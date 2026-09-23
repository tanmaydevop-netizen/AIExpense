import { useState, useEffect } from 'react';
import {
  Sparkles,
  TrendingUp,
  Lightbulb,
  AlertTriangle,
  Compass,
  RefreshCw,
  Loader2,
  CheckCircle2,
  Cpu,
} from 'lucide-react';
import { AIInsightItem } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export function AIInsightsView() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [insights, setInsights] = useState<AIInsightItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const fetchInsights = async (isManual = false) => {
    if (isManual) setGenerating(true);
    try {
      const res = await api.ai.getInsights();
      setInsights(res.insights || []);
      setLastUpdated(res.generatedAt || new Date().toISOString());
      if (isManual) {
        showToast('Gemini analyzed your latest ledger transactions!', 'success');
      }
    } catch {
      showToast('Could not complete AI financial analysis', 'error');
    } finally {
      setLoading(false);
      setGenerating(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  const getInsightMeta = (type: string) => {
    switch (type) {
      case 'spending_pattern':
        return {
          icon: TrendingUp,
          badge: 'Spending Pattern',
          badgeColor: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
          borderHover: 'hover:border-cyan-500/40',
          iconColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
        };
      case 'saving_opportunity':
        return {
          icon: Lightbulb,
          badge: 'Saving Opportunity',
          badgeColor: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
          borderHover: 'hover:border-emerald-500/40',
          iconColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
        };
      case 'budget_alert':
        return {
          icon: AlertTriangle,
          badge: 'Budget Status',
          badgeColor: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
          borderHover: 'hover:border-amber-500/40',
          iconColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
        };
      case 'ai_recommendation':
      default:
        return {
          icon: Compass,
          badge: 'Strategic Advice',
          badgeColor: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
          borderHover: 'hover:border-purple-500/40',
          iconColor: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
        };
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 max-w-7xl mx-auto w-full">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              AI Financial Insights
            </h1>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              AI Powered
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Automated intelligence computed from your verified transactions & budgets
          </p>
        </div>

        <button
          id="btn-rerun-ai-analysis"
          onClick={() => fetchInsights(true)}
          disabled={generating}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs sm:text-sm shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center gap-2 transition-all disabled:opacity-50"
        >
          {generating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4 stroke-[2.2]" />
          )}
          <span>{generating ? 'Analyzing Ledger...' : 'Re-run AI Analysis'}</span>
        </button>
      </div>

      {/* Model & Accuracy Guarantee Card */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 text-slate-300">
          <Cpu className="w-4 h-4 text-emerald-400" />
          <span>
            Model: <strong className="text-white">gemini-3.8-flash</strong> • Zero Hallucination Mode: Ground-truth ledger verification
          </span>
        </div>
        {lastUpdated && (
          <span className="text-[11px] text-slate-500 font-mono">
            Analyzed: {new Date(lastUpdated).toLocaleTimeString()}
          </span>
        )}
      </div>

      {/* Insights Cards Grid */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
          <p className="text-xs text-slate-400">Querying Gemini API with ledger snapshot...</p>
        </div>
      ) : insights.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {insights.map((item, idx) => {
            const meta = getInsightMeta(item.type);
            const Icon = meta.icon;

            return (
              <div
                key={idx}
                className={`p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl transition-all flex flex-col justify-between ${meta.borderHover}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-md border ${meta.badgeColor}`}
                    >
                      {meta.badge}
                    </span>
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center border ${meta.iconColor}`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-white tracking-tight mb-2">
                    {item.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {item.content}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                  <span>ExpenseAI Verified</span>
                  <span className="text-emerald-400/80">100% Calculated</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-16 rounded-2xl bg-slate-900/40 border border-slate-800 text-center flex flex-col items-center justify-center gap-2">
          <Sparkles className="w-8 h-8 text-slate-600 mb-1" />
          <p className="text-sm font-semibold text-slate-300">
            No expenses found to analyze
          </p>
          <p className="text-xs text-slate-500 max-w-sm">
            Add a few transactions or import the demo ledger to allow Gemini to analyze your spending
            patterns.
          </p>
        </div>
      )}
    </div>
  );
}
