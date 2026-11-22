import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Calendar,
  Download,
  Flame,
  Clock,
  Sparkles,
  PieChart,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Printer,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { IncomeExpenseChart } from '../components/charts/IncomeExpenseChart';
import { CategoryPieChart } from '../components/charts/CategoryPieChart';
import { StatCard } from '../components/common/StatCard';

export const FinancialAnalyticsPage = () => {
  const { formatCurrency, user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const res = await api.analytics.getDeepDive();
        setData(res);
      } catch (err) {
        console.error('Failed to load deep dive analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    loadAnalytics();
  }, []);

  const handleDownloadReport = async () => {
    try {
      const report = await api.analytics.getReport();
      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `finpilot_financial_audit_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.message || 'Error generating report');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400">
        Aggregating financial data models...
      </div>
    );
  }

  const momChange = data?.month_over_month_change || 0;
  const isMomPositive = momChange <= 0; // Less expense is positive in personal finance

  return (
    <div className="space-y-7 pb-12">
      {/* Header Banner */}
      <div className="fintech-card p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-gradient-to-r from-[#0D182E] to-indigo-950/30 border border-indigo-500/20">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Financial Intelligence & Analytics</h2>
              <p className="text-xs text-slate-400">
                Predictive burn rates, month-over-month velocity and category deep-dives
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#091224] border border-[#1A2A4A] text-slate-300 hover:text-white text-xs font-semibold transition-all hover:border-slate-500"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>

          <button
            onClick={handleDownloadReport}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/25 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Audit Dossier</span>
          </button>
        </div>
      </div>

      {/* Deep-Dive Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Month over Month Velocity */}
        <div className="fintech-card p-5">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">MoM Spending Velocity</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-white font-mono">{Math.abs(momChange)}%</span>
            <span
              className={`text-xs font-bold flex items-center ${
                isMomPositive ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {isMomPositive ? <ArrowDownRight className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
              {isMomPositive ? 'Reduced Spend' : 'Increased Spend'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Compared to previous 30-day baseline</p>
        </div>

        {/* Daily Burn Rate */}
        <div className="fintech-card p-5">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Average Daily Outflow</span>
          <p className="text-2xl font-bold text-white mt-1 font-mono">
            {formatCurrency(data?.daily_average_expense || 0)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Daily expenditure velocity</p>
        </div>

        {/* Projected Month End */}
        <div className="fintech-card p-5">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Projected Month-End Outflow</span>
          <p className="text-2xl font-bold text-sky-400 mt-1 font-mono">
            {formatCurrency(data?.projected_end_of_month_expense || 0)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Linear extrapolation model</p>
        </div>

        {/* Top Outflow Category */}
        <div className="fintech-card p-5">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Top Spending Category</span>
          <p className="text-2xl font-bold text-amber-400 mt-1 font-mono">
            {data?.top_spending_category || 'None'}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Totaled {formatCurrency(data?.top_spending_category_amount || 0)}
          </p>
        </div>
      </div>

      {/* Multi-Month Comparison Chart */}
      <div className="fintech-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">6-Month Macro Financial Trajectory</h3>
            <p className="text-xs text-slate-400">Inflows, outflows, and net capital accumulation</p>
          </div>
          <span className="text-xs font-semibold px-2 py-1 rounded bg-[#091224] text-slate-300 border border-[#1A2A4A]">
            Macro Trends
          </span>
        </div>
        <IncomeExpenseChart data={data?.monthly_breakdown || []} />
      </div>

      {/* Bottom Breakdown Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Pie Chart */}
        <div className="fintech-card p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight mb-1">Portfolio Weight</h3>
            <p className="text-xs text-slate-400 mb-2">Category distribution</p>
          </div>
          <CategoryPieChart data={data?.category_breakdown || []} />
        </div>

        {/* Category Breakdown Ranked Table */}
        <div className="fintech-card p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Ranked Category Outflows</h3>
              <p className="text-xs text-slate-400">Highest to lowest monthly capital consumption</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#091224] text-slate-400 border-b border-[#1A2A4A] font-semibold uppercase">
                <tr>
                  <th className="px-4 py-2.5">Category</th>
                  <th className="px-4 py-2.5">Total Amount</th>
                  <th className="px-4 py-2.5">Portfolio Share</th>
                  <th className="px-4 py-2.5 text-right">Burn Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A2A4A]/50">
                {(data?.category_breakdown || []).map((cat, idx) => (
                  <tr key={idx} className="hover:bg-[#0D182E]/90">
                    <td className="px-4 py-3 font-semibold text-white flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                      <span>{cat.name}</span>
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-100">
                      {formatCurrency(cat.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-[#1A2A4A] rounded-full h-1.5 overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${cat.percentage}%`, backgroundColor: cat.color }}
                          />
                        </div>
                        <span className="font-mono text-slate-300 font-semibold">{cat.percentage}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-400">
                      ~{formatCurrency(cat.amount / 30)}/day
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
