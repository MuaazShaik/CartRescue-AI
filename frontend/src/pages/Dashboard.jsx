import React from 'react';
import { useSession } from '../context/SessionContext';
import MetricsCards from '../components/dashboard/MetricsCards';
import RiskGauge from '../components/dashboard/RiskGauge';
import TopRiskFactors from '../components/dashboard/TopRiskFactors';
import LiveSessionFeed from '../components/dashboard/LiveSessionFeed';
import ActionDistribution from '../components/dashboard/ActionDistribution';
import RevenueChart from '../components/dashboard/RevenueChart';
import { Sparkles } from 'lucide-react';

export default function Dashboard() {
  const { sessions, selectedSession, setSelectedSession } = useSession();

  const activeSession = selectedSession || sessions[0] || {
    session_id: 'no_session',
    risk_score: 0,
    risk_level: 'LOW',
    top_factors: [],
  };

  return (
    <div className="space-y-6">
      {/* Top Metric Cards */}
      <MetricsCards sessions={sessions} />

      {/* Main Grid: Gauge + Top Risk Factors + Live Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Abandonment Risk Gauge (3 cols) */}
        <div className="lg:col-span-3">
          <RiskGauge score={activeSession.risk_score} level={activeSession.risk_level} />
        </div>

        {/* Middle: SHAP Top Risk Factors Panel (4 cols) */}
        <div className="lg:col-span-4">
          <TopRiskFactors factors={activeSession.top_factors} />
        </div>

        {/* Right: Live Session Stream (5 cols) */}
        <div className="lg:col-span-5">
          <LiveSessionFeed
            sessions={sessions}
            selectedSessionId={activeSession.session_id}
            onSelectSession={setSelectedSession}
          />
        </div>
      </div>

      {/* Analytics Row: Revenue Chart + Action Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
          <RevenueChart sessions={sessions} />
        </div>
        <div className="lg:col-span-5">
          <ActionDistribution sessions={sessions} />
        </div>
      </div>
    </div>
  );
}
