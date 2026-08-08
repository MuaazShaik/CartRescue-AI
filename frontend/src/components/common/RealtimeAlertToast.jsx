import React from 'react';
import { useSession } from '../../context/SessionContext';
import { ACTION_CONFIG, RISK_LEVEL_CONFIG } from '../../utils/constants';
import { ShieldAlert, Sparkles, X, MessageSquare, Send } from 'lucide-react';

export default function RealtimeAlertToast() {
  const { alerts, removeAlert } = useSession();

  if (!alerts || alerts.length === 0) return null;

  return (
    <div className="fixed top-20 right-6 z-50 space-y-3 max-w-md w-full pointer-events-none">
      {alerts.map((alert) => {
        const riskCfg = RISK_LEVEL_CONFIG[alert.risk_level] || RISK_LEVEL_CONFIG.HIGH;
        const actionCfg = ACTION_CONFIG[alert.recommended_action] || ACTION_CONFIG.DO_NOTHING;
        const twilio = alert.twilio_dispatch;

        return (
          <div
            key={alert.id}
            className="pointer-events-auto glass-card p-4 border-l-4 shadow-2xl backdrop-blur-xl transition-all duration-300 animate-slide-in bg-[#0F172A]/95 text-white space-y-3"
            style={{ borderColor: riskCfg.color }}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-xs text-white">{alert.title}</span>
                    <span className="text-[10px] font-mono text-gray-400">{alert.timestamp}</span>
                  </div>
                  <span className="text-[11px] font-mono text-purple-300">Session: {alert.session_id}</span>
                </div>
              </div>

              <button
                onClick={() => removeAlert(alert.id)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed bg-black/40 p-2.5 rounded-lg border border-white/5">
              {alert.message}
            </p>

            {/* Twilio Dispatch Payload Badge */}
            <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 space-y-1">
              <div className="flex items-center justify-between text-[11px] font-semibold text-emerald-300">
                <span className="flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-400 animate-bounce" />
                  Twilio Real-Time {twilio?.channel || 'SMS'} Alert
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                  {twilio?.mode === 'LIVE_TWILIO' ? '⚡ LIVE TWILIO API' : '⚡ TWILIO DISPATCHED'}
                </span>
              </div>
              <p className="text-[11px] text-gray-300 font-mono line-clamp-2 bg-black/50 p-1.5 rounded border border-emerald-500/20">
                {twilio?.message_body || `🚨 [Cart Rescue] Recovery intervention dispatched to customer for session ${alert.session_id}`}
              </p>
              {twilio?.recipient && (
                <div className="flex items-center justify-between text-[10px] text-gray-400 font-mono pt-0.5">
                  <span>To: <strong className="text-emerald-300">{twilio.recipient}</strong></span>
                  <span>SID: {twilio.sid || 'SM884291'}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-gray-800 text-xs">
              <span className="text-gray-400">Triggered Action:</span>
              <span className={`px-2.5 py-0.5 rounded-md border font-semibold text-xs flex items-center gap-1 ${actionCfg.color}`}>
                <Sparkles className="w-3 h-3 text-amber-400" />
                {actionCfg.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
