import React from 'react';

export default function RiskGauge({ score = 0, level = 'LOW' }) {
  const percentage = Math.round(score * 100);

  let colorClass = 'from-emerald-500 to-teal-400';
  let badgeBg = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
  let label = 'Low Risk';

  if (percentage >= 85) {
    colorClass = 'from-rose-600 to-red-500';
    badgeBg = 'bg-rose-500/20 text-rose-300 border-rose-500/30';
    label = 'Critical Risk';
  } else if (percentage >= 65) {
    colorClass = 'from-orange-500 to-amber-500';
    badgeBg = 'bg-orange-500/20 text-orange-300 border-orange-500/30';
    label = 'High Risk';
  } else if (percentage >= 40) {
    colorClass = 'from-amber-500 to-yellow-400';
    badgeBg = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    label = 'Medium Risk';
  }

  // Calculate SVG stroke offset for gauge meter
  const radius = 60;
  const circumference = Math.PI * radius; // Half circle
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="glass-card p-5 flex flex-col items-center justify-between h-full">
      <div className="w-full flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-300">Abandonment Risk</h3>
        <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${badgeBg}`}>
          {label}
        </span>
      </div>

      <div className="relative flex flex-col items-center justify-center my-2">
        <svg className="w-44 h-24 overflow-visible">
          {/* Background Arc */}
          <path
            d="M 10 70 A 60 60 0 0 1 130 70"
            fill="none"
            stroke="#1F2937"
            strokeWidth="12"
            strokeLinecap="round"
          />
          {/* Filled Arc */}
          <path
            d="M 10 70 A 60 60 0 0 1 130 70"
            fill="none"
            stroke="url(#riskGradient)"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-700 ease-out"
          />
          <defs>
            <linearGradient id="riskGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10B981" />
              <stop offset="50%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#F43F5E" />
            </linearGradient>
          </defs>
        </svg>

        <div className="absolute top-10 flex flex-col items-center">
          <span className="text-3xl font-extrabold text-white tracking-tight font-mono">
            {percentage}%
          </span>
          <span className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">
            Abandon Probability
          </span>
        </div>
      </div>

      <div className="w-full text-center text-xs text-gray-400 mt-2">
        Real-time XGBoost inference
      </div>
    </div>
  );
}
