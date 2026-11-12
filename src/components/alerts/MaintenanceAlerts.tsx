import React, { useState } from 'react';
import { 
  AlertTriangle, 
  AlertOctagon, 
  CheckCircle2, 
  Clock, 
  Filter, 
  Plus, 
  Download, 
  Search, 
  ShieldAlert, 
  Wrench, 
  RotateCcw, 
  X,
  Radio
} from 'lucide-react';
import { Alert, AlertCategory, AlertSeverity } from '../../types';

interface MaintenanceAlertsProps {
  alerts: Alert[];
  onResolveAlert: (id: string) => Promise<void>;
  onReopenAlert: (id: string) => Promise<void>;
  onCreateAlert: (alert: Partial<Alert>) => Promise<void>;
}

export const MaintenanceAlerts: React.FC<MaintenanceAlertsProps> = ({
  alerts,
  onResolveAlert,
  onReopenAlert,
  onCreateAlert
}) => {
  const [severityFilter, setSeverityFilter] = useState<'all' | AlertSeverity>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'resolved'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // New alert form state
  const [newAlertData, setNewAlertData] = useState({
    machineId: 'M-101',
    machineName: 'High-Precision 5-Axis Milling Machine',
    category: 'Sensor Anomaly' as AlertCategory,
    severity: 'medium' as AlertSeverity,
    description: '',
    recommendedAction: ''
  });

  const filteredAlerts = alerts.filter(a => {
    const matchesSeverity = severityFilter === 'all' || a.severity === severityFilter;
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    const matchesSearch = 
      a.machineId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.machineName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSeverity && matchesStatus && matchesSearch;
  });

  const activeCount = alerts.filter(a => a.status === 'active').length;
  const criticalCount = alerts.filter(a => a.status === 'active' && a.severity === 'critical').length;

  const handleExportCSV = () => {
    const headers = ['Alert ID', 'Machine ID', 'Machine Name', 'Category', 'Severity', 'Status', 'Timestamp', 'Description', 'Action'];
    const rows = filteredAlerts.map(a => [
      a.id, a.machineId, `"${a.machineName}"`, `"${a.category}"`, a.severity, a.status, a.timestamp, `"${a.description}"`, `"${a.recommendedAction}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encoded = encodeURI(csvContent);
    const link = document.createElement('a');
    link.href = encoded;
    link.download = `nexus_maintenance_alerts_${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onCreateAlert(newAlertData);
    setIsCreateModalOpen(false);
    setNewAlertData({
      machineId: 'M-101',
      machineName: 'High-Precision 5-Axis Milling Machine',
      category: 'Sensor Anomaly',
      severity: 'medium',
      description: '',
      recommendedAction: ''
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl glass-panel">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30">
              Operations Center
            </span>
            <span className="text-xs text-slate-400">
              {activeCount} Active Issues • {criticalCount} Critical Action Required
            </span>
          </div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-400" />
            <span>Industrial Maintenance Alert Center</span>
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-xs font-bold shadow hover:brightness-110 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>CREATE MANUAL ALERT</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl glass-panel text-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Status Segment */}
          <div className="flex items-center p-1 rounded-xl bg-slate-900/80 border border-slate-800">
            {(['all', 'active', 'resolved'] as const).map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-lg capitalize font-semibold transition-all cursor-pointer ${
                  statusFilter === st ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Severity Segment */}
          <div className="flex items-center p-1 rounded-xl bg-slate-900/80 border border-slate-800">
            {(['all', 'critical', 'high', 'medium', 'low'] as const).map(sev => (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                className={`px-2.5 py-1 rounded-lg capitalize font-semibold transition-all cursor-pointer ${
                  severityFilter === sev ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search alerts, machines, root causes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-3 py-1.5 rounded-xl glass-input w-52 sm:w-64"
          />
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="p-12 rounded-2xl glass-panel text-center text-slate-400">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-2 opacity-70" />
            <p className="text-sm font-semibold text-white">No maintenance alerts match the selected criteria.</p>
            <p className="text-xs text-slate-500 mt-1">Adjust filters or search parameters to inspect past incident history.</p>
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const isResolved = alert.status === 'resolved';
            const isCritical = alert.severity === 'critical';
            const isHigh = alert.severity === 'high';

            return (
              <div
                key={alert.id}
                className={`p-4 rounded-2xl glass-panel flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                  isResolved ? 'opacity-60 bg-slate-950/40' :
                  isCritical ? 'border-rose-500/40 bg-rose-950/15' :
                  isHigh ? 'border-amber-500/30' : ''
                }`}
              >
                {/* Left: Icon & Details */}
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                    isResolved ? 'bg-slate-800 text-slate-400' :
                    isCritical ? 'bg-rose-500/20 text-rose-400' :
                    isHigh ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'
                  }`}>
                    {isResolved ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> :
                     isCritical ? <AlertOctagon className="w-5 h-5 animate-pulse" /> :
                     <AlertTriangle className="w-5 h-5" />}
                  </div>

                  <div className="space-y-1 flex-1 min-w-0 text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-bold text-white bg-slate-800 px-2 py-0.5 rounded text-[11px]">
                        {alert.machineId}
                      </span>
                      <span className="font-semibold text-slate-300 truncate">{alert.machineName}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase bg-blue-500/20 text-cyan-300 border border-blue-500/30">
                        {alert.category}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                        isCritical ? 'bg-rose-500/20 text-rose-400' :
                        isHigh ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-300'
                      }`}>
                        {alert.severity}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono ml-auto">
                        {new Date(alert.timestamp).toLocaleString()}
                      </span>
                    </div>

                    <p className="text-slate-200 text-xs leading-relaxed font-medium">
                      {alert.description}
                    </p>

                    <div className="flex items-center gap-2 pt-1 text-[11px] text-cyan-400">
                      <Wrench className="w-3.5 h-3.5 shrink-0" />
                      <span className="font-semibold text-slate-400">Action:</span>
                      <span className="text-slate-200">{alert.recommendedAction}</span>
                    </div>

                    {isResolved && alert.resolvedBy && (
                      <div className="text-[10px] text-emerald-400 pt-0.5">
                        ✓ Resolved by {alert.resolvedBy} on {new Date(alert.resolvedAt || '').toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Action Button */}
                <div className="flex items-center justify-end shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800">
                  {alert.status === 'active' ? (
                    <button
                      onClick={() => onResolveAlert(alert.id)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40 text-xs font-bold transition-all cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>MARK AS RESOLVED</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => onReopenAlert(alert.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white text-xs font-semibold transition-all cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>REOPEN ALERT</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create Alert Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl glass-panel border border-slate-700 p-6 shadow-2xl relative space-y-4">
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-cyan-400" />
              <span>Issue Manual Maintenance Work Order</span>
            </h2>

            <form onSubmit={handleCreateSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Target Machine ID</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. M-101"
                  value={newAlertData.machineId}
                  onChange={(e) => setNewAlertData({ ...newAlertData, machineId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl glass-input font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Machine Model Name</label>
                <input
                  type="text"
                  required
                  value={newAlertData.machineName}
                  onChange={(e) => setNewAlertData({ ...newAlertData, machineName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl glass-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Category</label>
                  <select
                    value={newAlertData.category}
                    onChange={(e) => setNewAlertData({ ...newAlertData, category: e.target.value as AlertCategory })}
                    className="w-full px-3 py-2 rounded-xl glass-input"
                  >
                    <option value="Critical Failure Risk">Critical Failure Risk</option>
                    <option value="High Failure Risk">High Failure Risk</option>
                    <option value="Scheduled Maintenance">Scheduled Maintenance</option>
                    <option value="Sensor Anomaly">Sensor Anomaly</option>
                    <option value="Maintenance Overdue">Maintenance Overdue</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Severity</label>
                  <select
                    value={newAlertData.severity}
                    onChange={(e) => setNewAlertData({ ...newAlertData, severity: e.target.value as AlertSeverity })}
                    className="w-full px-3 py-2 rounded-xl glass-input"
                  >
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Incident Description</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe abnormal vibration, temperature spike, or tool condition..."
                  value={newAlertData.description}
                  onChange={(e) => setNewAlertData({ ...newAlertData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl glass-input resize-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Recommended Action</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Replace spindle bearings and flush oil reservoir"
                  value={newAlertData.recommendedAction}
                  onChange={(e) => setNewAlertData({ ...newAlertData, recommendedAction: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl glass-input"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold shadow"
                >
                  Publish Alert
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
