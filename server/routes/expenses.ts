import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

const expenseSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title too long'),
  amount: z.number().positive('Amount must be greater than zero'),
  category: z.string().min(1, 'Category is required'),
  paymentMethod: z.string().default('UPI'),
  date: z.string().or(z.date()),
  description: z.string().max(500).optional().nullable(),
});

// GET /api/expenses - List with search, filtering, sorting, pagination
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const {
      search,
      category,
      paymentMethod,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      sortBy = 'newest',
      page = '1',
      limit = '50',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const take = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 50));
    const skip = (pageNum - 1) * take;

    const where: any = {
      userId,
    };

    if (search && typeof search === 'string' && search.trim() !== '') {
      const q = search.trim();
      where.OR = [
        { title: { contains: q } },
        { description: { contains: q } },
        { category: { contains: q } },
      ];
    }

    if (category && typeof category === 'string' && category !== 'All') {
      where.category = category;
    }

    if (paymentMethod && typeof paymentMethod === 'string' && paymentMethod !== 'All') {
      where.paymentMethod = paymentMethod;
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate as string);
      }
      if (endDate) {
        // End of the selected day
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999);
        where.date.lte = end;
      }
    }

    if (minAmount || maxAmount) {
      where.amount = {};
      if (minAmount) {
        where.amount.gte = parseFloat(minAmount as string);
      }
      if (maxAmount) {
        where.amount.lte = parseFloat(maxAmount as string);
      }
    }

    let orderBy: any = { date: 'desc' };
    if (sortBy === 'oldest') {
      orderBy = { date: 'asc' };
    } else if (sortBy === 'highest') {
      orderBy = { amount: 'desc' };
    } else if (sortBy === 'lowest') {
      orderBy = { amount: 'asc' };
    } else if (sortBy === 'title') {
      orderBy = { title: 'asc' };
    }

    const [total, expenses] = await Promise.all([
      prisma.expense.count({ where }),
      prisma.expense.findMany({
        where,
        orderBy,
        skip,
        take,
      }),
    ]);

    res.json({
      expenses,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / take) || 1,
      limit: take,
    });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ error: 'Failed to retrieve expenses' });
  }
});

// POST /api/expenses - Add new expense
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const parseResult = expenseSchema.safeParse(req.body);

    if (!parseResult.success) {
      const msg = parseResult.error.issues[0]?.message || 'Invalid expense data';
      res.status(400).json({ error: msg });
      return;
    }

    const { title, amount, category, paymentMethod, date, description } = parseResult.data;

    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      res.status(400).json({ error: 'Invalid date provided' });
      return;
    }

    const newExpense = await prisma.expense.create({
      data: {
        userId,
        title: title.trim(),
        amount,
        category: category.trim(),
        paymentMethod: paymentMethod || 'UPI',
        date: parsedDate,
        description: description ? description.trim() : null,
      },
    });

    res.status(201).json({
      message: 'Expense added successfully',
      expense: newExpense,
    });
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({ error: 'Failed to create expense' });
  }
});

// GET /api/expenses/:id - Single expense
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const expense = await prisma.expense.findFirst({
      where: { id, userId },
    });

    if (!expense) {
      res.status(404).json({ error: 'Expense not found' });
      return;
    }

    res.json({ expense });
  } catch (error) {
    console.error('Error fetching expense:', error);
    res.status(500).json({ error: 'Failed to retrieve expense' });
  }
});

// PUT /api/expenses/:id - Update expense
router.put('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const parseResult = expenseSchema.safeParse(req.body);
    if (!parseResult.success) {
      const msg = parseResult.error.issues[0]?.message || 'Invalid expense data';
      res.status(400).json({ error: msg });
      return;
    }

    // Ensure the expense belongs to the requesting user
    const existing = await prisma.expense.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      res.status(404).json({ error: 'Expense not found or unauthorized' });
      return;
    }

    const { title, amount, category, paymentMethod, date, description } = parseResult.data;
    const parsedDate = new Date(date);

    const updated = await prisma.expense.update({
      where: { id },
      data: {
        title: title.trim(),
        amount,
        category: category.trim(),
        paymentMethod: paymentMethod || 'UPI',
        date: parsedDate,
        description: description ? description.trim() : null,
      },
    });

    res.json({
      message: 'Expense updated successfully',
      expense: updated,
    });
  } catch (error) {
    console.error('Error updating expense:', error);
    res.status(500).json({ error: 'Failed to update expense' });
  }
});

// DELETE /api/expenses/:id - Delete expense
router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const existing = await prisma.expense.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      res.status(404).json({ error: 'Expense not found or unauthorized' });
      return;
    }

    await prisma.expense.delete({
      where: { id },
    });

    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

export default router;
