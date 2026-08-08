import React from 'react';
import { ACTION_CONFIG, RISK_LEVEL_CONFIG, INTENT_CONFIG } from '../../utils/constants';
import { ShoppingCart, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

export default function LiveSessionFeed({ sessions = [], selectedSessionId, onSelectSession }) {
  return (
    <div className="glass-card p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-white">Live Sessions Stream</h3>
          <p className="text-xs text-gray-400">Real-time session monitoring and AI decision updates</p>
        </div>
        <span className="flex items-center space-x-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>Live Stream</span>
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
        {sessions.map((sess) => {
          const isSelected = sess.session_id === selectedSessionId;
          const riskConfig = RISK_LEVEL_CONFIG[sess.risk_level] || RISK_LEVEL_CONFIG.LOW;
          const actionConfig = ACTION_CONFIG[sess.recommended_action] || ACTION_CONFIG.DO_NOTHING;
          const intentConfig = INTENT_CONFIG[sess.intent_category] || INTENT_CONFIG.WINDOW_SHOPPING;

          return (
            <div
              key={sess.session_id}
              onClick={() => onSelectSession(sess)}
              className={`p-3.5 rounded-xl border transition-all duration-200 cursor-pointer ${
                isSelected
                  ? 'bg-purple-950/40 border-purple-500/50 shadow-lg shadow-purple-500/10 ring-1 ring-purple-500/30'
                  : 'bg-gray-900/50 border-gray-800 hover:border-gray-700 hover:bg-gray-800/40'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs text-gray-300 font-semibold">
                    {sess.session_id.slice(0, 12)}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${intentConfig.badge}`}>
                    {intentConfig.label}
                  </span>
                </div>

                <span className={`text-xs px-2 py-0.5 rounded-full border font-mono font-medium ${riskConfig.badge}`}>
                  {(sess.risk_score * 100).toFixed(0)}% Risk
                </span>
              </div>

              <div className="flex items-center justify-between text-xs mt-2 text-gray-400">
                <div className="flex items-center space-x-3">
                  <span className="flex items-center space-x-1">
                    <ShoppingCart className="w-3.5 h-3.5 text-gray-500" />
                    <span className="text-gray-200 font-medium">₹{sess.cart_value.toLocaleString()}</span>
                  </span>
                  <span>{sess.items_count} items</span>
                  {sess.payment_failed && (
                    <span className="text-rose-400 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> Payment Failed
                    </span>
                  )}
                </div>

                {/* Recommended Action Badge */}
                <span className={`px-2.5 py-1 rounded-lg border font-medium text-[11px] ${actionConfig.color}`}>
                  {actionConfig.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
