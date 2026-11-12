import React, { useState } from 'react';
import { 
  Database, 
  Upload, 
  CheckCircle2, 
  AlertTriangle, 
  FileSpreadsheet, 
  Info, 
  BarChart, 
  RefreshCw,
  Sparkles,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { DatasetValidationReport } from '../../types';
import { api } from '../../services/api';

export const DatasetManagement: React.FC = () => {
  const [report, setReport] = useState<DatasetValidationReport | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [rawText, setRawText] = useState('');

  // Sample Benchmark Data from AI4I 2020
  const loadBenchmarkSample = async () => {
    setIsValidating(true);
    const sampleRows = [
      { UDI: 1, 'Product ID': 'M14860', Type: 'M', 'Air temperature [K]': 298.1, 'Process temperature [K]': 308.6, 'Rotational speed [rpm]': 1551, 'Torque [Nm]': 42.8, 'Tool wear [min]': 0, 'Machine failure': 0 },
      { UDI: 2, 'Product ID': 'L47181', Type: 'L', 'Air temperature [K]': 298.2, 'Process temperature [K]': 308.7, 'Rotational speed [rpm]': 1408, 'Torque [Nm]': 46.3, 'Tool wear [min]': 3, 'Machine failure': 0 },
      { UDI: 3, 'Product ID': 'L47182', Type: 'L', 'Air temperature [K]': 298.1, 'Process temperature [K]': 308.5, 'Rotational speed [rpm]': 1498, 'Torque [Nm]': 49.4, 'Tool wear [min]': 5, 'Machine failure': 0 },
      { UDI: 4, 'Product ID': 'L47183', Type: 'L', 'Air temperature [K]': 298.2, 'Process temperature [K]': 308.6, 'Rotational speed [rpm]': 1433, 'Torque [Nm]': 39.5, 'Tool wear [min]': 7, 'Machine failure': 0 },
      { UDI: 5, 'Product ID': 'L47184', Type: 'L', 'Air temperature [K]': 298.2, 'Process temperature [K]': 308.7, 'Rotational speed [rpm]': 1408, 'Torque [Nm]': 40.0, 'Tool wear [min]': 9, 'Machine failure': 0 },
      { UDI: 6, 'Product ID': 'M14865', Type: 'M', 'Air temperature [K]': 298.1, 'Process temperature [K]': 308.6, 'Rotational speed [rpm]': 1425, 'Torque [Nm]': 41.9, 'Tool wear [min]': 11, 'Machine failure': 0 },
      { UDI: 7, 'Product ID': 'L47186', Type: 'L', 'Air temperature [K]': 298.1, 'Process temperature [K]': 308.6, 'Rotational speed [rpm]': 1558, 'Torque [Nm]': 33.1, 'Tool wear [min]': 14, 'Machine failure': 0 },
      { UDI: 8, 'Product ID': 'L47187', Type: 'L', 'Air temperature [K]': 298.1, 'Process temperature [K]': 308.6, 'Rotational speed [rpm]': 1527, 'Torque [Nm]': 45.8, 'Tool wear [min]': 17, 'Machine failure': 0 },
      { UDI: 9, 'Product ID': 'M14868', Type: 'M', 'Air temperature [K]': 298.3, 'Process temperature [K]': 308.7, 'Rotational speed [rpm]': 1667, 'Torque [Nm]': 28.6, 'Tool wear [min]': 21, 'Machine failure': 0 },
      { UDI: 10, 'Product ID': 'M14869', Type: 'M', 'Air temperature [K]': 298.5, 'Process temperature [K]': 309.0, 'Rotational speed [rpm]': 1741, 'Torque [Nm]': 28.0, 'Tool wear [min]': 24, 'Machine failure': 0 }
    ];

    try {
      const result = await api.validateDataset(sampleRows, 'ai4i2020_benchmark_sample.csv');
      setReport(result);
    } catch (e) {
      console.error(e);
    } finally {
      setIsValidating(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsValidating(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter(l => l.trim().length > 0);
      if (lines.length < 2) {
        setIsValidating(false);
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
      const parsedRows = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        const row: any = {};
        headers.forEach((h, i) => {
          row[h] = values[i];
        });
        return row;
      });

      const res = await api.validateDataset(parsedRows, file.name);
      setReport(res);
      setIsValidating(false);
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl glass-panel">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-blue-500/20 text-cyan-300 border border-blue-500/30">
              Data Quality Governance
            </span>
            <span className="text-xs text-slate-400">AI4I 2020 Standardized Schema Engine</span>
          </div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-cyan-400" />
            <span>Industrial Telemetry Dataset Management</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Audit CSV datasets for schema compliance, detect null or corrupted sensors, compute statistical moments, and inspect data quality.
          </p>
        </div>

        <button
          onClick={loadBenchmarkSample}
          disabled={isValidating}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-xs font-bold shadow hover:brightness-110 transition-all cursor-pointer disabled:opacity-50"
        >
          <Sparkles className="w-4 h-4 text-cyan-200" />
          <span>LOAD AI4I 2020 BENCHMARK SAMPLE</span>
        </button>
      </div>

      {/* Upload Zone & Dataset Information Notice */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Upload Zone (7 Cols) */}
        <div className="lg:col-span-7 p-6 rounded-2xl glass-panel space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Upload className="w-4 h-4 text-cyan-400" />
            <span>Upload Industrial Telemetry Dataset (CSV)</span>
          </h2>
          <div className="p-8 border-2 border-dashed border-slate-700 hover:border-cyan-500/60 rounded-2xl text-center bg-slate-900/40 transition-colors">
            <FileSpreadsheet className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
            <p className="text-xs font-bold text-white">Select a CSV sensor telemetry file</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Evaluates schema against standard parameters: Speed [rpm], Torque [Nm], Tool wear [min], Air temp [K], Process temp [K].
            </p>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="mt-3 text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Dataset Reference Guidelines (5 Cols) */}
        <div className="lg:col-span-5 p-6 rounded-2xl glass-panel space-y-3 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Dataset Governance Principles</span>
            </h3>
            <div className="mt-2 space-y-2 text-xs text-slate-300 leading-relaxed">
              <p className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <strong className="text-white block">Strict Separation of Training & Inference:</strong>
                Uploaded datasets are validated for schema integrity and exploratory quality inspection. Production models are trained reproducibly via standalone pipelines to prevent arbitrary drift.
              </p>
              <p className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <strong className="text-white block">No Target Leakage:</strong>
                Model training excludes failure target indicators (TWF, HDF, PWF, OSF) from input features.
              </p>
            </div>
          </div>

          <a
            href="https://archive.ics.uci.edu/dataset/601/ai4i+2020+predictive+maintenance+dataset"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between p-2.5 rounded-xl bg-blue-950/30 border border-blue-500/20 text-xs text-cyan-300 hover:text-white transition-colors"
          >
            <span>UCI AI4I 2020 Benchmark Citation</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Validation Report Display */}
      {report && (
        <div className="p-6 rounded-2xl glass-panel space-y-6 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                  {report.fileName}
                </span>
                <span className="text-xs text-slate-400">
                  {report.rowCount} rows evaluated ({report.validRowCount} valid)
                </span>
              </div>
              <h2 className="text-lg font-bold text-white mt-1">Dataset Quality & Health Report</h2>
            </div>

            {/* Quality Score */}
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-900/70 border border-slate-800">
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Quality Score</span>
                <span className="text-2xl font-black font-mono text-emerald-400">{report.qualityScore}/100</span>
              </div>
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>
          </div>

          {/* Warnings */}
          {report.warnings.length > 0 && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-1">
              <span className="font-bold flex items-center gap-1.5 mb-1">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Validation Observations:</span>
              </span>
              {report.warnings.map((w, i) => (
                <p key={i} className="pl-5">• {w}</p>
              ))}
            </div>
          )}

          {/* Statistical Distribution Table */}
          <div>
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3">
              Statistical Moments (Mean, Std Dev, Min, Max)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="border-b border-slate-800 text-slate-400">
                  <tr>
                    <th className="pb-2 font-semibold">Sensor Feature</th>
                    <th className="pb-2 font-semibold">Mean (μ)</th>
                    <th className="pb-2 font-semibold">Std Dev (σ)</th>
                    <th className="pb-2 font-semibold">Min</th>
                    <th className="pb-2 font-semibold">Max</th>
                    <th className="pb-2 font-semibold">Missing Count</th>
                    <th className="pb-2 font-semibold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {Object.entries(report.stats).map(([col, s]) => (
                    <tr key={col} className="hover:bg-slate-800/30">
                      <td className="py-2.5 text-white font-sans font-bold">{col}</td>
                      <td className="py-2.5 text-slate-300">{s.mean}</td>
                      <td className="py-2.5 text-slate-300">{s.std}</td>
                      <td className="py-2.5 text-slate-300">{s.min}</td>
                      <td className="py-2.5 text-slate-300">{s.max}</td>
                      <td className="py-2.5 text-slate-400">{report.missingValues[col] || 0}</td>
                      <td className="py-2.5 text-right font-sans">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          VALID
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sample Rows Preview */}
          <div>
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">
              Preview Ingested Records (Top 5 Rows)
            </h3>
            <div className="overflow-x-auto max-h-56">
              <table className="w-full text-left text-[11px] font-mono">
                <thead className="sticky top-0 bg-[#080B16] border-b border-slate-800 text-slate-400">
                  <tr>
                    {Object.keys(report.sampleRows[0] || {}).map(k => (
                      <th key={k} className="py-2 pr-3">{k}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {report.sampleRows.slice(0, 5).map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/30">
                      {Object.values(row).map((v: any, vi) => (
                        <td key={vi} className="py-2 pr-3 text-slate-300">{String(v)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
