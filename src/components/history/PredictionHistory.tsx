import React, { useState } from 'react';
import { 
  History, 
  Search, 
  Filter, 
  Download, 
  Trash2, 
  Eye, 
  X, 
  ArrowUpDown, 
  ChevronLeft, 
  ChevronRight,
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles
} from 'lucide-react';
import { PredictionRecord, RiskLevel } from '../../types';

interface PredictionHistoryProps {
  predictions: PredictionRecord[];
  onDeletePrediction: (id: string) => Promise<void>;
}

export const PredictionHistory: React.FC<PredictionHistoryProps> = ({
  predictions,
  onDeletePrediction
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState<'all' | RiskLevel>('all');
  const [sortBy, setSortBy] = useState<'date' | 'probability' | 'machine'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [selectedPrediction, setSelectedPrediction] = useState<PredictionRecord | null>(null);

  // Filter & Search
  let filtered = predictions.filter(p => {
    const matchesRisk = riskFilter === 'all' || p.riskLevel === riskFilter;
    const matchesSearch = 
      p.machineId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.machineName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.primaryFailureMode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesRisk && matchesSearch;
  });

  // Sorting
  filtered.sort((a, b) => {
    if (sortBy === 'probability') {
      return sortOrder === 'desc' 
        ? b.failureProbability - a.failureProbability 
        : a.failureProbability - b.failureProbability;
    }
    if (sortBy === 'machine') {
      return sortOrder === 'desc'
        ? b.machineId.localeCompare(a.machineId)
        : a.machineId.localeCompare(b.machineId);
    }
    // Default by date
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
  });

  // Pagination
  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const toggleSort = (field: 'date' | 'probability' | 'machine') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handleExportCSV = () => {
    const headers = [
      'Prediction ID', 'Machine ID', 'Machine Name', 'Air Temp [K]', 'Process Temp [K]', 
      'Speed [RPM]', 'Torque [Nm]', 'Tool Wear [min]', 'Predicted Class', 'Probability', 'Risk Tier', 'Failure Mode', 'Date'
    ];
    const rows = filtered.map(p => [
      p.id, p.machineId, `"${p.machineName}"`, p.airTemperatureK, p.processTemperatureK,
      p.rotationalSpeedRpm, p.torqueNm, p.toolWearMin, p.prediction, p.failureProbability, p.riskLevel, `"${p.primaryFailureMode}"`, p.createdAt
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encoded = encodeURI(csvContent);
    const link = document.createElement('a');
    link.href = encoded;
    link.download = `nexus_prediction_history_${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl glass-panel">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-blue-500/20 text-cyan-300 border border-blue-500/30">
              Audit Trail
            </span>
            <span className="text-xs text-slate-400">Total {predictions.length} Inferences Logged</span>
          </div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <History className="w-5 h-5 text-cyan-400" />
            <span>AI Predictive Maintenance Audit Records</span>
          </h1>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Audit History</span>
        </button>
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl glass-panel text-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Risk Level Filter */}
          <div className="flex items-center p-1 rounded-xl bg-slate-900/80 border border-slate-800">
            {(['all', 'Critical Risk', 'High Risk', 'Medium Risk', 'Low Risk'] as const).map(tier => (
              <button
                key={tier}
                onClick={() => {
                  setRiskFilter(tier as any);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  riskFilter === tier ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                {tier === 'all' ? 'All Tiers' : tier.replace(' Risk', '')}
              </button>
            ))}
          </div>

          {/* Quick Sort Controls */}
          <div className="flex items-center gap-1.5 text-slate-400">
            <span>Sort:</span>
            <button
              onClick={() => toggleSort('date')}
              className={`px-2 py-1 rounded-lg border transition-all ${
                sortBy === 'date' ? 'bg-slate-800 text-cyan-300 border-cyan-500/40' : 'border-slate-800 hover:text-white'
              }`}
            >
              Date {sortBy === 'date' && (sortOrder === 'desc' ? '↓' : '↑')}
            </button>
            <button
              onClick={() => toggleSort('probability')}
              className={`px-2 py-1 rounded-lg border transition-all ${
                sortBy === 'probability' ? 'bg-slate-800 text-cyan-300 border-cyan-500/40' : 'border-slate-800 hover:text-white'
              }`}
            >
              Risk % {sortBy === 'probability' && (sortOrder === 'desc' ? '↓' : '↑')}
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search prediction ID, unit, failure mode..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-9 pr-3 py-1.5 rounded-xl glass-input w-56 sm:w-64"
          />
        </div>
      </div>

      {/* History Table */}
      <div className="p-5 rounded-2xl glass-panel space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                <th className="pb-3">Inference ID</th>
                <th className="pb-3">Machine</th>
                <th className="pb-3">Telemetry Readings</th>
                <th className="pb-3">Failure Mode</th>
                <th className="pb-3">Risk Probability</th>
                <th className="pb-3">Risk Tier</th>
                <th className="pb-3">Timestamp</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500 font-sans">
                    No matching prediction records found.
                  </td>
                </tr>
              ) : (
                paginated.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 text-slate-300 font-bold">{p.id}</td>
                    <td className="py-3">
                      <div className="text-white font-bold">{p.machineId}</div>
                      <div className="text-[10px] text-slate-400 font-sans truncate max-w-[120px]">{p.machineName}</div>
                    </td>
                    <td className="py-3 text-[11px] text-slate-300">
                      {p.rotationalSpeedRpm} RPM • {p.torqueNm} Nm • {p.toolWearMin}m
                    </td>
                    <td className="py-3 font-sans">
                      <span className="text-slate-200 truncate max-w-[140px] block">
                        {p.primaryFailureMode}
                      </span>
                    </td>
                    <td className="py-3 font-bold text-sm">
                      <span className={
                        p.failureProbability >= 0.75 ? 'text-rose-400' :
                        p.failureProbability >= 0.50 ? 'text-amber-400' :
                        p.failureProbability >= 0.25 ? 'text-cyan-400' : 'text-emerald-400'
                      }>
                        {Math.round(p.failureProbability * 100)}%
                      </span>
                    </td>
                    <td className="py-3 font-sans">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        p.riskLevel === 'Critical Risk' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                        p.riskLevel === 'High Risk' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                        p.riskLevel === 'Medium Risk' ? 'bg-blue-500/20 text-cyan-300 border border-blue-500/30' :
                        'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}>
                        {p.riskLevel}
                      </span>
                    </td>
                    <td className="py-3 text-[10px] text-slate-400 font-mono">
                      {new Date(p.createdAt).toLocaleDateString()} {new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 text-right font-sans">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedPrediction(p)}
                          className="p-1.5 rounded-lg bg-blue-600/20 text-cyan-300 hover:bg-blue-600/40 border border-blue-500/30 transition-all cursor-pointer"
                          title="View Diagnostic Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeletePrediction(p.id)}
                          className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
                          title="Delete Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs text-slate-400">
          <span>
            Showing page <strong className="text-white">{currentPage}</strong> of <strong className="text-white">{totalPages}</strong> ({filtered.length} total entries)
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Prediction Detail Modal */}
      {selectedPrediction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl glass-panel border border-slate-700 p-6 shadow-2xl relative space-y-4">
            <button
              onClick={() => setSelectedPrediction(null)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800">
                  {selectedPrediction.id}
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {new Date(selectedPrediction.createdAt).toLocaleString()}
                </span>
              </div>
              <h2 className="text-base font-bold text-white">
                {selectedPrediction.machineId} • {selectedPrediction.machineName}
              </h2>
            </div>

            {/* Risk Probability Score */}
            <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Failure Risk</span>
                <span className={`text-3xl font-black font-mono ${
                  selectedPrediction.failureProbability >= 0.75 ? 'text-rose-400' :
                  selectedPrediction.failureProbability >= 0.50 ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {Math.round(selectedPrediction.failureProbability * 100)}%
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Identified Mode</span>
                <span className="text-xs font-bold text-cyan-300">{selectedPrediction.primaryFailureMode}</span>
              </div>
            </div>

            {/* Sensor Snapshot */}
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2.5 rounded-xl bg-slate-900/50 border border-slate-800">
                <span className="text-slate-400 font-sans block text-[11px]">Air Temperature</span>
                <span className="text-white font-bold">{selectedPrediction.airTemperatureK} K</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/50 border border-slate-800">
                <span className="text-slate-400 font-sans block text-[11px]">Process Temperature</span>
                <span className="text-white font-bold">{selectedPrediction.processTemperatureK} K</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/50 border border-slate-800">
                <span className="text-slate-400 font-sans block text-[11px]">Spindle Speed</span>
                <span className="text-cyan-400 font-bold">{selectedPrediction.rotationalSpeedRpm} RPM</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/50 border border-slate-800">
                <span className="text-slate-400 font-sans block text-[11px]">Torque / Tool Wear</span>
                <span className="text-amber-400 font-bold">{selectedPrediction.torqueNm} Nm • {selectedPrediction.toolWearMin}m</span>
              </div>
            </div>

            {/* Recommendations */}
            <div className="space-y-1.5 text-xs">
              <span className="font-bold text-slate-300">Prescribed Maintenance:</span>
              <ul className="space-y-1 text-slate-300">
                {selectedPrediction.recommendations.map((rec, i) => (
                  <li key={i} className="p-2 rounded-lg bg-blue-950/20 border border-blue-500/20 flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setSelectedPrediction(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
