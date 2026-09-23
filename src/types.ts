export interface User {
  id: string;
  name: string;
  email: string;
  currency: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  userId: string;
  title: string;
  amount: number;
  category: string;
  paymentMethod: string;
  date: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Budget {
  id: string;
  userId: string;
  category: string;
  amount: number;
  month: string;
  spent: number;
  remaining: number;
  overspent: number;
  percentageUsed: number;
  status: 'safe' | 'warning' | 'exceeded';
  alertMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryBreakdown {
  name: string;
  amount: number;
  percentage: number;
}

export interface AnalyticsSummary {
  month: string;
  totalSpending: number;
  prevTotalSpending: number;
  monthlyChangePercent: number;
  totalBudget: number;
  remainingBudget: number;
  budgetUsagePercentage: number;
  transactionCount: number;
  categoryBreakdown: CategoryBreakdown[];
  recentExpenses: Expense[];
  alerts: {
    category: string;
    message: string;
    severity: 'warning' | 'danger';
  }[];
}

export interface MonthlyChartData {
  monthKey: string;
  name: string;
  spent: number;
  budget: number;
  transactionCount: number;
}

export interface TimelineData {
  day: string;
  amount: number;
  cumulative: number;
}

export interface AIInsightItem {
  type: 'spending_pattern' | 'saving_opportunity' | 'budget_alert' | 'ai_recommendation';
  title: string;
  content: string;
  severity?: 'info' | 'warning' | 'positive';
}

export interface AIChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  dataPoints?: Record<string, any>;
}

export const CATEGORIES = [
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
] as const;

export const PAYMENT_METHODS = [
  'UPI',
  'Card',
  'Cash',
  'Bank Transfer',
  'Other',
] as const;
