import React, { useEffect, useState } from 'react';
import {
  Sparkles,
  Plus,
  ShieldCheck,
  Calendar,
  Zap,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

export const Navbar = ({ activePage, onOpenAddModal, onTriggerScan }) => {
  const { user } = useAuth();
  const [aiStatus, setAiStatus] = useState({ configured: false, engine: 'Loading...' });

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await api.settings.getStatus();
        setAiStatus({
          configured: res.gemini_api_configured,
          engine: res.ai_engine,
        });
      } catch (e) {
        setAiStatus({
          configured: false,
          engine: 'FinPilot AI Assistant (Demo Mode)',
        });
      }
    };
    fetchStatus();
  }, []);

  const pageTitles = {
    dashboard: { title: 'Executive Financial Dashboard', subtitle: 'Real-time telemetry, cash flow & wealth velocity' },
    transactions: { title: 'Smart Expense Ledger', subtitle: 'Manage, search, categorize and audit all cash flows' },
    'ai-assistant': { title: 'FinPilot AI Financial Copilot', subtitle: 'Natural language advisory with contextual account reasoning' },
    'fraud-detection': { title: 'Fraud & Anomaly Sentinel', subtitle: 'Hybrid rule-based & AI-driven financial risk monitoring' },
    'budget-planner': { title: 'Dynamic 50/30/20 Budget Planner', subtitle: 'Set thresholds, track pace & prevent budget overruns' },
    analytics: { title: 'Deep Dive Financial Analytics', subtitle: 'Multi-period trends, category deep-dives and forecasts' },
    'bank-analyzer': { title: 'Bank SMS & CSV Batch Analyzer', subtitle: 'Import statements, auto-categorize and screen anomalies' },
    settings: { title: 'Platform Settings & AI Configuration', subtitle: 'Manage Gemini API keys, currency and user preferences' },
  };

  const currentInfo = pageTitles[activePage] || { title: 'FinPilot AI', subtitle: 'Financial Management Platform' };

  return (
    <header className="h-20 bg-[#070D1E]/80 backdrop-blur-md border-b border-[#1A2A4A]/70 sticky top-0 z-20 px-8 flex items-center justify-between">
      {/* Title & Subtitle */}
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          {currentInfo.title}
        </h1>
        <p className="text-xs text-slate-400 font-medium">{currentInfo.subtitle}</p>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Gemini / AI Engine Status Pill */}
        <div
          title={aiStatus.configured ? 'Google Gemini API is connected' : 'Operating in smart demo heuristic mode. You can add a Gemini API key in Settings.'}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold ${
            aiStatus.configured
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-sky-500/10 border-sky-500/30 text-sky-300'
          }`}
        >
          <span className="relative flex h-2 w-2">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                aiStatus.configured ? 'bg-emerald-400' : 'bg-sky-400'
              }`}
            ></span>
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                aiStatus.configured ? 'bg-emerald-500' : 'bg-sky-500'
              }`}
            ></span>
          </span>
          <span className="max-w-[190px] truncate">
            {aiStatus.configured ? 'Gemini 1.5 Active' : 'FinPilot AI (Demo)'}
          </span>
        </div>

        {/* Currency Pill */}
        <div className="px-2.5 py-1.5 rounded-lg bg-[#0D182E] border border-[#1A2A4A] text-xs font-mono font-medium text-slate-300">
          {user?.currency || 'USD'}
        </div>

        {/* Quick Add Transaction Button */}
        {onOpenAddModal && (
          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-lg shadow-blue-600/25 transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Transaction</span>
          </button>
        )}
      </div>
    </header>
  );
};
