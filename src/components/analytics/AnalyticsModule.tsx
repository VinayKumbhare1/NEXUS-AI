import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Calendar, 
  Filter, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Activity, 
  Zap, 
  ShieldCheck,
  TrendingDown,
  Layers
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  Legend 
} from 'recharts';
import { Machine, Alert, PredictionRecord } from '../../types';

interface AnalyticsModuleProps {
  machines: Machine[];
  alerts: Alert[];
  predictions: PredictionRecord[];
}

export const AnalyticsModule: React.FC<AnalyticsModuleProps> = ({
  machines,
  alerts,
  predictions
}) => {
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('7d');
  const [selectedMachineFilter, setSelectedMachineFilter] = useState<string>('all');

  // Failure Mode Distribution in AI4I benchmark
  const failureModesData = [
    { mode: 'Heat Dissipation (HDF)', count: 115, percentage: 33.9, fill: '#22D3EE' },
    { mode: 'Power Failure (PWF)', count: 95, percentage: 28.0, fill: '#8B5CF6' },
    { mode: 'Overstrain (OSF)', count: 78, percentage: 23.0, fill: '#F59E0B' },
    { mode: 'Tool Wear (TWF)', count: 46, percentage: 13.6, fill: '#EF4444' },
    { mode: 'Random (RNF)', count: 5, percentage: 1.5, fill: '#10B981' }
  ];

  // 7-day Machine Health & Downtime Trends
  const healthTrendsData = [
    { day: 'Mon', avgHealth: 94, downtimeHours: 0.4, incidents: 1 },
    { day: 'Tue', avgHealth: 92, downtimeHours: 1.2, incidents: 2 },
    { day: 'Wed', avgHealth: 88, downtimeHours: 2.5, incidents: 4 },
    { day: 'Thu', avgHealth: 90, downtimeHours: 0.8, incidents: 1 },
    { day: 'Fri', avgHealth: 85, downtimeHours: 3.8, incidents: 5 },
    { day: 'Sat', avgHealth: 89, downtimeHours: 1.0, incidents: 2 },
    { day: 'Sun', avgHealth: 91, downtimeHours: 0.5, incidents: 1 }
  ];

  // Machine Risk Scores Comparison
  const machineRiskComparison = machines.map(m => {
    const latestPred = predictions.find(p => p.machineId === m.id);
    const failureProb = latestPred ? Math.round(latestPred.failureProbability * 100) : (100 - m.healthScore);
    return {
      id: m.id,
      name: m.name.split(' ')[0] + ' ' + m.id,
      healthScore: m.healthScore,
      riskProbability: failureProb,
      operatingHours: m.operatingHours
    };
  });

  // Sensor Operational Envelope (Torque vs RPM distribution)
  const sensorEnvelopeData = [
    { torque: 25, speed: 1850, status: 'Optimal' },
    { torque: 35, speed: 1650, status: 'Optimal' },
    { torque: 42, speed: 1510, status: 'Optimal' },
    { torque: 58, speed: 1440, status: 'Warning' },
    { torque: 68, speed: 1220, status: 'Critical' },
    { torque: 72, speed: 1750, status: 'Critical' },
    { torque: 38, speed: 1600, status: 'Optimal' }
  ];

  return (
    <div className="space-y-6">
      {/* Analytics Header & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl glass-panel">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-blue-500/20 text-cyan-300 border border-blue-500/30">
              Predictive Intelligence
            </span>
            <span className="text-xs text-slate-400">Continuous Machine Telemetry Analytics</span>
          </div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
            <span>Industrial Reliability & Failure Dynamics</span>
          </h1>
        </div>

        {/* Range & Machine Selectors */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          {/* Time range selector */}
          <div className="flex items-center p-1 rounded-xl bg-slate-900/80 border border-slate-800">
            {(['24h', '7d', '30d'] as const).map(tr => (
              <button
                key={tr}
                onClick={() => setTimeRange(tr)}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  timeRange === tr ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                {tr.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Machine Filter Dropdown */}
          <div className="relative">
            <select
              value={selectedMachineFilter}
              onChange={(e) => setSelectedMachineFilter(e.target.value)}
              aria-label="Filter Analytics by Machine"
              className="px-3 py-1.5 rounded-xl glass-input text-slate-200 cursor-pointer"
            >
              <option value="all" className="bg-slate-900">All Industrial Units</option>
              {machines.map(m => (
                <option key={m.id} value={m.id} className="bg-slate-900">{m.id} - {m.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Top Metric Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl glass-panel">
          <span className="text-xs text-slate-400 font-medium">Mean Time Between Failures (MTBF)</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black font-mono text-cyan-300">842.6 hrs</span>
            <span className="text-xs text-emerald-400 font-semibold">+6.4% vs Q3</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Benchmark: 800 hours target</p>
        </div>

        <div className="p-4 rounded-2xl glass-panel">
          <span className="text-xs text-slate-400 font-medium">Unplanned Downtime (7 Days)</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black font-mono text-amber-400">10.2 hrs</span>
            <span className="text-xs text-emerald-400 font-semibold">-2.1 hrs avoided</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">3 Failures Intercepted Pre-emptively</p>
        </div>

        <div className="p-4 rounded-2xl glass-panel">
          <span className="text-xs text-slate-400 font-medium">Dominant Risk Root Cause</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-lg font-black text-rose-400">Heat Dissipation (HDF)</span>
            <span className="text-xs font-mono text-slate-400">33.9%</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Cooling delta bottleneck (&lt;8.6 K)</p>
        </div>

        <div className="p-4 rounded-2xl glass-panel">
          <span className="text-xs text-slate-400 font-medium">AI Early Warning Lead Time</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black font-mono text-emerald-400">36.4 hrs</span>
            <span className="text-xs text-cyan-300 font-semibold">Pre-Failure</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Average advance notification</p>
        </div>
      </div>

      {/* Visualizations Row 1: Health Trend Area Chart & Failure Modes Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Health vs Downtime Over Time (8 Cols) */}
        <div className="lg:col-span-8 p-5 rounded-2xl glass-panel space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-white">Machine Health Index vs Downtime Trend</h2>
              <p className="text-xs text-slate-400">Correlation between overall factory health score and maintenance downtime hours.</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-cyan-400">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" /> Health Index (%)
              </span>
              <span className="flex items-center gap-1.5 text-amber-400">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Downtime (hrs)
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={healthTrendsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="healthGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22D3EE" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#22D3EE" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="day" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} domain={[70, 100]} tickLine={false} />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    fontSize: '12px'
                  }}
                />
                <Area type="monotone" dataKey="avgHealth" name="Health Index (%)" stroke="#22D3EE" strokeWidth={2.5} fillOpacity={1} fill="url(#healthGrad)" />
                <Line type="monotone" dataKey="downtimeHours" name="Downtime (hrs)" stroke="#F59E0B" strokeWidth={2} dot={{ r: 4, fill: '#F59E0B' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Failure Mode Distribution (4 Cols) */}
        <div className="lg:col-span-4 p-5 rounded-2xl glass-panel space-y-4 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-white">Failure Mode Breakdown</h2>
            <p className="text-xs text-slate-400">Distribution across 339 recorded failure events in AI4I 2020.</p>
          </div>

          <div className="h-44 w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={failureModesData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="count"
                >
                  {failureModesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} stroke="none" />
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
              <span className="text-xl font-black text-white font-mono">339</span>
              <span className="text-[10px] text-slate-400 uppercase font-medium">Failures</span>
            </div>
          </div>

          <div className="space-y-1.5 border-t border-slate-800 pt-3 text-xs">
            {failureModesData.map((m) => (
              <div key={m.mode} className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: m.fill }} />
                  <span className="truncate max-w-[150px]">{m.mode}</span>
                </span>
                <span className="font-mono text-slate-200">{m.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Visualizations Row 2: Machine Risk Distribution Bar Chart */}
      <div className="p-5 rounded-2xl glass-panel space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-white">Risk Distribution by Machine Unit</h2>
            <p className="text-xs text-slate-400">Comparing current operational health index vs predicted failure risk probability.</p>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={machineRiskComparison} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="id" stroke="#64748B" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748B" fontSize={11} domain={[0, 100]} tickLine={false} />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: '#0F172A',
                  borderColor: 'rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  fontSize: '12px'
                }}
              />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px', color: '#CBD5E1' }} />
              <Bar dataKey="healthScore" name="Health Score (%)" fill="#10B981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="riskProbability" name="Failure Risk Probability (%)" fill="#EF4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
