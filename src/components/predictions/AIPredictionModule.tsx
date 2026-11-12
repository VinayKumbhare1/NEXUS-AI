import React, { useState } from 'react';
import { 
  Sparkles, 
  Cpu, 
  Upload, 
  Download, 
  AlertTriangle, 
  AlertOctagon,
  CheckCircle2, 
  RotateCw, 
  Zap, 
  Thermometer, 
  Wrench, 
  ShieldCheck, 
  Clock, 
  Activity, 
  ArrowRight,
  RefreshCw,
  FileSpreadsheet,
  Layers,
  Server
} from 'lucide-react';
import { Machine, PredictionRecord, RiskLevel } from '../../types';
import { api } from '../../services/api';
import { validateSensorFeatures, PredictionResult } from '../../utils/ai4iEngine';

interface AIPredictionModuleProps {
  machines: Machine[];
  onSavePrediction: (prediction: Partial<PredictionRecord>) => Promise<void>;
  preselectedMachine?: Machine | null;
}

export const AIPredictionModule: React.FC<AIPredictionModuleProps> = ({
  machines,
  onSavePrediction,
  preselectedMachine
}) => {
  const [activeTab, setActiveTab] = useState<'single' | 'batch'>('single');
  const [selectedMachineId, setSelectedMachineId] = useState<string>(
    preselectedMachine ? preselectedMachine.id : (machines[0]?.id || 'M-101')
  );

  // Sensor Inputs (default matching normal industrial standard)
  const [airTempK, setAirTempK] = useState<number>(preselectedMachine ? preselectedMachine.airTemperatureK : 298.2);
  const [procTempK, setProcTempK] = useState<number>(preselectedMachine ? preselectedMachine.processTemperatureK : 308.7);
  const [rpm, setRpm] = useState<number>(preselectedMachine ? preselectedMachine.rotationalSpeedRpm : 1512);
  const [torque, setTorque] = useState<number>(preselectedMachine ? preselectedMachine.torqueNm : 41.5);
  const [toolWear, setToolWear] = useState<number>(preselectedMachine ? preselectedMachine.toolWearMin : 68);
  const [machineType, setMachineType] = useState<'L' | 'M' | 'H'>('M');

  // Prediction State
  const [isInferring, setIsInferring] = useState(false);
  const [predictionResult, setPredictionResult] = useState<PredictionResult | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Model Source Mode
  const [modelMode, setModelMode] = useState<'calibrated' | 'external'>('calibrated');
  const [pythonServiceOnline, setPythonServiceOnline] = useState<boolean>(false);

  // Batch Prediction State
  const [batchData, setBatchData] = useState<any[]>([]);
  const [batchResults, setBatchResults] = useState<any | null>(null);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);

  // When a machine is selected from dropdown
  const handleSelectMachine = (id: string) => {
    setSelectedMachineId(id);
    const m = machines.find(x => x.id === id);
    if (m) {
      setAirTempK(m.airTemperatureK);
      setProcTempK(m.processTemperatureK);
      setRpm(m.rotationalSpeedRpm);
      setTorque(m.torqueNm);
      setToolWear(m.toolWearMin);
      setMachineType(m.type);
    }
  };

  // Quick Presets
  const applyPreset = (presetName: string) => {
    switch (presetName) {
      case 'nominal':
        setAirTempK(298.1);
        setProcTempK(308.6);
        setRpm(1550);
        setTorque(42.0);
        setToolWear(45);
        break;
      case 'hdf': // Heat Dissipation Failure (delta < 8.6 K, speed < 1380 RPM)
        setAirTempK(302.5);
        setProcTempK(309.5);
        setRpm(1280);
        setTorque(45.0);
        setToolWear(55);
        break;
      case 'pwf': // Power Failure (Torque * speed > 9000 W)
        setAirTempK(298.0);
        setProcTempK(308.5);
        setRpm(1750);
        setTorque(68.0);
        setToolWear(40);
        break;
      case 'osf': // Overstrain Failure (wear * torque > 12000)
        setAirTempK(299.0);
        setProcTempK(309.2);
        setRpm(1420);
        setTorque(64.0);
        setToolWear(210);
        break;
      case 'twf': // Tool Wear Failure (wear > 220 min)
        setAirTempK(298.4);
        setProcTempK(308.8);
        setRpm(1500);
        setTorque(38.0);
        setToolWear(238);
        break;
    }
    setPredictionResult(null);
  };

  // Run Inference
  const handleRunInference = async () => {
    const sensorFeatures = {
      airTemperatureK: airTempK,
      processTemperatureK: procTempK,
      rotationalSpeedRpm: rpm,
      torqueNm: torque,
      toolWearMin: toolWear
    };

    const validation = validateSensorFeatures(sensorFeatures);
    if (!validation.valid) {
      setValidationErrors(validation.errors);
      return;
    }
    setValidationErrors([]);
    setIsInferring(true);
    setSaveSuccess(false);

    try {
      const result = await api.runInference(sensorFeatures, machineType);
      setPredictionResult(result);

      // Auto save record
      const selectedMachine = machines.find(m => m.id === selectedMachineId);
      await onSavePrediction({
        machineId: selectedMachineId,
        machineName: selectedMachine?.name || `Machine ${selectedMachineId}`,
        ...sensorFeatures,
        prediction: result.prediction,
        failureProbability: result.failureProbability,
        riskLevel: result.riskLevel,
        primaryFailureMode: result.primaryFailureMode,
        modelSource: modelMode === 'external' ? 'FastAPI Python Service' : 'AI4I 2020 Calibrated Neural Engine',
        recommendations: result.recommendations
      });
      setSaveSuccess(true);
    } catch (e) {
      console.error('Inference error:', e);
    } finally {
      setIsInferring(false);
    }
  };

  // Parse Uploaded CSV for Batch Predictions
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter(l => l.trim().length > 0);
      if (lines.length < 2) return;

      const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
      const parsedRows = lines.slice(1, 101).map((line, idx) => {
        const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        const rowObj: any = { index: idx + 1 };
        headers.forEach((h, i) => {
          rowObj[h] = values[i];
        });
        return rowObj;
      });

      setBatchData(parsedRows);
    };
    reader.readAsText(file);
  };

  // Run Batch Inference
  const handleRunBatchInference = async () => {
    if (batchData.length === 0) return;
    setIsBatchProcessing(true);
    try {
      const res = await api.runBatchInference(batchData);
      setBatchResults(res);
    } catch (e) {
      console.error('Batch inference error:', e);
    } finally {
      setIsBatchProcessing(false);
    }
  };

  // Export Batch Results to CSV
  const handleDownloadBatchCSV = () => {
    if (!batchResults?.results) return;
    const headers = [
      'Machine ID', 'Air Temp [K]', 'Process Temp [K]', 'Speed [RPM]', 'Torque [Nm]', 'Tool Wear [min]', 
      'Predicted Failure', 'Failure Probability', 'Risk Level', 'Primary Failure Mode'
    ];
    const rows = batchResults.results.map((r: any) => [
      r.machineId, r.airTemperatureK, r.processTemperatureK, r.rotationalSpeedRpm, r.torqueNm, r.toolWearMin,
      r.prediction, r.failureProbability, r.riskLevel, `"${r.primaryFailureMode}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e: any[]) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `nexus_ai_batch_predictions_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download Sample AI4I CSV Template
  const handleDownloadSampleTemplate = () => {
    const csv = `UDI,Product ID,Type,Air temperature [K],Process temperature [K],Rotational speed [rpm],Torque [Nm],Tool wear [min]
1,M14860,M,298.1,308.6,1551,42.8,0
2,L47181,L,298.2,308.7,1408,46.3,3
3,L47182,L,298.1,308.5,1498,49.4,5
4,M14863,M,302.5,309.5,1250,40.0,20
5,H29424,H,298.0,308.0,1600,70.0,15
6,M14865,M,298.0,308.0,1500,35.0,235`;
    const encodedUri = encodeURI('data:text/csv;charset=utf-8,' + csv);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'ai4i_sample_sensor_readings.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Module Title Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-2xl glass-panel relative overflow-hidden">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-blue-500/20 text-cyan-300 border border-blue-500/30">
              AI Core
            </span>
            <span className="text-xs text-slate-400 font-medium">
              TensorFlow & Calibrated Neural Network Inference
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-white">AI Failure Risk Prediction Engine</h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Input industrial parameters to predict impending failures, isolate failure mechanics (HDF, PWF, OSF, TWF), and generate prescriptive maintenance instructions.
          </p>
        </div>

        {/* Tab Switcher & Engine Indicator */}
        <div className="flex items-center gap-3">
          <div className="flex items-center p-1 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab('single')}
              className={`px-3.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                activeTab === 'single' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Manual / Unit Inference
            </button>
            <button
              onClick={() => setActiveTab('batch')}
              className={`px-3.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                activeTab === 'batch' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Batch CSV Processing
            </button>
          </div>
        </div>
      </div>

      {/* SINGLE INFERENCE VIEW */}
      {activeTab === 'single' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Machine Selector & Sensor Inputs (7 Cols) */}
          <div className="lg:col-span-7 p-6 rounded-2xl glass-panel space-y-5">
            {/* Machine Selection & Quick Presets */}
            <div className="space-y-3 pb-4 border-b border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-cyan-400" />
                  <span>Target Machine Profile</span>
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400">Variant:</span>
                  {(['L', 'M', 'H'] as const).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setMachineType(t)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                        machineType === t ? 'bg-cyan-500 text-slate-950 font-black' : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      Type {t}
                    </button>
                  ))}
                </div>
              </div>

              <select
                value={selectedMachineId}
                onChange={(e) => handleSelectMachine(e.target.value)}
                aria-label="Select Machine to Test"
                className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs font-semibold cursor-pointer"
              >
                {machines.map(m => (
                  <option key={m.id} value={m.id} className="bg-slate-900 text-slate-200">
                    {m.id} - {m.name} (Type {m.type} • Current Health: {m.healthScore}%)
                  </option>
                ))}
              </select>

              {/* Failure Scenario Presets */}
              <div>
                <span className="text-[11px] text-slate-400 font-semibold block mb-1.5">
                  Quick Benchmark Simulation Presets:
                </span>
                <div className="flex flex-wrap gap-2 text-xs">
                  <button
                    onClick={() => applyPreset('nominal')}
                    className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 text-[11px] font-medium transition-all cursor-pointer"
                  >
                    Nominal Operating
                  </button>
                  <button
                    onClick={() => applyPreset('hdf')}
                    className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/30 text-[11px] font-medium transition-all cursor-pointer"
                  >
                    Heat Dissipation (HDF)
                  </button>
                  <button
                    onClick={() => applyPreset('pwf')}
                    className="px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 border border-purple-500/30 text-[11px] font-medium transition-all cursor-pointer"
                  >
                    Power Overload (PWF)
                  </button>
                  <button
                    onClick={() => applyPreset('osf')}
                    className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30 text-[11px] font-medium transition-all cursor-pointer"
                  >
                    Overstrain Risk (OSF)
                  </button>
                  <button
                    onClick={() => applyPreset('twf')}
                    className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30 text-[11px] font-medium transition-all cursor-pointer"
                  >
                    Tool Wear Critical (TWF)
                  </button>
                </div>
              </div>
            </div>

            {/* 5 Sensor Inputs Form */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Telemetry Inputs (AI4I Feature Vector)
              </h3>

              {/* Temperatures */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                      <Thermometer className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Air Temperature [K]</span>
                    </span>
                    <span className="font-mono font-bold text-white text-xs">{airTempK} K</span>
                  </div>
                  <input
                    type="range"
                    min="290"
                    max="310"
                    step="0.1"
                    value={airTempK}
                    onChange={(e) => setAirTempK(parseFloat(e.target.value))}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>290 K (16.8°C)</span>
                    <span>310 K (36.8°C)</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                      <Thermometer className="w-3.5 h-3.5 text-blue-400" />
                      <span>Process Temperature [K]</span>
                    </span>
                    <span className="font-mono font-bold text-white text-xs">{procTempK} K</span>
                  </div>
                  <input
                    type="range"
                    min="300"
                    max="320"
                    step="0.1"
                    value={procTempK}
                    onChange={(e) => setProcTempK(parseFloat(e.target.value))}
                    className="w-full accent-blue-400 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>300 K</span>
                    <span>Delta: {(procTempK - airTempK).toFixed(1)} K</span>
                    <span>320 K</span>
                  </div>
                </div>
              </div>

              {/* Speed & Torque */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                      <RotateCw className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Rotational Speed [RPM]</span>
                    </span>
                    <span className="font-mono font-bold text-white text-xs">{rpm} RPM</span>
                  </div>
                  <input
                    type="range"
                    min="1000"
                    max="3000"
                    step="10"
                    value={rpm}
                    onChange={(e) => setRpm(parseInt(e.target.value))}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>1000 RPM</span>
                    <span>Spindle Velocity</span>
                    <span>3000 RPM</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                      <Zap className="w-3.5 h-3.5 text-violet-400" />
                      <span>Torque [Nm]</span>
                    </span>
                    <span className="font-mono font-bold text-white text-xs">{torque} Nm</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="90"
                    step="0.5"
                    value={torque}
                    onChange={(e) => setTorque(parseFloat(e.target.value))}
                    className="w-full accent-violet-400 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>5 Nm</span>
                    <span>Motor Load</span>
                    <span>90 Nm</span>
                  </div>
                </div>
              </div>

              {/* Tool Wear Slider */}
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                    <Wrench className="w-3.5 h-3.5 text-amber-400" />
                    <span>Cumulative Tool Wear [min]</span>
                  </span>
                  <span className={`font-mono font-bold text-xs ${
                    toolWear >= 200 ? 'text-rose-400' : 'text-white'
                  }`}>
                    {toolWear} min / 250 min max
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="260"
                  step="1"
                  value={toolWear}
                  onChange={(e) => setToolWear(parseInt(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>0 min (Fresh Insert)</span>
                  <span className="text-amber-500/80">Threshold ~200 min</span>
                  <span>260 min (Exhausted)</span>
                </div>
              </div>
            </div>

            {/* Validation Errors */}
            {validationErrors.length > 0 && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs space-y-1">
                {validationErrors.map((err, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>{err}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Execute Button */}
            <button
              onClick={handleRunInference}
              disabled={isInferring}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:brightness-110 text-white font-extrabold text-xs tracking-wider shadow-[0_0_25px_rgba(59,130,246,0.5)] transition-all cursor-pointer disabled:opacity-50"
            >
              {isInferring ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-cyan-200" />
                  <span>COMPUTING NEURAL TENSOR INFERENCE...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-cyan-200" />
                  <span>RUN MODEL INFERENCE</span>
                </>
              )}
            </button>
          </div>

          {/* Right Column: Animated Risk Gauge & Diagnostic Report (5 Cols) */}
          <div className="lg:col-span-5 p-6 rounded-2xl glass-panel flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  <span>Diagnostic Inference Assessment</span>
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-cyan-300 border border-blue-500/30">
                  AI4I Calibrated
                </span>
              </div>

              {!predictionResult ? (
                <div className="py-16 text-center text-slate-400 space-y-3">
                  <div className="w-16 h-16 rounded-full bg-slate-900/80 border border-slate-800 flex items-center justify-center mx-auto text-slate-600">
                    <Sparkles className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-200">Awaiting Sensor Telemetry</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                      Adjust the input sliders or choose a benchmark preset, then click &apos;Run Model Inference&apos;.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-5 pt-3 animate-in fade-in zoom-in-95 duration-200">
                  {/* Gauge Display */}
                  <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 text-center relative overflow-hidden">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Machine Failure Risk Probability
                    </span>

                    <div className="mt-2 mb-1">
                      <span className={`text-4xl font-black font-mono tracking-tight ${
                        predictionResult.riskLevel === 'Critical Risk' ? 'text-rose-400' :
                        predictionResult.riskLevel === 'High Risk' ? 'text-amber-400' :
                        predictionResult.riskLevel === 'Medium Risk' ? 'text-cyan-400' : 'text-emerald-400'
                      }`}>
                        {Math.round(predictionResult.failureProbability * 100)}%
                      </span>
                    </div>

                    {/* Risk Badge */}
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase border mt-1 mb-3" style={{
                      backgroundColor: predictionResult.riskLevel === 'Critical Risk' ? 'rgba(239,68,68,0.15)' :
                                       predictionResult.riskLevel === 'High Risk' ? 'rgba(245,158,11,0.15)' :
                                       predictionResult.riskLevel === 'Medium Risk' ? 'rgba(56,189,248,0.15)' : 'rgba(16,185,129,0.15)',
                      color: predictionResult.riskLevel === 'Critical Risk' ? '#F87171' :
                             predictionResult.riskLevel === 'High Risk' ? '#FBBF24' :
                             predictionResult.riskLevel === 'Medium Risk' ? '#38BDF8' : '#34D399',
                      borderColor: predictionResult.riskLevel === 'Critical Risk' ? 'rgba(239,68,68,0.3)' :
                                   predictionResult.riskLevel === 'High Risk' ? 'rgba(245,158,11,0.3)' :
                                   predictionResult.riskLevel === 'Medium Risk' ? 'rgba(56,189,248,0.3)' : 'rgba(16,185,129,0.3)'
                    }}>
                      {predictionResult.riskLevel === 'Critical Risk' ? <AlertOctagon className="w-3.5 h-3.5" /> :
                       predictionResult.riskLevel === 'High Risk' ? <AlertTriangle className="w-3.5 h-3.5" /> :
                       <CheckCircle2 className="w-3.5 h-3.5" />}
                      <span>{predictionResult.riskLevel}</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.round(predictionResult.failureProbability * 100)}%`,
                          backgroundColor: predictionResult.riskLevel === 'Critical Risk' ? '#EF4444' :
                                           predictionResult.riskLevel === 'High Risk' ? '#F59E0B' :
                                           predictionResult.riskLevel === 'Medium Risk' ? '#38BDF8' : '#10B981'
                        }}
                      />
                    </div>

                    <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-2">
                      <span>Predicted State:</span>
                      <span className="font-mono font-bold text-white">
                        {predictionResult.prediction === 1 ? 'FAILURE DETECTED (Class 1)' : 'NOMINAL (Class 0)'}
                      </span>
                    </div>
                  </div>

                  {/* Primary Failure Mode & Sub-risks */}
                  <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Primary Failure Mechanics:</span>
                      <span className="font-bold text-slate-200">{predictionResult.primaryFailureMode}</span>
                    </div>

                    <div className="grid grid-cols-4 gap-1.5 pt-2 border-t border-slate-800/60 text-[10px] text-center font-mono">
                      <div className="p-1 rounded bg-slate-800/50">
                        <span className="text-slate-400 block">HDF</span>
                        <span className="font-bold text-cyan-300">{Math.round(predictionResult.failureModeBreakdown.hdf * 100)}%</span>
                      </div>
                      <div className="p-1 rounded bg-slate-800/50">
                        <span className="text-slate-400 block">PWF</span>
                        <span className="font-bold text-violet-300">{Math.round(predictionResult.failureModeBreakdown.pwf * 100)}%</span>
                      </div>
                      <div className="p-1 rounded bg-slate-800/50">
                        <span className="text-slate-400 block">OSF</span>
                        <span className="font-bold text-amber-300">{Math.round(predictionResult.failureModeBreakdown.osf * 100)}%</span>
                      </div>
                      <div className="p-1 rounded bg-slate-800/50">
                        <span className="text-slate-400 block">TWF</span>
                        <span className="font-bold text-rose-300">{Math.round(predictionResult.failureModeBreakdown.twf * 100)}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div className="space-y-1.5">
                    <span className="text-xs font-bold text-slate-300 block">
                      Prescriptive Recommendations:
                    </span>
                    <ul className="space-y-1.5 text-xs text-slate-300">
                      {predictionResult.recommendations.map((rec, i) => (
                        <li key={i} className="flex items-start gap-2 p-2 rounded-xl bg-blue-950/20 border border-blue-500/20">
                          <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                          <span className="leading-relaxed">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Estimated RUL (Remaining Useful Life) */}
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Estimated Remaining Useful Life (RUL)</span>
                    </span>
                    <span className="font-mono font-bold text-cyan-300">
                      ~{predictionResult.estimatedRulHours} operational hrs
                    </span>
                  </div>
                </div>
              )}
            </div>

            {saveSuccess && (
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Diagnostic snapshot recorded to system prediction database.</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* BATCH PREDICTION VIEW */}
      {activeTab === 'batch' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl glass-panel space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-cyan-400" />
                  <span>Batch CSV Sensor Ingestion</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Upload multi-row operational records for high-throughput batch failure classification.
                </p>
              </div>

              <button
                onClick={handleDownloadSampleTemplate}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download AI4I CSV Template</span>
              </button>
            </div>

            {/* Drag and Drop Box */}
            <div className="p-8 border-2 border-dashed border-slate-700 hover:border-cyan-500/60 rounded-2xl text-center bg-slate-900/40 transition-colors">
              <Upload className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
              <p className="text-xs font-bold text-white">Click or drag CSV sensor telemetry file here</p>
              <p className="text-[11px] text-slate-400 mt-1">Supports up to 1,000 rows. Required columns: Speed, Torque, Tool wear, Air & Process temp.</p>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="mt-3 text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer"
              />
            </div>

            {batchData.length > 0 && (
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-slate-300 font-semibold">
                  Parsed {batchData.length} records ready for neural inference.
                </span>
                <button
                  onClick={handleRunBatchInference}
                  disabled={isBatchProcessing}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-xs font-bold shadow hover:brightness-110 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isBatchProcessing ? 'PROCESSING BATCH...' : 'EXECUTE BATCH INFERENCE'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Batch Results Table */}
          {batchResults && (
            <div className="p-6 rounded-2xl glass-panel space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-white">Batch Evaluation Output</h3>
                  <p className="text-xs text-slate-400">
                    Processed {batchResults.totalProcessed} records: 
                    <span className="text-rose-400 font-bold ml-1.5">{batchResults.criticalCount} Critical</span>, 
                    <span className="text-amber-400 font-bold ml-1.5">{batchResults.highRiskCount} High Risk</span>, 
                    <span className="text-emerald-400 font-bold ml-1.5">{batchResults.lowRiskCount} Nominal</span>.
                  </p>
                </div>

                <button
                  onClick={handleDownloadBatchCSV}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600/30 text-cyan-300 hover:bg-blue-600/50 border border-blue-500/40 text-xs font-bold cursor-pointer transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>EXPORT RESULTS TO CSV</span>
                </button>
              </div>

              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-[#080B16] border-b border-slate-800 text-slate-400">
                    <tr>
                      <th className="py-2 font-semibold">#</th>
                      <th className="py-2 font-semibold">Machine ID</th>
                      <th className="py-2 font-semibold">Speed [RPM]</th>
                      <th className="py-2 font-semibold">Torque [Nm]</th>
                      <th className="py-2 font-semibold">Tool Wear [min]</th>
                      <th className="py-2 font-semibold">Failure Risk</th>
                      <th className="py-2 font-semibold">Risk Tier</th>
                      <th className="py-2 font-semibold">Failure Mode</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {batchResults.results.map((r: any) => (
                      <tr key={r.index} className="hover:bg-slate-800/30">
                        <td className="py-2 text-slate-500">{r.index}</td>
                        <td className="py-2 text-white font-bold">{r.machineId}</td>
                        <td className="py-2 text-slate-300">{r.rotationalSpeedRpm}</td>
                        <td className="py-2 text-slate-300">{r.torqueNm}</td>
                        <td className="py-2 text-slate-300">{r.toolWearMin}</td>
                        <td className="py-2 font-bold">
                          <span className={
                            r.failureProbability >= 0.75 ? 'text-rose-400' :
                            r.failureProbability >= 0.50 ? 'text-amber-400' : 'text-emerald-400'
                          }>
                            {Math.round(r.failureProbability * 100)}%
                          </span>
                        </td>
                        <td className="py-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            r.riskLevel === 'Critical Risk' ? 'bg-rose-500/20 text-rose-400' :
                            r.riskLevel === 'High Risk' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
                          }`}>
                            {r.riskLevel}
                          </span>
                        </td>
                        <td className="py-2 text-slate-200 text-xs font-sans truncate max-w-[160px]">
                          {r.primaryFailureMode}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
