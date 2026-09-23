import { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  PieChart,
  Wallet,
  Receipt,
  Sparkles,
  AlertTriangle,
  ArrowRight,
  Plus,
  ArrowUpRight,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPie,
  Pie,
  Cell,
} from 'recharts';
import { AnalyticsSummary, TimelineData } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

interface DashboardViewProps {
  onOpenAddExpense: () => void;
  onNavigate: (view: any) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  Food: '#10b981', // Emerald
  Shopping: '#f59e0b', // Amber
  Transport: '#06b6d4', // Cyan
  Bills: '#6366f1', // Indigo
  Entertainment: '#ec4899', // Pink
  Health: '#14b8a6', // Teal
  Subscription: '#8b5cf6', // Purple
  Education: '#3b82f6', // Blue
  Travel: '#eab308', // Yellow
  Other: '#64748b', // Slate
};

export function DashboardView({ onOpenAddExpense, onNavigate }: DashboardViewProps) {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [timeline, setTimeline] = useState<TimelineData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const currency = user?.currency || '₹';

  const loadData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    try {
      const [sumRes, timeRes] = await Promise.all([
        api.analytics.summary(),
        api.analytics.timeline(),
      ]);
      setSummary(sumRes);
      setTimeline(timeRes.timeline);
      if (isManualRefresh) {
        showToast('Dashboard refreshed with latest ledger data', 'info');
      }
    } catch {
      showToast('Could not load dashboard analytics', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
        <p className="text-sm text-slate-400">Loading your financial dashboard...</p>
      </div>
    );
  }

  const pieData =
    summary?.categoryBreakdown && summary.categoryBreakdown.length > 0
      ? summary.categoryBreakdown
      : [{ name: 'No Expenses', amount: 1, percentage: 100 }];

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 max-w-7xl mx-auto w-full">
      {/* Header Greeting & Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Financial Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time ledger overview for <span className="text-slate-200 font-semibold">{summary?.month}</span>
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="p-2.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Refresh dashboard"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-emerald-400' : ''}`} />
          </button>

          <button
            onClick={() => onNavigate('ask_ai')}
            className="px-3.5 py-2.5 rounded-xl bg-slate-900 border border-emerald-500/30 text-emerald-400 text-xs sm:text-sm font-semibold flex items-center gap-2 hover:bg-emerald-500/10 transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            <span>Ask ExpenseAI</span>
          </button>

          <button
            id="btn-dash-add-expense"
            onClick={onOpenAddExpense}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs sm:text-sm shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* Budget Alerts Banner (if any) */}
      {summary?.alerts && summary.alerts.length > 0 && (
        <div className="flex flex-col gap-2">
          {summary.alerts.map((alert, idx) => (
            <div
              key={idx}
              className={`p-3.5 rounded-xl border flex items-center justify-between text-xs sm:text-sm backdrop-blur-md ${
                alert.severity === 'danger'
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span className="font-medium">{alert.message}</span>
              </div>
              <button
                onClick={() => onNavigate('budgets')}
                className="text-xs font-bold underline hover:opacity-80 shrink-0 ml-2"
              >
                Review Budget
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Spending */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Spending
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
              {currency}
              {summary?.totalSpending.toLocaleString()}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs">
              {summary?.monthlyChangePercent !== undefined && summary.monthlyChangePercent >= 0 ? (
                <span className="text-rose-400 flex items-center font-semibold">
                  <TrendingUp className="w-3.5 h-3.5 mr-0.5" />
                  +{summary.monthlyChangePercent}%
                </span>
              ) : (
                <span className="text-emerald-400 flex items-center font-semibold">
                  <TrendingDown className="w-3.5 h-3.5 mr-0.5" />
                  {summary?.monthlyChangePercent}%
                </span>
              )}
              <span className="text-slate-500">vs last month</span>
            </div>
          </div>
        </div>

        {/* Card 2: Total Budget */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Monthly Budget
            </span>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <PieChart className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
              {currency}
              {summary?.totalBudget ? summary.totalBudget.toLocaleString() : 'Not Set'}
            </div>
            <div className="mt-1 text-xs text-slate-400">
              {summary?.totalBudget ? (
                <span>{summary.budgetUsagePercentage}% of limit utilized</span>
              ) : (
                <button
                  onClick={() => onNavigate('budgets')}
                  className="text-cyan-400 hover:underline font-medium"
                >
                  + Set monthly budget
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Card 3: Remaining Budget */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Remaining Budget
            </span>
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div
              className={`text-2xl sm:text-3xl font-extrabold font-mono ${
                (summary?.remainingBudget || 0) > 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {currency}
              {summary?.remainingBudget.toLocaleString()}
            </div>
            <div className="mt-1 text-xs text-slate-400">
              {(summary?.remainingBudget || 0) > 0 ? 'Safe reserve available' : 'Budget fully exhausted'}
            </div>
          </div>
        </div>

        {/* Card 4: Transaction Count */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Transactions
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
              {summary?.transactionCount || 0}
            </div>
            <div className="mt-1 text-xs text-slate-400">Recorded this month</div>
          </div>
        </div>
      </div>

      {/* Charts Section: Daily Spending Area Chart + Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timeline Area Chart (2 cols) */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-base text-white">Daily Spending Trajectory</h3>
              <p className="text-xs text-slate-400">Cumulative expenditure velocity this month</p>
            </div>
            <button
              onClick={() => onNavigate('analytics')}
              className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold"
            >
              <span>Full Analytics</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="spendingGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="day"
                  stroke="#475569"
                  fontSize={11}
                  tickLine={false}
                  interval={Math.max(1, Math.floor(timeline.length / 6))}
                />
                <YAxis
                  stroke="#475569"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => `${currency}${val}`}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl shadow-xl text-xs font-mono">
                          <p className="text-slate-400">{data.day}</p>
                          <p className="text-emerald-400 font-bold text-sm mt-0.5">
                            Spent: {currency}
                            {data.amount.toLocaleString()}
                          </p>
                          <p className="text-slate-300 mt-0.5">
                            Cumulative: {currency}
                            {data.cumulative.toLocaleString()}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="cumulative"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#spendingGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Distribution (1 col) */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-base text-white">Categories</h3>
            <span className="text-xs text-slate-500 font-mono">
              {summary?.categoryBreakdown.length || 0} active
            </span>
          </div>

          <div className="h-44 w-full flex items-center justify-center">
            {summary?.categoryBreakdown && summary.categoryBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPie>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="amount"
                  >
                    {pieData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CATEGORY_COLORS[entry.name] || '#64748b'}
                        stroke="#0f172a"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono">
                            <span className="font-bold text-white">{d.name}: </span>
                            <span className="text-emerald-400">
                              {currency}
                              {d.amount.toLocaleString()} ({d.percentage}%)
                            </span>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </RechartsPie>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-slate-500 text-center py-8">
                No expense data recorded this month
              </div>
            )}
          </div>

          {/* Category Top List */}
          <div className="flex flex-col gap-2 mt-2 max-h-36 overflow-y-auto">
            {summary?.categoryBreakdown.slice(0, 4).map((cat) => (
              <div key={cat.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: CATEGORY_COLORS[cat.name] || '#64748b' }}
                  />
                  <span className="text-slate-300 truncate max-w-[120px]">{cat.name}</span>
                </div>
                <div className="font-mono text-slate-200">
                  {currency}
                  {cat.amount.toLocaleString()} ({cat.percentage}%)
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Insight Teaser Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-cyan-950/40 border border-emerald-500/20 backdrop-blur-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h4 className="font-bold text-sm sm:text-base text-white flex items-center gap-2">
              Gemini AI Spending Analysis Ready
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Live
              </span>
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Review pattern shifts, saving recommendations, and automated category velocity insights.
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigate('ai_insights')}
          className="px-4 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 font-semibold text-xs sm:text-sm flex items-center gap-1.5 transition-all shrink-0"
        >
          <span>View Insights</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Recent Transactions List */}
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-base text-white">Recent Transactions</h3>
            <p className="text-xs text-slate-400">Latest activity from your ledger</p>
          </div>
          <button
            onClick={() => onNavigate('expenses')}
            className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {summary?.recentExpenses && summary.recentExpenses.length > 0 ? (
          <div className="divide-y divide-slate-800/80">
            {summary.recentExpenses.map((exp) => (
              <div
                key={exp.id}
                className="py-3 flex items-center justify-between gap-4 hover:bg-slate-800/30 px-2 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0"
                    style={{ backgroundColor: `${CATEGORY_COLORS[exp.category] || '#64748b'}25` }}
                  >
                    <span style={{ color: CATEGORY_COLORS[exp.category] || '#94a3b8' }}>
                      {exp.category.charAt(0)}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-semibold text-white truncate">
                      {exp.title}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                      <span>{exp.category}</span>
                      <span>•</span>
                      <span>{new Date(exp.date).toLocaleDateString()}</span>
                      {exp.paymentMethod && (
                        <>
                          <span>•</span>
                          <span className="font-mono text-[10px] text-slate-500">
                            {exp.paymentMethod}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="font-mono font-bold text-sm sm:text-base text-white text-right shrink-0">
                  -{currency}
                  {exp.amount.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-slate-500 text-xs">
            No transactions found. Click "Add Expense" to record your first transaction.
          </div>
        )}
      </div>
    </div>
  );
}
