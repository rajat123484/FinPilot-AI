import React, { useState } from 'react';
import {
  FileSpreadsheet,
  MessageSquare,
  Upload,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Download,
  Check,
  RefreshCw,
  FileText,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Badge } from '../components/common/Badge';

export const BankAnalyzerPage = ({ setActivePage }) => {
  const { formatCurrency } = useAuth();
  const [activeTab, setActiveTab] = useState('csv'); // 'csv' or 'sms'
  const [parsing, setParsing] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [parsedResult, setParsedResult] = useState(null);
  const [commitStatus, setCommitStatus] = useState(null);

  // SMS input state
  const [smsText, setSmsText] = useState(
    `Alert: USD 84.50 spent on your Card at WHOLE FOODS MARKET on 2026-11-18. Avl Bal: USD 3,420.\n` +
    `Acct XX1234 credited with USD 6,500.00 on 2026-11-01 by APEX FINTECH SALARY.\n` +
    `Alert: USD 18.20 paid to UBER RIDES on 2026-11-17.\n` +
    `Alert: USD 3,850.00 spent at APEX ELECTRONICS MEGASTORE on 2026-11-16.`
  );

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setParsing(true);
    setParsedResult(null);
    setCommitStatus(null);

    try {
      const res = await api.upload.uploadCsv(file);
      setParsedResult(res);
    } catch (err) {
      alert(err.message || 'Failed to parse CSV file');
    } finally {
      setParsing(false);
    }
  };

  const handleParseSms = async () => {
    if (!smsText.trim()) return;

    setParsing(true);
    setParsedResult(null);
    setCommitStatus(null);

    try {
      const res = await api.upload.parseSms(smsText);
      setParsedResult(res);
    } catch (err) {
      alert(err.message || 'Failed to parse bank SMS text');
    } finally {
      setParsing(false);
    }
  };

  const handleCommit = async () => {
    if (!parsedResult || !parsedResult.transactions.length) return;

    setCommitting(true);
    try {
      const res = await api.upload.commit(parsedResult.transactions);
      setCommitStatus(res);
      setParsedResult(null);
    } catch (err) {
      alert(err.message || 'Failed to import transactions');
    } finally {
      setCommitting(false);
    }
  };

  const handleDownloadSample = (type) => {
    const sampleCsv =
      type === 'clean'
        ? `Date,Description,Amount,Type,Category\n2026-11-01,Tech Solutions Monthly Salary,6500.00,income,Salary\n2026-11-02,Bayview Apartments Rent,1650.00,expense,Bills\n2026-11-03,Whole Foods Market,115.40,expense,Food\n2026-11-04,Blue Bottle Coffee,7.50,expense,Food\n2026-11-05,Comcast Internet Cable,89.99,expense,Bills\n2026-11-06,Shell Gasoline Service,54.20,expense,Travel\n2026-11-07,Nike Sportswear Outlet,129.00,expense,Shopping\n2026-11-08,Trader Joe's Groceries,82.35,expense,Food`
        : `Date,Description,Amount,Type,Category\n2026-11-01,Starbucks Downtown,6.50,expense,Food\n2026-11-02,Target Retail Store,42.00,expense,Shopping\n2026-11-03,Abnormal Electronics Purchase,4899.00,expense,Shopping\n2026-11-03,Binance Overseas Crypto Wire,2500.00,expense,Investments\n2026-11-04,Digital Software License,199.99,expense,Shopping\n2026-11-04,Digital Software License,199.99,expense,Shopping`;

    const blob = new Blob([sampleCsv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = type === 'clean' ? 'sample_transactions.csv' : 'suspicious_transactions.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-7 pb-12">
      {/* Header Banner */}
      <div className="fintech-card p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-gradient-to-r from-[#0D182E] to-teal-950/20 border border-teal-500/20">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400 shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Bank SMS & CSV Batch Analyzer</h2>
              <p className="text-xs text-slate-400">
                Bulk ingest banking statements, extract merchant entities, and auto-tag categories
              </p>
            </div>
          </div>
        </div>

        {/* Sample Downloader Pills */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => handleDownloadSample('clean')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#091224] border border-[#1A2A4A] text-slate-300 hover:text-white text-xs font-semibold hover:border-slate-500 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Sample Clean CSV</span>
          </button>

          <button
            onClick={() => handleDownloadSample('suspicious')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#091224] border border-rose-500/30 text-rose-300 hover:text-white text-xs font-semibold hover:border-rose-500 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Sample Fraud CSV</span>
          </button>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex gap-3 border-b border-[#1A2A4A] pb-3 text-sm font-bold">
        <button
          onClick={() => { setActiveTab('csv'); setCommitStatus(null); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            activeTab === 'csv'
              ? 'bg-blue-600/20 text-sky-400 border border-blue-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-[#0D182E]'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>CSV Statement File</span>
        </button>

        <button
          onClick={() => { setActiveTab('sms'); setCommitStatus(null); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            activeTab === 'sms'
              ? 'bg-blue-600/20 text-sky-400 border border-blue-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-[#0D182E]'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Paste Bank SMS Alerts</span>
        </button>
      </div>

      {/* Commit Success Banner */}
      {commitStatus && (
        <div className="p-5 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
            <div>
              <h4 className="text-sm font-bold text-white">{commitStatus.message}</h4>
              <p className="text-xs text-slate-300 mt-0.5">
                All transactions have been written to your active ledger and processed by the Fraud Sentinel.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActivePage('transactions')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/25 transition-all shrink-0"
          >
            <span>View in Ledger</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Ingestion Input Card */}
      {activeTab === 'csv' ? (
        <div className="fintech-card p-8 border-2 border-dashed border-[#1A2A4A] hover:border-sky-500/40 transition-colors flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 mb-4">
            <Upload className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-white">Upload Your Bank Statement CSV</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md">
            Drag and drop your bank or credit card CSV file. FinPilot AI automatically aligns columns for Date, Merchant, Amount, and Category.
          </p>

          <label className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/25 cursor-pointer transition-all active:scale-95">
            <Upload className="w-4 h-4" />
            <span>Choose File (.csv)</span>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      ) : (
        <div className="fintech-card p-6 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white mb-1">Paste Raw Bank SMS Notification Text</h3>
            <p className="text-xs text-slate-400">
              Paste one or multiple SMS alerts (one per line). FinPilot AI will extract debits, credits, merchants, and timestamps.
            </p>
          </div>

          <textarea
            rows={5}
            value={smsText}
            onChange={(e) => setSmsText(e.target.value)}
            placeholder="Paste raw bank notification SMS text here..."
            className="w-full p-4 bg-[#091224] border border-[#1A2A4A] rounded-xl text-xs text-slate-200 font-mono focus:outline-none focus:border-sky-500 transition-colors"
          />

          <div className="flex justify-end">
            <button
              onClick={handleParseSms}
              disabled={parsing || !smsText.trim()}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/25 transition-all disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{parsing ? 'Parsing Entities...' : 'Extract & Categorize SMS'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Parsing Loading Indicator */}
      {parsing && (
        <div className="flex flex-col items-center justify-center py-10 text-slate-400 gap-2">
          <RefreshCw className="w-6 h-6 animate-spin text-sky-400" />
          <p className="text-xs font-medium">Extracting financial entities and auto-categorizing...</p>
        </div>
      )}

      {/* Preview Table of Parsed Transactions */}
      {parsedResult && (
        <div className="fintech-card overflow-hidden animate-in fade-in duration-300">
          {/* Summary Strip */}
          <div className="p-5 bg-[#091224] border-b border-[#1A2A4A] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Ingestion Preview: {parsedResult.total_parsed} Transactions</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-400 font-bold">
                  {parsedResult.detected_categories.length} Categories Detected
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Total Inflow: <strong className="text-emerald-400">{formatCurrency(parsedResult.total_income)}</strong> • Total Outflow: <strong className="text-rose-400">{formatCurrency(parsedResult.total_expense)}</strong>
              </p>
            </div>

            <button
              onClick={handleCommit}
              disabled={committing}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs shadow-lg shadow-emerald-600/25 transition-all active:scale-95 disabled:opacity-50 shrink-0"
            >
              <Check className="w-4 h-4" />
              <span>{committing ? 'Importing & Screening...' : 'Commit & Import to Ledger'}</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#070D1E] text-slate-400 border-b border-[#1A2A4A] font-semibold uppercase">
                <tr>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Extracted Merchant</th>
                  <th className="px-5 py-3">Category Tag</th>
                  <th className="px-5 py-3">AI Confidence</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Risk Assessment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A2A4A]/50">
                {parsedResult.transactions.map((t, idx) => (
                  <tr key={idx} className="hover:bg-[#0D182E]/90">
                    <td className="px-5 py-3 text-slate-400 font-mono">{t.date}</td>
                    <td className="px-5 py-3 font-bold text-white">{t.title}</td>
                    <td className="px-5 py-3">
                      <span className="px-2 py-0.5 rounded-md bg-[#091224] text-slate-300 border border-[#1A2A4A]">
                        {t.category}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="font-mono text-sky-400 font-semibold">
                        {(t.confidence * 100).toFixed(0)}%
                      </span>
                    </td>
                    <td className="px-5 py-3 font-mono font-bold">
                      <span className={t.type === 'income' ? 'text-emerald-400' : 'text-slate-100'}>
                        {t.type === 'income' ? '+' : '-'}
                        {formatCurrency(t.amount)}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {t.potential_risk ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">
                          {t.potential_risk}
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-500">Low Risk</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
