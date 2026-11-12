/**
 * AI4I 2020 Predictive Maintenance Engine
 * Based on the AI4I 2020 Predictive Maintenance Dataset from UCI Machine Learning Repository:
 * https://archive.ics.uci.edu/dataset/601/ai4i+2020+predictive+maintenance+dataset
 * 
 * Features:
 * - Air temperature [K]: ambient operating temperature (typical ~295K - 305K)
 * - Process temperature [K]: operational machine temperature (typical ~305K - 315K)
 * - Rotational speed [rpm]: angular velocity of drive spindle (typical 1160 - 2880 rpm)
 * - Torque [Nm]: torsional force applied (typical 3.8 - 76.6 Nm)
 * - Tool wear [min]: cumulative operational tool wear (typical 0 - 250 min)
 */

export interface SensorFeatures {
  airTemperatureK: number;
  processTemperatureK: number;
  rotationalSpeedRpm: number;
  torqueNm: number;
  toolWearMin: number;
}

export type FailureType = 
  | 'None' 
  | 'Heat Dissipation Failure (HDF)' 
  | 'Power Failure (PWF)' 
  | 'Overstrain Failure (OSF)' 
  | 'Tool Wear Failure (TWF)' 
  | 'Random Failure (RNF)';

export type RiskLevel = 'Low Risk' | 'Medium Risk' | 'High Risk' | 'Critical Risk';

export interface PredictionResult {
  failureProbability: number; // 0 to 1
  prediction: number; // 0 (healthy) or 1 (failure predicted)
  riskLevel: RiskLevel;
  primaryFailureMode: FailureType;
  failureModeBreakdown: {
    hdf: number; // Heat Dissipation risk (0-1)
    pwf: number; // Power Failure risk (0-1)
    osf: number; // Overstrain Failure risk (0-1)
    twf: number; // Tool Wear Failure risk (0-1)
  };
  metrics: {
    temperatureDifferenceK: number;
    mechanicalPowerW: number;
    overstrainProduct: number;
  };
  recommendations: string[];
  estimatedRulHours: number; // Remaining Useful Life
}

/**
 * Validates sensor feature bounds
 */
export function validateSensorFeatures(features: SensorFeatures): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (isNaN(features.airTemperatureK) || features.airTemperatureK < 250 || features.airTemperatureK > 350) {
    errors.push('Air temperature must be between 250 K and 350 K');
  }
  if (isNaN(features.processTemperatureK) || features.processTemperatureK < 250 || features.processTemperatureK > 360) {
    errors.push('Process temperature must be between 250 K and 360 K');
  }
  if (isNaN(features.rotationalSpeedRpm) || features.rotationalSpeedRpm < 500 || features.rotationalSpeedRpm > 4000) {
    errors.push('Rotational speed must be between 500 RPM and 4000 RPM');
  }
  if (isNaN(features.torqueNm) || features.torqueNm < 0 || features.torqueNm > 150) {
    errors.push('Torque must be between 0 Nm and 150 Nm');
  }
  if (isNaN(features.toolWearMin) || features.toolWearMin < 0 || features.toolWearMin > 500) {
    errors.push('Tool wear must be between 0 and 500 minutes');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Calibrated physics & statistical inference model matching AI4I 2020 dataset characteristics
 */
export function predictMachineFailure(features: SensorFeatures, machineType: 'L' | 'M' | 'H' = 'M'): PredictionResult {
  const tempDiff = features.processTemperatureK - features.airTemperatureK;
  // Mechanical power: P = Torque * omega = Torque * (2 * pi / 60) * RPM
  const mechanicalPowerW = features.torqueNm * (2 * Math.PI / 60) * features.rotationalSpeedRpm;
  const overstrainProduct = features.toolWearMin * features.torqueNm;

  // Overstrain threshold varies by machine quality variant
  // L (low): 11000 min*Nm, M (medium): 12000 min*Nm, H (high): 13000 min*Nm
  const overstrainThreshold = machineType === 'L' ? 11000 : machineType === 'M' ? 12000 : 13000;

  // 1. Heat Dissipation Failure (HDF) probability
  // Dataset rule: tempDiff < 8.6 K and rotationalSpeed < 1380 rpm
  let hdfRisk = 0.01;
  if (tempDiff < 8.6 && features.rotationalSpeedRpm < 1380) {
    hdfRisk = 0.85 + Math.max(0, (8.6 - tempDiff) * 0.05);
  } else if (tempDiff < 9.5 && features.rotationalSpeedRpm < 1450) {
    hdfRisk = 0.45;
  }

  // 2. Power Failure (PWF) probability
  // Dataset rule: power < 3500 W or power > 9000 W
  let pwfRisk = 0.01;
  if (mechanicalPowerW < 3500) {
    pwfRisk = 0.75 + Math.min(0.2, (3500 - mechanicalPowerW) / 5000);
  } else if (mechanicalPowerW > 9000) {
    pwfRisk = 0.82 + Math.min(0.16, (mechanicalPowerW - 9000) / 4000);
  } else if (mechanicalPowerW < 3900 || mechanicalPowerW > 8300) {
    pwfRisk = 0.35;
  }

  // 3. Overstrain Failure (OSF) probability
  // Dataset rule: toolWear * torque > threshold
  let osfRisk = 0.01;
  if (overstrainProduct > overstrainThreshold) {
    osfRisk = 0.80 + Math.min(0.18, ((overstrainProduct - overstrainThreshold) / 4000));
  } else if (overstrainProduct > overstrainThreshold * 0.88) {
    osfRisk = 0.40;
  }

  // 4. Tool Wear Failure (TWF) probability
  // Dataset rule: tool wear between 200 - 240 mins carries severe cumulative fatigue
  let twfRisk = 0.01;
  if (features.toolWearMin >= 220) {
    twfRisk = 0.78 + Math.min(0.2, (features.toolWearMin - 220) / 100);
  } else if (features.toolWearMin >= 190) {
    twfRisk = 0.42;
  }

  // Cap sub-risks to 0.99
  hdfRisk = Math.min(0.99, Math.max(0.01, hdfRisk));
  pwfRisk = Math.min(0.99, Math.max(0.01, pwfRisk));
  osfRisk = Math.min(0.99, Math.max(0.01, osfRisk));
  twfRisk = Math.min(0.99, Math.max(0.01, twfRisk));

  // Combined failure probability via logistic union
  const combinedLogOdds = 
    Math.log(hdfRisk / (1 - hdfRisk)) * 0.35 +
    Math.log(pwfRisk / (1 - pwfRisk)) * 0.35 +
    Math.log(osfRisk / (1 - osfRisk)) * 0.35 +
    Math.log(twfRisk / (1 - twfRisk)) * 0.25;

  let failureProbability = 1 / (1 + Math.exp(-combinedLogOdds));

  // Ensure individual trigger dominance
  const maxSubRisk = Math.max(hdfRisk, pwfRisk, osfRisk, twfRisk);
  if (maxSubRisk > 0.7) {
    failureProbability = Math.max(failureProbability, maxSubRisk);
  }

  // Format to 3 decimal places
  failureProbability = Math.round(Math.min(0.99, Math.max(0.01, failureProbability)) * 1000) / 1000;

  // Determine risk category
  let riskLevel: RiskLevel = 'Low Risk';
  if (failureProbability >= 0.75) {
    riskLevel = 'Critical Risk';
  } else if (failureProbability >= 0.50) {
    riskLevel = 'High Risk';
  } else if (failureProbability >= 0.25) {
    riskLevel = 'Medium Risk';
  } else {
    riskLevel = 'Low Risk';
  }

  const prediction = failureProbability >= 0.50 ? 1 : 0;

  // Primary failure mode determination
  let primaryFailureMode: FailureType = 'None';
  if (prediction === 1 || failureProbability >= 0.35) {
    if (hdfRisk >= Math.max(pwfRisk, osfRisk, twfRisk) && hdfRisk > 0.3) {
      primaryFailureMode = 'Heat Dissipation Failure (HDF)';
    } else if (pwfRisk >= Math.max(hdfRisk, osfRisk, twfRisk) && pwfRisk > 0.3) {
      primaryFailureMode = 'Power Failure (PWF)';
    } else if (osfRisk >= Math.max(hdfRisk, pwfRisk, twfRisk) && osfRisk > 0.3) {
      primaryFailureMode = 'Overstrain Failure (OSF)';
    } else if (twfRisk > 0.3) {
      primaryFailureMode = 'Tool Wear Failure (TWF)';
    } else {
      primaryFailureMode = 'Random Failure (RNF)';
    }
  }

  // Actionable maintenance recommendations
  const recommendations: string[] = [];
  if (hdfRisk > 0.3) {
    recommendations.push(
      `Inspect heat exchanger and cooling ducts. Temperature delta is ${tempDiff.toFixed(1)}K (optimal: >9.0K) at ${features.rotationalSpeedRpm} RPM.`
    );
  }
  if (pwfRisk > 0.3) {
    if (mechanicalPowerW < 3500) {
      recommendations.push(
        `Drive power underload detected (${Math.round(mechanicalPowerW)} W < 3500 W limit). Check motor coupling and supply voltage.`
      );
    } else {
      recommendations.push(
        `Drive power overload detected (${Math.round(mechanicalPowerW)} W > 9000 W limit). Verify spindle load and bearing lubrication.`
      );
    }
  }
  if (osfRisk > 0.3) {
    recommendations.push(
      `Overstrain limit exceeded (${Math.round(overstrainProduct)} min·Nm vs ${overstrainThreshold} max). Replace worn insert and reduce feed torque.`
    );
  }
  if (twfRisk > 0.3) {
    recommendations.push(
      `Tool insert wear critical at ${features.toolWearMin} mins (end-of-life threshold: 200 min). Schedule immediate tool replacement.`
    );
  }
  if (recommendations.length === 0) {
    recommendations.push('Machine is operating within normal technical tolerance envelopes. Continue standard monitoring schedule.');
  }

  // Estimated Remaining Useful Life (RUL) in operational hours
  let estimatedRulHours = 480;
  if (riskLevel === 'Critical Risk') {
    estimatedRulHours = Math.max(4, Math.round((1 - failureProbability) * 48));
  } else if (riskLevel === 'High Risk') {
    estimatedRulHours = Math.max(36, Math.round((1 - failureProbability) * 160));
  } else if (riskLevel === 'Medium Risk') {
    estimatedRulHours = Math.max(120, Math.round((1 - failureProbability) * 350));
  } else {
    estimatedRulHours = Math.round(350 + (1 - failureProbability) * 250);
  }

  return {
    failureProbability,
    prediction,
    riskLevel,
    primaryFailureMode,
    failureModeBreakdown: {
      hdf: Math.round(hdfRisk * 100) / 100,
      pwf: Math.round(pwfRisk * 100) / 100,
      osf: Math.round(osfRisk * 100) / 100,
      twf: Math.round(twfRisk * 100) / 100,
    },
    metrics: {
      temperatureDifferenceK: Math.round(tempDiff * 10) / 10,
      mechanicalPowerW: Math.round(mechanicalPowerW),
      overstrainProduct: Math.round(overstrainProduct),
    },
    recommendations,
    estimatedRulHours,
  };
}
