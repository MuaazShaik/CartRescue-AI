import React from 'react';
import { ArrowUpRight, ArrowDownRight, Info, AlertTriangle } from 'lucide-react';

export default function TopRiskFactors({ factors = [] }) {
  if (!factors || factors.length === 0) {
    return (
      <div className="glass-card p-5 h-full flex flex-col justify-center items-center text-center">
        <AlertTriangle className="w-8 h-8 text-gray-500 mb-2" />
        <p className="text-sm text-gray-400">Select an active session to view SHAP risk factor analysis.</p>
      </div>
    );
  }

  return (
    <div className="glass-card p-5 h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <h3 className="text-base font-semibold text-white">Top Risk Factors</h3>
            <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono border border-purple-500/30">
              SHAP Explainer
            </span>
          </div>
          <div className="group relative">
            <Info className="w-4 h-4 text-gray-400 hover:text-white cursor-pointer" />
            <div className="absolute right-0 top-6 hidden group-hover:block w-64 p-2 bg-gray-900 text-xs text-gray-300 rounded border border-gray-700 z-20 shadow-xl">
              SHAP values calculate exact mathematical contribution of each signal to the final risk score.
            </div>
          </div>
        </div>

        <p className="text-xs text-gray-400 mb-4">
          Key features driving abandonment risk for current session:
        </p>

        <div className="space-y-3">
          {factors.map((factor, idx) => {
            const isIncrease = factor.direction === 'increases_risk';
            // Calculate percentage width for bar (max shap value normalized to ~100%)
            const barWidth = Math.min(100, Math.max(15, (factor.shap_value / 0.4) * 100));

            return (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-gray-200 truncate max-w-[200px]">
                    {factor.description || factor.feature}
                  </span>
                  <div className="flex items-center space-x-1 font-mono text-[11px]">
                    {isIncrease ? (
                      <span className="text-rose-400 flex items-center">
                        <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> +{factor.shap_value.toFixed(3)}
                      </span>
                    ) : (
                      <span className="text-emerald-400 flex items-center">
                        <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" /> -{factor.shap_value.toFixed(3)}
                      </span>
                    )}
                  </div>
                </div>

                {/* SHAP Bar */}
                <div className="w-full bg-gray-800/80 rounded-full h-2 overflow-hidden flex">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isIncrease
                        ? 'bg-gradient-to-r from-rose-600 to-orange-500'
                        : 'bg-gradient-to-r from-emerald-600 to-teal-400'
                    }`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-gray-800 flex items-center justify-between text-[11px] text-gray-400">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" /> Increases Risk
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Reduces Risk
        </span>
        <span className="text-gray-500 font-mono">Explainable AI</span>
      </div>
    </div>
  );
}
