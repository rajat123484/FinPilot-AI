import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useAuth } from '../../context/AuthContext';

export const CategoryPieChart = ({ data = [] }) => {
  const { formatCurrency } = useAuth();

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-[#091224] border border-[#1A2A4A] p-2.5 rounded-xl shadow-2xl text-xs space-y-1">
          <p className="font-bold text-white flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
            {item.name}
          </p>
          <p className="font-mono text-slate-300">
            Amount: <span className="font-semibold text-white">{formatCurrency(item.amount)}</span>
          </p>
          <p className="text-slate-400">
            Share: <span className="font-semibold text-sky-400">{item.percentage}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  if (!data || data.length === 0) {
    return (
      <div className="w-full h-64 flex flex-col items-center justify-center text-slate-500 text-xs">
        No expense data recorded this period
      </div>
    );
  }

  return (
    <div className="w-full h-64 flex items-center">
      <div className="w-1/2 h-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip content={<CustomTooltip />} />
            <Pie
              data={data}
              dataKey="amount"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={3}
              stroke="#0D182E"
              strokeWidth={2}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color || '#38BDF8'} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend Column */}
      <div className="w-1/2 pl-2 space-y-2 max-h-56 overflow-y-auto pr-1">
        {data.map((cat, idx) => (
          <div key={idx} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 truncate">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }}></span>
              <span className="text-slate-300 truncate font-medium">{cat.name}</span>
            </div>
            <div className="text-right shrink-0">
              <span className="font-mono text-slate-200 font-semibold">{cat.percentage}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
