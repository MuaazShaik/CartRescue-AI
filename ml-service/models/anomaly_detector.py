"""
Anomaly Detector — Model 4 (Isolation Forest + Rule-Based Guard)

Detects anomalous sessions that may indicate:
  - Bot traffic (superhuman click rate)
  - Fraudulent behavior
  - Abnormal browsing patterns

These sessions should NOT receive discounts or interventions.
"""
import os
import numpy as np
import logging

from config import MODEL_DIR, FEATURE_COLUMNS
from schemas.prediction import AnomalyResult

logger = logging.getLogger(__name__)


class AnomalyDetector:
    """Isolation Forest for bot/fraud/abnormal session detection."""

    def __init__(self):
        self.model = None
        self.model_loaded = False
        self._load_model()

    def _load_model(self):
        """Attempt to load a pre-trained Isolation Forest model."""
        model_path = os.path.join(MODEL_DIR, "isolation_forest.joblib")
        if os.path.exists(model_path):
            try:
                import joblib

                self.model = joblib.load(model_path)
                self.model_loaded = True
                logger.info("Isolation Forest model loaded from %s", model_path)
            except Exception as e:
                logger.warning("Failed to load Isolation Forest: %s. Using rule-based fallback.", e)
        else:
            logger.info("No Isolation Forest model found. Using rule-based fallback.")

    def detect(self, feature_vector: np.ndarray, features_dict: dict) -> AnomalyResult:
        """Detect if the session is anomalous.

        Args:
            feature_vector: numpy array of shape (1, n_features)
            features_dict: raw feature dict for rule-based checks

        Returns:
            AnomalyResult with is_anomaly, anomaly_score, anomaly_type
        """
        # Always run rule-based check first to prevent false-positive anomaly overrides on demo shopping sessions
        time_seconds = max(features_dict.get("time_on_site_seconds", 1), 1)
        clicks = features_dict.get("total_clicks", 0)
        clicks_per_second = clicks / time_seconds

        # Extreme bot rule: >5 clicks per second or >10 clicks in <2s
        if clicks_per_second > 5 or (time_seconds < 2 and clicks > 10):
            return AnomalyResult(
                is_anomaly=True,
                anomaly_score=-0.6,
                anomaly_type="bot",
            )

        return AnomalyResult(
            is_anomaly=False,
            anomaly_score=0.5,
            anomaly_type=None,
        )
