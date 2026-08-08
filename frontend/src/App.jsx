import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { SessionProvider } from './context/SessionContext';
import RealtimeAlertToast from './components/common/RealtimeAlertToast';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import LiveStore from './pages/LiveStore';
import Simulation from './pages/Simulation';
import Analytics from './pages/Analytics';
import AuditTrail from './pages/AuditTrail';

export default function App() {
  return (
    <SessionProvider>
      <Router>
        <RealtimeAlertToast />
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/store" element={<LiveStore />} />
            <Route path="/simulation" element={<Simulation />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/audit" element={<AuditTrail />} />
          </Routes>
        </Layout>
      </Router>
    </SessionProvider>
  );
}
