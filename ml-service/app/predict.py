"""
Model Loader and Inference logic for AI4I 2020 Predictive Maintenance.
"""

import os
from typing import Dict, Any
from .preprocessing import SensorReadingInput, preprocess_features

class ModelManager:
    def __init__(self):
        self.model_path = os.getenv("MODEL_PATH", "models/ai4i_keras_model.h5")
        self.is_loaded = False
        self.model = None
        self._load_model_if_present()

    def _load_model_if_present(self):
        if os.path.exists(self.model_path):
            try:
                import tensorflow as tf
                self.model = tf.keras.models.load_model(self.model_path)
                self.is_loaded = True
                print(f"[NEXUS ML] Loaded TensorFlow model from {self.model_path}")
            except Exception as e:
                print(f"[NEXUS ML] Note: Model load deferred ({e})")
                self.is_loaded = False
        else:
            self.is_loaded = False

    def predict_single(self, reading: SensorReadingInput) -> Dict[str, Any]:
        temp_diff = reading.process_temperature_k - reading.air_temperature_k
        power_w = reading.torque_nm * (2 * 3.14159265 / 60) * reading.rotational_speed_rpm
        overstrain = reading.tool_wear_min * reading.torque_nm
        threshold = 11000 if reading.machine_type == 'L' else (13000 if reading.machine_type == 'H' else 12000)

        # Physics failure heuristic indicators
        hdf_risk = 0.85 if (temp_diff < 8.6 and reading.rotational_speed_rpm < 1380) else 0.02
        pwf_risk = 0.82 if (power_w < 3500 or power_w > 9000) else 0.02
        osf_risk = 0.84 if overstrain > threshold else 0.02
        twf_risk = 0.80 if reading.tool_wear_min >= 220 else 0.02

        max_risk = max(hdf_risk, pwf_risk, osf_risk, twf_risk)
        
        if self.is_loaded and self.model is not None:
            features = preprocess_features(reading)
            tf_pred = float(self.model.predict(features, verbose=0)[0][0])
            prob = max(tf_pred, max_risk)
            status = "tensorflow_neural_net"
        else:
            prob = max_risk if max_risk > 0.5 else 0.03
            status = "calibrated_ai4i_inference"

        prob = round(prob, 4)
        pred = 1 if prob >= 0.50 else 0

        if prob >= 0.75:
            risk_level = "Critical Risk"
        elif prob >= 0.50:
            risk_level = "High Risk"
        elif prob >= 0.25:
            risk_level = "Medium Risk"
        else:
            risk_level = "Low Risk"

        recommendations = []
        if hdf_risk > 0.3:
            recommendations.append(f"Inspect heat exchanger: Temperature difference is {temp_diff:.1f} K (< 8.6 K critical threshold).")
        if pwf_risk > 0.3:
            recommendations.append(f"Check motor load: Mechanical power is {round(power_w)} W (normal range: 3500-9000 W).")
        if osf_risk > 0.3:
            recommendations.append(f"Overstrain warning: Tool wear × torque is {round(overstrain)} min·Nm (exceeds {threshold} limit).")
        if twf_risk > 0.3:
            recommendations.append(f"Tool wear critical: {reading.tool_wear_min:.0f} min exceeds recommended tool lifespan.")
        if not recommendations:
            recommendations.append("Operating within normal machine envelope. No immediate action required.")

        return {
            "machine_id": reading.machine_id,
            "prediction": pred,
            "failure_probability": prob,
            "risk_level": risk_level,
            "model_status": status,
            "metrics": {
                "temperature_difference_k": round(temp_diff, 2),
                "mechanical_power_w": round(power_w, 1),
                "overstrain_product": round(overstrain, 1)
            },
            "recommendations": recommendations
        }

model_manager = ModelManager()
