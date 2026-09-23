import { Sparkles, Plus, Bell, Menu, X, Wallet } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  onOpenAddExpense: () => void;
  onToggleMobileSidebar: () => void;
  isMobileSidebarOpen: boolean;
  activeAlertsCount?: number;
  onNavigateToBudgets?: () => void;
}

export function Navbar({
  onOpenAddExpense,
  onToggleMobileSidebar,
  isMobileSidebarOpen,
  activeAlertsCount = 0,
  onNavigateToBudgets,
}: NavbarProps) {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-30 w-full h-16 border-b border-slate-800/80 bg-[#090d16]/80 backdrop-blur-xl px-4 sm:px-6 flex items-center justify-between transition-all">
      {/* Left section: mobile hamburger & quick brand */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
          aria-label="Toggle navigation menu"
        >
          {isMobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.3)]">
            <Sparkles className="w-4 h-4 text-slate-950" />
          </div>
          <span className="font-bold text-lg tracking-tight text-white hidden sm:inline-block">
            Expense<span className="text-emerald-400">AI</span>
          </span>
          <span className="text-[10px] tracking-wider uppercase font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hidden md:inline-block">
            Gemini Engine
          </span>
        </div>
      </div>

      {/* Right section: live alert badge, quick add expense, user profile avatar */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {activeAlertsCount > 0 && (
          <button
            onClick={onNavigateToBudgets}
            className="relative p-2 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 transition-colors"
            title={`${activeAlertsCount} budget warning(s)`}
          >
            <Bell className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-slate-950 font-bold text-[10px] flex items-center justify-center animate-pulse">
              {activeAlertsCount}
            </span>
          </button>
        )}

        <button
          id="btn-quick-add-expense"
          onClick={onOpenAddExpense}
          className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-semibold text-xs sm:text-sm shadow-[0_0_20px_rgba(16,185,129,0.25)] transition-all transform active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span className="hidden xs:inline">Add Expense</span>
        </button>

        {user && (
          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-emerald-400">
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="hidden xl:block text-left text-xs leading-tight">
              <div className="font-semibold text-slate-200 truncate max-w-[120px]">{user.name}</div>
              <div className="text-[10px] text-slate-400 flex items-center gap-1">
                <Wallet className="w-3 h-3 text-emerald-400" />
                <span>{user.currency || '₹'} INR</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
