import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Mail,
  Wallet,
  Lock,
  Download,
  Calendar,
  Shield,
  Loader2,
  CheckCircle2,
  LogOut,
  FileArchive,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';

const CURRENCIES = [
  { symbol: '₹', label: 'INR (₹) - Indian Rupee' },
  { symbol: '$', label: 'USD ($) - US Dollar' },
  { symbol: '€', label: 'EUR (€) - Euro' },
  { symbol: '£', label: 'GBP (£) - British Pound' },
  { symbol: '¥', label: 'JPY (¥) - Japanese Yen' },
  { symbol: 'A$', label: 'AUD (A$) - Australian Dollar' },
  { symbol: 'C$', label: 'CAD (C$) - Canadian Dollar' },
  { symbol: 'AED', label: 'AED - UAE Dirham' },
];

export function ProfileView() {
  const { user, refreshUser, logout } = useAuth();
  const { showToast } = useToast();

  const [name, setName] = useState(user?.name || '');
  const [currency, setCurrency] = useState(user?.currency || '₹');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isUpdating, setIsUpdating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [stats, setStats] = useState<{ expenses: number; budgets: number }>({ expenses: 0, budgets: 0 });

  useEffect(() => {
    if (user) {
      setName(user.name);
      setCurrency(user.currency || '₹');
    }
    api.profile
      .get()
      .then((res) => {
        setStats(res.user._count);
      })
      .catch(() => {});
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword && newPassword !== confirmPassword) {
      showToast('New passwords do not match', 'warning');
      return;
    }

    setIsUpdating(true);
    try {
      await api.profile.update({
        name: name.trim(),
        currency: currency.trim(),
        currentPassword: currentPassword || undefined,
        newPassword: newPassword || undefined,
      });

      await refreshUser();
      showToast('Profile settings updated successfully!', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      showToast(err.message || 'Failed to update profile', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const res = await api.expenses.list({ limit: 1000 });
      const expenses = res.expenses;

      if (expenses.length === 0) {
        showToast('No expenses found to export', 'info');
        return;
      }

      const headers = ['ID', 'Title', 'Amount', 'Category', 'PaymentMethod', 'Date', 'Description'];
      const rows = expenses.map((e) => [
        `"${e.id}"`,
        `"${e.title.replace(/"/g, '""')}"`,
        e.amount,
        `"${e.category}"`,
        `"${e.paymentMethod || 'UPI'}"`,
        `"${e.date}"`,
        `"${(e.description || '').replace(/"/g, '""')}"`,
      ]);

      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `ExpenseAI_ledger_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast('Exported expense ledger as CSV', 'success');
    } catch {
      showToast('Failed to export ledger', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 max-w-4xl mx-auto w-full">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Account & Preferences
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Manage your personal details, default currency, and export options
        </p>
      </div>

      {/* Account Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Account Email
          </span>
          <div className="text-sm font-semibold text-white mt-1 truncate">{user?.email}</div>
          <span className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Verified Profile
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Total Ledger Entries
          </span>
          <div className="text-2xl font-extrabold text-white font-mono mt-1">
            {stats.expenses}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Recorded in SQLite</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Configured Budgets
          </span>
          <div className="text-2xl font-extrabold text-cyan-400 font-mono mt-1">
            {stats.budgets}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Active threshold rules</span>
        </div>
      </div>

      {/* Settings Form */}
      <form
        onSubmit={handleUpdateProfile}
        className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl flex flex-col gap-5"
      >
        <h3 className="text-base font-bold text-white border-b border-slate-800 pb-3">
          Profile Settings
        </h3>

        {/* Display Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Full Name
          </label>
          <div className="relative flex items-center">
            <UserCheck className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full bg-slate-950/60 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-all"
            />
          </div>
        </div>

        {/* Currency Preference */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Default Currency Symbol
          </label>
          <div className="relative flex items-center">
            <Wallet className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full bg-slate-950/60 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-all"
            >
              {CURRENCIES.map((c) => (
                <option key={c.symbol} value={c.symbol}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Security / Password section */}
        <div className="pt-3 border-t border-slate-800 flex flex-col gap-3">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            Change Password (Optional)
          </h4>

          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                minLength={6}
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                minLength={6}
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            id="btn-save-profile"
            disabled={isUpdating}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center gap-2 transition-all disabled:opacity-50"
          >
            {isUpdating && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>Save Preferences</span>
          </button>
        </div>
      </form>

      {/* Data Export & Project Download */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-white">Export Financial Data</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Download your entire transaction history in CSV format for spreadsheet analysis.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          disabled={isExporting}
          className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors shrink-0"
        >
          {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          <span>Export Ledger (CSV)</span>
        </button>
      </div>

      {/* Download Entire Codebase ZIP */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-cyan-500/20 backdrop-blur-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white">Download Complete Source Code</h3>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
              Full Project ZIP
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Get the complete project repository including React frontend, Express backend, Prisma SQLite schemas, and seed files.
          </p>
        </div>

        <a
          href="/api/download-zip"
          download="expenseai-project.zip"
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-bold text-xs sm:text-sm shadow-[0_0_20px_rgba(6,182,212,0.3)] flex items-center gap-2 transition-all shrink-0"
        >
          <FileArchive className="w-4 h-4" />
          <span>Download Project ZIP</span>
        </a>
      </div>

      {/* Logout Action */}
      <div className="p-6 rounded-2xl bg-rose-950/20 border border-rose-500/20 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-rose-300">Log Out of ExpenseAI</h3>
          <p className="text-xs text-rose-400/80 mt-0.5">
            End your current session on this device.
          </p>
        </div>
        <button
          onClick={logout}
          className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-[0_0_15px_rgba(244,63,94,0.3)] flex items-center gap-1.5"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}
