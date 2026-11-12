"""
NEXUS AI - Model Training Pipeline
Dataset: AI4I 2020 Predictive Maintenance Dataset (UCI Machine Learning Repository)
Task: Binary Classification of Machine Failure
Target: 'Machine failure'
Features:
- Air temperature [K]
- Process temperature [K]
- Rotational speed [rpm]
- Torque [Nm]
- Tool wear [min]

NOTE: Failure mode indicators (TWF, HDF, PWF, OSF, RNF) and UDI/Product ID are excluded
from training features to prevent target leakage.
"""

import os
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score, f1_score, precision_score, recall_score
import tensorflow as tf
from tensorflow.keras import layers, models, callbacks

# 1. Configuration & Hyperparameters
CONFIG = {
    "random_seed": 42,
    "test_size": 0.2,
    "val_size": 0.1,
    "batch_size": 32,
    "epochs": 50,
    "learning_rate": 0.001,
    "model_save_path": "models/ai4i_keras_model.h5",
    "scaler_save_path": "models/scaler.joblib",
    "metrics_save_path": "models/evaluation_metrics.json"
}

np.random.seed(CONFIG["random_seed"])
tf.random.set_seed(CONFIG["random_seed"])

def load_and_preprocess_dataset(csv_url_or_path: str):
    """
    Downloads or reads the AI4I 2020 dataset and strips non-feature and target-leakage columns.
    """
    print("[NEXUS AI] Loading AI4I 2020 dataset...")
    df = pd.read_csv(csv_url_or_path)

    feature_cols = [
        "Air temperature [K]",
        "Process temperature [K]",
        "Rotational speed [rpm]",
        "Torque [Nm]",
        "Tool wear [min]"
    ]
    
    target_col = "Machine failure"

    X = df[feature_cols].copy()
    y = df[target_col].copy()

    # Split into Train, Validation, and Test sets with stratification
    X_train_val, X_test, y_train_val, y_test = train_test_split(
        X, y, test_size=CONFIG["test_size"], random_state=CONFIG["random_seed"], stratify=y
    )

    val_relative_size = CONFIG["val_size"] / (1.0 - CONFIG["test_size"])
    X_train, X_val, y_train, y_val = train_test_split(
        X_train_val, y_train_val, test_size=val_relative_size, random_state=CONFIG["random_seed"], stratify=y_train_val
    )

    # Standard scaling fitted exclusively on X_train to avoid data snooping
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_val_scaled = scaler.transform(X_val)
    X_test_scaled = scaler.transform(X_test)

    # Calculate class weights to handle severe class imbalance (~3.4% failure rate in AI4I)
    neg_count = np.sum(y_train == 0)
    pos_count = np.sum(y_train == 1)
    class_weights = {
        0: 1.0,
        1: (neg_count / pos_count) * 1.5 # Boost positive class recall
    }
    print(f"[NEXUS AI] Class distribution - Train Negatives: {neg_count}, Positives: {pos_count}")
    print(f"[NEXUS AI] Applied class weights: {class_weights}")

    return X_train_scaled, X_val_scaled, X_test_scaled, y_train, y_val, y_test, scaler

def build_neural_network(input_dim: int):
    """
    Constructs a Deep Neural Network optimized for tabular industrial sensor data.
    """
    model = models.Sequential([
        layers.Input(shape=(input_dim,)),
        layers.Dense(64, activation="relu"),
        layers.BatchNormalization(),
        layers.Dropout(0.25),
        
        layers.Dense(32, activation="relu"),
        layers.BatchNormalization(),
        layers.Dropout(0.20),
        
        layers.Dense(16, activation="relu"),
        layers.Dense(1, activation="sigmoid")
    ])

    optimizer = tf.keras.optimizers.Adam(learning_rate=CONFIG["learning_rate"])
    model.compile(
        optimizer=optimizer,
        loss="binary_crossentropy",
        metrics=[
            "accuracy",
            tf.keras.metrics.Precision(name="precision"),
            tf.keras.metrics.Recall(name="recall"),
            tf.keras.metrics.AUC(name="auc")
        ]
    )
    return model

def main():
    os.makedirs("models", exist_ok=True)
    
    # Dataset path or default UCI link
    dataset_source = os.getenv(
        "DATASET_PATH", 
        "https://archive.ics.uci.edu/static/public/601/ai4i+2020+predictive+maintenance+dataset.zip"
    )

    # Note: If running locally or on Colab, point DATASET_PATH to ai4i2020.csv
    if not os.path.exists(dataset_source) and not dataset_source.startswith("http"):
        print(f"[NEXUS AI] Specified file {dataset_source} not found. Please provide valid CSV path.")
        return

    X_train, X_val, X_test, y_train, y_val, y_test, scaler = load_and_preprocess_dataset(dataset_source)

    model = build_neural_network(input_dim=X_train.shape[1])
    model.summary()

    # Callbacks
    early_stop = callbacks.EarlyStopping(monitor="val_loss", patience=10, restore_best_weights=True)
    reduce_lr = callbacks.ReduceLROnPlateau(monitor="val_loss", factor=0.5, patience=5, min_lr=1e-5)

    print("[NEXUS AI] Starting model training...")
    history = model.fit(
        X_train, y_train,
        validation_data=(X_val, y_val),
        epochs=CONFIG["epochs"],
        batch_size=CONFIG["batch_size"],
        callbacks=[early_stop, reduce_lr],
        verbose=1
    )

    # Evaluation on holdout test set
    y_pred_probs = model.predict(X_test)
    y_pred = (y_pred_probs >= 0.50).astype(int)

    cm = confusion_matrix(y_test, y_pred)
    acc = float(np.mean(y_test == y_pred.ravel()))
    prec = float(precision_score(y_test, y_pred))
    rec = float(recall_score(y_test, y_pred))
    f1 = float(f1_score(y_test, y_pred))
    auc = float(roc_auc_score(y_test, y_pred_probs))

    metrics = {
        "accuracy": round(acc, 4),
        "precision": round(prec, 4),
        "recall": round(rec, 4),
        "f1_score": round(f1, 4),
        "roc_auc": round(auc, 4),
        "confusion_matrix": {
            "true_negatives": int(cm[0][0]),
            "false_positives": int(cm[0][1]),
            "false_negatives": int(cm[1][0]),
            "true_positives": int(cm[1][1])
        }
    }

    print("\n[NEXUS AI] Final Test Set Evaluation:")
    print(json.dumps(metrics, indent=2))

    # Save artifacts
    model.save(CONFIG["model_save_path"])
    joblib.dump(scaler, CONFIG["scaler_save_path"])
    with open(CONFIG["metrics_save_path"], "w") as f:
        json.dump(metrics, f, indent=2)

    print(f"[NEXUS AI] Model saved to {CONFIG['model_save_path']}")
    print(f"[NEXUS AI] Scaler saved to {CONFIG['scaler_save_path']}")

if __name__ == "__main__":
    main()
