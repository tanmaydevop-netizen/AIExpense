import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider, useToast } from './context/ToastContext';
import { Navbar } from './components/Navbar';
import { Sidebar, NavView } from './components/Sidebar';
import { ExpenseModal } from './components/ExpenseModal';
import { LandingPage } from './views/LandingPage';
import { DashboardView } from './views/DashboardView';
import { ExpensesView } from './views/ExpensesView';
import { BudgetsView } from './views/BudgetsView';
import { AnalyticsView } from './views/AnalyticsView';
import { AIInsightsView } from './views/AIInsightsView';
import { AskAIView } from './views/AskAIView';
import { ProfileView } from './views/ProfileView';
import { api } from './services/api';

function MainLayout() {
  const { isAuthenticated, loading } = useAuth();
  const [currentView, setCurrentView] = useState<NavView>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);
  const [activeAlertsCount, setActiveAlertsCount] = useState(0);

  // Poll or check active budget alerts occasionally
  useEffect(() => {
    if (!isAuthenticated) return;

    api.analytics
      .summary()
      .then((res) => {
        setActiveAlertsCount(res.alerts?.length || 0);
      })
      .catch(() => {});
  }, [isAuthenticated, currentView]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090d16] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-400 flex items-center justify-center animate-pulse">
            <span className="font-extrabold text-slate-950 text-xl font-mono">E</span>
          </div>
          <p className="text-xs text-slate-400 tracking-wider uppercase font-semibold">
            Initializing ExpenseAI...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LandingPage onOpenDashboard={() => setCurrentView('dashboard')} />;
  }

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col lg:flex-row selection:bg-emerald-500/30 selection:text-emerald-300">
      {/* Sidebar Navigation */}
      <Sidebar
        currentView={currentView}
        onSelectView={(v) => setCurrentView(v)}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        <Navbar
          onOpenAddExpense={() => setIsAddExpenseModalOpen(true)}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          isMobileSidebarOpen={isMobileSidebarOpen}
          activeAlertsCount={activeAlertsCount}
          onNavigateToBudgets={() => setCurrentView('budgets')}
        />

        <main className="flex-1 pb-16">
          {currentView === 'dashboard' && (
            <DashboardView
              onOpenAddExpense={() => setIsAddExpenseModalOpen(true)}
              onNavigate={(v) => setCurrentView(v)}
            />
          )}
          {currentView === 'expenses' && <ExpensesView />}
          {currentView === 'budgets' && <BudgetsView />}
          {currentView === 'analytics' && <AnalyticsView />}
          {currentView === 'ai_insights' && <AIInsightsView />}
          {currentView === 'ask_ai' && <AskAIView />}
          {currentView === 'profile' && <ProfileView />}
        </main>
      </div>

      {/* Global Add Expense Modal */}
      <ExpenseModal
        isOpen={isAddExpenseModalOpen}
        onClose={() => setIsAddExpenseModalOpen(false)}
        onExpenseSaved={() => {
          // Re-trigger view refresh by briefly touching current view
          setCurrentView((v) => v);
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <MainLayout />
      </ToastProvider>
    </AuthProvider>
  );
}
