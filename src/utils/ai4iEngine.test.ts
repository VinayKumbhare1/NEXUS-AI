import test from 'node:test';
import assert from 'node:assert/strict';
import { validateSensorFeatures, predictMachineFailure } from './ai4iEngine';

test('validates valid sensor features without errors', () => {
  const result = validateSensorFeatures({
    airTemperatureK: 298.1,
    processTemperatureK: 308.6,
    rotationalSpeedRpm: 1551,
    torqueNm: 42.8,
    toolWearMin: 120,
  });

  assert.equal(result.valid, true);
  assert.equal(result.errors.length, 0);
});

test('detects out-of-bounds sensor values', () => {
  const result = validateSensorFeatures({
    airTemperatureK: 120, // out of range
    processTemperatureK: 308.6,
    rotationalSpeedRpm: 50, // out of range
    torqueNm: -5, // out of range
    toolWearMin: 600, // out of range
  });

  assert.equal(result.valid, false);
  assert.ok(result.errors.length >= 3);
});

test('predicts healthy operating condition for standard nominal parameters', () => {
  const prediction = predictMachineFailure({
    airTemperatureK: 298.1,
    processTemperatureK: 308.6, // delta = 10.5 K (healthy)
    rotationalSpeedRpm: 1550,
    torqueNm: 42.0, // power ~6800 W (healthy)
    toolWearMin: 45, // well below fatigue limit
  }, 'M');

  assert.equal(prediction.prediction, 0);
  assert.equal(prediction.riskLevel, 'Low Risk');
  assert.ok(prediction.failureProbability < 0.25);
  assert.equal(prediction.primaryFailureMode, 'None');
  assert.ok(prediction.estimatedRulHours > 300);
});

test('triggers Heat Dissipation Failure (HDF) when temp delta < 8.6K and RPM < 1380', () => {
  const prediction = predictMachineFailure({
    airTemperatureK: 302.5,
    processTemperatureK: 309.5, // delta = 7.0 K (< 8.6 K)
    rotationalSpeedRpm: 1250, // < 1380 RPM
    torqueNm: 40.0,
    toolWearMin: 20,
  }, 'M');

  assert.equal(prediction.prediction, 1);
  assert.ok(prediction.failureProbability >= 0.75);
  assert.equal(prediction.riskLevel, 'Critical Risk');
  assert.equal(prediction.primaryFailureMode, 'Heat Dissipation Failure (HDF)');
  assert.ok(prediction.recommendations.some(r => r.includes('heat exchanger')));
});

test('triggers Power Failure (PWF) on mechanical power overload > 9000 W', () => {
  // Power = torque * (2*pi/60) * RPM = 70 * (0.1047) * 1600 = 11726 W (> 9000 W)
  const prediction = predictMachineFailure({
    airTemperatureK: 298.0,
    processTemperatureK: 308.0,
    rotationalSpeedRpm: 1600,
    torqueNm: 70.0,
    toolWearMin: 15,
  }, 'M');

  assert.equal(prediction.prediction, 1);
  assert.equal(prediction.primaryFailureMode, 'Power Failure (PWF)');
  assert.ok(prediction.metrics.mechanicalPowerW > 9000);
  assert.ok(prediction.recommendations.some(r => r.includes('overload')));
});

test('triggers Overstrain Failure (OSF) when toolWear * torque exceeds threshold', () => {
  // Variant L threshold = 11000 min*Nm. Here 200 min * 65 Nm = 13000 min*Nm
  const prediction = predictMachineFailure({
    airTemperatureK: 298.0,
    processTemperatureK: 308.0,
    rotationalSpeedRpm: 1400,
    torqueNm: 65.0,
    toolWearMin: 200,
  }, 'L');

  assert.equal(prediction.prediction, 1);
  assert.equal(prediction.primaryFailureMode, 'Overstrain Failure (OSF)');
  assert.ok(prediction.metrics.overstrainProduct >= 11000);
});

test('triggers Tool Wear Failure (TWF) when tool wear exceeds 220 min', () => {
  const prediction = predictMachineFailure({
    airTemperatureK: 298.0,
    processTemperatureK: 308.0,
    rotationalSpeedRpm: 1500,
    torqueNm: 35.0,
    toolWearMin: 235,
  }, 'M');

  assert.equal(prediction.prediction, 1);
  assert.equal(prediction.primaryFailureMode, 'Tool Wear Failure (TWF)');
  assert.ok(prediction.recommendations.some(r => r.includes('Tool insert wear critical')));
});
