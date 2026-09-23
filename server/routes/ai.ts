import { Router, Response } from 'express';
import { Type } from '@google/genai';
import { prisma } from '../db.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { getGeminiAI, GEMINI_MODEL } from '../gemini.js';

const router = Router();
router.use(requireAuth);

const ALLOWED_CATEGORIES = [
  'Food',
  'Shopping',
  'Transport',
  'Bills',
  'Entertainment',
  'Education',
  'Health',
  'Travel',
  'Subscription',
  'Other',
];

// Helper to get month ranges
function getMonthRange(year: number, monthIndex: number) {
  const start = new Date(year, monthIndex, 1);
  const end = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);
  const monthKey = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
  return { start, end, monthKey };
}

// POST /api/ai/insights - Generate AI spending insights based on REAL expense data
router.post('/insights', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const currency = req.user!.currency || '₹';

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonthIdx = now.getMonth();

    const currentRange = getMonthRange(currentYear, currentMonthIdx);
    const prevRange = getMonthRange(
      currentMonthIdx === 0 ? currentYear - 1 : currentYear,
      currentMonthIdx === 0 ? 11 : currentMonthIdx - 1
    );

    // Fetch real user data
    const [currentExpenses, prevExpenses, currentBudgets] = await Promise.all([
      prisma.expense.findMany({
        where: { userId, date: { gte: currentRange.start, lte: currentRange.end } },
        orderBy: { date: 'desc' },
      }),
      prisma.expense.findMany({
        where: { userId, date: { gte: prevRange.start, lte: prevRange.end } },
        orderBy: { date: 'desc' },
      }),
      prisma.budget.findMany({
        where: { userId, month: currentRange.monthKey },
      }),
    ]);

    if (currentExpenses.length === 0 && prevExpenses.length === 0) {
      res.json({
        empty: true,
        message: 'Your financial dashboard is waiting for its first transaction.',
        insights: [],
      });
      return;
    }

    // Compute metrics
    const currentTotal = currentExpenses.reduce((s, e) => s + e.amount, 0);
    const prevTotal = prevExpenses.reduce((s, e) => s + e.amount, 0);

    const currentCatMap: Record<string, number> = {};
    for (const e of currentExpenses) {
      currentCatMap[e.category] = (currentCatMap[e.category] || 0) + e.amount;
    }

    const prevCatMap: Record<string, number> = {};
    for (const e of prevExpenses) {
      prevCatMap[e.category] = (prevCatMap[e.category] || 0) + e.amount;
    }

    const topExpenses = [...currentExpenses].sort((a, b) => b.amount - a.amount).slice(0, 5);

    const budgetsSummary = currentBudgets.map((b) => {
      const isOverall = b.category.toLowerCase() === 'total' || b.category.toLowerCase() === 'overall';
      const spent = isOverall ? currentTotal : (currentCatMap[b.category] || 0);
      const pct = b.amount > 0 ? Math.round((spent / b.amount) * 100) : 0;
      return { category: b.category, target: b.amount, spent, pct };
    });

    const ai = getGeminiAI();
    let generatedInsights: { type: string; title: string; content: string; severity?: string }[] = [];

    if (ai) {
      try {
        const prompt = `You are ExpenseAI, an expert financial analyst. Analyze this user's REAL financial data for ${currentRange.monthKey}:
Currency: ${currency}
Current Month Total Spending: ${currency}${currentTotal.toLocaleString()} (${currentExpenses.length} transactions)
Previous Month Total Spending: ${currency}${prevTotal.toLocaleString()} (${prevExpenses.length} transactions)

Current Spending by Category:
${Object.entries(currentCatMap)
  .map(([cat, amt]) => `- ${cat}: ${currency}${amt.toLocaleString()} (${Math.round((amt / (currentTotal || 1)) * 100)}%)`)
  .join('\n')}

Previous Month Spending by Category:
${Object.entries(prevCatMap)
  .map(([cat, amt]) => `- ${cat}: ${currency}${amt.toLocaleString()}`)
  .join('\n') || 'No previous month data'}

Top 5 Largest Transactions:
${topExpenses.map((e) => `- ${e.title}: ${currency}${e.amount.toLocaleString()} (${e.category})`).join('\n') || 'None'}

Budgets & Utilization:
${budgetsSummary.map((b) => `- ${b.category}: Budget ${currency}${b.target.toLocaleString()}, Spent ${currency}${b.spent.toLocaleString()} (${b.pct}% used)`).join('\n') || 'No budgets configured'}

Generate exactly 4 distinct financial insights strictly grounded in these real numbers:
1. type: "spending_pattern" (Analyze category increases/decreases, trends)
2. type: "saving_opportunity" (Actionable ways to trim recurring or high-frequency costs)
3. type: "budget_alert" (Progress on active budgets or risk warning)
4. type: "ai_recommendation" (Strategic recommendation for next month)

Do NOT fabricate any numbers. Use the exact calculations provided above.`;

        const response = await ai.models.generateContent({
          model: GEMINI_MODEL,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: {
                    type: Type.STRING,
                    description: 'One of: spending_pattern, saving_opportunity, budget_alert, ai_recommendation',
                  },
                  title: {
                    type: Type.STRING,
                    description: 'Short impactful title (e.g. Transportation Shift, High Dining Velocity)',
                  },
                  content: {
                    type: Type.STRING,
                    description: '1 to 2 concise sentences with exact figures and actionable observation',
                  },
                  severity: {
                    type: Type.STRING,
                    description: 'info, warning, or positive',
                  },
                },
                required: ['type', 'title', 'content'],
              },
            },
          },
        });

        const rawText = response.text?.trim();
        if (rawText) {
          generatedInsights = JSON.parse(rawText);
        }
      } catch (geminiError) {
        console.warn('Gemini generateContent error, falling back to rule-based analysis:', geminiError);
      }
    }

    // Fallback rule-based generation if AI is offline or key missing
    if (generatedInsights.length === 0) {
      // 1. Spending pattern
      const sortedCats = Object.entries(currentCatMap).sort((a, b) => b[1] - a[1]);
      const topCat = sortedCats[0];
      if (topCat) {
        const topPct = currentTotal > 0 ? Math.round((topCat[1] / currentTotal) * 100) : 0;
        generatedInsights.push({
          type: 'spending_pattern',
          title: `${topCat[0]} Concentration`,
          content: `${topCat[0]} represents your highest expenditure this month at ${currency}${topCat[1].toLocaleString()} (${topPct}% of all spending).`,
          severity: 'info',
        });
      }

      // 2. Saving opportunity
      if (topExpenses.length > 0) {
        generatedInsights.push({
          type: 'saving_opportunity',
          title: 'High-Ticket Purchase Review',
          content: `Your single largest expense was "${topExpenses[0].title}" for ${currency}${topExpenses[0].amount.toLocaleString()}. Monitoring large one-off expenses can boost your monthly savings rate.`,
          severity: 'positive',
        });
      }

      // 3. Budget alert
      const exceededBudget = budgetsSummary.find((b) => b.pct >= 100);
      const warningBudget = budgetsSummary.find((b) => b.pct >= 80);
      if (exceededBudget) {
        generatedInsights.push({
          type: 'budget_alert',
          title: `${exceededBudget.category} Budget Exceeded`,
          content: `You have spent ${currency}${exceededBudget.spent.toLocaleString()} against your ${currency}${exceededBudget.target.toLocaleString()} target (${exceededBudget.pct}%).`,
          severity: 'warning',
        });
      } else if (warningBudget) {
        generatedInsights.push({
          type: 'budget_alert',
          title: `${warningBudget.category} Budget Warning`,
          content: `${warningBudget.category} budget is ${warningBudget.pct}% used with ${currency}${(warningBudget.target - warningBudget.spent).toLocaleString()} remaining.`,
          severity: 'warning',
        });
      } else {
        generatedInsights.push({
          type: 'budget_alert',
          title: 'Budget Discipline',
          content: budgetsSummary.length > 0
            ? 'All active budgets are currently within safe spending limits.'
            : 'Consider setting up category budgets to trigger intelligent threshold warnings.',
          severity: 'positive',
        });
      }

      // 4. Recommendation
      generatedInsights.push({
        type: 'ai_recommendation',
        title: 'Monthly Spending Trajectory',
        content: `At an average of ${currency}${Math.round(currentTotal / Math.max(1, now.getDate())).toLocaleString()} per day, pace discretionary purchases to finish the month under target.`,
        severity: 'info',
      });
    }

    // Persist insights to database for the user
    try {
      await prisma.aIInsight.deleteMany({ where: { userId } });
      await prisma.aIInsight.createMany({
        data: generatedInsights.map((gi) => ({
          userId,
          type: gi.type,
          content: `${gi.title}:::${gi.content}:::${gi.severity || 'info'}`,
        })),
      });
    } catch (saveErr) {
      console.warn('Could not persist insights to DB:', saveErr);
    }

    res.json({
      empty: false,
      month: currentRange.monthKey,
      insights: generatedInsights,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error generating AI insights:', error);
    res.status(500).json({ error: 'Failed to generate financial insights' });
  }
});

// POST /api/ai/categorize - AI smart expense categorization
router.post('/categorize', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, description } = req.body;
    if (!title || typeof title !== 'string') {
      res.status(400).json({ error: 'Expense title is required for categorization' });
      return;
    }

    const ai = getGeminiAI();
    let suggestedCategory = 'Other';
    let confidence = 0.8;
    let reason = 'Matched keyword pattern';

    const text = `${title} ${description || ''}`.toLowerCase();

    // Fast heuristic match fallback
    if (/pizza|burger|swiggy|zomato|domino|starbucks|mcdonald|food|dinner|lunch|breakfast|restaurant|cafe|grocery|groceries|zepto|blinkit|milk|supermarket/i.test(text)) {
      suggestedCategory = 'Food';
      confidence = 0.95;
      reason = 'Identified food, grocery or dining merchant';
    } else if (/uber|ola|rapido|metro|petrol|fuel|diesel|flight|indigo|train|irctc|bus|taxi|parking|toll/i.test(text)) {
      suggestedCategory = 'Transport';
      confidence = 0.95;
      reason = 'Identified transit, ride-hailing or fuel merchant';
    } else if (/amazon|flipkart|myntra|zara|h&m|clothing|shoes|mall|shopping|store|apparel/i.test(text)) {
      suggestedCategory = 'Shopping';
      confidence = 0.9;
      reason = 'Identified retail or ecommerce brand';
    } else if (/electricity|water|wifi|broadband|airtel|jio|gas|cylinder|rent|maintenance|bill/i.test(text)) {
      suggestedCategory = 'Bills';
      confidence = 0.95;
      reason = 'Identified utility or recurring housing bill';
    } else if (/netflix|spotify|prime|hotstar|youtube|apple tv|subscription|patreon|membership/i.test(text)) {
      suggestedCategory = 'Subscription';
      confidence = 0.95;
      reason = 'Identified digital entertainment subscription';
    } else if (/movie|cinema|pvr|concert|game|steam|playstation|arcade|party/i.test(text)) {
      suggestedCategory = 'Entertainment';
      confidence = 0.9;
      reason = 'Identified entertainment or leisure activity';
    } else if (/doctor|hospital|pharmacy|medicine|apollo|dentist|clinic|gym|fitness|health/i.test(text)) {
      suggestedCategory = 'Health';
      confidence = 0.95;
      reason = 'Identified medical, healthcare or fitness cost';
    } else if (/hotel|airbnb|booking|resort|vacation|trip|travel|tour/i.test(text)) {
      suggestedCategory = 'Travel';
      confidence = 0.9;
      reason = 'Identified travel or accommodation';
    } else if (/course|udemy|coursera|tuition|book|school|college|exam|class/i.test(text)) {
      suggestedCategory = 'Education';
      confidence = 0.95;
      reason = 'Identified educational material or course';
    }

    if (ai) {
      try {
        const response = await ai.models.generateContent({
          model: GEMINI_MODEL,
          contents: `Classify this financial expense into exactly one of these allowed categories:
${ALLOWED_CATEGORIES.join(', ')}

Expense Title: "${title}"
Description: "${description || 'None'}"

Return JSON with "category" (must be one of the allowed categories) and a brief "reason".`,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                category: {
                  type: Type.STRING,
                  enum: ALLOWED_CATEGORIES,
                },
                reason: {
                  type: Type.STRING,
                },
              },
              required: ['category'],
            },
          },
        });

        const raw = response.text?.trim();
        if (raw) {
          const parsed = JSON.parse(raw);
          if (ALLOWED_CATEGORIES.includes(parsed.category)) {
            suggestedCategory = parsed.category;
            confidence = 0.98;
            reason = parsed.reason || 'AI categorized from transaction details';
          }
        }
      } catch (err) {
        console.warn('Gemini categorization fallback used:', err);
      }
    }

    res.json({
      category: suggestedCategory,
      confidence,
      reason,
      allowedCategories: ALLOWED_CATEGORIES,
    });
  } catch (error) {
    console.error('Error categorizing expense:', error);
    res.status(500).json({ error: 'Failed to predict category' });
  }
});

// POST /api/ai/ask - Natural Language Query over real user financial data
router.post('/ask', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const currency = req.user!.currency || '₹';
    const { question } = req.body;

    if (!question || typeof question !== 'string') {
      res.status(400).json({ error: 'Question is required' });
      return;
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonthIdx = now.getMonth();

    const currentRange = getMonthRange(currentYear, currentMonthIdx);
    const prevRange = getMonthRange(
      currentMonthIdx === 0 ? currentYear - 1 : currentYear,
      currentMonthIdx === 0 ? 11 : currentMonthIdx - 1
    );

    // Fetch verified ledger data from Prisma
    const [currentExpenses, prevExpenses, budgets] = await Promise.all([
      prisma.expense.findMany({
        where: { userId, date: { gte: currentRange.start, lte: currentRange.end } },
        orderBy: { date: 'desc' },
      }),
      prisma.expense.findMany({
        where: { userId, date: { gte: prevRange.start, lte: prevRange.end } },
        orderBy: { date: 'desc' },
      }),
      prisma.budget.findMany({
        where: { userId, month: currentRange.monthKey },
      }),
    ]);

    const currentTotal = currentExpenses.reduce((s, e) => s + e.amount, 0);
    const prevTotal = prevExpenses.reduce((s, e) => s + e.amount, 0);

    const currentCategorySpending: Record<string, number> = {};
    for (const e of currentExpenses) {
      currentCategorySpending[e.category] = (currentCategorySpending[e.category] || 0) + e.amount;
    }

    const prevCategorySpending: Record<string, number> = {};
    for (const e of prevExpenses) {
      prevCategorySpending[e.category] = (prevCategorySpending[e.category] || 0) + e.amount;
    }

    const sortedExpenses = [...currentExpenses].sort((a, b) => b.amount - a.amount);
    const topTransactions = sortedExpenses.slice(0, 5);

    // If user has zero expenses
    if (currentExpenses.length === 0 && prevExpenses.length === 0) {
      res.json({
        answer: `You haven't recorded any expenses yet in ExpenseAI. Add your first transaction or set up a budget to start asking questions about your spending!`,
        dataPoints: { currentTotal: 0, transactionsCount: 0 },
      });
      return;
    }

    // Determine highest category
    const categoryArray = Object.entries(currentCategorySpending).sort((a, b) => b[1] - a[1]);
    const highestCategory = categoryArray[0] || ['None', 0];

    const contextData = {
      currency,
      currentMonth: currentRange.monthKey,
      currentTotalSpending: currentTotal,
      currentTransactionCount: currentExpenses.length,
      previousMonth: prevRange.monthKey,
      previousTotalSpending: prevTotal,
      categorySpending: currentCategorySpending,
      previousCategorySpending: prevCategorySpending,
      highestSpendingCategory: {
        category: highestCategory[0],
        amount: highestCategory[1],
        percentage: currentTotal > 0 ? Math.round((highestCategory[1] / currentTotal) * 100) : 0,
      },
      top5Transactions: topTransactions.map((e) => ({
        title: e.title,
        amount: e.amount,
        category: e.category,
        date: e.date.toISOString().split('T')[0],
      })),
      budgets: budgets.map((b) => ({
        category: b.category,
        budget: b.amount,
        spent: currentCategorySpending[b.category] || (b.category.toLowerCase() === 'total' ? currentTotal : 0),
      })),
    };

    const ai = getGeminiAI();
    let answer = '';

    if (ai) {
      try {
        const prompt = `You are ExpenseAI's natural language financial assistant.
Answer the user's question accurately using ONLY the following verified database metrics.
Do NOT fabricate any transaction, date, or amount. Always use the user's currency symbol (${currency}).

--- VERIFIED FINANCIAL DATA ---
Month: ${contextData.currentMonth}
Total Spending Current Month: ${currency}${contextData.currentTotalSpending.toLocaleString()} across ${contextData.currentTransactionCount} transactions
Total Spending Previous Month: ${currency}${contextData.previousTotalSpending.toLocaleString()}

Category Breakdown This Month:
${Object.entries(contextData.categorySpending)
  .map(([cat, amt]) => `- ${cat}: ${currency}${amt.toLocaleString()} (${Math.round((amt / (contextData.currentTotalSpending || 1)) * 100)}%)`)
  .join('\n') || 'None'}

Top Transactions:
${contextData.top5Transactions
  .map((t) => `- ${t.title}: ${currency}${t.amount.toLocaleString()} in ${t.category} on ${t.date}`)
  .join('\n') || 'None'}

Budgets:
${contextData.budgets
  .map((b) => `- ${b.category}: Budget ${currency}${b.budget.toLocaleString()}, Spent ${currency}${b.spent.toLocaleString()}`)
  .join('\n') || 'None configured'}

--- USER QUESTION ---
"${question}"

Provide a concise, helpful, and direct answer (2-4 sentences). Format amounts cleanly with ${currency}. If the user asks about a specific category, state the exact amount and percentage. Provide actionable context where appropriate.`;

        const response = await ai.models.generateContent({
          model: GEMINI_MODEL,
          contents: prompt,
        });

        answer = response.text?.trim() || '';
      } catch (err) {
        console.warn('Gemini chat fallback used:', err);
      }
    }

    // Direct accurate fallback if AI unavailable
    if (!answer) {
      const q = question.toLowerCase();
      if (q.includes('food')) {
        const foodSpent = currentCategorySpending['Food'] || 0;
        const pct = currentTotal > 0 ? Math.round((foodSpent / currentTotal) * 100) : 0;
        answer = `You spent ${currency}${foodSpent.toLocaleString()} on Food this month, which represents approximately ${pct}% of your total spending (${currency}${currentTotal.toLocaleString()}).`;
      } else if (q.includes('most') || q.includes('biggest category') || q.includes('where am i spending')) {
        answer = `Your largest spending category this month is ${highestCategory[0]} at ${currency}${highestCategory[1].toLocaleString()} (${Math.round((highestCategory[1] / (currentTotal || 1)) * 100)}% of total).`;
      } else if (q.includes('last month') || q.includes('previous')) {
        answer = `Last month (${prevRange.monthKey}) you spent a total of ${currency}${prevTotal.toLocaleString()}.`;
      } else if (q.includes('biggest') || q.includes('highest expense') || q.includes('large')) {
        if (topTransactions.length > 0) {
          answer = `Your biggest transaction this month was "${topTransactions[0].title}" for ${currency}${topTransactions[0].amount.toLocaleString()} in ${topTransactions[0].category}.`;
        } else {
          answer = `You have no recorded expenses this month yet.`;
        }
      } else if (q.includes('reduce') || q.includes('save') || q.includes('cut')) {
        answer = `To reduce spending, focus on your top category: ${highestCategory[0]} (${currency}${highestCategory[1].toLocaleString()}). Setting a dedicated category budget will help you control daily velocity.`;
      } else {
        answer = `This month you have spent ${currency}${currentTotal.toLocaleString()} across ${contextData.currentTransactionCount} transactions, with ${highestCategory[0]} being your largest expense category.`;
      }
    }

    res.json({
      question,
      answer,
      dataPoints: {
        currentTotal,
        transactionCount: currentExpenses.length,
        highestCategory: highestCategory[0],
        highestAmount: highestCategory[1],
      },
    });
  } catch (error) {
    console.error('Error answering financial query:', error);
    res.status(500).json({ error: 'Failed to process financial query' });
  }
});

export default router;
