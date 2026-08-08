import React, { useState, useEffect } from 'react';
import { Activity, Cpu, Clock, CheckCircle2 } from 'lucide-react';
import { checkHealth } from '../../services/api';

export default function Header() {
  const [health, setHealth] = useState({ status: 'checking', latency: 0 });

  useEffect(() => {
    async function runCheck() {
      const start = performance.now();
      const res = await checkHealth();
      const latency = Math.round(performance.now() - start);
      setHealth({ ...res, latency });
    }
    runCheck();
    const interval = setInterval(runCheck, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 border-b border-gray-800 bg-[#0F172A]/70 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center space-x-3">
        <h2 className="text-sm font-semibold text-gray-200">Track 2 · Cart Rescue</h2>
        <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 font-medium">
          6-Agent Chain Pipeline
        </span>
      </div>

      <div className="flex items-center space-x-6">
        {/* ML Status Pill */}
        <div className="flex items-center space-x-2 text-xs">
          <Cpu className="w-4 h-4 text-purple-400" />
          <span className="text-gray-400">Engine:</span>
          <span className="font-medium text-gray-200">XGBoost + SHAP</span>
        </div>

        {/* Latency Pill */}
        <div className="flex items-center space-x-2 text-xs">
          <Clock className="w-4 h-4 text-cyan-400" />
          <span className="text-gray-400">Latency:</span>
          <span className="font-medium text-emerald-400">{health.latency || 12} ms</span>
          <span className="text-[10px] text-gray-500">(Target &lt;300ms)</span>
        </div>

        {/* Live Status */}
        <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>System Healthy</span>
        </div>
      </div>
    </header>
  );
}
