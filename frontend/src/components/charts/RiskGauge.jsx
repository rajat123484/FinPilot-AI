import React from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle } from 'lucide-react';

export const RiskGauge = ({ score = 88, highCount = 0, mediumCount = 0, lowCount = 0 }) => {
  // Score interpretation: 80+ Excellent, 60-79 Moderate Risk, <60 High Risk
  const isHealthy = score >= 75;
  const isWarning = score >= 50 && score < 75;

  const color = isHealthy ? '#10B981' : isWarning ? '#F59E0B' : '#EF4444';
  const label = isHealthy ? 'Account Status: Clean & Healthy' : isWarning ? 'Moderate Risk Detected' : 'Elevated Anomaly Alert';

  return (
    <div className="flex flex-col items-center justify-center p-4">
      {/* Radial Meter Visual */}
      <div className="relative w-40 h-40 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          {/* Background Circle */}
          <circle
            cx="50"
            cy="50"
            r="40"
            className="text-[#1A2A4A]"
            strokeWidth="9"
            stroke="currentColor"
            fill="transparent"
          />
          {/* Progress Circle */}
          <circle
            cx="50"
            cy="50"
            r="40"
            stroke={color}
            strokeWidth="9"
            strokeDasharray={251.2}
            strokeDashoffset={251.2 - (251.2 * score) / 100}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Center Content */}
        <div className="absolute flex flex-col items-center">
          <span className="text-3xl font-extrabold font-mono text-white tracking-tight">{score}</span>
          <span className="text-[10px] uppercase font-bold text-slate-400">Health Index</span>
        </div>
      </div>

      {/* Label */}
      <div className="mt-3 text-center">
        <div className="flex items-center justify-center gap-1.5 text-xs font-bold" style={{ color }}>
          {isHealthy ? <ShieldCheck className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          <span>{label}</span>
        </div>
        <p className="text-[11px] text-slate-400 mt-1">
          {highCount > 0
            ? `${highCount} critical transaction(s) require cardholder verification`
            : 'No unauthorized high-risk patterns detected in current cycle'}
        </p>
      </div>

      {/* Risk Level Pills */}
      <div className="grid grid-cols-3 gap-2 w-full mt-4 text-center">
        <div className="bg-[#091224] p-2 rounded-xl border border-rose-500/20">
          <p className="text-[10px] text-rose-400 font-semibold uppercase">High Risk</p>
          <p className="text-base font-bold text-white font-mono">{highCount}</p>
        </div>
        <div className="bg-[#091224] p-2 rounded-xl border border-amber-500/20">
          <p className="text-[10px] text-amber-400 font-semibold uppercase">Med Risk</p>
          <p className="text-base font-bold text-white font-mono">{mediumCount}</p>
        </div>
        <div className="bg-[#091224] p-2 rounded-xl border border-emerald-500/20">
          <p className="text-[10px] text-emerald-400 font-semibold uppercase">Low Risk</p>
          <p className="text-base font-bold text-white font-mono">{lowCount}</p>
        </div>
      </div>
    </div>
  );
};
