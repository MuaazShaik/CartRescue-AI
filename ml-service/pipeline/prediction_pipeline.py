"""
Prediction Pipeline — Orchestrates the full AI Agent pipeline

Flow:
  Features → SessionIntelligenceService → PaymentFailureAnalyzer
           → XGBoost → SHAP → AnomalyDetector
           → MarginProtectionService → RecoveryRecommendationService
           → TwilioService (Real-Time SMS/WhatsApp Alert)
           → AuditLogger → Response
"""
import time
import logging
import numpy as np
from typing import Dict, Any

from config import FEATURE_COLUMNS, MODEL_VERSION
from schemas.features import SessionFeatures
from schemas.prediction import PredictionResponse

from services.session_intelligence_service import SessionIntelligenceService
from services.payment_failure_analyzer import PaymentFailureAnalyzer
from services.margin_protection_service import MarginProtectionService
from services.recovery_recommendation_service import RecoveryRecommendationService
from services.twilio_service import TwilioService
from services.audit_logger import AuditLogger
from models.abandonment_classifier import AbandonmentClassifier
from models.anomaly_detector import AnomalyDetector
from explainability.shap_explainer import ShapExplainer

logger = logging.getLogger(__name__)


class PredictionPipeline:
    """Orchestrates the full prediction pipeline (Chain of Responsibility)."""

    def __init__(self):
        # Initialize all services (agents)
        self.session_intelligence = SessionIntelligenceService()
        self.payment_analyzer = PaymentFailureAnalyzer()
        self.margin_protection = MarginProtectionService()
        self.recovery_recommendation = RecoveryRecommendationService()
        self.twilio_service = TwilioService()
        self.audit_logger = AuditLogger()

        # Initialize ML models
        self.classifier = AbandonmentClassifier()
        self.anomaly_detector = AnomalyDetector()

        # Initialize explainer
        self.shap_explainer = ShapExplainer()

        # If XGBoost model is loaded, initialize SHAP with it
        if self.classifier.model_loaded and self.classifier.model is not None:
            self.shap_explainer.initialize(self.classifier.model)

        logger.info("Prediction pipeline initialized. Model loaded: %s", self.classifier.model_loaded)

    def predict(self, features: SessionFeatures) -> PredictionResponse:
        """Execute the full prediction pipeline."""
        start_time = time.time()

        # ── Step 1: Prepare feature vector ──────────────────────────
        features_dict = self._extract_ml_features(features)
        feature_vector = self.classifier.get_feature_vector(features_dict)

        # ── Step 2: SessionIntelligenceService (Agent 1) ────────────
        engagement = self.session_intelligence.analyze(features)

        # ── Step 3: PaymentFailureAnalyzer (Agent 2) ────────────────
        payment = self.payment_analyzer.analyze(features)

        # ── Step 4: XGBoost Classification ──────────────────────────
        risk_score = self.classifier.predict(feature_vector)

        # ── Step 5: SHAP Explainability ─────────────────────────────
        top_risk_factors = self.shap_explainer.explain(
            feature_vector, risk_score, top_n=5
        )

        # ── Step 6: Anomaly Detection (parallel side-channel) ──────
        anomaly = self.anomaly_detector.detect(feature_vector, features_dict)

        # ── Step 7: MarginProtectionService (Agent 4) ───────────────
        margin = self.margin_protection.analyze(features)

        # ── Step 8: RecoveryRecommendationService (Agent 5) ─────────
        action, intent, risk_level, reason = self.recovery_recommendation.recommend(
            features=features,
            risk_score=risk_score,
            engagement=engagement,
            payment=payment,
            margin=margin,
            anomaly=anomaly,
        )

        # ── Step 9: Twilio Real-Time Messaging ─────────────────────
        twilio_dispatch = None
        if action.value != "DO_NOTHING" or risk_level.value in ("HIGH", "CRITICAL"):
            twilio_dispatch = self.twilio_service.send_recovery_notification(
                session_id=features.session_id,
                action_type=action.value,
                reason=reason,
                cart_value=features.cart_value,
            )

        # ── Step 10: AuditLogger (Agent 6) ─────────────────────────
        audit = self.audit_logger.log(
            features=features,
            risk_score=risk_score,
            risk_level=risk_level,
            intent=intent,
            action=action,
            reason=reason,
            engagement=engagement,
            payment=payment,
            margin=margin,
            anomaly=anomaly,
            top_risk_factors=top_risk_factors,
        )

        # ── Assemble response ──────────────────────────────────────
        pipeline_latency = (time.time() - start_time) * 1000  # Convert to ms

        response = PredictionResponse(
            session_id=features.session_id,
            risk_score=risk_score,
            risk_level=risk_level,
            intent_category=intent,
            recommended_action=action,
            action_reason=reason,
            engagement=engagement,
            payment_analysis=payment,
            margin_check=margin,
            anomaly=anomaly,
            top_risk_factors=top_risk_factors,
            audit=audit,
            model_version=MODEL_VERSION,
            pipeline_latency_ms=round(pipeline_latency, 2),
            twilio_dispatch=twilio_dispatch,
        )

        logger.info(
            "Pipeline completed for session %s: risk=%.4f, action=%s, twilio=%s, latency=%.1fms",
            features.session_id,
            risk_score,
            action.value,
            bool(twilio_dispatch),
            pipeline_latency,
        )

        return response

    def _extract_ml_features(self, features: SessionFeatures) -> Dict[str, Any]:
        """Extract the ML feature columns from SessionFeatures into a flat dict."""
        return {
            "total_clicks": features.total_clicks,
            "pages_viewed": features.pages_viewed,
            "time_on_site_seconds": features.time_on_site_seconds,
            "cart_value": features.cart_value,
            "cart_items_count": features.cart_items_count,
            "items_added": features.items_added,
            "items_removed": features.items_removed,
            "payment_attempts": features.payment_attempts,
            "payment_failures": features.payment_failures,
            "scroll_depth_avg": features.scroll_depth_avg,
            "checkout_progress": features.checkout_progress,
            "time_since_last_action": features.time_since_last_action,
            "unique_pages": features.unique_pages,
            "avg_time_per_page": features.avg_time_per_page,
            "cart_value_changes": features.cart_value_changes,
            "has_searched": features.has_searched,
            "device_type_mobile": features.device_type_mobile,
            "returning_user": features.returning_user,
            "session_hour": features.session_hour,
            "day_of_week": features.day_of_week,
        }
