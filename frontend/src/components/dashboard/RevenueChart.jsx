import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const DATA = [
  { time: '10:00', revenueSaved: 12000, discountSpent: 1400 },
  { time: '11:00', revenueSaved: 28000, discountSpent: 2800 },
  { time: '12:00', revenueSaved: 45000, discountSpent: 4200 },
  { time: '13:00', revenueSaved: 68000, discountSpent: 5900 },
  { time: '14:00', revenueSaved: 92000, discountSpent: 7100 },
  { time: '15:00', revenueSaved: 145000, discountSpent: 10400 },
  { time: '16:00', revenueSaved: 198000, discountSpent: 13800 },
  { time: '17:00', revenueSaved: 242000, discountSpent: 16200 },
  { time: '18:00', revenueSaved: 284500, discountSpent: 18500 },
];

export default function RevenueChart() {
  return (
    <div className="glass-card p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-white">Incremental Revenue vs. Discount Spend</h3>
          <p className="text-xs text-gray-400">Margin Protection Agent optimizes net profit lift</p>
        </div>
        <div className="text-right">
          <span className="text-xs text-gray-400">ROI Ratio</span>
          <p className="text-sm font-bold text-emerald-400 font-mono">15.3x</p>
        </div>
      </div>

      <div className="flex-1 w-full min-h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={DATA} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorSaved" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorSpent" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
            <XAxis dataKey="time" stroke="#6B7280" fontSize={11} />
            <YAxis stroke="#6B7280" fontSize={11} tickFormatter={(v) => `₹${v/1000}k`} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#111827',
                borderColor: '#374151',
                borderRadius: '0.75rem',
                color: '#fff',
                fontSize: '12px',
              }}
              formatter={(value) => [`₹${value.toLocaleString()}`, '']}
            />
            <Legend wrapperStyle={{ fontSize: '11px', color: '#9CA3AF' }} />
            <Area type="monotone" dataKey="revenueSaved" name="Recovered Revenue (₹)" stroke="#10B981" fillOpacity={1} fill="url(#colorSaved)" strokeWidth={2} />
            <Area type="monotone" dataKey="discountSpent" name="Discount Budget Spent (₹)" stroke="#8B5CF6" fillOpacity={1} fill="url(#colorSpent)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
