"""
AuditLogger (Agent 6 in presentation)

Captures the complete decision trail for every session prediction:
  - Risk score & level
  - Features used
  - Prediction details
  - Chosen action & reason
  - Model version
  - Timestamp
  - SHAP explanation

This directly satisfies the auditability guardrail requirement.
"""
from datetime import datetime, timezone
from typing import List

from schemas.features import SessionFeatures
from schemas.prediction import (
    AuditRecord,
    RiskFactor,
    EngagementResult,
    PaymentAnalysis,
    MarginCheck,
    AnomalyResult,
    ActionType,
    IntentCategory,
    RiskLevel,
)
from config import MODEL_VERSION


class AuditLogger:
    """Creates complete audit records for every prediction decision."""

    def log(
        self,
        features: SessionFeatures,
        risk_score: float,
        risk_level: RiskLevel,
        intent: IntentCategory,
        action: ActionType,
        reason: str,
        engagement: EngagementResult,
        payment: PaymentAnalysis,
        margin: MarginCheck,
        anomaly: AnomalyResult,
        top_risk_factors: List[RiskFactor],
    ) -> AuditRecord:
        """Create a structured audit record for this prediction.

        Returns:
            AuditRecord with all decision inputs and outputs
        """
        return AuditRecord(
            session_id=features.session_id,
            risk_score=round(risk_score, 4),
            risk_level=risk_level.value,
            intent_category=intent.value,
            recommended_action=action.value,
            engagement_score=engagement.engagement_score,
            has_payment_issue=payment.has_payment_issue,
            coupon_allowed=margin.coupon_allowed,
            max_discount_pct=margin.max_discount_pct,
            is_anomaly=anomaly.is_anomaly,
            model_version=MODEL_VERSION,
            top_risk_factors=top_risk_factors,
            reason=reason,
            timestamp=datetime.now(timezone.utc).isoformat(),
        )
