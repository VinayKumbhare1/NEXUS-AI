import React, { useState } from 'react';
import { 
  Search, 
  Bell, 
  Factory, 
  ShieldCheck, 
  Activity, 
  User, 
  CheckCircle2, 
  AlertTriangle, 
  ChevronDown,
  ExternalLink
} from 'lucide-react';
import { Alert } from '../../types';

interface TopNavbarProps {
  sidebarCollapsed: boolean;
  selectedFactory: string;
  onSelectFactory: (factory: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  alerts: Alert[];
  onOpenAlerts: () => void;
  onNavigateToPredictions: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  sidebarCollapsed,
  selectedFactory,
  onSelectFactory,
  searchQuery,
  onSearchChange,
  alerts,
  onOpenAlerts,
  onNavigateToPredictions
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const factories = [
    'Gigafactory 01 - Detroit Hub',
    'Automated Line B - Stuttgart Plant',
    'Precision Micro-Cell - Tokyo Works',
    'Heavy Machining - Monterrey Facility'
  ];

  const activeAlerts = alerts.filter(a => a.status === 'active');

  return (
    <header 
      className={`fixed top-0 right-0 h-16 z-30 transition-all duration-300 border-b border-slate-800/80 bg-[#080B16]/90 backdrop-blur-xl px-4 lg:px-6 flex items-center justify-between ${
        sidebarCollapsed ? 'left-20' : 'left-64'
      }`}
    >
      {/* Left: Factory Selector & Search */}
      <div className="flex items-center gap-4 flex-1 max-w-2xl">
        {/* Factory Selector Dropdown */}
        <div className="relative group shrink-0 hidden sm:block">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-200 text-xs font-medium cursor-pointer hover:border-slate-700 hover:bg-slate-800/60 transition-all">
            <Factory className="w-4 h-4 text-cyan-400" />
            <select
              value={selectedFactory}
              onChange={(e) => onSelectFactory(e.target.value)}
              aria-label="Select Factory Location"
              className="bg-transparent border-none text-slate-200 text-xs font-semibold focus:outline-none cursor-pointer pr-2"
            >
              {factories.map(f => (
                <option key={f} value={f} className="bg-slate-900 text-slate-200">
                  {f}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search machines, sensor telemetry, alerts, or predictions (e.g. M-104, TWF)..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 rounded-xl text-xs glass-input placeholder:text-slate-500 font-medium"
          />
        </div>
      </div>

      {/* Right: Status Pill, Notifications, User Profile */}
      <div className="flex items-center gap-3">
        {/* Live System Status Pill */}
        <div 
          onClick={onNavigateToPredictions}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 text-xs font-medium cursor-pointer hover:bg-cyan-900/30 transition-all shadow-[0_0_12px_rgba(34,211,238,0.15)]"
          title="Click to open AI Predictor"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400"></span>
          </span>
          <span className="tracking-wide uppercase text-[10px] font-bold">ML Core Online</span>
          <span className="text-[10px] text-cyan-400/80 font-mono">1.8ms</span>
        </div>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="Toggle notifications menu"
            className="relative p-2 rounded-xl text-slate-300 hover:text-white bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800/80 transition-all"
          >
            <Bell className="w-4 h-4" />
            {activeAlerts.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white shadow-lg shadow-rose-500/50">
                {activeAlerts.length}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl glass-panel shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-slate-100">Live Maintenance Alerts</span>
                  <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 text-xs font-bold border border-rose-500/30">
                    {activeAlerts.length} Active
                  </span>
                </div>
                <button
                  onClick={() => {
                    setShowNotifications(false);
                    onOpenAlerts();
                  }}
                  className="text-xs text-cyan-400 hover:text-cyan-300 font-medium"
                >
                  View All
                </button>
              </div>

              <div className="py-2 space-y-2 max-h-72 overflow-y-auto">
                {activeAlerts.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
                    All machines operational. No active critical alerts.
                  </div>
                ) : (
                  activeAlerts.slice(0, 4).map((alert) => (
                    <div
                      key={alert.id}
                      onClick={() => {
                        setShowNotifications(false);
                        onOpenAlerts();
                      }}
                      className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800/80 hover:border-slate-700 cursor-pointer transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="text-xs font-bold text-slate-200">
                          {alert.machineId} • {alert.category}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                          alert.severity === 'critical' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
                        }`}>
                          {alert.severity}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                        {alert.description}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            aria-label="Toggle user profile menu"
            className="flex items-center gap-2 p-1.5 pr-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800/80 transition-all cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center text-white font-bold text-xs shadow-[0_0_8px_rgba(59,130,246,0.5)]">
              MC
            </div>
            <div className="hidden lg:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-200">Dr. Marcus Chen</span>
              <span className="text-[10px] text-cyan-400 font-mono">Lead Maintenance Architect</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl glass-panel shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="pb-2 mb-2 border-b border-slate-800">
                <p className="text-xs font-semibold text-slate-200">Dr. Marcus Chen</p>
                <p className="text-[11px] text-slate-400 truncate">m.chen@nexus-industrial.ai</p>
                <p className="text-[10px] text-cyan-400 mt-1">Role: Factory Administrator (L4)</p>
              </div>
              <div className="space-y-1">
                <div className="px-2 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800/50 rounded-lg cursor-pointer flex items-center justify-between">
                  <span>Factory Node Access</span>
                  <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded">All Plants</span>
                </div>
                <div className="px-2 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800/50 rounded-lg cursor-pointer flex items-center justify-between">
                  <span>Model Pipeline</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded">v1.0.4 Ready</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
