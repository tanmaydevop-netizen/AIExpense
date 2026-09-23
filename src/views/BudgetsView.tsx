import { useState, useEffect } from 'react';
import {
  PieChart,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Calendar,
  Loader2,
  TrendingDown,
  ShieldCheck,
} from 'lucide-react';
import { Budget } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { BudgetModal } from '../components/BudgetModal';
import { ConfirmationModal } from '../components/ConfirmationModal';

export function BudgetsView() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [totalSpending, setTotalSpending] = useState(0);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteBudgetId, setDeleteBudgetId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const currency = user?.currency || '₹';

  const loadBudgets = async () => {
    setLoading(true);
    try {
      const res = await api.budgets.list(selectedMonth);
      setBudgets(res.budgets);
      setTotalSpending(res.totalSpending);
    } catch {
      showToast('Failed to load budgets', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBudgets();
  }, [selectedMonth]);

  const confirmDelete = async () => {
    if (!deleteBudgetId) return;
    setIsDeleting(true);
    try {
      await api.budgets.delete(deleteBudgetId);
      showToast('Budget removed successfully', 'success');
      setDeleteBudgetId(null);
      loadBudgets();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete budget', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const overallBudget = budgets.find(
    (b) => b.category.toLowerCase() === 'total' || b.category.toLowerCase() === 'overall'
  );

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 max-w-7xl mx-auto w-full">
      {/* Header and Add Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Budget Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Enforce spending limits with dynamic visual threshold meters
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Month Selector */}
          <div className="relative flex items-center">
            <Calendar className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-slate-900/80 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          <button
            id="btn-create-budget"
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-bold text-xs sm:text-sm shadow-[0_0_20px_rgba(6,182,212,0.3)] flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Set Budget</span>
          </button>
        </div>
      </div>

      {/* Overall Summary Card */}
      {overallBudget && (
        <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/40 border border-cyan-500/20 backdrop-blur-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-md bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                Primary Monthly Ceiling
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-white mt-2">
                Overall Monthly Budget
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Cap for all combined expenses in {selectedMonth}
              </p>
            </div>

            <div className="flex items-center gap-6">
              <div>
                <div className="text-xs text-slate-400">Total Spent</div>
                <div className="text-xl font-bold text-white font-mono">
                  {currency}
                  {totalSpending.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Total Target</div>
                <div className="text-xl font-bold text-cyan-400 font-mono">
                  {currency}
                  {overallBudget.amount.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Remaining</div>
                <div
                  className={`text-xl font-bold font-mono ${
                    overallBudget.remaining > 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {currency}
                  {overallBudget.remaining.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Large Progress Bar */}
          <div className="mt-5">
            <div className="flex justify-between text-xs mb-1.5 font-mono">
              <span className="text-slate-400">{overallBudget.percentageUsed}% used</span>
              <span
                className={
                  overallBudget.status === 'exceeded'
                    ? 'text-rose-400 font-bold'
                    : overallBudget.status === 'warning'
                    ? 'text-amber-400 font-bold'
                    : 'text-emerald-400 font-bold'
                }
              >
                {overallBudget.status === 'exceeded'
                  ? 'Limit Exceeded!'
                  : overallBudget.status === 'warning'
                  ? 'Near Limit (Warning)'
                  : 'Safe Velocity'}
              </span>
            </div>
            <div className="w-full h-3 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
              <div
                className={`h-full transition-all duration-500 ${
                  overallBudget.status === 'exceeded'
                    ? 'bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.5)]'
                    : overallBudget.status === 'warning'
                    ? 'bg-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.5)]'
                    : 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]'
                }`}
                style={{ width: `${Math.min(100, overallBudget.percentageUsed)}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Category Budgets Grid */}
      <div className="flex flex-col gap-3">
        <h3 className="text-base font-bold text-white tracking-tight">Category Budgets</h3>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
            <p className="text-xs text-slate-400">Loading budget records...</p>
          </div>
        ) : budgets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {budgets.map((b) => {
              const statusColors = {
                safe: {
                  badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
                  bar: 'bg-emerald-500',
                  icon: CheckCircle2,
                  label: 'Safe (<80%)',
                },
                warning: {
                  badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
                  bar: 'bg-amber-400',
                  icon: AlertTriangle,
                  label: 'Warning (80-99%)',
                },
                exceeded: {
                  badge: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
                  bar: 'bg-rose-500',
                  icon: AlertTriangle,
                  label: 'Exceeded (>=100%)',
                },
              }[b.status];

              const Icon = statusColors.icon;

              return (
                <div
                  key={b.id}
                  className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl flex flex-col justify-between hover:border-slate-700 transition-all group"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-base text-white">{b.category}</h4>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border flex items-center gap-1 ${statusColors.badge}`}
                        >
                          <Icon className="w-3 h-3" />
                          <span>{statusColors.label}</span>
                        </span>
                      </div>

                      <button
                        onClick={() => setDeleteBudgetId(b.id)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                        title="Delete budget"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-4">
                      <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                        <div
                          className={`h-full transition-all duration-500 ${statusColors.bar}`}
                          style={{ width: `${Math.min(100, b.percentageUsed)}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-center text-xs text-slate-400 mt-1.5 font-mono">
                        <span>{b.percentageUsed}% spent</span>
                        <span>
                          Target: {currency}
                          {b.amount.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Metrics Breakdown */}
                    <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-800/80 text-xs">
                      <div>
                        <span className="text-slate-500 block">Spent</span>
                        <span className="font-mono font-bold text-slate-200">
                          {currency}
                          {b.spent.toLocaleString()}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-500 block">Remaining</span>
                        <span
                          className={`font-mono font-bold ${
                            b.remaining > 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {b.remaining > 0 ? '' : '-'}
                          {currency}
                          {Math.abs(b.remaining).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Alert message if any */}
                  {b.alertMessage && (
                    <div className="mt-3 p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-[11px] text-rose-300 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{b.alertMessage}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 rounded-2xl bg-slate-900/40 border border-slate-800 text-center flex flex-col items-center justify-center gap-2">
            <PieChart className="w-8 h-8 text-slate-600 mb-1" />
            <p className="text-sm font-semibold text-slate-300">
              No budgets established for {selectedMonth}
            </p>
            <p className="text-xs text-slate-500 max-w-sm">
              Establishing category budgets gives you automatic threshold alerts when nearing spending
              ceilings.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-3 px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 text-cyan-300 font-semibold text-xs transition-colors"
            >
              + Create First Budget
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      <BudgetModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onBudgetSaved={loadBudgets}
        currentMonth={selectedMonth}
      />

      <ConfirmationModal
        isOpen={Boolean(deleteBudgetId)}
        title="Remove Budget Target"
        message="Are you sure you want to remove this budget target? You will no longer receive threshold alerts for this category in this month."
        confirmLabel="Remove Budget"
        isLoading={isDeleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteBudgetId(null)}
      />
    </div>
  );
}
