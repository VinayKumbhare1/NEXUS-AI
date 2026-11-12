export type MachineQualityType = 'L' | 'M' | 'H';

export type MachineStatus = 'healthy' | 'warning' | 'critical' | 'maintenance';

export interface SensorDataPoint {
  timestamp: string;
  airTemp: number;
  procTemp: number;
  rpm: number;
  torque: number;
  toolWear: number;
  health: number;
}

export interface Machine {
  id: string;
  name: string;
  type: MachineQualityType;
  status: MachineStatus;
  healthScore: number;
  airTemperatureK: number;
  processTemperatureK: number;
  rotationalSpeedRpm: number;
  torqueNm: number;
  toolWearMin: number;
  lastMaintenance: string;
  nextMaintenance: string;
  operatingHours: number;
  location: string;
  sensorHistory: SensorDataPoint[];
}

export type AlertCategory = 
  | 'Critical Failure Risk'
  | 'High Failure Risk'
  | 'Scheduled Maintenance'
  | 'Sensor Anomaly'
  | 'Maintenance Overdue';

export type AlertSeverity = 'critical' | 'high' | 'medium' | 'low';

export interface Alert {
  id: string;
  machineId: string;
  machineName: string;
  category: AlertCategory;
  severity: AlertSeverity;
  description: string;
  timestamp: string;
  recommendedAction: string;
  status: 'active' | 'resolved';
  resolvedAt?: string;
  resolvedBy?: string;
}

export type RiskLevel = 'Low Risk' | 'Medium Risk' | 'High Risk' | 'Critical Risk';

export interface PredictionRecord {
  id: string;
  machineId: string;
  machineName: string;
  airTemperatureK: number;
  processTemperatureK: number;
  rotationalSpeedRpm: number;
  torqueNm: number;
  toolWearMin: number;
  prediction: number;
  failureProbability: number;
  riskLevel: RiskLevel;
  primaryFailureMode: string;
  createdAt: string;
  modelSource: string;
  recommendations: string[];
}

export interface ColumnStats {
  min: number;
  max: number;
  mean: number;
  std: number;
}

export interface DatasetValidationReport {
  fileName: string;
  rowCount: number;
  validRowCount: number;
  columnsPresent: string[];
  missingColumns: string[];
  missingValues: Record<string, number>;
  outliersDetected: number;
  qualityScore: number;
  stats: Record<string, ColumnStats>;
  sampleRows: Record<string, any>[];
  warnings: string[];
}

export interface ModelPerformanceData {
  modelName: string;
  framework: string;
  trainingDate: string;
  dataset: string;
  version: string;
  trainingStatus: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  rocAuc: number;
  confusionMatrix: {
    trueNegatives: number;
    falsePositives: number;
    falseNegatives: number;
    truePositives: number;
  };
  featureImportance: { feature: string; importance: number }[];
}

export type NavigationTab = 
  | 'overview'
  | 'machines'
  | 'predictions'
  | 'alerts'
  | 'analytics'
  | 'history'
  | 'datasets'
  | 'model-performance'
  | 'settings';
