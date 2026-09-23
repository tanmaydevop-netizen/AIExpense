import {
  LayoutDashboard,
  Receipt,
  PieChart,
  TrendingUp,
  Sparkles,
  MessageSquareCode,
  UserCheck,
  LogOut,
  Cpu,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export type NavView =
  | 'dashboard'
  | 'expenses'
  | 'budgets'
  | 'analytics'
  | 'ai_insights'
  | 'ask_ai'
  | 'profile';

interface SidebarProps {
  currentView: NavView;
  onSelectView: (view: NavView) => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({
  currentView,
  onSelectView,
  isMobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const { logout, user } = useAuth();

  const navItems = [
    { id: 'dashboard' as NavView, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'expenses' as NavView, label: 'Expenses', icon: Receipt },
    { id: 'budgets' as NavView, label: 'Budgets', icon: PieChart },
    { id: 'analytics' as NavView, label: 'Analytics', icon: TrendingUp },
    {
      id: 'ai_insights' as NavView,
      label: 'AI Insights',
      icon: Sparkles,
      badge: 'Live',
      highlight: true,
    },
    {
      id: 'ask_ai' as NavView,
      label: 'Ask ExpenseAI',
      icon: MessageSquareCode,
      badge: 'Gemini',
      highlight: true,
    },
    { id: 'profile' as NavView, label: 'Profile', icon: UserCheck },
  ];

  const handleSelect = (view: NavView) => {
    onSelectView(view);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:static top-0 left-0 z-50 h-screen w-64 border-r border-slate-800/80 bg-[#090d16] flex flex-col justify-between p-4 transition-transform duration-300 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand & Navigation */}
        <div className="flex flex-col gap-6">
          {/* Logo Header */}
          <div className="flex items-center gap-3 px-2 pt-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-400 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.35)]">
              <Sparkles className="w-5 h-5 text-slate-950 stroke-[2.2]" />
            </div>
            <div>
              <div className="font-extrabold text-lg tracking-tight text-white flex items-center gap-1">
                Expense<span className="text-emerald-400">AI</span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Control your spending</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1.5 pt-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;

              return (
                <button
                  key={item.id}
                  id={`nav-${item.id}`}
                  onClick={() => handleSelect(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 group ${
                    isActive
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)] font-semibold'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 transition-colors ${
                        isActive
                          ? 'text-emerald-400'
                          : item.highlight
                          ? 'text-cyan-400/80 group-hover:text-cyan-300'
                          : 'text-slate-400 group-hover:text-slate-200'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md ${
                        item.badge === 'Live'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer section: AI Status Card + Logout */}
        <div className="flex flex-col gap-3 pt-4 border-t border-slate-800/70">
          {/* AI Status Card */}
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Cpu className="w-3.5 h-3.5 animate-pulse" />
              </div>
              <div className="text-left">
                <div className="text-[11px] font-semibold text-slate-200">AI Financial Engine</div>
                <div className="text-[10px] text-emerald-400/90 flex items-center gap-1 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-ping" />
                  Neural Analyzer Active
                </div>
              </div>
            </div>
          </div>

          {/* User Info & Logout Button */}
          {user && (
            <div className="flex items-center justify-between px-1">
              <div className="text-left truncate max-w-[140px]">
                <div className="text-xs font-medium text-slate-300 truncate">{user.name}</div>
                <div className="text-[10px] text-slate-400 truncate">{user.email}</div>
              </div>
              <button
                id="btn-sidebar-logout"
                onClick={logout}
                title="Log out"
                className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                aria-label="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
