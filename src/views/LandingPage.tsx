import React, { useState } from 'react';
import {
  Sparkles,
  TrendingUp,
  PieChart,
  ShieldCheck,
  Bell,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle,
  Lock,
  Mail,
  User,
  Zap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

interface LandingPageProps {
  onOpenDashboard: () => void;
}

export function LandingPage({ onOpenDashboard }: LandingPageProps) {
  const { login, register, isAuthenticated } = useAuth();
  const { showToast } = useToast();

  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (authMode === 'login') {
        await login(email, password);
        showToast('Welcome back to ExpenseAI!', 'success');
        setShowAuthModal(false);
        onOpenDashboard();
      } else {
        if (password !== confirmPassword) {
          showToast('Passwords do not match', 'error');
          setIsSubmitting(false);
          return;
        }
        await register(name, email, password, confirmPassword);
        showToast('Account created successfully!', 'success');
        setShowAuthModal(false);
        onOpenDashboard();
      }
    } catch (err: any) {
      showToast(err.message || 'Authentication failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col selection:bg-emerald-500/30 selection:text-emerald-300">
      {/* Top Floating Glass Header */}
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-[#090d16]/80 backdrop-blur-xl px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-400 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)]">
            <Sparkles className="w-5 h-5 text-slate-950 stroke-[2.2]" />
          </div>
          <span className="font-extrabold text-xl tracking-tight text-white">
            Expense<span className="text-emerald-400">AI</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <button
              onClick={onOpenDashboard}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-sm shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center gap-1.5 transition-all hover:scale-105"
            >
              <span>Go to Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <>
              <button
                onClick={() => {
                  setAuthMode('login');
                  setShowAuthModal(true);
                }}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
              >
                Log In
              </button>
              <button
                onClick={() => {
                  setAuthMode('register');
                  setShowAuthModal(true);
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-sm shadow-[0_0_15px_rgba(16,185,129,0.25)] transition-all hover:from-emerald-400 hover:to-teal-400"
              >
                Get Started
              </button>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-6 py-20 md:py-28 max-w-5xl mx-auto text-center flex flex-col items-center">
        {/* Subtle Ambient Radial Glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none -z-10" />

        {/* Main Display Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white max-w-3xl leading-[1.15]">
          Understand your money.{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
            Control your spending.
          </span>
        </h1>

        {/* Supporting Copy */}
        <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl font-normal leading-relaxed">
          ExpenseAI turns your everyday transactions into clear insights, smarter budgets, and
          actionable financial recommendations powered by Google's latest Gemini models.
        </p>

        {/* CTA Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <button
            id="btn-landing-get-started"
            onClick={() => {
              if (isAuthenticated) {
                onOpenDashboard();
              } else {
                setAuthMode('register');
                setShowAuthModal(true);
              }
            }}
            className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm sm:text-base shadow-[0_0_25px_rgba(16,185,129,0.35)] flex items-center gap-2 transition-all transform active:scale-95"
          >
            <span>Get Started Free</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>

        </div>

        {/* Security & Highlights Trust Badges */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 font-medium">
          <div className="flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>Encrypted Ledger</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>No Fabrication Guarantee</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>Server-Side Gemini AI</span>
          </div>
        </div>
      </section>

      {/* Feature Grid Section */}
      <section className="px-6 py-16 max-w-6xl mx-auto w-full">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Financial clarity in high definition
          </h2>
          <p className="text-slate-400 text-sm mt-2">
            Every transaction analyzed against your actual ledger—never simulated.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1: AI-Powered Insights */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/90 backdrop-blur-xl hover:border-emerald-500/40 transition-all flex flex-col gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">AI-Powered Insights</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Understand where your money is going. Neural analysis identifies spending shifts,
              high-velocity categories, and opportunities to optimize your cash flow.
            </p>
          </div>

          {/* Card 2: Smart Budgeting */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/90 backdrop-blur-xl hover:border-cyan-500/40 transition-all flex flex-col gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <PieChart className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Smart Budgeting</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Set category-wise budgets and track real progress in real-time. Instant visual
              thresholds alert you before you exceed your target limits.
            </p>
          </div>

          {/* Card 3: Spending Analytics */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/90 backdrop-blur-xl hover:border-teal-500/40 transition-all flex flex-col gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Spending Analytics</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Visualize spending trends over time with interactive Recharts. Daily expense velocity,
              category distribution donuts, and historical monthly comparisons.
            </p>
          </div>

          {/* Card 4: Intelligent Alerts */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/90 backdrop-blur-xl hover:border-amber-500/40 transition-all flex flex-col gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Bell className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Intelligent Alerts</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Never get caught off guard by unexpected bills or exceeding budgets. Proactive 80% and
              100% threshold calculations flag overspending instantly.
            </p>
          </div>

          {/* Card 5: Natural Language Queries */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/90 backdrop-blur-xl hover:border-indigo-500/40 transition-all flex flex-col gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Ask ExpenseAI</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Ask questions in plain English: "How much did I spend on food this month?" or "Show my
              biggest expenses" and get direct answers backed by your database.
            </p>
          </div>

          {/* Card 6: Privacy First */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/90 backdrop-blur-xl hover:border-emerald-500/40 transition-all flex flex-col gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Privacy First</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Zero third-party data selling. Every query is strictly isolated to your authenticated
              account with cryptographic JWT security and bcrypt salted hashes.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 bg-[#070a11] px-6 py-10 text-xs text-slate-400">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-slate-200">ExpenseAI</span>
            <span className="text-slate-500">© {new Date().getFullYear()} All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6">
            <span className="hover:text-slate-200 cursor-pointer">About</span>
            <span className="hover:text-slate-200 cursor-pointer">Features</span>
            <span className="hover:text-slate-200 cursor-pointer">Privacy</span>
            <span className="hover:text-slate-200 cursor-pointer">Terms</span>
            <span className="hover:text-slate-200 cursor-pointer">Contact</span>
          </div>
        </div>
      </footer>

      {/* Auth Modal (Login & Register) */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 shadow-[0_0_60px_rgba(0,0,0,0.9)] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Tabs */}
            <div className="flex border-b border-slate-800 bg-slate-950/60">
              <button
                type="button"
                onClick={() => setAuthMode('login')}
                className={`flex-1 py-3.5 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${
                  authMode === 'login'
                    ? 'border-emerald-400 text-emerald-400 bg-slate-900/50'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Log In
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('register')}
                className={`flex-1 py-3.5 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${
                  authMode === 'register'
                    ? 'border-emerald-400 text-emerald-400 bg-slate-900/50'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Create Account
              </button>
            </div>

            <form onSubmit={handleAuthSubmit} className="p-6 flex flex-col gap-4">
              {authMode === 'register' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Your Full Name *
                  </label>
                  <div className="relative flex items-center">
                    <User className="w-4 h-4 text-slate-500 absolute left-3.5 pointer-events-none" />
                    <input
                      id="input-auth-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Tanmay Sharma"
                      required
                      className="w-full bg-slate-950/60 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Email Address *
                </label>
                <div className="relative flex items-center">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 pointer-events-none" />
                  <input
                    id="input-auth-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-mono text-xs sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Password *
                </label>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 pointer-events-none" />
                  <input
                    id="input-auth-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {authMode === 'register' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Confirm Password *
                  </label>
                  <div className="relative flex items-center">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 pointer-events-none" />
                    <input
                      id="input-auth-confirm-password"
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={6}
                      className="w-full bg-slate-950/60 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAuthModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="btn-auth-submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-sm shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:from-emerald-400 hover:to-teal-400 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Authenticating...' : authMode === 'login' ? 'Sign In' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
