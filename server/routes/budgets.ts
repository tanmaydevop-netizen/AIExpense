import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

const budgetSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  amount: z.number().positive('Budget amount must be greater than zero'),
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Month format must be YYYY-MM (e.g. 2026-09)'),
});

function getCurrentMonthString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

// GET /api/budgets - Get user budgets for month with real spending calculation
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const month = (req.query.month as string) || getCurrentMonthString();

    const [yearStr, monthStr] = month.split('-');
    const year = parseInt(yearStr, 10);
    const monthIndex = parseInt(monthStr, 10) - 1;

    const startDate = new Date(year, monthIndex, 1);
    const endDate = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);

    // Fetch budgets for user in this month
    const budgets = await prisma.budget.findMany({
      where: { userId, month },
      orderBy: { category: 'asc' },
    });

    // Fetch all user expenses for this month
    const expenses = await prisma.expense.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Compute spending per category and total spending
    const categorySpending: Record<string, number> = {};
    let totalSpending = 0;

    for (const exp of expenses) {
      totalSpending += exp.amount;
      const cat = exp.category;
      categorySpending[cat] = (categorySpending[cat] || 0) + exp.amount;
    }

    const budgetsWithMetrics = budgets.map((b) => {
      const spent = b.category.toLowerCase() === 'total' || b.category.toLowerCase() === 'overall'
        ? totalSpending
        : (categorySpending[b.category] || 0);

      const remaining = Math.max(0, b.amount - spent);
      const overspent = spent > b.amount ? spent - b.amount : 0;
      const percentageUsed = b.amount > 0 ? Math.round((spent / b.amount) * 100) : 0;

      let status: 'safe' | 'warning' | 'exceeded' = 'safe';
      let alertMessage: string | null = null;

      if (percentageUsed >= 100) {
        status = 'exceeded';
        alertMessage = `You've exceeded your ${b.category} budget by ${req.user!.currency}${overspent.toLocaleString()}`;
      } else if (percentageUsed >= 80) {
        status = 'warning';
        alertMessage = `${b.category} budget is ${percentageUsed}% used.`;
      }

      return {
        ...b,
        spent,
        remaining,
        overspent,
        percentageUsed,
        status,
        alertMessage,
      };
    });

    res.json({
      month,
      totalSpending,
      budgets: budgetsWithMetrics,
    });
  } catch (error) {
    console.error('Error fetching budgets:', error);
    res.status(500).json({ error: 'Failed to retrieve budgets' });
  }
});

// POST /api/budgets - Create or update budget
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const parseResult = budgetSchema.safeParse(req.body);

    if (!parseResult.success) {
      const msg = parseResult.error.issues[0]?.message || 'Invalid budget data';
      res.status(400).json({ error: msg });
      return;
    }

    const { category, amount, month } = parseResult.data;

    const budget = await prisma.budget.upsert({
      where: {
        userId_category_month: {
          userId,
          category: category.trim(),
          month,
        },
      },
      update: {
        amount,
      },
      create: {
        userId,
        category: category.trim(),
        amount,
        month,
      },
    });

    res.status(201).json({
      message: 'Budget saved successfully',
      budget,
    });
  } catch (error) {
    console.error('Error saving budget:', error);
    res.status(500).json({ error: 'Failed to save budget' });
  }
});

// PUT /api/budgets/:id - Update budget
router.put('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { amount } = req.body;

    if (typeof amount !== 'number' || amount <= 0) {
      res.status(400).json({ error: 'Valid positive amount is required' });
      return;
    }

    const existing = await prisma.budget.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      res.status(404).json({ error: 'Budget not found or unauthorized' });
      return;
    }

    const updated = await prisma.budget.update({
      where: { id },
      data: { amount },
    });

    res.json({
      message: 'Budget updated successfully',
      budget: updated,
    });
  } catch (error) {
    console.error('Error updating budget:', error);
    res.status(500).json({ error: 'Failed to update budget' });
  }
});

// DELETE /api/budgets/:id - Delete budget
router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const existing = await prisma.budget.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      res.status(404).json({ error: 'Budget not found or unauthorized' });
      return;
    }

    await prisma.budget.delete({
      where: { id },
    });

    res.json({ message: 'Budget deleted successfully' });
  } catch (error) {
    console.error('Error deleting budget:', error);
    res.status(500).json({ error: 'Failed to delete budget' });
  }
});

export default router;
