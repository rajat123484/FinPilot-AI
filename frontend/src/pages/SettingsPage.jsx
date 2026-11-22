import React, { useState, useEffect } from 'react';
import {
  Settings,
  Key,
  User,
  DollarSign,
  Shield,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Save,
  Lock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export const SettingsPage = () => {
  const { user, updateUser, formatCurrency } = useAuth();
  const [profileData, setProfileData] = useState({
    full_name: user?.full_name || '',
    currency: user?.currency || 'USD',
    monthly_income: user?.monthly_income || 6500,
    savings_goal: user?.savings_goal || 25000,
  });

  const [geminiKey, setGeminiKey] = useState('');
  const [aiStatus, setAiStatus] = useState(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');
  const [keySaving, setKeySaving] = useState(false);
  const [keyMsg, setKeyMsg] = useState(null);
  const [resetting, setResetting] = useState(false);

  const loadStatus = async () => {
    try {
      const res = await api.settings.getStatus();
      setAiStatus(res);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMsg('');
    try {
      const updated = await api.settings.updateProfile({
        full_name: profileData.full_name,
        currency: profileData.currency,
        monthly_income: parseFloat(profileData.monthly_income),
        savings_goal: parseFloat(profileData.savings_goal),
      });
      updateUser(updated);
      setProfileMsg('Profile and financial metrics updated successfully!');
      setTimeout(() => setProfileMsg(''), 3000);
    } catch (err) {
      alert(err.message || 'Error updating profile');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleKeySubmit = async (e) => {
    e.preventDefault();
    if (!geminiKey.trim()) return;

    setKeySaving(true);
    setKeyMsg(null);
    try {
      const res = await api.settings.setGeminiKey(geminiKey);
      setKeyMsg({
        success: true,
        text: `Gemini API Key activated! Engine tested: "${res.response_sample}"`,
      });
      loadStatus();
      setGeminiKey('');
    } catch (err) {
      setKeyMsg({
        success: false,
        text: err.message || 'Failed to validate Gemini API Key',
      });
    } finally {
      setKeySaving(false);
    }
  };

  const handleResetDemoData = async () => {
    if (
      window.confirm(
        'Are you sure you want to re-seed your accounts? This will reset transactions, budgets, and fraud alerts to the factory demo state.'
      )
    ) {
      setResetting(true);
      try {
        await api.settings.resetDemoData();
        alert('Accounts re-seeded successfully with pristine demo data!');
        window.location.reload();
      } catch (err) {
        alert(err.message || 'Error resetting data');
      } finally {
        setResetting(false);
      }
    }
  };

  return (
    <div className="space-y-7 pb-12 max-w-4xl">
      {/* Header Banner */}
      <div className="fintech-card p-6 flex items-center justify-between bg-gradient-to-r from-[#0D182E] to-blue-950/20 border border-blue-500/20">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Platform Configuration & Settings</h2>
            <p className="text-xs text-slate-400">Manage API keys, currency, financial targets and demo presets</p>
          </div>
        </div>
      </div>

      {/* Profile & Financial Baselines */}
      <div className="fintech-card p-6">
        <div className="flex items-center gap-2 mb-4 border-b border-[#1A2A4A] pb-3">
          <User className="w-4 h-4 text-sky-400" />
          <h3 className="text-sm font-bold text-white tracking-tight">User Profile & Wealth Parameters</h3>
        </div>

        {profileMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{profileMsg}</span>
          </div>
        )}

        <form onSubmit={handleProfileSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">Full Name</label>
              <input
                type="text"
                required
                value={profileData.full_name}
                onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-[#091224] border border-[#1A2A4A] rounded-xl text-white focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">Operating Currency</label>
              <select
                value={profileData.currency}
                onChange={(e) => setProfileData({ ...profileData, currency: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-[#091224] border border-[#1A2A4A] rounded-xl text-white focus:outline-none focus:border-sky-500"
              >
                <option value="USD">USD ($) - US Dollar</option>
                <option value="EUR">EUR (€) - Euro</option>
                <option value="INR">INR (₹) - Indian Rupee</option>
                <option value="GBP">GBP (£) - British Pound</option>
                <option value="CAD">CAD (C$) - Canadian Dollar</option>
                <option value="JPY">JPY (¥) - Japanese Yen</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">
                Baseline Monthly Income ({profileData.currency})
              </label>
              <input
                type="number"
                step="50"
                min="0"
                required
                value={profileData.monthly_income}
                onChange={(e) => setProfileData({ ...profileData, monthly_income: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-[#091224] border border-[#1A2A4A] rounded-xl text-white font-mono focus:outline-none focus:border-sky-500"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Used for 50/30/20 budget allocations</span>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">
                Annual Savings Target ({profileData.currency})
              </label>
              <input
                type="number"
                step="100"
                min="0"
                required
                value={profileData.savings_goal}
                onChange={(e) => setProfileData({ ...profileData, savings_goal: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-[#091224] border border-[#1A2A4A] rounded-xl text-white font-mono focus:outline-none focus:border-sky-500"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Tracks overall net balance milestone</span>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={profileSaving}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/25 transition-all disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{profileSaving ? 'Saving...' : 'Update Settings'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Google Gemini AI Service Configuration */}
      <div className="fintech-card p-6">
        <div className="flex items-center justify-between border-b border-[#1A2A4A] pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-bold text-white tracking-tight">Google Gemini AI Engine Integration</h3>
          </div>

          <div
            className={`px-3 py-1 rounded-full text-[11px] font-bold border ${
              aiStatus?.gemini_api_configured
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                : 'bg-sky-500/15 text-sky-300 border-sky-500/30'
            }`}
          >
            {aiStatus?.ai_engine || 'Checking engine...'}
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed mb-4">
          FinPilot AI securely connects to Google Gemini (1.5 Flash / Pro) to power natural language financial reasoning and fraud risk explainability. If an API key is not supplied, FinPilot automatically activates its built-in offline financial reasoning engine without interrupting your workflow.
        </p>

        {keyMsg && (
          <div
            className={`mb-4 p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
              keyMsg.success
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}
          >
            {keyMsg.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{keyMsg.text}</span>
          </div>
        )}

        <form onSubmit={handleKeySubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              Google Gemini API Key
            </label>
            <div className="relative">
              <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                placeholder="AIzaSy..."
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#091224] border border-[#1A2A4A] rounded-xl text-white font-mono placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Never exposed to the browser client; handled exclusively through your local FastAPI backend.
            </p>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={keySaving || !geminiKey.trim()}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/25 transition-all disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{keySaving ? 'Validating Key...' : 'Save & Validate Gemini Key'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Factory Demo Reset */}
      <div className="fintech-card p-6 border border-rose-500/30 bg-[#091224]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
              <RotateCcw className="w-4 h-4 text-rose-400" /> Reset Demo Environment
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              Re-seeds the local database with pristine demo transactions, budgets, and pre-calculated fraud anomalies.
            </p>
          </div>

          <button
            onClick={handleResetDemoData}
            disabled={resetting}
            className="px-4 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 text-xs font-bold transition-all disabled:opacity-50 shrink-0"
          >
            {resetting ? 'Resetting...' : 'Re-Seed Demo Data'}
          </button>
        </div>
      </div>
    </div>
  );
};
