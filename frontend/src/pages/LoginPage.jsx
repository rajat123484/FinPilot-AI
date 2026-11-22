import React, { useState } from 'react';
import {
  Sparkles,
  Shield,
  ArrowRight,
  Lock,
  Mail,
  User,
  Zap,
  TrendingUp,
  Bot,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage = () => {
  const { login, register, demoLogin } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    currency: 'USD',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        await register(formData);
      } else {
        await login(formData.email, formData.password);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoClick = async () => {
    setError('');
    setDemoLoading(true);
    try {
      await demoLogin();
    } catch (err) {
      setError(err.message || 'Demo initialization failed. Please try again.');
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070D1E] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background radial ambient glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-4xl grid md:grid-cols-2 fintech-card border border-[#1A2A4A] rounded-3xl overflow-hidden shadow-2xl relative z-10">
        {/* Left Side: Brand & Feature Highlights */}
        <div className="p-8 md:p-10 bg-gradient-to-br from-[#0D182E] to-[#091224] border-b md:border-b-0 md:border-r border-[#1A2A4A] flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 via-sky-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-sky-500/25">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-1.5">
                  FinPilot <span className="text-xs px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/30">AI</span>
                </h2>
                <p className="text-xs text-slate-400">Intelligent Personal Financial Copilot</p>
              </div>
            </div>

            <p className="mt-6 text-sm text-slate-300 leading-relaxed">
              Autonomous wealth analytics, real-time transaction telemetry, hybrid AI fraud sentinel, and conversational financial reasoning powered by Gemini.
            </p>

            {/* Feature Pills */}
            <div className="mt-8 space-y-3.5">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-sky-500/15 border border-sky-500/30 flex items-center justify-center shrink-0 text-sky-400 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">AI Financial Assistant</h4>
                  <p className="text-[11px] text-slate-400">Contextual answers on spending, savings trajectory and 50/30/20 budgets.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-rose-500/15 border border-rose-500/30 flex items-center justify-center shrink-0 text-rose-400 mt-0.5">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Fraud & Anomaly Sentinel</h4>
                  <p className="text-[11px] text-slate-400">Statistical outlier detection & AI explainable risk scores for suspicious transactions.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0 text-emerald-400 mt-0.5">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Bank SMS & CSV Batch Analyzer</h4>
                  <p className="text-[11px] text-slate-400">Instant statement parsing with confidence-scored categorization.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-[#1A2A4A]/60 flex items-center justify-between text-[11px] text-slate-400">
            <span>Enterprise Grade Encryption</span>
            <span>Zero Bank Credential Exposure</span>
          </div>
        </div>

        {/* Right Side: Auth Form & 1-Click Demo */}
        <div className="p-8 md:p-10 flex flex-col justify-center bg-[#070D1E]/95">
          {/* Quick Demo One-Click Access Card */}
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-blue-900/30 via-sky-900/20 to-blue-900/30 border border-sky-500/30 shadow-lg shadow-sky-500/10">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-sky-400 tracking-wider flex items-center gap-1">
                  <Zap className="w-3 h-3 fill-sky-400" /> Instant Evaluation
                </span>
                <h4 className="text-sm font-bold text-white mt-0.5">Pre-Seeded Demo Account</h4>
                <p className="text-[11px] text-slate-400">100+ transactions, 6 budgets & fraud anomalies ready</p>
              </div>
              <button
                type="button"
                onClick={handleDemoClick}
                disabled={demoLoading}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white font-bold text-xs shadow-md shadow-blue-500/25 transition-all transform active:scale-95 disabled:opacity-50 shrink-0"
              >
                {demoLoading ? 'Launching...' : '1-Click Demo Login'}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between mb-5">
            <div className="flex gap-4 border-b border-[#1A2A4A] w-full">
              <button
                type="button"
                onClick={() => { setIsRegister(false); setError(''); }}
                className={`pb-2.5 text-sm font-bold transition-all relative ${
                  !isRegister ? 'text-sky-400' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Sign In
                {!isRegister && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-400 rounded-full" />}
              </button>
              <button
                type="button"
                onClick={() => { setIsRegister(true); setError(''); }}
                className={`pb-2.5 text-sm font-bold transition-all relative ${
                  isRegister ? 'text-sky-400' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Create Account
                {isRegister && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-400 rounded-full" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="Alex Mercer"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#0D182E] border border-[#1A2A4A] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#0D182E] border border-[#1A2A4A] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#0D182E] border border-[#1A2A4A] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
                />
              </div>
            </div>

            {isRegister && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Default Currency</label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full px-4 py-2.5 bg-[#0D182E] border border-[#1A2A4A] rounded-xl text-sm text-white focus:outline-none focus:border-sky-500 transition-colors"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="INR">INR (₹)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : isRegister ? 'Create Account' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <p className="mt-4 text-center text-[11px] text-slate-400">
            Default test credentials: <code className="text-slate-300">demo@finpilot.ai</code> / <code className="text-slate-300">password123</code>
          </p>
        </div>
      </div>
    </div>
  );
};
