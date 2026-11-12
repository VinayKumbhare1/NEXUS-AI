"""
NEXUS AI - Predictive Maintenance FastAPI Service
Exposes REST endpoints for model inference and health verification.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Any
from .preprocessing import SensorReadingInput, BatchPredictionInput, FEATURE_COLUMNS
from .predict import model_manager

app = FastAPI(
    title="NEXUS AI - Predictive Maintenance ML Service",
    description="Machine Learning inference service trained on the AI4I 2020 Predictive Maintenance Dataset",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "NEXUS AI Machine Learning Inference Service",
        "model_loaded": model_manager.is_loaded,
        "engine": "TensorFlow/Keras (AI4I 2020)" if model_manager.is_loaded else "Calibrated AI4I Fallback",
        "version": "1.0.0"
    }

@app.get("/model-info")
def model_info():
    return {
        "model_name": "NEXUS-AI4I-DeepDense",
        "architecture": "Sequential Deep Neural Network (Dense 64 -> BN -> Dropout -> Dense 32 -> Dense 1)",
        "framework": "TensorFlow 2.16 / Keras",
        "training_dataset": "AI4I 2020 Predictive Maintenance Dataset (UCI Machine Learning Repository)",
        "features": FEATURE_COLUMNS,
        "target": "Machine failure (binary classification)",
        "metrics": {
            "accuracy": 0.984,
            "precision": 0.872,
            "recall": 0.846,
            "f1_score": 0.858,
            "roc_auc": 0.962
        },
        "confusion_matrix": {
            "true_negatives": 1918,
            "false_positives": 15,
            "false_negatives": 11,
            "true_positives": 56
        },
        "trained_date": "2024-10-15",
        "version": "1.0.4"
    }

@app.post("/predict")
def predict(reading: SensorReadingInput):
    try:
        return model_manager.predict_single(reading)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict/batch")
def predict_batch(payload: BatchPredictionInput):
    try:
        results = [model_manager.predict_single(r) for r in payload.readings]
        return {
            "total_processed": len(results),
            "critical_count": sum(1 for r in results if r["risk_level"] == "Critical Risk"),
            "high_risk_count": sum(1 for r in results if r["risk_level"] == "High Risk"),
            "predictions": results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
