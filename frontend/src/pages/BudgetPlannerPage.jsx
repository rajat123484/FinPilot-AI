import React, { useState, useEffect } from 'react';
import {
  PieChart,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  TrendingUp,
  Edit2,
  Trash2,
  Info,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Modal } from '../components/common/Modal';
import { Badge } from '../components/common/Badge';

const CATEGORIES = [
  'Bills',
  'Food',
  'Shopping',
  'Travel',
  'Entertainment',
  'Healthcare',
  'Education',
  'Investments',
  'Miscellaneous',
];

export const BudgetPlannerPage = () => {
  const { formatCurrency, user } = useAuth();
  const [data, setData] = useState(null);
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    category: 'Food',
    monthly_limit: '',
    month_year: new Date().toISOString().slice(0, 7), // "YYYY-MM"
  });

  const loadBudgets = async () => {
    try {
      const [budgetRes, aiRes] = await Promise.all([
        api.budgets.getOverview(),
        api.budgets.getAiRecommendations(),
      ]);
      setData(budgetRes);
      setAiSuggestions(aiRes);
    } catch (err) {
      console.error('Failed to load budgets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBudgets();
  }, []);

  const handleSaveBudget = async (e) => {
    e.preventDefault();
    try {
      await api.budgets.save({
        category: formData.category,
        monthly_limit: parseFloat(formData.monthly_limit),
        month_year: formData.month_year,
      });
      setIsModalOpen(false);
      loadBudgets();
    } catch (err) {
      alert(err.message || 'Failed to save budget limit');
    }
  };

  const handleDeleteBudget = async (id) => {
    if (window.confirm('Delete this category budget?')) {
      try {
        await api.budgets.delete(id);
        loadBudgets();
      } catch (err) {
        alert(err.message || 'Failed to delete budget');
      }
    }
  };

  const handleApplyAiBudgets = async () => {
    if (!aiSuggestions?.recommended_budgets) return;
    if (window.confirm('Apply AI 50/30/20 recommended spending limits for all categories?')) {
      try {
        const curMy = new Date().toISOString().slice(0, 7);
        for (const item of aiSuggestions.recommended_budgets) {
          await api.budgets.save({
            category: item.category,
            monthly_limit: item.limit,
            month_year: curMy,
          });
        }
        loadBudgets();
        alert('AI 50/30/20 budgets successfully applied!');
      } catch (err) {
        alert(err.message || 'Error applying AI budgets');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400">
        Loading budget planner telemetry...
      </div>
    );
  }

  const categories = data?.categories || [];
  const totalBudget = data?.total_budget || 0;
  const totalSpent = data?.total_spent || 0;
  const remaining = Math.max(totalBudget - totalSpent, 0);
  const overallPercentage = data?.overall_percentage || 0;

  return (
    <div className="space-y-7 pb-12">
      {/* Header Banner */}
      <div className="fintech-card p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-gradient-to-r from-[#0D182E] to-blue-950/30 border border-blue-500/20">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
              <PieChart className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Smart Budget Planner</h2>
              <p className="text-xs text-slate-400">
                Pace monthly category caps, prevent lifestyle creep & reach your {formatCurrency(user?.savings_goal || 25000)} savings goal
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => {
              setFormData({
                category: 'Food',
                monthly_limit: '',
                month_year: new Date().toISOString().slice(0, 7),
              });
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/25 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Set Category Limit</span>
          </button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="fintech-card p-5">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Monthly Budget</span>
          <p className="text-2xl font-bold text-white mt-1 font-mono">{formatCurrency(totalBudget)}</p>
          <p className="text-[11px] text-slate-400 mt-1">{categories.length} tracked categories</p>
        </div>

        <div className="fintech-card p-5">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Spent So Far</span>
          <p className="text-2xl font-bold text-white mt-1 font-mono">{formatCurrency(totalSpent)}</p>
          <p className="text-[11px] text-slate-400 mt-1">{overallPercentage}% overall utilization</p>
        </div>

        <div className="fintech-card p-5">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Remaining Buffer</span>
          <p className="text-2xl font-bold text-emerald-400 mt-1 font-mono">{formatCurrency(remaining)}</p>
          <p className="text-[11px] text-slate-400 mt-1">Available to spend safely</p>
        </div>

        <div className="fintech-card p-5">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Budget Status</span>
          <div className="mt-2">
            <Badge
              variant={overallPercentage > 100 ? 'danger' : overallPercentage > 85 ? 'warning' : 'success'}
              size="sm"
            >
              {overallPercentage > 100
                ? 'Budget Exceeded'
                : overallPercentage > 85
                ? 'Approaching Limit'
                : 'Pacing Safely'}
            </Badge>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Target: 50% Needs / 30% Wants / 20% Save
          </p>
        </div>
      </div>

      {/* AI Budget Optimizer Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-950/30 via-[#0D182E] to-sky-950/30 border border-purple-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <span>AI 50/30/20 Wealth Formulation</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold uppercase">
                Optimized for {formatCurrency(aiSuggestions?.monthly_income || 6500)} Income
              </span>
            </h4>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Based on your monthly compensation, the AI recommends allocating{' '}
              <strong className="text-emerald-400">{formatCurrency(aiSuggestions?.recommended_savings || 1300)} (20%)</strong> directly into savings & investments, leaving 50% for fixed needs and 30% for lifestyle.
            </p>
          </div>
        </div>

        <button
          onClick={handleApplyAiBudgets}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-600/25 transition-all shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Apply AI Budget Caps</span>
        </button>
      </div>

      {/* Category Budgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {categories.map((b) => {
          const isExceeded = b.status === 'EXCEEDED';
          const isCritical = b.status === 'CRITICAL';
          const isWarning = b.status === 'WARNING';

          const statusColor = isExceeded
            ? 'text-rose-400'
            : isCritical
            ? 'text-orange-400'
            : isWarning
            ? 'text-amber-400'
            : 'text-emerald-400';

          const barColor = isExceeded
            ? 'bg-gradient-to-r from-red-600 to-rose-600'
            : isCritical
            ? 'bg-gradient-to-r from-amber-500 to-orange-500'
            : isWarning
            ? 'bg-gradient-to-r from-yellow-500 to-amber-500'
            : 'bg-gradient-to-r from-emerald-500 to-teal-500';

          return (
            <div
              key={b.id || b.category}
              className="fintech-card p-5 relative overflow-hidden flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: b.color || '#38BDF8' }} />
                    <h4 className="text-sm font-bold text-white">{b.category}</h4>
                  </div>
                  <Badge
                    variant={isExceeded ? 'danger' : isCritical ? 'warning' : isWarning ? 'warning' : 'success'}
                    size="xs"
                  >
                    {b.status}
                  </Badge>
                </div>

                <div className="flex items-baseline justify-between mt-2 font-mono">
                  <div>
                    <span className="text-lg font-bold text-white">{formatCurrency(b.spent)}</span>
                    <span className="text-xs text-slate-400"> of {formatCurrency(b.monthly_limit)}</span>
                  </div>
                  <span className={`text-sm font-bold ${statusColor}`}>{b.percentage_used}%</span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-[#1A2A4A] rounded-full h-2 mt-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${barColor}`}
                    style={{ width: `${Math.min(b.percentage_used, 100)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 font-mono">
                  <span>
                    Remaining: <strong className="text-slate-200">{formatCurrency(b.remaining)}</strong>
                  </span>
                  {isExceeded && (
                    <span className="text-rose-400 font-bold flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Over by {formatCurrency(b.spent - b.monthly_limit)}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="mt-4 pt-3 border-t border-[#1A2A4A]/60 flex items-center justify-between text-xs">
                <button
                  onClick={() => {
                    setFormData({
                      category: b.category,
                      monthly_limit: b.monthly_limit.toString(),
                      month_year: data?.month_year || new Date().toISOString().slice(0, 7),
                    });
                    setIsModalOpen(true);
                  }}
                  className="text-slate-400 hover:text-sky-400 flex items-center gap-1 font-medium transition-colors"
                >
                  <Edit2 className="w-3 h-3" /> Edit Cap
                </button>

                {b.id && (
                  <button
                    onClick={() => handleDeleteBudget(b.id)}
                    className="text-slate-400 hover:text-rose-400 p-1 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Set Category Limit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Set Category Budget Limit"
        subtitle="Automatic warnings trigger when spending passes 70% and 90%"
      >
        <form onSubmit={handleSaveBudget} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Expense Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-[#091224] border border-[#1A2A4A] rounded-xl text-white focus:outline-none focus:border-sky-500"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              Monthly Limit ({user?.currency || 'USD'})
            </label>
            <input
              type="number"
              step="10"
              min="10"
              required
              placeholder="e.g. 750"
              value={formData.monthly_limit}
              onChange={(e) => setFormData({ ...formData, monthly_limit: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-[#091224] border border-[#1A2A4A] rounded-xl text-white font-mono placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="pt-3 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-[#1A2A4A] text-slate-300 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-600/25"
            >
              Save Budget Limit
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
