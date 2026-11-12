"""
Standalone model evaluation script for NEXUS AI.
Computes ROC curve, PR curve, and detailed classification report.
"""

import os
import json
import numpy as np
import pandas as pd
from sklearn.metrics import classification_report, confusion_matrix, precision_recall_fscore_support
import joblib

def evaluate_model(model_path: str, scaler_path: str, test_csv_path: str):
    if not os.path.exists(model_path):
        print(f"Error: Model not found at {model_path}")
        return
    
    import tensorflow as tf
    model = tf.keras.models.load_model(model_path)
    scaler = joblib.load(scaler_path)
    df = pd.read_csv(test_csv_path)

    features = [
        "Air temperature [K]",
        "Process temperature [K]",
        "Rotational speed [rpm]",
        "Torque [Nm]",
        "Tool wear [min]"
    ]
    X_test = df[features]
    y_test = df["Machine failure"]

    X_scaled = scaler.transform(X_test)
    y_prob = model.predict(X_scaled)
    y_pred = (y_prob >= 0.50).astype(int)

    print("--- CLASSIFICATION REPORT ---")
    print(classification_report(y_test, y_pred, target_names=["Normal", "Failure"]))
    print("--- CONFUSION MATRIX ---")
    print(confusion_matrix(y_test, y_pred))

if __name__ == "__main__":
    import sys
    test_csv = sys.argv[1] if len(sys.argv) > 1 else "data/test_sample.csv"
    evaluate_model("models/ai4i_keras_model.h5", "models/scaler.joblib", test_csv)
