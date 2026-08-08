import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const DEFAULT_DATA = [
  { name: 'Do Nothing', value: 42, color: '#6B7280' },
  { name: 'Retry Payment', value: 24, color: '#F59E0B' },
  { name: '5% Coupon', value: 16, color: '#10B981' },
  { name: '10% Coupon', value: 8, color: '#8B5CF6' },
  { name: 'Free Shipping', value: 6, color: '#06B6D4' },
  { name: 'Nudge / Reminder', value: 4, color: '#EC4899' },
];

export default function ActionDistribution({ data = DEFAULT_DATA }) {
  return (
    <div className="glass-card p-5 h-full flex flex-col">
      <div className="mb-2">
        <h3 className="text-base font-semibold text-white">Action Distribution</h3>
        <p className="text-xs text-gray-400">Policy-bounded recommendations across active sessions</p>
      </div>

      <div className="flex-1 w-full min-h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={4}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="#111827" strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#1F2937',
                borderColor: '#374151',
                borderRadius: '0.75rem',
                color: '#fff',
                fontSize: '12px',
              }}
              formatter={(value) => [`${value}%`, 'Share']}
            />
            <Legend
              layout="vertical"
              align="right"
              verticalAlign="middle"
              iconType="circle"
              wrapperStyle={{ fontSize: '11px', color: '#9CA3AF' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
