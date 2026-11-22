import React from 'react';

export const Badge = ({ children, variant = 'default', size = 'sm' }) => {
  const variantMap = {
    default: 'bg-slate-800 text-slate-300 border-slate-700',
    primary: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    sky: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
    success: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    warning: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    danger: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    purple: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    high: 'bg-rose-600/20 text-rose-300 border-rose-500/40 font-bold',
    medium: 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold',
    low: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-semibold',
  };

  const sizeMap = {
    xs: 'text-[10px] px-1.5 py-0.5',
    sm: 'text-xs px-2.5 py-1',
    md: 'text-sm px-3 py-1.5',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-medium ${
        variantMap[variant] || variantMap.default
      } ${sizeMap[size] || sizeMap.sm}`}
    >
      {children}
    </span>
  );
};
