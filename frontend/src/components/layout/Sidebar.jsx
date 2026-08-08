import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingBag,
  Gamepad2, 
  BarChart3, 
  FileText, 
  ShieldCheck, 
  Bot, 
  Sparkles,
  Zap
} from 'lucide-react';

export default function Sidebar() {
  const navItems = [
    { to: '/', label: 'Live Dashboard', icon: LayoutDashboard },
    { to: '/store', label: 'Live Storefront (Inputs)', icon: ShoppingBag, badge: 'REAL-TIME' },
    { to: '/simulation', label: 'Customer Simulator', icon: Gamepad2 },
    { to: '/analytics', label: 'Model Performance', icon: BarChart3 },
    { to: '/audit', label: 'Audit Trail & SHAP', icon: FileText },
  ];

  return (
    <aside className="w-64 bg-[#0F172A]/90 border-r border-gray-800 flex flex-col justify-between p-4 min-h-screen">
      <div>
        {/* Brand Header */}
        <div className="flex items-center space-x-3 px-2 py-4 mb-6 border-b border-gray-800">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-blue-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-white leading-tight flex items-center gap-1.5">
              CartRescue <Sparkles className="w-4 h-4 text-purple-400" />
            </h1>
            <p className="text-xs text-gray-400">AI Cart Rescue Engine</p>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30 shadow-inner'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
                  }`
                }
              >
                <div className="flex items-center space-x-3">
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono font-bold border border-emerald-500/30 animate-pulse">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Guardrails Footer Badge */}
      <div className="glass-card p-3 border-emerald-500/20 bg-emerald-950/10">
        <div className="flex items-center space-x-2 text-emerald-400 font-semibold text-xs mb-1">
          <ShieldCheck className="w-4 h-4" />
          <span>Margin Protection Active</span>
        </div>
        <p className="text-[11px] text-gray-400 leading-tight">
          Policy bounded: "Do Nothing" enabled for non-converting traffic.
        </p>
      </div>
    </aside>
  );
}
