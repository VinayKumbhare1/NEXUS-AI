import React, { useState } from 'react';
import { 
  Cpu, 
  Search, 
  Filter, 
  Plus, 
  Edit3, 
  Trash2, 
  Eye, 
  Thermometer, 
  RotateCw, 
  Zap, 
  Wrench, 
  AlertTriangle, 
  CheckCircle2, 
  AlertOctagon, 
  Clock, 
  MapPin, 
  X, 
  Sparkles,
  ArrowRight,
  TrendingDown
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip 
} from 'recharts';
import { Machine, MachineStatus, MachineQualityType } from '../../types';

interface MachineMonitoringProps {
  machines: Machine[];
  onAddMachine: (machine: Partial<Machine>) => Promise<void>;
  onUpdateMachine: (id: string, updates: Partial<Machine>) => Promise<void>;
  onDeleteMachine: (id: string) => Promise<void>;
  onRunDiagnostics: (machine: Machine) => void;
  selectedMachineForDetail: Machine | null;
  onCloseDetailModal: () => void;
  onOpenDetailModal: (machine: Machine) => void;
}

export const MachineMonitoring: React.FC<MachineMonitoringProps> = ({
  machines,
  onAddMachine,
  onUpdateMachine,
  onDeleteMachine,
  onRunDiagnostics,
  selectedMachineForDetail,
  onCloseDetailModal,
  onOpenDetailModal
}) => {
  const [statusFilter, setStatusFilter] = useState<'all' | 'healthy' | 'warning' | 'critical'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'L' | 'M' | 'H'>('all');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingMachine, setEditingMachine] = useState<Machine | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    type: 'M' as MachineQualityType,
    status: 'healthy' as MachineStatus,
    healthScore: 95,
    airTemperatureK: 298.2,
    processTemperatureK: 308.6,
    rotationalSpeedRpm: 1520,
    torqueNm: 40.0,
    toolWearMin: 50,
    location: 'Bay A - Machining Center',
    lastMaintenance: new Date().toISOString().split('T')[0]
  });

  const filteredMachines = machines.filter(m => {
    const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
    const matchesType = typeFilter === 'all' || m.type === typeFilter;
    const matchesSearch = 
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      m.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.location.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesType && matchesSearch;
  });

  const handleOpenAdd = () => {
    const nextId = `M-${100 + machines.length + 1}`;
    setFormData({
      id: nextId,
      name: '',
      type: 'M',
      status: 'healthy',
      healthScore: 95,
      airTemperatureK: 298.5,
      processTemperatureK: 308.8,
      rotationalSpeedRpm: 1530,
      torqueNm: 41.0,
      toolWearMin: 40,
      location: 'Bay B - Precision Cell',
      lastMaintenance: new Date().toISOString().split('T')[0]
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (machine: Machine) => {
    setEditingMachine(machine);
    setFormData({
      id: machine.id,
      name: machine.name,
      type: machine.type,
      status: machine.status,
      healthScore: machine.healthScore,
      airTemperatureK: machine.airTemperatureK,
      processTemperatureK: machine.processTemperatureK,
      rotationalSpeedRpm: machine.rotationalSpeedRpm,
      torqueNm: machine.torqueNm,
      toolWearMin: machine.toolWearMin,
      location: machine.location,
      lastMaintenance: machine.lastMaintenance
    });
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingMachine) {
      await onUpdateMachine(editingMachine.id, formData);
      setEditingMachine(null);
    } else {
      await onAddMachine(formData);
      setIsAddModalOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action & Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl glass-panel">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Cpu className="w-5 h-5 text-cyan-400" />
            <span>Industrial Machine Surveillance</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time telemetry and physical machine profiles configured for AI4I 2020 feature parameters.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Status Filter Buttons */}
          <div className="flex items-center p-1 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
            {(['all', 'healthy', 'warning', 'critical'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg capitalize font-medium transition-all cursor-pointer ${
                  statusFilter === s
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search ID, name, bay..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-1.5 rounded-xl text-xs glass-input w-44 sm:w-56"
            />
          </div>

          {/* Add Machine Button */}
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-xs font-bold shadow hover:brightness-110 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>ADD MACHINE</span>
          </button>
        </div>
      </div>

      {/* Machine Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {filteredMachines.map((machine) => {
          const isCritical = machine.status === 'critical';
          const isWarning = machine.status === 'warning';
          const isHealthy = machine.status === 'healthy';

          return (
            <div
              key={machine.id}
              className={`p-5 rounded-2xl glass-panel glass-panel-hover flex flex-col justify-between relative overflow-hidden group ${
                isCritical ? 'border-rose-500/40 bg-rose-950/10' : isWarning ? 'border-amber-500/30' : ''
              }`}
            >
              {/* Header */}
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black text-white bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
                        {machine.id}
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-cyan-300 border border-blue-500/30">
                        Variant {machine.type}
                      </span>
                    </div>
                    <h3 className="font-bold text-sm text-slate-100 mt-2 line-clamp-1 group-hover:text-cyan-300 transition-colors">
                      {machine.name}
                    </h3>
                  </div>

                  {/* Status Indicator */}
                  <div className={`p-1.5 rounded-xl shrink-0 ${
                    isCritical ? 'bg-rose-500/20 text-rose-400' : isWarning ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {isCritical ? <AlertOctagon className="w-4 h-4" /> : isWarning ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-4">
                  <MapPin className="w-3 h-3 text-slate-500" />
                  <span className="truncate">{machine.location}</span>
                </div>

                {/* Health Score Gauge Bar */}
                <div className="mb-4 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-slate-400 font-medium">Health Index</span>
                    <span className={`font-mono font-bold ${
                      machine.healthScore < 50 ? 'text-rose-400' : machine.healthScore < 80 ? 'text-amber-400' : 'text-emerald-400'
                    }`}>
                      {machine.healthScore}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        machine.healthScore < 50 
                          ? 'bg-rose-500' 
                          : machine.healthScore < 80 
                          ? 'bg-amber-500' 
                          : 'bg-emerald-400'
                      }`}
                      style={{ width: `${machine.healthScore}%` }}
                    />
                  </div>
                </div>

                {/* 4 Sensor Telemetry Tiles */}
                <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                  {/* Temperatures */}
                  <div className="p-2 rounded-xl bg-slate-900/50 border border-slate-800">
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 mb-0.5">
                      <Thermometer className="w-3 h-3 text-cyan-400" />
                      <span>Temp [K]</span>
                    </div>
                    <div className="font-mono font-semibold text-slate-200 text-xs">
                      {machine.airTemperatureK} / {machine.processTemperatureK}
                    </div>
                  </div>

                  {/* Rotational Speed */}
                  <div className="p-2 rounded-xl bg-slate-900/50 border border-slate-800">
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 mb-0.5">
                      <RotateCw className="w-3 h-3 text-blue-400" />
                      <span>Speed</span>
                    </div>
                    <div className="font-mono font-semibold text-slate-200 text-xs">
                      {machine.rotationalSpeedRpm} <span className="text-[10px] text-slate-400 font-normal">RPM</span>
                    </div>
                  </div>

                  {/* Torque */}
                  <div className="p-2 rounded-xl bg-slate-900/50 border border-slate-800">
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 mb-0.5">
                      <Zap className="w-3 h-3 text-violet-400" />
                      <span>Torque</span>
                    </div>
                    <div className="font-mono font-semibold text-slate-200 text-xs">
                      {machine.torqueNm} <span className="text-[10px] text-slate-400 font-normal">Nm</span>
                    </div>
                  </div>

                  {/* Tool Wear */}
                  <div className="p-2 rounded-xl bg-slate-900/50 border border-slate-800">
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 mb-0.5">
                      <Wrench className="w-3 h-3 text-amber-400" />
                      <span>Tool Wear</span>
                    </div>
                    <div className={`font-mono font-semibold text-xs ${
                      machine.toolWearMin >= 200 ? 'text-rose-400 font-bold' : 'text-slate-200'
                    }`}>
                      {machine.toolWearMin} <span className="text-[10px] text-slate-400 font-normal">min</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                <button
                  onClick={() => onOpenDetailModal(machine)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Telemetry</span>
                </button>

                <button
                  onClick={() => onRunDiagnostics(machine)}
                  title="Run AI Inference on current sensors"
                  className="p-1.5 rounded-lg bg-blue-600/20 text-cyan-300 hover:bg-blue-600/40 border border-blue-500/30 transition-all cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleOpenEdit(machine)}
                  aria-label={`Edit ${machine.name}`}
                  className="p-1.5 rounded-lg bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-700 transition-all cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => onDeleteMachine(machine.id)}
                  aria-label={`Delete ${machine.name}`}
                  className="p-1.5 rounded-lg bg-slate-800/60 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Machine Detail Modal */}
      {selectedMachineForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl glass-panel border border-slate-700 p-6 shadow-2xl relative space-y-6">
            <button
              onClick={onCloseDetailModal}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-700 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Title */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-sm font-bold text-cyan-400 bg-cyan-950/60 px-2.5 py-0.5 rounded border border-cyan-800">
                  {selectedMachineForDetail.id}
                </span>
                <span className="text-xs px-2 py-0.5 rounded font-bold uppercase bg-blue-500/20 text-blue-300">
                  Variant {selectedMachineForDetail.type} Industrial
                </span>
                <span className={`text-xs px-2 py-0.5 rounded font-bold uppercase ${
                  selectedMachineForDetail.status === 'critical' ? 'bg-rose-500/20 text-rose-400' :
                  selectedMachineForDetail.status === 'warning' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
                }`}>
                  {selectedMachineForDetail.status}
                </span>
              </div>
              <h2 className="text-xl font-bold text-white">{selectedMachineForDetail.name}</h2>
              <p className="text-xs text-slate-400">{selectedMachineForDetail.location} • Operating Hours: {selectedMachineForDetail.operatingHours} hrs</p>
            </div>

            {/* Historical Sensor Telemetry Chart */}
            <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">Historical Telemetry Stream</h3>
                <span className="text-[11px] text-slate-400">Past 24 Hours Data Points</span>
              </div>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={selectedMachineForDetail.sensorHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="timestamp" stroke="#64748B" fontSize={10} tickLine={false} />
                    <YAxis stroke="#64748B" fontSize={10} tickLine={false} />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: '#0F172A',
                        borderColor: 'rgba(255,255,255,0.1)',
                        borderRadius: '10px',
                        fontSize: '11px'
                      }}
                    />
                    <Line type="monotone" dataKey="rpm" name="Speed [RPM]" stroke="#22D3EE" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="torque" name="Torque [Nm]" stroke="#8B5CF6" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="health" name="Health Score" stroke="#10B981" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Sensor Diagnostic Overview */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400 block mb-1">Air Temperature</span>
                <span className="text-base font-black font-mono text-white">{selectedMachineForDetail.airTemperatureK} K</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400 block mb-1">Process Temperature</span>
                <span className="text-base font-black font-mono text-white">{selectedMachineForDetail.processTemperatureK} K</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400 block mb-1">Rotational Speed</span>
                <span className="text-base font-black font-mono text-cyan-400">{selectedMachineForDetail.rotationalSpeedRpm} RPM</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400 block mb-1">Cumulative Tool Wear</span>
                <span className={`text-base font-black font-mono ${
                  selectedMachineForDetail.toolWearMin >= 200 ? 'text-rose-400' : 'text-slate-200'
                }`}>{selectedMachineForDetail.toolWearMin} min</span>
              </div>
            </div>

            {/* Maintenance Schedule Info & AI Action */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-gradient-to-r from-blue-950/40 to-slate-900/80 border border-blue-500/20">
              <div className="space-y-1 text-xs">
                <div className="text-slate-300">
                  <span className="text-slate-400">Last Maintenance:</span> <span className="font-semibold">{selectedMachineForDetail.lastMaintenance}</span>
                </div>
                <div className="text-slate-300">
                  <span className="text-slate-400">Next Scheduled Service:</span> <span className="font-semibold text-cyan-300">{selectedMachineForDetail.nextMaintenance}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  onCloseDetailModal();
                  onRunDiagnostics(selectedMachineForDetail);
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 text-white text-xs font-bold shadow-lg hover:brightness-110 transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>EXECUTE AI PREDICTION FOR THIS UNIT</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Machine Modal */}
      {(isAddModalOpen || editingMachine) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl glass-panel border border-slate-700 p-6 shadow-2xl relative space-y-4">
            <button
              onClick={() => {
                setIsAddModalOpen(false);
                setEditingMachine(null);
              }}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-700 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Cpu className="w-5 h-5 text-cyan-400" />
              <span>{editingMachine ? `Edit Machine (${editingMachine.id})` : 'Add New Industrial Unit'}</span>
            </h2>

            <form onSubmit={handleSaveForm} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Machine ID</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingMachine}
                    value={formData.id}
                    onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl glass-input font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Quality Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as MachineQualityType })}
                    className="w-full px-3 py-2 rounded-xl glass-input"
                  >
                    <option value="L">L (Low Variant - 50%)</option>
                    <option value="M">M (Medium Variant - 30%)</option>
                    <option value="H">H (High Variant - 20%)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Machine Name / Model</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 5-Axis CNC Milling Center"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl glass-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Air Temperature [K]</label>
                  <input
                    type="number"
                    step="0.1"
                    min="250"
                    max="350"
                    required
                    value={formData.airTemperatureK}
                    onChange={(e) => setFormData({ ...formData, airTemperatureK: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl glass-input font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Process Temperature [K]</label>
                  <input
                    type="number"
                    step="0.1"
                    min="250"
                    max="360"
                    required
                    value={formData.processTemperatureK}
                    onChange={(e) => setFormData({ ...formData, processTemperatureK: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl glass-input font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Speed [RPM]</label>
                  <input
                    type="number"
                    min="500"
                    max="4000"
                    required
                    value={formData.rotationalSpeedRpm}
                    onChange={(e) => setFormData({ ...formData, rotationalSpeedRpm: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl glass-input font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Torque [Nm]</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="150"
                    required
                    value={formData.torqueNm}
                    onChange={(e) => setFormData({ ...formData, torqueNm: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl glass-input font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Tool Wear [min]</label>
                  <input
                    type="number"
                    min="0"
                    max="500"
                    required
                    value={formData.toolWearMin}
                    onChange={(e) => setFormData({ ...formData, toolWearMin: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl glass-input font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Location / Bay</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl glass-input"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Operational Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as MachineStatus })}
                    className="w-full px-3 py-2 rounded-xl glass-input"
                  >
                    <option value="healthy">Healthy</option>
                    <option value="warning">Warning</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingMachine(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-xs font-bold shadow hover:brightness-110"
                >
                  {editingMachine ? 'Save Changes' : 'Create Machine'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
