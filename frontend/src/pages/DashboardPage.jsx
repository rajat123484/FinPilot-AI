import React, { useEffect, useState } from 'react';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  PiggyBank,
  Target,
  ShieldAlert,
  ArrowRight,
  Bot,
  Plus,
  FileSpreadsheet,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { StatCard } from '../components/common/StatCard';
import { IncomeExpenseChart } from '../components/charts/IncomeExpenseChart';
import { CategoryPieChart } from '../components/charts/CategoryPieChart';
import { SpendingTrendsChart } from '../components/charts/SpendingTrendsChart';
import { Badge } from '../components/common/Badge';

export const DashboardPage = ({ setActivePage, onOpenAddModal }) => {
  const { user, formatCurrency } = useAuth();
  const [data, setData] = useState(null);
  const [recentTx, setRecentTx] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboardData = async () => {
    try {
      const [summaryRes, txRes] = await Promise.all([
        api.dashboard.getSummary(),
        api.transactions.list({ page: 1, page_size: 5 }),
      ]);
      setData(summaryRes);
      setRecentTx(txRes.transactions || []);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400 gap-3">
        <RefreshCw className="w-8 h-8 animate-spin text-sky-400" />
        <p className="text-sm font-medium">Synthesizing Financial Telemetry...</p>
      </div>
    );
  }

  const kpis = data?.kpis || {};

  return (
    <div className="space-y-7 pb-12">
      {/* Welcome Banner & Quick Action Bar */}
      <div className="fintech-card p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-gradient-to-r from-blue-950/40 via-[#0D182E] to-sky-950/30 border border-sky-500/20">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">
              Welcome back, {user?.full_name || 'Financier'}!
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold">
              Account Active
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            FinPilot AI has processed your accounts: You are maintaining a{' '}
            <span className="text-sky-300 font-bold">{kpis.savings_rate}% savings rate</span> this month.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={handleRefresh}
            title="Refresh Metrics"
            className="p-2.5 rounded-xl bg-[#091224] border border-[#1A2A4A] text-slate-400 hover:text-white transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-sky-400' : ''}`} />
          </button>

          <button
            onClick={() => setActivePage('ai-assistant')}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-purple-600/20 border border-purple-500/40 text-purple-300 hover:bg-purple-600/30 font-medium text-xs transition-all"
          >
            <Bot className="w-4 h-4 text-purple-400" />
            <span>Consult AI</span>
          </button>

          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-lg shadow-blue-600/25 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Record Expense</span>
          </button>
        </div>
      </div>

      {/* KPI Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Net Balance"
          value={formatCurrency(kpis.total_balance)}
          subtitle="Cumulative liquid reserve"
          icon={Wallet}
          accentColor="sky"
        />

        <StatCard
          title="Monthly Income"
          value={formatCurrency(kpis.monthly_income)}
          subtitle="Salary & investments inflow"
          trend="positive"
          trendValue="+100%"
          icon={ArrowUpRight}
          accentColor="emerald"
        />

        <StatCard
          title="Monthly Expenses"
          value={formatCurrency(kpis.monthly_expenses)}
          subtitle="Total recorded outflow"
          trend={kpis.monthly_expenses > 3000 ? 'negative' : 'positive'}
          trendValue={`${((kpis.monthly_expenses / (kpis.monthly_income || 1)) * 100).toFixed(0)}% of income`}
          icon={ArrowDownLeft}
          accentColor="rose"
        />

        <StatCard
          title="Net Monthly Savings"
          value={formatCurrency(kpis.total_savings)}
          subtitle={`Savings Rate: ${kpis.savings_rate}%`}
          progress={kpis.savings_goal_progress}
          icon={PiggyBank}
          accentColor="emerald"
        />
      </div>

      {/* Fraud & Security Alert Banner (If pending alerts exist) */}
      {kpis.active_fraud_alerts > 0 && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-950/40 via-[#0D182E] to-rose-950/30 border border-rose-500/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Fraud Sentinel: {kpis.active_fraud_alerts} Suspicious Transaction Alert(s)</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold uppercase">
                  Action Required
                </span>
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Our hybrid statistical engine detected abnormal purchase patterns that require your verification.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActivePage('fraud-detection')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs shadow-md shadow-rose-600/30 transition-all shrink-0"
          >
            <span>Review Alerts</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Charts Section: Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Income vs Expenses Multi-Month Comparison */}
        <div className="fintech-card p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Income vs Expenses</h3>
              <p className="text-xs text-slate-400">Past 6-month historical trajectory</p>
            </div>
            <span className="text-xs font-semibold px-2 py-1 rounded bg-[#091224] text-slate-300 border border-[#1A2A4A]">
              Monthly Breakdown
            </span>
          </div>
          <IncomeExpenseChart data={data?.income_vs_expenses || []} />
        </div>

        {/* Category Expense Pie / Donut Chart */}
        <div className="fintech-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-base font-bold text-white tracking-tight">Category Breakdown</h3>
              <span className="text-xs font-semibold text-sky-400">Current Month</span>
            </div>
            <p className="text-xs text-slate-400 mb-2">Spending distribution by sector</p>
          </div>
          <CategoryPieChart data={data?.category_spending || []} />
        </div>
      </div>

      {/* Charts Section: Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Spending Velocity Trends AreaChart */}
        <div className="fintech-card p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Daily Spending Velocity</h3>
              <p className="text-xs text-slate-400">Chronological expense trend</p>
            </div>
            <span className="text-xs font-semibold px-2 py-1 rounded bg-[#091224] text-slate-300 border border-[#1A2A4A]">
              Velocity Curve
            </span>
          </div>
          <SpendingTrendsChart data={data?.spending_trends || []} />
        </div>

        {/* Quick Recent Transactions Feed */}
        <div className="fintech-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-white tracking-tight">Recent Activity</h3>
              <button
                onClick={() => setActivePage('transactions')}
                className="text-xs font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-1"
              >
                <span>View All</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-3">
              {recentTx.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">No recent transactions recorded</p>
              ) : (
                recentTx.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-[#091224] border border-[#1A2A4A]/60"
                  >
                    <div className="truncate pr-2">
                      <p className="text-xs font-semibold text-white truncate">{tx.title}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] text-slate-400">
                          {new Date(tx.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                        <span className="text-[10px] text-slate-600">•</span>
                        <span className="text-[10px] text-slate-400">{tx.category}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p
                        className={`text-xs font-bold font-mono ${
                          tx.type === 'income' ? 'text-emerald-400' : 'text-slate-200'
                        }`}
                      >
                        {tx.type === 'income' ? '+' : '-'}
                        {formatCurrency(tx.amount)}
                      </p>
                      {tx.is_flagged && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-rose-500/20 text-rose-300 font-bold">
                          Risk
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#1A2A4A]/60 flex items-center justify-between text-xs text-slate-400">
            <span>Statement Sync: Real-time</span>
            <button
              onClick={() => setActivePage('bank-analyzer')}
              className="text-sky-400 hover:underline flex items-center gap-1"
            >
              <FileSpreadsheet className="w-3 h-3" /> Upload CSV
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
