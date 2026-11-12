"""
Sensor data preprocessing and validation pipeline for AI4I 2020 Predictive Maintenance.
Strictly preserves feature ordering:
1. Air temperature [K]
2. Process temperature [K]
3. Rotational speed [rpm]
4. Torque [Nm]
5. Tool wear [min]
"""

import numpy as np
from pydantic import BaseModel, Field
from typing import List, Optional

class SensorReadingInput(BaseModel):
    machine_id: Optional[str] = Field(default="M-001", description="Machine identifier")
    air_temperature_k: float = Field(..., ge=250.0, le=350.0, description="Air temperature in Kelvin")
    process_temperature_k: float = Field(..., ge=250.0, le=360.0, description="Process temperature in Kelvin")
    rotational_speed_rpm: float = Field(..., ge=500.0, le=4000.0, description="Rotational speed in RPM")
    torque_nm: float = Field(..., ge=0.0, le=150.0, description="Torque in Newton-meters")
    tool_wear_min: float = Field(..., ge=0.0, le=500.0, description="Tool wear time in minutes")
    machine_type: Optional[str] = Field(default="M", description="Quality type: L, M, or H")

class BatchPredictionInput(BaseModel):
    readings: List[SensorReadingInput]

FEATURE_COLUMNS = [
    "Air temperature [K]",
    "Process temperature [K]",
    "Rotational speed [rpm]",
    "Torque [Nm]",
    "Tool wear [min]"
]

# AI4I 2020 empirical normalization parameters (Mean & Std Dev from 10,000 instances)
# Used for StandardScaler feature transformation during inference
MEANS = np.array([300.00, 310.01, 1538.78, 39.99, 107.95])
STDS = np.array([2.00, 1.48, 179.28, 9.97, 63.65])

def preprocess_features(reading: SensorReadingInput) -> np.ndarray:
    raw = np.array([
        reading.air_temperature_k,
        reading.process_temperature_k,
        reading.rotational_speed_rpm,
        reading.torque_nm,
        reading.tool_wear_min
    ], dtype=np.float32)
    # Standard scale: z = (x - mean) / std
    scaled = (raw - MEANS) / STDS
    return scaled.reshape(1, -1)
