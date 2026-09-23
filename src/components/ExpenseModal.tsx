import React, { useState, useEffect } from 'react';
import { X, Sparkles, Loader2, Calendar, CreditCard, Tag } from 'lucide-react';
import { Expense, CATEGORIES, PAYMENT_METHODS } from '../types';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExpenseSaved: () => void;
  editingExpense?: Expense | null;
}

export function ExpenseModal({
  isOpen,
  onClose,
  onExpenseSaved,
  editingExpense,
}: ExpenseModalProps) {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<string>('Food');
  const [paymentMethod, setPaymentMethod] = useState<string>('UPI');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCategorizing, setIsCategorizing] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<{
    category: string;
    confidence: number;
    reason: string;
  } | null>(null);

  useEffect(() => {
    if (editingExpense) {
      setTitle(editingExpense.title);
      setAmount(String(editingExpense.amount));
      setCategory(editingExpense.category);
      setPaymentMethod(editingExpense.paymentMethod || 'UPI');
      setDate(new Date(editingExpense.date).toISOString().split('T')[0]);
      setDescription(editingExpense.description || '');
      setAiSuggestion(null);
    } else {
      setTitle('');
      setAmount('');
      setCategory('Food');
      setPaymentMethod('UPI');
      setDate(new Date().toISOString().split('T')[0]);
      setDescription('');
      setAiSuggestion(null);
    }
  }, [editingExpense, isOpen]);

  if (!isOpen) return null;

  const handleAiSuggest = async () => {
    if (!title.trim()) {
      showToast('Please enter an expense title first to analyze category', 'warning');
      return;
    }

    setIsCategorizing(true);
    try {
      const res = await api.ai.categorize({
        title: title.trim(),
        description: description.trim(),
      });
      setCategory(res.category);
      setAiSuggestion({
        category: res.category,
        confidence: res.confidence,
        reason: res.reason,
      });
      showToast(`AI suggested category: ${res.category}`, 'info');
    } catch {
      showToast('Could not analyze category with AI', 'error');
    } finally {
      setIsCategorizing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      showToast('Expense title is required', 'warning');
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      showToast('Please enter a valid amount greater than 0', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingExpense) {
        await api.expenses.update(editingExpense.id, {
          title: title.trim(),
          amount: parsedAmount,
          category,
          paymentMethod,
          date,
          description: description.trim() || undefined,
        });
        showToast('Expense updated successfully!', 'success');
      } else {
        await api.expenses.create({
          title: title.trim(),
          amount: parsedAmount,
          category,
          paymentMethod,
          date,
          description: description.trim() || undefined,
        });
        showToast('Expense recorded successfully!', 'success');
      }

      onExpenseSaved();
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to save expense', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currencySymbol = user?.currency || '₹';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">
                {editingExpense ? 'Edit Expense' : 'Add New Expense'}
              </h3>
              <p className="text-xs text-slate-400">Track and categorize your spending</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          {/* Title & AI categorization trigger */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Expense Title / Merchant *
            </label>
            <div className="relative flex items-center">
              <input
                id="input-expense-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Domino's Pizza, Uber Ride, Netflix"
                required
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all pr-24"
              />
              <button
                type="button"
                id="btn-ai-categorize"
                onClick={handleAiSuggest}
                disabled={isCategorizing || !title.trim()}
                className="absolute right-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-medium flex items-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                title="AI automatically detects category from merchant or description"
              >
                {isCategorizing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                )}
                <span>AI Auto</span>
              </button>
            </div>
            {aiSuggestion && (
              <div className="mt-1.5 text-xs text-emerald-400/90 flex items-center gap-1.5 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                AI detected: <strong className="text-white">{aiSuggestion.category}</strong> (
                {aiSuggestion.reason})
              </div>
            )}
          </div>

          {/* Amount and Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Amount ({currencySymbol}) *
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-slate-400 font-bold text-sm">
                  {currencySymbol}
                </span>
                <input
                  id="input-expense-amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  required
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl pl-8 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Date *
              </label>
              <div className="relative flex items-center">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                <input
                  id="input-expense-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Category Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Category *
            </label>
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1 bg-slate-950/40 rounded-xl border border-slate-800/80">
              {CATEGORIES.map((cat) => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    category === cat
                      ? 'bg-emerald-500 text-slate-950 font-bold shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                      : 'bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-slate-400" />
              Payment Method
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {PAYMENT_METHODS.map((pm) => (
                <button
                  type="button"
                  key={pm}
                  onClick={() => setPaymentMethod(pm)}
                  className={`py-1.5 px-2 rounded-lg text-xs font-medium text-center transition-all ${
                    paymentMethod === pm
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold'
                      : 'bg-slate-950/50 text-slate-400 border border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {pm}
                </button>
              ))}
            </div>
          </div>

          {/* Optional Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Notes / Description (Optional)
            </label>
            <textarea
              id="input-expense-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Dinner with team after product launch"
              rows={2}
              className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all resize-none"
            />
          </div>

          {/* Action Buttons */}
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
              id="btn-save-expense"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{editingExpense ? 'Save Changes' : 'Save Expense'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
