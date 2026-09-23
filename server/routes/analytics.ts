import { Router, Response } from 'express';
import { prisma } from '../db.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

function getMonthRange(year: number, monthIndex: number) {
  const start = new Date(year, monthIndex, 1);
  const end = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);
  const monthKey = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
  return { start, end, monthKey };
}

// GET /api/analytics/summary
router.get('/summary', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonthIndex = now.getMonth();

    const currentRange = getMonthRange(currentYear, currentMonthIndex);
    const prevRange = getMonthRange(
      currentMonthIndex === 0 ? currentYear - 1 : currentYear,
      currentMonthIndex === 0 ? 11 : currentMonthIndex - 1
    );

    const [currentExpenses, prevExpenses, currentBudgets, recentExpenses] = await Promise.all([
      prisma.expense.findMany({
        where: {
          userId,
          date: { gte: currentRange.start, lte: currentRange.end },
        },
      }),
      prisma.expense.findMany({
        where: {
          userId,
          date: { gte: prevRange.start, lte: prevRange.end },
        },
      }),
      prisma.budget.findMany({
        where: { userId, month: currentRange.monthKey },
      }),
      prisma.expense.findMany({
        where: { userId },
        orderBy: { date: 'desc' },
        take: 5,
      }),
    ]);

    const totalSpending = currentExpenses.reduce((acc, curr) => acc + curr.amount, 0);
    const prevTotalSpending = prevExpenses.reduce((acc, curr) => acc + curr.amount, 0);
    const transactionCount = currentExpenses.length;

    // Budget calculation: find overall 'Total' budget, or sum category budgets
    const totalBudgetRecord = currentBudgets.find(
      (b) => b.category.toLowerCase() === 'total' || b.category.toLowerCase() === 'overall'
    );
    let totalBudget = 0;
    if (totalBudgetRecord) {
      totalBudget = totalBudgetRecord.amount;
    } else {
      totalBudget = currentBudgets.reduce((acc, curr) => acc + curr.amount, 0);
    }

    const remainingBudget = totalBudget > 0 ? Math.max(0, totalBudget - totalSpending) : 0;
    const budgetUsagePercentage = totalBudget > 0 ? Math.round((totalSpending / totalBudget) * 100) : 0;

    // % change compared to previous month
    let monthlyChangePercent = 0;
    if (prevTotalSpending > 0) {
      monthlyChangePercent = Math.round(((totalSpending - prevTotalSpending) / prevTotalSpending) * 100);
    } else if (totalSpending > 0) {
      monthlyChangePercent = 100;
    }

    // Category breakdown
    const categorySpending: Record<string, number> = {};
    for (const exp of currentExpenses) {
      categorySpending[exp.category] = (categorySpending[exp.category] || 0) + exp.amount;
    }

    const categoryBreakdown = Object.entries(categorySpending)
      .map(([name, amount]) => ({
        name,
        amount,
        percentage: totalSpending > 0 ? Math.round((amount / totalSpending) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    // Active budget alerts
    const alerts: { category: string; message: string; severity: 'warning' | 'danger' }[] = [];
    for (const b of currentBudgets) {
      const isOverall = b.category.toLowerCase() === 'total' || b.category.toLowerCase() === 'overall';
      const spent = isOverall ? totalSpending : (categorySpending[b.category] || 0);
      const pct = b.amount > 0 ? Math.round((spent / b.amount) * 100) : 0;

      if (pct >= 100) {
        const over = spent - b.amount;
        alerts.push({
          category: b.category,
          message: `You've exceeded your ${b.category} budget by ${req.user!.currency}${over.toLocaleString()}`,
          severity: 'danger',
        });
      } else if (pct >= 80) {
        alerts.push({
          category: b.category,
          message: `${b.category} budget is ${pct}% used.`,
          severity: 'warning',
        });
      }
    }

    res.json({
      month: currentRange.monthKey,
      totalSpending,
      prevTotalSpending,
      monthlyChangePercent,
      totalBudget,
      remainingBudget,
      budgetUsagePercentage,
      transactionCount,
      categoryBreakdown,
      recentExpenses,
      alerts,
    });
  } catch (error) {
    console.error('Error fetching analytics summary:', error);
    res.status(500).json({ error: 'Failed to generate analytics summary' });
  }
});

// GET /api/analytics/categories - Category breakdown with total spending
router.get('/categories', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const now = new Date();
    const range = getMonthRange(now.getFullYear(), now.getMonth());

    const expenses = await prisma.expense.findMany({
      where: {
        userId,
        date: { gte: range.start, lte: range.end },
      },
    });

    const categoryMap: Record<string, { count: number; total: number }> = {};
    let totalSpending = 0;

    for (const exp of expenses) {
      totalSpending += exp.amount;
      if (!categoryMap[exp.category]) {
        categoryMap[exp.category] = { count: 0, total: 0 };
      }
      categoryMap[exp.category].count += 1;
      categoryMap[exp.category].total += exp.amount;
    }

    const categories = Object.entries(categoryMap).map(([category, data]) => ({
      category,
      count: data.count,
      total: data.total,
      percentage: totalSpending > 0 ? Number(((data.total / totalSpending) * 100).toFixed(1)) : 0,
    })).sort((a, b) => b.total - a.total);

    res.json({
      totalSpending,
      categories,
    });
  } catch (error) {
    console.error('Error fetching category analytics:', error);
    res.status(500).json({ error: 'Failed to retrieve category analytics' });
  }
});

// GET /api/analytics/monthly - Last 6 months spending vs budget for bar chart
router.get('/monthly', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const now = new Date();
    const monthsData = [];

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const monthIdx = d.getMonth();
      const range = getMonthRange(year, monthIdx);

      const [expenses, budgets] = await Promise.all([
        prisma.expense.findMany({
          where: {
            userId,
            date: { gte: range.start, lte: range.end },
          },
        }),
        prisma.budget.findMany({
          where: { userId, month: range.monthKey },
        }),
      ]);

      const spent = expenses.reduce((acc, curr) => acc + curr.amount, 0);

      const totalBudgetRecord = budgets.find(
        (b) => b.category.toLowerCase() === 'total' || b.category.toLowerCase() === 'overall'
      );
      let budget = 0;
      if (totalBudgetRecord) {
        budget = totalBudgetRecord.amount;
      } else {
        budget = budgets.reduce((acc, curr) => acc + curr.amount, 0);
      }

      monthsData.push({
        monthKey: range.monthKey,
        name: `${monthNames[monthIdx]} ${year === now.getFullYear() ? '' : year}`.trim(),
        spent,
        budget: budget || (spent > 0 ? Math.round(spent * 1.15) : 0),
        transactionCount: expenses.length,
      });
    }

    res.json({ months: monthsData });
  } catch (error) {
    console.error('Error fetching monthly analytics:', error);
    res.status(500).json({ error: 'Failed to retrieve monthly analytics' });
  }
});

// GET /api/analytics/timeline - Daily spending points for area chart
router.get('/timeline', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const now = new Date();
    const range = getMonthRange(now.getFullYear(), now.getMonth());

    const expenses = await prisma.expense.findMany({
      where: {
        userId,
        date: { gte: range.start, lte: range.end },
      },
      orderBy: { date: 'asc' },
    });

    const daysInMonth = range.end.getDate();
    const dailyMap: Record<number, number> = {};

    for (let day = 1; day <= daysInMonth; day++) {
      dailyMap[day] = 0;
    }

    for (const exp of expenses) {
      const day = new Date(exp.date).getDate();
      dailyMap[day] = (dailyMap[day] || 0) + exp.amount;
    }

    let cumulative = 0;
    const timeline = Object.entries(dailyMap).map(([dayStr, amount]) => {
      const day = parseInt(dayStr, 10);
      cumulative += amount;
      return {
        day: `Day ${day}`,
        amount,
        cumulative,
      };
    });

    res.json({ timeline });
  } catch (error) {
    console.error('Error fetching timeline analytics:', error);
    res.status(500).json({ error: 'Failed to retrieve timeline' });
  }
});

export default router;
