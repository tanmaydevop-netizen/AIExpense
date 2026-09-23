import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Plus,
  Filter,
  Edit2,
  Trash2,
  Calendar,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Loader2,
  X,
} from 'lucide-react';
import { Expense, CATEGORIES, PAYMENT_METHODS } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ExpenseModal } from '../components/ExpenseModal';
import { ConfirmationModal } from '../components/ConfirmationModal';

export function ExpensesView() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  // Search and Filter states
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [sortBy, setSortBy] = useState('date_desc');
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

  // Modals state
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const [deleteExpenseId, setDeleteExpenseId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const currency = user?.currency || '₹';

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.expenses.list({
        search: search.trim() || undefined,
        category: category || undefined,
        paymentMethod: paymentMethod || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        minAmount: minAmount ? parseFloat(minAmount) : undefined,
        maxAmount: maxAmount ? parseFloat(maxAmount) : undefined,
        sortBy,
        page,
        limit,
      });

      setExpenses(res.expenses);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch {
      showToast('Failed to load expenses', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, category, paymentMethod, startDate, endDate, minAmount, maxAmount, sortBy, page, limit, showToast]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const handleClearFilters = () => {
    setSearch('');
    setCategory('');
    setPaymentMethod('');
    setStartDate('');
    setEndDate('');
    setMinAmount('');
    setMaxAmount('');
    setSortBy('date_desc');
    setPage(1);
  };

  const hasActiveFilters =
    Boolean(category) ||
    Boolean(paymentMethod) ||
    Boolean(startDate) ||
    Boolean(endDate) ||
    Boolean(minAmount) ||
    Boolean(maxAmount) ||
    sortBy !== 'date_desc';

  const handleEdit = (exp: Expense) => {
    setEditingExpense(exp);
    setIsExpenseModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteExpenseId) return;
    setIsDeleting(true);
    try {
      await api.expenses.delete(deleteExpenseId);
      showToast('Expense deleted successfully', 'success');
      setDeleteExpenseId(null);
      fetchExpenses();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete expense', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 max-w-7xl mx-auto w-full">
      {/* Top Header & Add Expense Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Expense Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Search, filter, categorize, and maintain your transaction records
          </p>
        </div>

        <button
          id="btn-add-expense-page"
          onClick={() => {
            setEditingExpense(null);
            setIsExpenseModalOpen(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs sm:text-sm shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center gap-1.5 transition-all"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Expense</span>
        </button>
      </div>

      {/* Search Bar & Quick Filters */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
            <input
              id="input-expense-search"
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by title, merchant, or notes..."
              className="w-full bg-slate-950/60 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Category Select */}
          <select
            id="select-category-filter"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
            className="bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Sort By Select */}
          <select
            id="select-sort-by"
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setPage(1);
            }}
            className="bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
          >
            <option value="date_desc">Newest First</option>
            <option value="date_asc">Oldest First</option>
            <option value="amount_desc">Highest Amount</option>
            <option value="amount_asc">Lowest Amount</option>
          </select>

          {/* More Filters Toggle */}
          <button
            onClick={() => setShowFilterDrawer(!showFilterDrawer)}
            className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors border ${
              hasActiveFilters
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>Filters {hasActiveFilters && '(Active)'}</span>
          </button>
        </div>

        {/* Expandable Advanced Filters */}
        {showFilterDrawer && (
          <div className="pt-3 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 animate-in fade-in duration-150">
            {/* Payment Method */}
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => {
                  setPaymentMethod(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white"
              >
                <option value="">Any Method</option>
                {PAYMENT_METHODS.map((pm) => (
                  <option key={pm} value={pm}>
                    {pm}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white"
              />
            </div>

            {/* Amount Range */}
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">
                  Min ({currency})
                </label>
                <input
                  type="number"
                  placeholder="Min"
                  value={minAmount}
                  onChange={(e) => {
                    setMinAmount(e.target.value);
                    setPage(1);
                  }}
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white font-mono"
                />
              </div>
              <div className="flex-1">
                <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">
                  Max ({currency})
                </label>
                <input
                  type="number"
                  placeholder="Max"
                  value={maxAmount}
                  onChange={(e) => {
                    setMaxAmount(e.target.value);
                    setPage(1);
                  }}
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white font-mono"
                />
              </div>
            </div>

            {hasActiveFilters && (
              <div className="sm:col-span-2 lg:col-span-4 flex justify-end">
                <button
                  onClick={handleClearFilters}
                  className="text-xs text-rose-400 hover:text-rose-300 font-semibold"
                >
                  Reset All Filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Expenses Table */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
            <p className="text-xs text-slate-400">Querying transactions...</p>
          </div>
        ) : expenses.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] sm:text-xs font-semibold tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4 sm:px-6">Title & Merchant</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4">Payment Method</th>
                    <th className="py-3.5 px-4 text-right">Amount</th>
                    <th className="py-3.5 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {expenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="font-semibold text-white truncate max-w-xs sm:max-w-sm">
                          {exp.title}
                        </div>
                        {exp.description && (
                          <div className="text-[11px] text-slate-400 truncate max-w-xs mt-0.5">
                            {exp.description}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-200 text-xs font-medium border border-slate-700/60">
                          {exp.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300 font-mono text-xs whitespace-nowrap">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          {new Date(exp.date).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 text-xs whitespace-nowrap">
                        <span className="flex items-center gap-1.5">
                          <CreditCard className="w-3.5 h-3.5 text-slate-500" />
                          {exp.paymentMethod || 'UPI'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-white whitespace-nowrap">
                        -{currency}
                        {exp.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleEdit(exp)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                            title="Edit expense"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteExpenseId(exp.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Delete expense"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="px-6 py-3.5 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 bg-slate-950/40">
              <div>
                Showing{' '}
                <span className="font-semibold text-slate-200">
                  {expenses.length > 0 ? (page - 1) * limit + 1 : 0}
                </span>{' '}
                to{' '}
                <span className="font-semibold text-slate-200">
                  {Math.min(page * limit, total)}
                </span>{' '}
                of <span className="font-semibold text-slate-200">{total}</span> transactions
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 text-slate-300 disabled:opacity-40 disabled:hover:bg-transparent"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-mono text-xs text-slate-300">
                  Page {page} of {Math.max(1, totalPages)}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 text-slate-300 disabled:opacity-40 disabled:hover:bg-transparent"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="py-16 text-center flex flex-col items-center justify-center gap-2">
            <p className="text-sm text-slate-400 font-medium">No transactions match your criteria</p>
            {hasActiveFilters ? (
              <button
                onClick={handleClearFilters}
                className="text-xs text-emerald-400 hover:underline font-semibold mt-1"
              >
                Clear all filters
              </button>
            ) : (
              <button
                onClick={() => setIsExpenseModalOpen(true)}
                className="text-xs text-emerald-400 hover:underline font-semibold mt-1"
              >
                Add your first expense
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        onExpenseSaved={fetchExpenses}
        editingExpense={editingExpense}
      />

      <ConfirmationModal
        isOpen={Boolean(deleteExpenseId)}
        title="Delete Transaction"
        message="Are you sure you want to delete this expense? This action will permanently remove it from your ledger and update your budget progress."
        confirmLabel="Delete Transaction"
        isLoading={isDeleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteExpenseId(null)}
      />
    </div>
  );
}
