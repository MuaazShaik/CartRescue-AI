"""
Train Isolation Forest Anomaly Detector

Trains an unsupervised Isolation Forest model to detect
anomalous sessions (bots, fraud, abnormal behavior).
Saves the model to saved_models/isolation_forest.joblib

Usage:
    cd ml-service
    python -m training.train_anomaly
"""
import os
import sys
import logging
import json
import numpy as np
from sklearn.ensemble import IsolationForest
import joblib

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import MODEL_DIR
from training.data_loader import load_and_prepare_data

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s │ %(levelname)-7s │ %(message)s",
)
logger = logging.getLogger(__name__)


def train():
    """Train Isolation Forest anomaly detector and save model."""
    logger.info("=" * 60)
    logger.info("  Training Isolation Forest Anomaly Detector")
    logger.info("=" * 60)

    # Load data (we only use features, not labels — unsupervised)
    X, _ = load_and_prepare_data()
    logger.info("Data shape: %s", X.shape)

    # Train Isolation Forest
    model = IsolationForest(
        n_estimators=100,
        max_samples="auto",
        contamination=0.05,  # Expect ~5% anomalous sessions
        max_features=1.0,
        random_state=42,
        n_jobs=-1,
    )

    model.fit(X)

    # Evaluate on training data
    predictions = model.predict(X)
    anomaly_count = (predictions == -1).sum()
    normal_count = (predictions == 1).sum()

    scores = model.decision_function(X)

    logger.info("\n" + "=" * 40)
    logger.info("  ANOMALY DETECTION RESULTS")
    logger.info("=" * 40)
    logger.info("  Total sessions: %d", len(X))
    logger.info("  Normal:         %d (%.1f%%)", normal_count, normal_count / len(X) * 100)
    logger.info("  Anomalous:      %d (%.1f%%)", anomaly_count, anomaly_count / len(X) * 100)
    logger.info("  Score range:    [%.4f, %.4f]", scores.min(), scores.max())
    logger.info("  Score mean:     %.4f", scores.mean())
    logger.info("=" * 40)

    # Save model
    os.makedirs(MODEL_DIR, exist_ok=True)
    model_path = os.path.join(MODEL_DIR, "isolation_forest.joblib")
    joblib.dump(model, model_path)
    logger.info("\nModel saved to %s", model_path)

    # Save metrics
    metrics = {
        "total_sessions": int(len(X)),
        "normal_count": int(normal_count),
        "anomaly_count": int(anomaly_count),
        "anomaly_rate": round(float(anomaly_count / len(X)), 4),
        "score_min": round(float(scores.min()), 4),
        "score_max": round(float(scores.max()), 4),
        "score_mean": round(float(scores.mean()), 4),
    }
    metrics_path = os.path.join(MODEL_DIR, "isolation_forest_metrics.json")
    with open(metrics_path, "w") as f:
        json.dump(metrics, f, indent=2)
    logger.info("Metrics saved to %s", metrics_path)

    return model, metrics


if __name__ == "__main__":
    train()
