import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  FileSearch,
  CheckCircle,
  XCircle,
  HelpCircle,
  Sparkles,
  RefreshCw,
  Upload,
  ArrowRight,
  Info,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { RiskGauge } from '../components/charts/RiskGauge';
import { Modal } from '../components/common/Modal';
import { Badge } from '../components/common/Badge';

export const FraudDetectionPage = () => {
  const { formatCurrency } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);

  // File direct scanner state
  const [fileScanResult, setFileScanResult] = useState(null);
  const [fileScanning, setFileScanning] = useState(false);

  const loadFraudData = async () => {
    try {
      const res = await api.fraud.getOverview();
      setData(res);
    } catch (err) {
      console.error('Failed to load fraud overview:', err);
    } finally {
      setLoading(false);
      setScanning(false);
    }
  };

  useEffect(() => {
    loadFraudData();
  }, []);

  const handleScanNow = async () => {
    setScanning(true);
    try {
      const res = await api.fraud.scanNow();
      setData(res);
    } catch (err) {
      alert(err.message || 'Scan failed');
    } finally {
      setScanning(false);
    }
  };

  const handleResolve = async (alertId, action) => {
    try {
      await api.fraud.resolveAlert(alertId, action);
      loadFraudData();
      if (selectedAlert && selectedAlert.id === alertId) {
        setSelectedAlert(null);
      }
    } catch (err) {
      alert(err.message || 'Error updating alert');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileScanning(true);
    setFileScanResult(null);
    try {
      const res = await api.fraud.analyzeFile(file);
      setFileScanResult(res);
    } catch (err) {
      alert(err.message || 'Failed to scan uploaded CSV');
    } finally {
      setFileScanning(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400 gap-3">
        <RefreshCw className="w-8 h-8 animate-spin text-sky-400" />
        <p className="text-sm font-medium">Running Anomaly Detection Heuristics...</p>
      </div>
    );
  }

  const alerts = data?.alerts || [];
  const pendingAlerts = alerts.filter((a) => a.status === 'PENDING');

  return (
    <div className="space-y-7 pb-12">
      {/* Header Banner */}
      <div className="fintech-card p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-gradient-to-r from-[#0D182E] via-[#091224] to-rose-950/20 border border-rose-500/20">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Fraud & Anomaly Sentinel</h2>
              <p className="text-xs text-slate-400">
                Deterministic statistical Z-Score & velocity engine with explainable AI reasoning
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <label className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#091224] border border-[#1A2A4A] text-slate-300 hover:text-white text-xs font-semibold cursor-pointer transition-all hover:border-slate-500">
            <Upload className="w-3.5 h-3.5" />
            <span>Scan CSV File</span>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          <button
            onClick={handleScanNow}
            disabled={scanning}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/25 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${scanning ? 'animate-spin' : ''}`} />
            <span>{scanning ? 'Scanning Ledger...' : 'Run Ledger Audit'}</span>
          </button>
        </div>
      </div>

      {/* Direct CSV Scan Report Modal / Banner */}
      {fileScanResult && (
        <div className="fintech-card p-6 border border-sky-500/40 bg-[#091224]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileSearch className="w-5 h-5 text-sky-400" />
              <h3 className="text-sm font-bold text-white">
                CSV Risk Scan Report: <span className="font-mono text-sky-300">{fileScanResult.file_name}</span>
              </h3>
            </div>
            <button
              onClick={() => setFileScanResult(null)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Dismiss
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-4">
            <div className="bg-[#0D182E] p-3 rounded-xl border border-[#1A2A4A]">
              <span className="text-slate-400">Total Scanned:</span>
              <p className="text-base font-bold text-white mt-1 font-mono">{fileScanResult.total_scanned}</p>
            </div>
            <div className="bg-[#0D182E] p-3 rounded-xl border border-rose-500/30">
              <span className="text-rose-400">Anomalies Detected:</span>
              <p className="text-base font-bold text-white mt-1 font-mono">{fileScanResult.anomalies_detected}</p>
            </div>
            <div className="bg-[#0D182E] p-3 rounded-xl border border-rose-500/30">
              <span className="text-rose-400">High Risk Items:</span>
              <p className="text-base font-bold text-white mt-1 font-mono">{fileScanResult.high_risk_count}</p>
            </div>
            <div className="bg-[#0D182E] p-3 rounded-xl border border-amber-500/30">
              <span className="text-amber-400">Medium Risk Items:</span>
              <p className="text-base font-bold text-white mt-1 font-mono">{fileScanResult.medium_risk_count}</p>
            </div>
          </div>

          {fileScanResult.flagged_transactions.length > 0 && (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {fileScanResult.flagged_transactions.map((t, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-[#0D182E] border border-rose-500/30 flex items-center justify-between text-xs"
                >
                  <div>
                    <p className="font-bold text-white">{t.title}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{t.rules_triggered.join(' • ')}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-bold text-rose-400">{formatCurrency(t.amount)}</p>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold">
                      {t.risk_score} Risk ({t.risk_level})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Top Grid: Health Gauge + Methodology Explanation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Health Gauge */}
        <div className="fintech-card p-6 flex flex-col justify-center">
          <h3 className="text-sm font-bold text-white mb-2 tracking-tight">Security & Health Index</h3>
          <RiskGauge
            score={data?.overall_health_score || 88}
            highCount={data?.high_risk_count || 0}
            mediumCount={data?.medium_risk_count || 0}
            lowCount={data?.low_risk_count || 0}
          />
        </div>

        {/* Explainability & Compliance Card */}
        <div className="fintech-card p-6 lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-4 h-4 text-sky-400" />
              <h3 className="text-sm font-bold text-white tracking-tight">
                Explainable Risk Engine Methodology
              </h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              FinPilot AI executes a multi-layer risk verification protocol on every recorded transaction.
              Our goal is transparency and zero black-box accusations.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 text-xs">
              <div className="p-3 rounded-xl bg-[#091224] border border-[#1A2A4A]">
                <h4 className="font-bold text-sky-400">1. Statistical Deviation (Z-Score)</h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  Flags any transaction greater than 3.0 standard deviations from your category moving average.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#091224] border border-[#1A2A4A]">
                <h4 className="font-bold text-amber-400">2. Velocity & Rapid Duplicates</h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  Catches double-billing errors or rapid repeated merchant checkout attempts within a 24-hour window.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#091224] border border-[#1A2A4A]">
                <h4 className="font-bold text-rose-400">3. Entity Pattern Scanning</h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  Detects high-risk keywords (crypto wires, casinos, offshore transfers) that deviate from your profile.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#091224] border border-[#1A2A4A]">
                <h4 className="font-bold text-purple-400">4. AI Human-in-the-Loop Narrative</h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  Translates statistical triggers into plain English with practical cardholder verification steps.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#1A2A4A]/60 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Notice: Algorithmic flags represent statistical variance, not confirmed criminal fraud.</span>
            <span className="text-sky-400 font-semibold">{data?.total_analyzed || 0} Transactions Screened</span>
          </div>
        </div>
      </div>

      {/* Flagged Transactions Table */}
      <div className="fintech-card overflow-hidden">
        <div className="px-6 py-4 border-b border-[#1A2A4A] bg-[#091224] flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Suspicious Transactions Requiring Review</h3>
            <p className="text-xs text-slate-400">
              {pendingAlerts.length} pending risk alert(s) across your accounts
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
            {pendingAlerts.length} Active Flag(s)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#070D1E] border-b border-[#1A2A4A] text-slate-400 uppercase font-semibold">
              <tr>
                <th className="px-6 py-3.5">Risk Level</th>
                <th className="px-6 py-3.5">Merchant / Title</th>
                <th className="px-6 py-3.5">Amount</th>
                <th className="px-6 py-3.5">Timestamp</th>
                <th className="px-6 py-3.5">Triggered Rules</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1A2A4A]/50">
              {alerts.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-slate-400">
                    <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-white">No Suspicious Transactions Flagged</p>
                    <p className="text-xs text-slate-400 mt-0.5">Your accounts are currently operating with clean baseline security.</p>
                  </td>
                </tr>
              ) : (
                alerts.map((alert) => (
                  <tr key={alert.id} className="hover:bg-[#0D182E]/90 transition-colors">
                    <td className="px-6 py-4">
                      <Badge variant={alert.risk_level.toLowerCase()} size="xs">
                        <AlertTriangle className="w-3 h-3" />
                        <span>{alert.risk_level} ({alert.risk_score})</span>
                      </Badge>
                    </td>

                    <td className="px-6 py-4 font-bold text-white">
                      <span>{alert.title}</span>
                    </td>

                    <td className="px-6 py-4 font-mono font-bold text-rose-400">
                      {formatCurrency(alert.amount)}
                    </td>

                    <td className="px-6 py-4 text-slate-400 font-mono">
                      {alert.date}
                    </td>

                    <td className="px-6 py-4 max-w-xs">
                      <div className="space-y-1">
                        {alert.rules_triggered.map((rule, rIdx) => (
                          <p key={rIdx} className="text-[11px] text-slate-300 truncate" title={rule}>
                            • {rule}
                          </p>
                        ))}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          alert.status === 'PENDING'
                            ? 'bg-amber-500/20 text-amber-300'
                            : alert.status === 'REVIEWED'
                            ? 'bg-blue-500/20 text-blue-300'
                            : 'bg-slate-700 text-slate-300'
                        }`}
                      >
                        {alert.status}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => setSelectedAlert(alert)}
                        className="px-2.5 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 text-[11px] font-bold transition-all"
                      >
                        <Sparkles className="w-3 h-3 inline mr-1" />
                        AI Analysis
                      </button>

                      {alert.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleResolve(alert.id, 'REVIEWED')}
                            title="I Authorized This"
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold transition-all"
                          >
                            Verify
                          </button>
                          <button
                            onClick={() => handleResolve(alert.id, 'DISMISSED')}
                            title="Dismiss False Alarm"
                            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition-all"
                          >
                            Dismiss
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Explainability & Action Modal */}
      {selectedAlert && (
        <Modal
          isOpen={!!selectedAlert}
          onClose={() => setSelectedAlert(null)}
          title="AI Risk Assessment & Explainability Audit"
          subtitle={`Merchant: ${selectedAlert.title} • Amount: ${formatCurrency(selectedAlert.amount)}`}
          maxWidth="max-w-xl"
        >
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#091224] border border-[#1A2A4A]">
              <div>
                <span className="text-slate-400">Risk Assessment:</span>
                <p className="text-base font-bold text-white mt-0.5">
                  {selectedAlert.risk_level} Risk ({selectedAlert.risk_score} / 100)
                </p>
              </div>
              <Badge variant={selectedAlert.risk_level.toLowerCase()} size="md">
                {selectedAlert.risk_level} RISK
              </Badge>
            </div>

            <div>
              <h4 className="font-bold text-sky-400 mb-1.5">Algorithmic Rules Triggered:</h4>
              <div className="space-y-1.5 p-3 rounded-xl bg-[#091224] border border-[#1A2A4A]">
                {selectedAlert.rules_triggered.map((rule, idx) => (
                  <p key={idx} className="text-slate-200">
                    <span className="text-rose-400 font-bold">•</span> {rule}
                  </p>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-bold text-purple-400 mb-1.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> AI Synthesis & Actionable Advice:
              </h4>
              <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 text-slate-200 leading-relaxed whitespace-pre-wrap">
                {selectedAlert.ai_explanation}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#091224] border border-[#1A2A4A] text-slate-400 text-[11px]">
              <p className="font-semibold text-slate-300">Recommended Cardholder Action:</p>
              <p className="mt-0.5">
                If you made this purchase: click <strong>"Verify as Authorized"</strong> to update our statistical model. If unrecognized: contact your issuing bank immediately.
              </p>
            </div>

            <div className="pt-2 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setSelectedAlert(null)}
                className="px-4 py-2 rounded-xl bg-[#1A2A4A] text-slate-300 hover:text-white"
              >
                Close
              </button>
              {selectedAlert.status === 'PENDING' && (
                <button
                  type="button"
                  onClick={() => handleResolve(selectedAlert.id, 'REVIEWED')}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-600/25"
                >
                  Verify as Authorized
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
