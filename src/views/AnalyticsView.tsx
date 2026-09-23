import { useState, useEffect } from 'react';
import {
  TrendingUp,
  PieChart as PieIcon,
  BarChart3,
  Calendar,
  Layers,
  ArrowUpRight,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPie,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { AnalyticsSummary, MonthlyChartData, TimelineData } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const CATEGORY_COLORS: Record<string, string> = {
  Food: '#10b981',
  Shopping: '#f59e0b',
  Transport: '#06b6d4',
  Bills: '#6366f1',
  Entertainment: '#ec4899',
  Health: '#14b8a6',
  Subscription: '#8b5cf6',
  Education: '#3b82f6',
  Travel: '#eab308',
  Other: '#64748b',
};

export function AnalyticsView() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyChartData[]>([]);
  const [timeline, setTimeline] = useState<TimelineData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const currency = user?.currency || '₹';

  const loadAllAnalytics = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const [sumRes, monthRes, timeRes] = await Promise.all([
        api.analytics.summary(),
        api.analytics.monthly(),
        api.analytics.timeline(),
      ]);

      setSummary(sumRes);
      setMonthlyData(monthRes.months);
      setTimeline(timeRes.timeline);
      if (isManual) showToast('Analytics data refreshed', 'info');
    } catch {
      showToast('Failed to load financial analytics', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAllAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
        <p className="text-sm text-slate-400">Computing ledger visual analytics...</p>
      </div>
    );
  }

  const categoryData = summary?.categoryBreakdown || [];

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Financial Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Deep-dive visual breakdown of expenditure patterns, trajectories, and allocations
          </p>
        </div>

        <button
          onClick={() => loadAllAnalytics(true)}
          disabled={refreshing}
          className="p-2.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          title="Refresh analytics"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-emerald-400' : ''}`} />
        </button>
      </div>

      {/* Top 3 Analytical Summary Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Current Month Spend
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono mt-2">
            {currency}
            {summary?.totalSpending.toLocaleString()}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Across {summary?.transactionCount} verified ledger entries
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Previous Month Spend
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-300 font-mono mt-2">
            {currency}
            {summary?.prevTotalSpending.toLocaleString()}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {summary?.monthlyChangePercent !== undefined && summary.monthlyChangePercent >= 0 ? (
              <span className="text-rose-400 font-semibold">+{summary.monthlyChangePercent}% increase</span>
            ) : (
              <span className="text-emerald-400 font-semibold">{summary?.monthlyChangePercent}% decrease</span>
            )}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Top Expenditure Category
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono mt-2 truncate">
            {categoryData[0]?.name || 'None'}
          </div>
          <div className="text-xs text-slate-400 mt-1 font-mono">
            {categoryData[0]
              ? `${currency}${categoryData[0].amount.toLocaleString()} (${categoryData[0].percentage}% of spend)`
              : 'No entries yet'}
          </div>
        </div>
      </div>

      {/* Chart 1: 6-Month Comparison (Bar Chart: Spent vs Budget) */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-base text-white">6-Month Spending vs Budget</h3>
            <p className="text-xs text-slate-400">Compare monthly spending against established limits</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" />
              <span className="text-slate-300">Spent</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-cyan-600 inline-block" />
              <span className="text-slate-300">Budget Target</span>
            </div>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <XAxis dataKey="name" stroke="#475569" fontSize={11} tickLine={false} />
              <YAxis
                stroke="#475569"
                fontSize={11}
                tickLine={false}
                tickFormatter={(v) => `${currency}${v}`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono shadow-xl">
                        <p className="text-white font-bold">{d.name}</p>
                        <p className="text-emerald-400 mt-1">
                          Spent: {currency}
                          {d.spent.toLocaleString()}
                        </p>
                        <p className="text-cyan-400">
                          Budget: {currency}
                          {d.budget.toLocaleString()}
                        </p>
                        <p className="text-slate-400 mt-0.5">
                          Transactions: {d.transactionCount}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="spent" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={38} />
              <Bar dataKey="budget" fill="#0891b2" radius={[4, 4, 0, 0]} maxBarSize={38} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grid: Category Distribution Donut & Daily Trajectory Area Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown Donut */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="font-bold text-base text-white">Category Allocation</h3>
              <p className="text-xs text-slate-400">Percentage distribution of current month</p>
            </div>
            <PieIcon className="w-5 h-5 text-slate-500" />
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPie>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={3}
                    dataKey="amount"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CATEGORY_COLORS[entry.name] || '#64748b'}
                        stroke="#090d16"
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
              <div className="text-xs text-slate-500">No expenses recorded</div>
            )}
          </div>

          {/* Legend Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-800/80">
            {categoryData.map((c) => (
              <div key={c.name} className="flex items-center gap-2 text-xs">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: CATEGORY_COLORS[c.name] || '#64748b' }}
                />
                <span className="text-slate-300 truncate text-[11px]">
                  {c.name} ({c.percentage}%)
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Daily Velocity Area Chart */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="font-bold text-base text-white">Daily Spending Velocity</h3>
              <p className="text-xs text-slate-400">Daily incremental transactions</p>
            </div>
            <TrendingUp className="w-5 h-5 text-emerald-400" />
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="dailyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="day"
                  stroke="#475569"
                  fontSize={11}
                  tickLine={false}
                  interval={Math.max(1, Math.floor(timeline.length / 5))}
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
                      const d = payload[0].payload;
                      return (
                        <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono shadow-xl">
                          <p className="text-slate-400">{d.day}</p>
                          <p className="text-cyan-400 font-bold text-sm">
                            Day Spend: {currency}
                            {d.amount.toLocaleString()}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#dailyGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Tracking daily pacing helps maintain monthly targets.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
