import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquareCode,
  Send,
  Sparkles,
  Loader2,
  Bot,
  User as UserIcon,
  HelpCircle,
  TrendingDown,
  Info,
} from 'lucide-react';
import { AIChatMessage } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const PROMPT_SUGGESTIONS = [
  'How much did I spend on food this month?',
  'Where am I spending the most?',
  'Show my biggest expenses.',
  'How much did I spend last month?',
  'Can I reduce my spending?',
  'What is my remaining budget?',
];

export function AskAIView() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [messages, setMessages] = useState<AIChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: `Hello ${
        user?.name ? user.name.split(' ')[0] : 'there'
      }! I am ExpenseAI, connected directly to your financial database. You can ask me any question about your real expenses, categories, or budgets.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSending]);

  const handleSend = async (queryText?: string) => {
    const question = (queryText || inputValue).trim();
    if (!question || isSending) return;

    const userMessage: AIChatMessage = {
      id: Math.random().toString(36).substring(2, 9),
      sender: 'user',
      text: question,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsSending(true);

    try {
      const res = await api.ai.ask({ question });
      const aiMessage: AIChatMessage = {
        id: Math.random().toString(36).substring(2, 9),
        sender: 'ai',
        text: res.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        dataPoints: res.dataPoints,
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch {
      showToast('Could not reach ExpenseAI assistant', 'error');
      const errMessage: AIChatMessage = {
        id: Math.random().toString(36).substring(2, 9),
        sender: 'ai',
        text: 'I ran into an issue accessing your ledger metrics. Please verify your connection or try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errMessage]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] max-w-5xl mx-auto w-full p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-400 flex items-center justify-center text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
            <MessageSquareCode className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-tight">Ask ExpenseAI</h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Ground-Truth AI
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Direct answers verified against your SQLite database
            </p>
          </div>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
        {messages.map((msg) => {
          const isAi = msg.sender === 'ai';

          return (
            <div
              key={msg.id}
              className={`flex gap-3 items-start ${isAi ? 'justify-start' : 'justify-end'}`}
            >
              {isAi && (
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-xl p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                  isAi
                    ? 'bg-slate-900/80 border border-slate-800 text-slate-200 rounded-tl-sm shadow-md'
                    : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-slate-950 font-medium rounded-tr-sm shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                }`}
              >
                <div className="whitespace-pre-line">{msg.text}</div>
                <div
                  className={`text-[10px] mt-1.5 font-mono text-right ${
                    isAi ? 'text-slate-500' : 'text-emerald-950/70'
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>

              {!isAi && (
                <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400 font-bold text-xs shrink-0 mt-0.5">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
            </div>
          );
        })}

        {isSending && (
          <div className="flex gap-3 items-start justify-start">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Sparkles className="w-4 h-4 animate-spin" />
            </div>
            <div className="p-3.5 rounded-2xl rounded-tl-sm bg-slate-900/80 border border-slate-800 text-slate-400 text-xs flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
              <span>Querying database metrics and synthesizing answer...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompt Chips */}
      <div className="py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider shrink-0 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-emerald-400" />
          Try:
        </span>
        {PROMPT_SUGGESTIONS.map((prompt, i) => (
          <button
            key={i}
            onClick={() => handleSend(prompt)}
            disabled={isSending}
            className="px-2.5 py-1 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs whitespace-nowrap transition-colors shrink-0 disabled:opacity-40"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Field Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="pt-2 flex items-center gap-2"
      >
        <div className="relative flex-1 flex items-center">
          <input
            id="input-ask-ai"
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask anything about your money, e.g., 'How much did I spend on food this month?'"
            disabled={isSending}
            className="w-full bg-slate-900/80 border border-slate-800 rounded-xl px-4 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all pr-12 disabled:opacity-50"
          />
          <button
            type="submit"
            id="btn-send-ask-ai"
            disabled={!inputValue.trim() || isSending}
            className="absolute right-2 p-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 hover:from-emerald-400 hover:to-teal-400 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(16,185,129,0.3)]"
          >
            <Send className="w-4 h-4 stroke-[2.2]" />
          </button>
        </div>
      </form>
    </div>
  );
}
