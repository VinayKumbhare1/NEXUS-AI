import React from 'react';
import { 
  LayoutDashboard, 
  Cpu, 
  Sparkles, 
  AlertTriangle, 
  BarChart3, 
  History, 
  Database, 
  Gauge, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  ShieldCheck,
  Zap,
  Activity
} from 'lucide-react';
import { NavigationTab } from '../../types';

interface SidebarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  activeAlertCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  collapsed,
  onToggleCollapse,
  activeAlertCount
}) => {
  const navItems: { id: NavigationTab; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'machines', label: 'Machine Monitoring', icon: Cpu },
    { id: 'predictions', label: 'AI Predictions', icon: Sparkles },
    { id: 'alerts', label: 'Maintenance Alerts', icon: AlertTriangle, badge: activeAlertCount },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'history', label: 'Prediction History', icon: History },
    { id: 'datasets', label: 'Dataset Management', icon: Database },
    { id: 'model-performance', label: 'Model Performance', icon: Gauge },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <aside
      className={`fixed top-0 left-0 h-screen z-40 transition-all duration-300 ease-in-out flex flex-col border-r border-slate-800/80 bg-[#080B16]/95 backdrop-blur-xl ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/70">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 p-[1.5px] shadow-[0_0_15px_rgba(59,130,246,0.5)]">
            <div className="w-full h-full bg-[#080B16] rounded-[10px] flex items-center justify-center">
              <Zap className="w-5 h-5 text-cyan-400 animate-pulse" />
            </div>
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-white">
                  NEXUS
                </span>
                <span className="text-xs px-1.5 py-0.5 rounded bg-blue-500/20 text-cyan-300 font-semibold border border-blue-500/30">
                  AI
                </span>
              </div>
              <span className="text-[10px] tracking-tight text-slate-400 truncate">
                Predict. Prevent. Perform.
              </span>
            </div>
          )}
        </div>

        <button
          onClick={onToggleCollapse}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors border border-transparent hover:border-slate-700/50"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5" aria-label="Main Navigation">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative ${
                isActive
                  ? 'bg-gradient-to-r from-blue-600/30 via-indigo-600/20 to-transparent text-cyan-300 border border-blue-500/40 shadow-[0_0_15px_rgba(59,130,246,0.15)]'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40 border border-transparent'
              }`}
              title={collapsed ? item.label : undefined}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-cyan-400 rounded-r shadow-[0_0_8px_#22D3EE]" />
              )}
              <Icon
                className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-110 ${
                  isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-200'
                }`}
              />
              {!collapsed && (
                <span className="truncate flex-1 text-left">{item.label}</span>
              )}
              {!collapsed && item.badge !== undefined && item.badge > 0 && (
                <span className="ml-auto px-2 py-0.5 text-xs font-semibold rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse">
                  {item.badge}
                </span>
              )}
              {collapsed && item.badge !== undefined && item.badge > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500 ring-4 ring-[#080B16]" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Operational Mode Badge at Footer */}
      <div className="p-3 border-t border-slate-800/70">
        {!collapsed ? (
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-semibold text-slate-200">AI4I 2020 Engine</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              UCI Benchmark Architecture Active
            </p>
          </div>
        ) : (
          <div className="flex justify-center" title="AI4I Neural Engine: Online">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>
        )}
      </div>
    </aside>
  );
};
