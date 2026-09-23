import React, { useState } from 'react';
import { X, PieChart, Loader2 } from 'lucide-react';
import { CATEGORIES } from '../types';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBudgetSaved: () => void;
  currentMonth: string;
}

export function BudgetModal({
  isOpen,
  onClose,
  onBudgetSaved,
  currentMonth,
}: BudgetModalProps) {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [category, setCategory] = useState<string>('Total');
  const [amount, setAmount] = useState<string>('');
  const [month, setMonth] = useState<string>(currentMonth);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      showToast('Please enter a valid positive budget amount', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.budgets.createOrUpdate({
        category,
        amount: parsedAmount,
        month,
      });
      showToast(`${category} budget saved successfully!`, 'success');
      onBudgetSaved();
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to set budget', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currencySymbol = user?.currency || '₹';
  const allCategories = ['Total', ...CATEGORIES];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <PieChart className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Set Budget Target</h3>
              <p className="text-xs text-slate-400">Prevent overspending with visual alerts</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Budget Target Type
            </label>
            <select
              id="select-budget-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
            >
              <option value="Total">Overall Monthly Budget (All Expenses)</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat} Specific Budget
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400 mt-1">
              {category === 'Total'
                ? 'Monitors total monthly spending against your ceiling.'
                : `Monitors monthly expenses categorized under ${category}.`}
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Budget Amount ({currencySymbol}) *
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-slate-400 font-bold text-sm">
                {currencySymbol}
              </span>
              <input
                id="input-budget-amount"
                type="number"
                step="1"
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 8000"
                required
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl pl-8 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Target Month
            </label>
            <input
              id="input-budget-month"
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              required
              className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-mono"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="btn-save-budget"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-bold text-sm shadow-[0_0_20px_rgba(6,182,212,0.3)] flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Save Budget Target</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
