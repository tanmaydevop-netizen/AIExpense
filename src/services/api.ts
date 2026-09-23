import {
  User,
  Expense,
  Budget,
  AnalyticsSummary,
  MonthlyChartData,
  TimelineData,
  AIInsightItem,
} from '../types';

const TOKEN_KEY = 'expenseai_token';
const USER_KEY = 'expenseai_user';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user: User) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401) {
      removeToken();
    }
    const errorMsg = data?.error || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data as T;
}

export const api = {
  // Authentication
  auth: {
    register: (body: { name: string; email: string; password: string; confirmPassword: string }) =>
      request<{ user: User; token: string; message: string }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    login: (body: { email: string; password: string }) =>
      request<{ user: User; token: string; message: string }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    logout: () =>
      request<{ message: string }>('/api/auth/logout', { method: 'POST' }),
    me: () => request<{ user: User }>('/api/auth/me'),
  },

  // Expenses
  expenses: {
    list: (params: {
      search?: string;
      category?: string;
      paymentMethod?: string;
      startDate?: string;
      endDate?: string;
      minAmount?: number;
      maxAmount?: number;
      sortBy?: string;
      page?: number;
      limit?: number;
    } = {}) => {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          query.append(key, String(val));
        }
      });
      const qs = query.toString();
      return request<{
        expenses: Expense[];
        total: number;
        page: number;
        totalPages: number;
        limit: number;
      }>(`/api/expenses${qs ? `?${qs}` : ''}`);
    },
    create: (data: {
      title: string;
      amount: number;
      category: string;
      paymentMethod?: string;
      date: string;
      description?: string;
    }) =>
      request<{ message: string; expense: Expense }>('/api/expenses', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: {
      title: string;
      amount: number;
      category: string;
      paymentMethod?: string;
      date: string;
      description?: string;
    }) =>
      request<{ message: string; expense: Expense }>(`/api/expenses/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<{ message: string }>(`/api/expenses/${id}`, {
        method: 'DELETE',
      }),
  },

  // Budgets
  budgets: {
    list: (month?: string) =>
      request<{
        month: string;
        totalSpending: number;
        budgets: Budget[];
      }>(`/api/budgets${month ? `?month=${month}` : ''}`),
    createOrUpdate: (data: { category: string; amount: number; month: string }) =>
      request<{ message: string; budget: Budget }>('/api/budgets', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<{ message: string }>(`/api/budgets/${id}`, {
        method: 'DELETE',
      }),
  },

  // Analytics
  analytics: {
    summary: () => request<AnalyticsSummary>('/api/analytics/summary'),
    categories: () =>
      request<{
        totalSpending: number;
        categories: { category: string; count: number; total: number; percentage: number }[];
      }>('/api/analytics/categories'),
    monthly: () => request<{ months: MonthlyChartData[] }>('/api/analytics/monthly'),
    timeline: () => request<{ timeline: TimelineData[] }>('/api/analytics/timeline'),
  },

  // AI Features
  ai: {
    getInsights: () =>
      request<{
        empty: boolean;
        month?: string;
        message?: string;
        insights: AIInsightItem[];
        generatedAt: string;
      }>('/api/ai/insights', {
        method: 'POST',
      }),
    categorize: (data: { title: string; description?: string }) =>
      request<{
        category: string;
        confidence: number;
        reason: string;
        allowedCategories: string[];
      }>('/api/ai/categorize', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    ask: (data: { question: string }) =>
      request<{
        question: string;
        answer: string;
        dataPoints: Record<string, any>;
      }>('/api/ai/ask', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  // Profile
  profile: {
    get: () => request<{ user: User & { _count: { expenses: number; budgets: number } } }>('/api/profile'),
    update: (data: { name?: string; currency?: string; currentPassword?: string; newPassword?: string }) =>
      request<{ message: string; user: User }>('/api/profile', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  },
};
