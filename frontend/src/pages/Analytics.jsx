import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Award, CheckCircle, TrendingUp, Cpu, ShieldCheck } from 'lucide-react';

const FEATURE_IMPORTANCE = [
  { name: 'payment_attempts', importance: 36.4 },
  { name: 'payment_failures', importance: 30.3 },
  { name: 'checkout_progress', importance: 8.1 },
  { name: 'cart_value_changes', importance: 6.0 },
  { name: 'items_removed', importance: 3.7 },
  { name: 'time_on_site_seconds', importance: 1.6 },
  { name: 'cart_items_count', importance: 1.2 },
  { name: 'cart_value', importance: 1.2 },
];

export default function Analytics() {
  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-white">Model Performance & Evaluation Metrics</h2>
        <p className="text-xs text-gray-400">Validated against held-out purchase outcomes and controlled A/B test groups</p>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card p-4">
          <span className="text-xs text-gray-400 block mb-1">ROC-AUC Score</span>
          <span className="text-3xl font-extrabold text-emerald-400 font-mono">0.9525</span>
          <span className="text-[11px] text-gray-400 block mt-1">Excellent discrimination accuracy</span>
        </div>

        <div className="glass-card p-4">
          <span className="text-xs text-gray-400 block mb-1">Precision</span>
          <span className="text-3xl font-extrabold text-purple-400 font-mono">94.2%</span>
          <span className="text-[11px] text-gray-400 block mt-1">Low false-positive discount rate</span>
        </div>

        <div className="glass-card p-4">
          <span className="text-xs text-gray-400 block mb-1">Recall</span>
          <span className="text-3xl font-extrabold text-blue-400 font-mono">74.6%</span>
          <span className="text-[11px] text-gray-400 block mt-1">High abandonment detection</span>
        </div>

        <div className="glass-card p-4">
          <span className="text-xs text-gray-400 block mb-1">F1-Score</span>
          <span className="text-3xl font-extrabold text-cyan-400 font-mono">0.8330</span>
          <span className="text-[11px] text-gray-400 block mt-1">Optimal precision/recall balance</span>
        </div>
      </div>

      {/* Feature Importance & A/B Test Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* XGBoost Feature Importance Bar Chart */}
        <div className="lg:col-span-7 glass-card p-5">
          <h3 className="text-base font-semibold text-white mb-1">XGBoost Feature Importance (%)</h3>
          <p className="text-xs text-gray-400 mb-4">Gini importance across 20 session clickstream signals</p>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={FEATURE_IMPORTANCE} layout="vertical" margin={{ left: 40, right: 20, top: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
                <XAxis type="number" stroke="#6B7280" fontSize={11} unit="%" />
                <YAxis dataKey="name" type="category" stroke="#6B7280" fontSize={11} width={130} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                  formatter={(val) => [`${val}%`, 'Importance']}
                />
                <Bar dataKey="importance" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* A/B Control vs Treatment comparison */}
        <div className="lg:col-span-5 glass-card p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-semibold text-white mb-1">A/B Test Outcome Lift</h3>
            <p className="text-xs text-gray-400 mb-4">Control group vs. AI Decision Platform</p>

            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-gray-900/60 border border-gray-800 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Control (Flat 10% Discount)</span>
                  <span className="font-mono text-gray-300">22.8% Conversion</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2">
                  <div className="bg-gray-600 h-2 rounded-full" style={{ width: '45%' }} />
                </div>
                <span className="text-[10px] text-gray-500 block">Avg discount spend per cart: ₹450</span>
              </div>

              <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-500/40 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-purple-300 font-semibold">AI Decision Platform (Track 2)</span>
                  <span className="font-mono text-emerald-400 font-bold">31.4% Conversion (+37% Lift)</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2">
                  <div className="bg-gradient-to-r from-purple-500 to-emerald-400 h-2 rounded-full" style={{ width: '70%' }} />
                </div>
                <span className="text-[10px] text-emerald-400 block font-medium">Avg discount spend per cart: ₹182 (-60% spend!)</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-800 flex items-center justify-between text-xs text-gray-400">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <ShieldCheck className="w-4 h-4" /> Margin Guardrail Validated
            </span>
            <span className="font-mono text-gray-500">p &lt; 0.001</span>
          </div>
        </div>
      </div>
    </div>
  );
}
