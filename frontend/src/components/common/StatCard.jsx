import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend, // positive, negative, neutral
  trendValue,
  accentColor = 'sky', // sky, emerald, rose, purple, amber
  progress, // 0 to 100 optional
}) => {
  const colorMap = {
    sky: {
      border: 'hover:border-sky-500/40',
      iconBg: 'bg-sky-500/15 text-sky-400 border border-sky-500/30',
      gradient: 'from-sky-500/10 via-transparent to-transparent',
      bar: 'bg-gradient-to-r from-sky-500 to-blue-600',
    },
    emerald: {
      border: 'hover:border-emerald-500/40',
      iconBg: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
      gradient: 'from-emerald-500/10 via-transparent to-transparent',
      bar: 'bg-gradient-to-r from-emerald-500 to-teal-600',
    },
    rose: {
      border: 'hover:border-rose-500/40',
      iconBg: 'bg-rose-500/15 text-rose-400 border border-rose-500/30',
      gradient: 'from-rose-500/10 via-transparent to-transparent',
      bar: 'bg-gradient-to-r from-rose-500 to-red-600',
    },
    purple: {
      border: 'hover:border-purple-500/40',
      iconBg: 'bg-purple-500/15 text-purple-400 border border-purple-500/30',
      gradient: 'from-purple-500/10 via-transparent to-transparent',
      bar: 'bg-gradient-to-r from-purple-500 to-indigo-600',
    },
    amber: {
      border: 'hover:border-amber-500/40',
      iconBg: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
      gradient: 'from-amber-500/10 via-transparent to-transparent',
      bar: 'bg-gradient-to-r from-amber-500 to-orange-600',
    },
  };

  const scheme = colorMap[accentColor] || colorMap.sky;

  return (
    <div
      className={`fintech-card fintech-card-hover p-5 relative overflow-hidden transition-all duration-300 ${scheme.border}`}
    >
      {/* Top subtle gradient accent */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${scheme.bar}`} />

      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</p>
          <h3 className="text-2xl font-bold text-white mt-1.5 tracking-tight font-mono">{value}</h3>
        </div>
        {Icon && (
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${scheme.iconBg}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {/* Subtitle / Trend */}
      <div className="mt-3.5 flex items-center gap-2 text-xs">
        {trend && (
          <span
            className={`flex items-center gap-1 font-semibold px-1.5 py-0.5 rounded ${
              trend === 'positive'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : trend === 'negative'
                ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                : 'bg-slate-700/50 text-slate-300'
            }`}
          >
            {trend === 'positive' ? (
              <TrendingUp className="w-3 h-3" />
            ) : trend === 'negative' ? (
              <TrendingDown className="w-3 h-3" />
            ) : (
              <Minus className="w-3 h-3" />
            )}
            {trendValue}
          </span>
        )}
        {subtitle && <span className="text-slate-400 truncate">{subtitle}</span>}
      </div>

      {/* Optional Progress Bar */}
      {progress !== undefined && (
        <div className="mt-3">
          <div className="flex justify-between text-[11px] text-slate-400 mb-1">
            <span>Goal Progress</span>
            <span className="font-mono font-medium text-slate-200">{progress}%</span>
          </div>
          <div className="w-full bg-[#1A2A4A] rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${scheme.bar}`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
