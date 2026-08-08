import React, { useState } from 'react';
import { useSession } from '../context/SessionContext';
import { Search, ShieldCheck, Filter, FileText, CheckCircle2 } from 'lucide-react';
import { ACTION_CONFIG, RISK_LEVEL_CONFIG } from '../utils/constants';

export default function AuditTrail() {
  const { auditLogs } = useSession();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);

  const logsToDisplay = auditLogs && auditLogs.length > 0 ? auditLogs : [];
  const activeLog = selectedLog || logsToDisplay[0] || null;

  const filteredLogs = logsToDisplay.filter(
    (log) =>
      log.session_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.recommended_action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.intent_category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Decision Audit Log & SHAP Inspector</h2>
          <p className="text-xs text-gray-400">Complete, immutable decision trail satisfying the auditability guardrail requirement</p>
        </div>
        <div className="flex items-center space-x-2 text-xs text-purple-400 bg-purple-500/10 px-3 py-1.5 rounded-xl border border-purple-500/20 font-medium">
          <ShieldCheck className="w-4 h-4" />
          <span>Auditability Active (Agent 6)</span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="glass-card p-3 flex items-center space-x-3">
        <Search className="w-4 h-4 text-gray-400 ml-2" />
        <input
          type="text"
          placeholder="Filter real-time audit logs by session ID, action, or intent..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-transparent border-none text-xs text-gray-200 focus:outline-none w-full placeholder-gray-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Audit Log Table (7 cols) */}
        <div className="lg:col-span-7 glass-card p-4 overflow-hidden">
          {filteredLogs.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-500 space-y-2">
              <FileText className="w-6 h-6 mx-auto text-gray-600 animate-pulse" />
              <p>No real-time audit logs recorded yet.</p>
              <p className="text-[11px] text-gray-400">Perform actions on the <strong>Live Storefront</strong> webpage to generate live decision logs.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-gray-400 border-b border-gray-800 pb-2">
                    <th className="p-2 font-medium">Session ID</th>
                    <th className="p-2 font-medium">Risk Score</th>
                    <th className="p-2 font-medium">Action</th>
                    <th className="p-2 font-medium">Intent</th>
                    <th className="p-2 font-medium">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60">
                  {filteredLogs.map((log) => {
                    const isSelected = activeLog && log.session_id === activeLog.session_id;
                    const riskCfg = RISK_LEVEL_CONFIG[log.risk_level] || RISK_LEVEL_CONFIG.LOW;
                    const actCfg = ACTION_CONFIG[log.recommended_action] || ACTION_CONFIG.DO_NOTHING;

                    return (
                      <tr
                        key={log.session_id}
                        onClick={() => setSelectedLog(log)}
                        className={`cursor-pointer transition-all ${
                          isSelected ? 'bg-purple-950/40 text-white' : 'hover:bg-gray-800/40 text-gray-300'
                        }`}
                      >
                        <td className="p-2.5 font-mono text-purple-300">{log.session_id}</td>
                        <td className="p-2.5 font-mono font-bold">
                          <span className={`px-2 py-0.5 rounded border text-[11px] ${riskCfg.badge}`}>
                            {(log.risk_score * 100).toFixed(0)}%
                          </span>
                        </td>
                        <td className="p-2.5">
                          <span className={`px-2 py-0.5 rounded border font-medium text-[11px] ${actCfg.color}`}>
                            {actCfg.label}
                          </span>
                        </td>
                        <td className="p-2.5 text-gray-400">{log.intent_category}</td>
                        <td className="p-2.5 font-mono text-gray-500 text-[11px]">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Selected Audit Log Details Inspector (5 cols) */}
        <div className="lg:col-span-5">
          {activeLog ? (
            <div className="glass-card p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">
                  Audit Entry Detail
                </span>
                <span className="text-xs font-mono text-gray-400">
                  Model v{activeLog.model_version || '1.0.0'}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-gray-800/60">
                  <span className="text-gray-400">Session ID:</span>
                  <span className="font-mono text-white font-semibold">{activeLog.session_id}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-800/60">
                  <span className="text-gray-400">Timestamp:</span>
                  <span className="font-mono text-gray-300">{activeLog.timestamp}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-800/60">
                  <span className="text-gray-400">Engagement Score:</span>
                  <span className="font-mono text-cyan-400">{activeLog.engagement_score}/100</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-800/60">
                  <span className="text-gray-400">Payment Issue:</span>
                  <span className={activeLog.has_payment_issue ? 'text-rose-400 font-semibold' : 'text-gray-400'}>
                    {activeLog.has_payment_issue ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-800/60">
                  <span className="text-gray-400">Margin Guardrail Check:</span>
                  <span className={activeLog.coupon_allowed ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
                    {activeLog.coupon_allowed ? `Coupon Allowed (Max ${activeLog.max_discount_pct}%)` : 'Coupon Blocked'}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-gray-900 border border-gray-800 space-y-1">
                <span className="text-[11px] font-semibold text-purple-400 uppercase tracking-wider block">
                  Reasoning & Policy Justification
                </span>
                <p className="text-xs text-gray-300 leading-relaxed font-sans">
                  {activeLog.reason}
                </p>
              </div>
            </div>
          ) : (
            <div className="glass-card p-6 text-center text-xs text-gray-500">
              Select an audit log entry from the table to view complete policy justification.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
