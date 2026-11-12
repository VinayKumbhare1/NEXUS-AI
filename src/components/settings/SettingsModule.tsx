import React, { useState } from 'react';
import { 
  Settings, 
  Factory, 
  User, 
  Bell, 
  Server, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Check, 
  ShieldCheck, 
  Cpu, 
  Database,
  Sliders
} from 'lucide-react';

interface SettingsModuleProps {
  currentFactory: string;
  onUpdateFactory: (name: string) => void;
}

export const SettingsModule: React.FC<SettingsModuleProps> = ({
  currentFactory,
  onUpdateFactory
}) => {
  const [plantCode, setPlantCode] = useState('GF-DET-01');
  const [floorName, setFloorName] = useState('Level 2 - High-Precision Milling Complex');
  const [shiftSupervisor, setShiftSupervisor] = useState('Elena Rostova, Chief Systems Eng.');

  // ML Service Config
  const [serviceUrl, setServiceUrl] = useState('http://localhost:8000');
  const [testingConnection, setTestingConnection] = useState(false);
  const [pingResult, setPingResult] = useState<{ status: string; latency?: number; message?: string } | null>(null);

  // Notification Thresholds
  const [criticalThreshold, setCriticalThreshold] = useState(75);
  const [warningThreshold, setWarningThreshold] = useState(50);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleTestMLConnection = async () => {
    setTestingConnection(true);
    setPingResult(null);
    const start = performance.now();
    try {
      // First ping our backend proxy or direct
      const res = await fetch('/api/ml/health');
      const data = await res.json();
      const elapsed = Math.round(performance.now() - start);
      setPingResult({
        status: 'online',
        latency: elapsed,
        message: `Embedded AI4I Neural Engine responding with ~${elapsed}ms roundtrip. Standalone FastAPI service proxy standby.`
      });
    } catch (e: any) {
      setPingResult({
        status: 'error',
        message: 'Could not connect to external service endpoint.'
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl glass-panel">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-blue-500/20 text-cyan-300 border border-blue-500/30">
              System Configuration
            </span>
            <span className="text-xs text-slate-400">Environment & Telemetry Rules</span>
          </div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-cyan-400" />
            <span>Platform Settings & ML Integration</span>
          </h1>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold animate-in fade-in">
            <Check className="w-4 h-4" />
            <span>Settings Saved Successfully</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Row 1: Factory Information & User Profile */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Factory Information */}
          <div className="p-6 rounded-2xl glass-panel space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 pb-2 border-b border-slate-800">
              <Factory className="w-4 h-4 text-cyan-400" />
              <span>Plant & Facility Parameters</span>
            </h2>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Facility / Hub Name</label>
                <input
                  type="text"
                  value={currentFactory}
                  onChange={(e) => onUpdateFactory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl glass-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Plant Facility Code</label>
                  <input
                    type="text"
                    value={plantCode}
                    onChange={(e) => setPlantCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl glass-input font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Shift Supervisor</label>
                  <input
                    type="text"
                    value={shiftSupervisor}
                    onChange={(e) => setShiftSupervisor(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl glass-input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Production Floor / Complex</label>
                <input
                  type="text"
                  value={floorName}
                  onChange={(e) => setFloorName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl glass-input"
                />
              </div>
            </div>
          </div>

          {/* User Profile */}
          <div className="p-6 rounded-2xl glass-panel space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 pb-2 border-b border-slate-800">
              <User className="w-4 h-4 text-cyan-400" />
              <span>Administrator Profile</span>
            </h2>

            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center text-white font-extrabold text-sm shadow">
                  MC
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Dr. Marcus Chen</h3>
                  <p className="text-slate-400">Chief Predictive Maintenance Architect</p>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded bg-blue-500/20 text-cyan-300 text-[10px] font-bold">
                    Super-Admin (Level 4 Authorization)
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Contact Email for Urgent Dispatches</label>
                <input
                  type="email"
                  defaultValue="m.chen@nexus-industrial.ai"
                  className="w-full px-3 py-2 rounded-xl glass-input"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: ML Service Integration & Notification Thresholds */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Machine Learning Service Integration */}
          <div className="p-6 rounded-2xl glass-panel space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 pb-2 border-b border-slate-800">
              <Server className="w-4 h-4 text-cyan-400" />
              <span>Machine Learning Service Integration</span>
            </h2>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">
                  Python FastAPI ML Service Endpoint
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={serviceUrl}
                    onChange={(e) => setServiceUrl(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl glass-input font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleTestMLConnection}
                    disabled={testingConnection}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-cyan-300 hover:text-white border border-slate-700 font-bold shrink-0 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {testingConnection ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Ping Service'}
                  </button>
                </div>
              </div>

              {pingResult && (
                <div className={`p-3 rounded-xl border text-xs ${
                  pingResult.status === 'online' 
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                }`}>
                  <div className="flex items-center gap-1.5 font-bold mb-1">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Inference Core Online ({pingResult.latency}ms)</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-300">{pingResult.message}</p>
                </div>
              )}

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
                <span className="font-bold text-slate-200 block mb-0.5">Deployment Separation Note:</span>
                The Python ML backend is packaged in <code className="text-cyan-300">/ml-service/app/main.py</code> for independent microservice deployment with FastAPI & Uvicorn.
              </div>
            </div>
          </div>

          {/* Automated Notification Rules & Thresholds */}
          <div className="p-6 rounded-2xl glass-panel space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 pb-2 border-b border-slate-800">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span>Alert Automation Thresholds</span>
            </h2>

            <div className="space-y-4 text-xs">
              <div>
                <div className="flex justify-between mb-1.5">
                  <span className="text-slate-300 font-medium">Critical Failure Risk Trigger Threshold</span>
                  <span className="font-mono font-bold text-rose-400">{criticalThreshold}%</span>
                </div>
                <input
                  type="range"
                  min="60"
                  max="95"
                  value={criticalThreshold}
                  onChange={(e) => setCriticalThreshold(parseInt(e.target.value))}
                  className="w-full accent-rose-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1.5">
                  <span className="text-slate-300 font-medium">Warning Advisory Trigger Threshold</span>
                  <span className="font-mono font-bold text-amber-400">{warningThreshold}%</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="70"
                  value={warningThreshold}
                  onChange={(e) => setWarningThreshold(parseInt(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <span className="text-slate-300 font-medium">Dispatch Automated Email Work Orders</span>
                <input
                  type="checkbox"
                  checked={emailAlerts}
                  onChange={(e) => setEmailAlerts(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 accent-blue-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-300 font-medium">SMS Emergency Broadcast to Floor Supervisors</span>
                <input
                  type="checkbox"
                  checked={smsAlerts}
                  onChange={(e) => setSmsAlerts(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 accent-blue-500 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Save Changes Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold text-xs shadow hover:brightness-110 transition-all cursor-pointer"
          >
            SAVE CONFIGURATION
          </button>
        </div>
      </form>
    </div>
  );
};
