import React from 'react';
import { 
  Cpu, 
  CheckCircle2, 
  AlertTriangle, 
  AlertOctagon, 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  Sparkles, 
  ArrowUpRight,
  ShieldAlert,
  Clock,
  Radio,
  ExternalLink
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip as RechartsTooltip, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  LineChart, 
  Line, 
  Legend 
} from 'recharts';
import { Machine, Alert, PredictionRecord, NavigationTab } from '../../types';

interface OverviewDashboardProps {
  machines: Machine[];
  alerts: Alert[];
  predictions: PredictionRecord[];
  onNavigate: (tab: NavigationTab) => void;
  onSelectMachine: (machine: Machine) => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  machines,
  alerts,
  predictions,
  onNavigate,
  onSelectMachine
}) => {
  // Aggregate KPI metrics
  const totalMachines = machines.length;
  const healthyMachines = machines.filter(m => m.status === 'healthy').length;
  const atRiskMachines = machines.filter(m => m.status === 'warning').length;
  const criticalMachines = machines.filter(m => m.status === 'critical').length;
  
  const avgHealth = totalMachines > 0 
    ? Math.round(machines.reduce((acc, m) => acc + m.healthScore, 0) / totalMachines) 
    : 0;

  // Donut Chart Data: Machine Health Distribution
  const healthDistributionData = [
    { name: 'Optimal (Healthy)', value: healthyMachines, color: '#10B981' },
    { name: 'Degrading (Warning)', value: atRiskMachines, color: '#F59E0B' },
    { name: 'Critical (High Risk)', value: criticalMachines, color: '#EF4444' }
  ];

  // Failure Risk Categorization Data
  const riskCategoriesData = [
    { category: 'Low Risk', count: predictions.filter(p => p.riskLevel === 'Low Risk').length, fill: '#10B981' },
    { category: 'Medium Risk', count: predictions.filter(p => p.riskLevel === 'Medium Risk').length, fill: '#38BDF8' },
    { category: 'High Risk', count: predictions.filter(p => p.riskLevel === 'High Risk').length, fill: '#F59E0B' },
    { category: 'Critical Risk', count: predictions.filter(p => p.riskLevel === 'Critical Risk').length, fill: '#EF4444' }
  ];

  // Aggregated Performance Trend across all machines over 12 timepoints
  const trendData = Array.from({ length: 10 }, (_, i) => {
    const hour = `${(8 + i * 2) % 24}:00`;
    const speedAvg = Math.round(1520 + Math.sin(i) * 60 + (i === 7 ? -90 : 0));
    const torqueAvg = +(41 + Math.cos(i) * 4 + (i === 7 ? 14 : 0)).toFixed(1);
    const tempDeltaAvg = +(10.2 + Math.sin(i * 1.5) * 0.8 - (i === 7 ? 2.5 : 0)).toFixed(1);
    return {
      time: hour,
      avgSpeed: speedAvg,
      avgTorque: torqueAvg,
      tempDelta: tempDeltaAvg
    };
  });

  return (
    <div className="space-y-6">
      {/* Banner / Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-2xl glass-panel relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-blue-500/20 text-cyan-300 border border-blue-500/30">
              Operational Telemetry
            </span>
            <span className="text-xs text-slate-400 font-medium">
              Synchronized with AI4I 2020 Industrial Standards
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
            Factory Floor Health & Machine Risk Radar
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Real-time multi-sensor surveillance predicting mechanical degradation, thermal dissipation bottlenecks, and tool wear before catastrophic downtime occurs.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-3">
          <button
            onClick={() => onNavigate('predictions')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 text-white text-xs font-bold tracking-wide shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:brightness-110 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-cyan-200" />
            <span>RUN AI INFERENCE</span>
          </button>
          <button
            onClick={() => onNavigate('alerts')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 text-xs font-semibold border border-slate-700/80 transition-all cursor-pointer"
          >
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span>ALERTS ({alerts.filter(a => a.status === 'active').length})</span>
          </button>
        </div>
      </div>

      {/* Top 5 Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Machines */}
        <div 
          onClick={() => onNavigate('machines')}
          className="p-4 rounded-2xl glass-panel glass-panel-hover cursor-pointer relative overflow-hidden group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Units</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 group-hover:scale-110 transition-transform">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-white font-mono">{totalMachines}</span>
            <span className="text-[11px] text-cyan-400 flex items-center font-medium">
              100% Monitored
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 truncate">8 Active Milling Spindles</p>
        </div>

        {/* Healthy Machines */}
        <div 
          onClick={() => onNavigate('machines')}
          className="p-4 rounded-2xl glass-panel glass-panel-hover cursor-pointer relative overflow-hidden group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Optimal Health</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-400 font-mono">{healthyMachines}</span>
            <span className="text-[11px] text-emerald-400/90 flex items-center gap-0.5 font-medium">
              <TrendingUp className="w-3 h-3" />
              {Math.round((healthyMachines / (totalMachines || 1)) * 100)}%
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 truncate">Nominal Vibration & Temp</p>
        </div>

        {/* Machines At Risk */}
        <div 
          onClick={() => onNavigate('machines')}
          className="p-4 rounded-2xl glass-panel glass-panel-hover cursor-pointer relative overflow-hidden group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Warning State</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 group-hover:scale-110 transition-transform">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-amber-400 font-mono">{atRiskMachines}</span>
            <span className="text-[11px] text-amber-400 flex items-center gap-0.5 font-medium">
              Needs Service
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 truncate">Approaching Wear Thresholds</p>
        </div>

        {/* Critical Machines */}
        <div 
          onClick={() => onNavigate('machines')}
          className="p-4 rounded-2xl glass-panel glass-panel-hover cursor-pointer relative overflow-hidden group border-rose-500/30"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Critical Risk</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 group-hover:scale-110 transition-transform">
              <AlertOctagon className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-rose-400 font-mono">{criticalMachines}</span>
            <span className="text-[11px] text-rose-400 font-bold animate-pulse">
              Spindle Stop!
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 truncate">Tool Wear / Heat Breach</p>
        </div>

        {/* Overall Factory Health */}
        <div className="p-4 rounded-2xl glass-panel glass-panel-hover relative overflow-hidden group bg-gradient-to-br from-blue-950/40 via-indigo-950/30 to-[#10172A]">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Plant Index</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-cyan-300 font-mono">{avgHealth}%</span>
            <span className="text-[11px] text-cyan-400 font-medium">
              Score: {avgHealth > 85 ? 'Grade A' : 'Grade B'}
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2.5 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-blue-500 to-cyan-400 h-1.5 rounded-full" 
              style={{ width: `${avgHealth}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Line Chart (8 Cols) */}
        <div className="lg:col-span-8 p-5 rounded-2xl glass-panel space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Machine Performance & Telemetry Envelopes</span>
                <span className="text-xs font-normal text-slate-400 font-mono">(24h Aggregated)</span>
              </h2>
              <p className="text-xs text-slate-400">
                Tracking spindle rotational velocity (RPM), motor torque (Nm), and thermal delta (K).
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-cyan-300">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" /> Spindle RPM
              </span>
              <span className="flex items-center gap-1.5 text-violet-300">
                <span className="w-2.5 h-2.5 rounded-full bg-violet-400" /> Torque [Nm]
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="time" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis yAxisId="rpm" stroke="#64748B" fontSize={11} domain={[1300, 1700]} tickLine={false} />
                <YAxis yAxisId="torque" orientation="right" stroke="#64748B" fontSize={11} domain={[20, 80]} tickLine={false} />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    fontSize: '12px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
                  }}
                />
                <Line
                  yAxisId="rpm"
                  type="monotone"
                  dataKey="avgSpeed"
                  name="Avg Spindle Speed [RPM]"
                  stroke="#22D3EE"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#22D3EE' }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  yAxisId="torque"
                  type="monotone"
                  dataKey="avgTorque"
                  name="Avg Torque [Nm]"
                  stroke="#8B5CF6"
                  strokeWidth={2}
                  strokeDasharray="4 2"
                  dot={{ r: 3, fill: '#8B5CF6' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Column: Donut Chart Health Distribution (4 Cols) */}
        <div className="lg:col-span-4 p-5 rounded-2xl glass-panel space-y-4 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-white">Machine Health Distribution</h2>
            <p className="text-xs text-slate-400">Current status breakdown across active units.</p>
          </div>

          <div className="h-48 w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={healthDistributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {healthDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderRadius: '10px',
                    fontSize: '11px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black text-white font-mono">{totalMachines}</span>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Units</span>
            </div>
          </div>

          <div className="space-y-2 border-t border-slate-800/80 pt-3">
            {healthDistributionData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  {item.name}
                </span>
                <span className="font-mono font-bold text-white">{item.value} units</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Second Row: Failure Risk Bar Chart & Recent Predictions Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Failure Risk Overview Bar Chart (4 Cols) */}
        <div className="lg:col-span-4 p-5 rounded-2xl glass-panel space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white">Failure Risk Overview</h2>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/50">
              AI Classified
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Machine population grouped by predicted failure risk tiers.
          </p>

          <div className="h-56 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskCategoriesData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="category" stroke="#64748B" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} allowDecimals={false} tickLine={false} />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderRadius: '10px',
                    fontSize: '11px'
                  }}
                />
                <Bar dataKey="count" name="Evaluations" radius={[6, 6, 0, 0]}>
                  {riskCategoriesData.map((entry, index) => (
                    <Cell key={`bar-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent AI Predictions Table (8 Cols) */}
        <div className="lg:col-span-8 p-5 rounded-2xl glass-panel space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">Recent AI Predictions</h2>
              <p className="text-xs text-slate-400">Latest machine diagnostics from AI4I neural inference.</p>
            </div>
            <button
              onClick={() => onNavigate('history')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>Full History</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-2.5 font-semibold">Machine</th>
                  <th className="pb-2.5 font-semibold">Telemetry Snapshot</th>
                  <th className="pb-2.5 font-semibold">Primary Risk Mode</th>
                  <th className="pb-2.5 font-semibold">Risk Probability</th>
                  <th className="pb-2.5 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {predictions.slice(0, 4).map((p) => {
                  const m = machines.find(x => x.id === p.machineId);
                  return (
                    <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-2.5">
                        <div className="font-bold text-slate-100">{p.machineId}</div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[140px]">{p.machineName}</div>
                      </td>
                      <td className="py-2.5 font-mono text-[11px] text-slate-300">
                        {p.rotationalSpeedRpm} RPM • {p.torqueNm} Nm • {p.toolWearMin}m
                      </td>
                      <td className="py-2.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          p.riskLevel === 'Critical Risk' 
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' 
                            : p.riskLevel === 'High Risk'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        }`}>
                          {p.primaryFailureMode}
                        </span>
                      </td>
                      <td className="py-2.5 font-mono font-bold">
                        <span className={
                          p.failureProbability >= 0.75 
                            ? 'text-rose-400' 
                            : p.failureProbability >= 0.50 
                            ? 'text-amber-400' 
                            : 'text-emerald-400'
                        }>
                          {Math.round(p.failureProbability * 100)}%
                        </span>
                      </td>
                      <td className="py-2.5 text-right">
                        {m && (
                          <button
                            onClick={() => onSelectMachine(m)}
                            className="px-2.5 py-1 rounded-lg bg-blue-600/20 text-cyan-300 hover:bg-blue-600/30 border border-blue-500/30 font-medium text-[11px] transition-all cursor-pointer"
                          >
                            Inspect
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Third Row: Maintenance Activity Timeline & System Activity Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Maintenance Activity Timeline (7 Cols) */}
        <div className="lg:col-span-7 p-5 rounded-2xl glass-panel space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>Maintenance Activity & Dispatch Log</span>
            </h2>
            <button
              onClick={() => onNavigate('alerts')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold"
            >
              Alert Center
            </button>
          </div>

          <div className="space-y-3">
            {alerts.slice(0, 3).map((a, idx) => (
              <div key={a.id} className="flex gap-3 p-3 rounded-xl bg-slate-900/50 border border-slate-800">
                <div className={`p-2 rounded-xl h-fit shrink-0 ${
                  a.severity === 'critical' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
                }`}>
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-bold text-xs text-white">
                      {a.machineId} • {a.category}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(a.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 line-clamp-1">{a.description}</p>
                  <div className="mt-1.5 flex items-center gap-2 text-[11px] text-cyan-400">
                    <span className="font-semibold">Action:</span>
                    <span className="text-slate-300 truncate">{a.recommendedAction}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Activity Panel (5 Cols) */}
        <div className="lg:col-span-5 p-5 rounded-2xl glass-panel space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span>Real-Time Sensor Bus</span>
            </h2>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
              POLLING 1000ms
            </span>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                <span className="text-slate-200">M-101 SPINDLE</span>
              </div>
              <span className="text-slate-400">1512 RPM • 41.5 Nm</span>
              <span className="text-emerald-400 font-bold">NOMINAL</span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="text-slate-200">M-103 THERMAL</span>
              </div>
              <span className="text-slate-400">Δ 7.7 K • 1390 RPM</span>
              <span className="text-amber-400 font-bold">WARN_HDF</span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-rose-900/40 bg-rose-950/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                <span className="text-rose-200">M-104 TOOL_WEAR</span>
              </div>
              <span className="text-slate-300">232 min (98% max)</span>
              <span className="text-rose-400 font-bold">CRIT_TWF</span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                <span className="text-slate-200">M-107 SURF_MILL</span>
              </div>
              <span className="text-slate-400">1560 RPM • 39.8 Nm</span>
              <span className="text-emerald-400 font-bold">NOMINAL</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
