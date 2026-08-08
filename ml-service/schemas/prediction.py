"""
Cart Rescue ML Service — Pydantic Schemas for Prediction Request/Response
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum

from schemas.features import SessionFeatures


# ── Enums ──────────────────────────────────────────────────────────────

class ActionType(str, Enum):
    DO_NOTHING = "DO_NOTHING"
    COUPON_5 = "COUPON_5"
    COUPON_10 = "COUPON_10"
    RETRY_PAYMENT = "RETRY_PAYMENT"
    COD_OPTION = "COD_OPTION"
    WHATSAPP_REMINDER = "WHATSAPP_REMINDER"
    EMAIL_REMINDER = "EMAIL_REMINDER"
    FREE_SHIPPING = "FREE_SHIPPING"
    LIVE_CHAT = "LIVE_CHAT"
    CALL_SUPPORT = "CALL_SUPPORT"
    NOTIFY_LATER = "NOTIFY_LATER"


class IntentCategory(str, Enum):
    WINDOW_SHOPPING = "WINDOW_SHOPPING"
    PRICE_COMPARISON = "PRICE_COMPARISON"
    GENUINE_PURCHASE = "GENUINE_PURCHASE"
    ACCIDENTAL_EXIT = "ACCIDENTAL_EXIT"
    PAYMENT_ISSUE = "PAYMENT_ISSUE"


class RiskLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


# ── Request ────────────────────────────────────────────────────────────

class PredictionRequest(BaseModel):
    """Request to the /predict endpoint."""
    features: SessionFeatures
    experiment_group: Optional[str] = Field(None, description="A/B test group: 'control' or 'treatment'")


# ── Response sub-models ────────────────────────────────────────────────

class RiskFactor(BaseModel):
    """A single SHAP-based risk factor."""
    feature: str = Field(..., description="Feature name")
    shap_value: float = Field(..., description="SHAP value magnitude")
    direction: str = Field(..., description="increases_risk or decreases_risk")
    description: str = Field(..., description="Human-readable explanation")


class EngagementResult(BaseModel):
    """Output from SessionIntelligenceService."""
    engagement_score: float = Field(..., ge=0, le=100)
    engagement_level: str = Field(..., description="low/medium/high")


class PaymentAnalysis(BaseModel):
    """Output from PaymentFailureAnalyzer."""
    has_payment_issue: bool
    failure_reason: Optional[str] = None
    retry_probability: float = Field(0, ge=0, le=1)
    failure_details: Optional[str] = None


class MarginCheck(BaseModel):
    """Output from MarginProtectionService."""
    coupon_allowed: bool
    max_discount_pct: float = Field(0, ge=0, le=15)
    budget_remaining: float
    reason: str


class AnomalyResult(BaseModel):
    """Output from AnomalyDetector (Isolation Forest)."""
    is_anomaly: bool
    anomaly_score: float = Field(..., ge=-1, le=1)
    anomaly_type: Optional[str] = None  # "bot", "fraud", "abnormal"


class AuditRecord(BaseModel):
    """Output from AuditLogger — complete decision trail."""
    model_config = {"protected_namespaces": ()}

    session_id: str
    risk_score: float
    risk_level: str
    intent_category: str
    recommended_action: str
    engagement_score: float
    has_payment_issue: bool
    coupon_allowed: bool
    max_discount_pct: float
    is_anomaly: bool
    model_version: str
    top_risk_factors: List[RiskFactor]
    reason: str
    timestamp: str


# ── Full Response ──────────────────────────────────────────────────────

class PredictionResponse(BaseModel):
    """Full response from the /predict endpoint."""
    model_config = {"protected_namespaces": ()}

    session_id: str
    risk_score: float = Field(..., ge=0, le=1, description="Abandonment probability (0-1)")
    risk_level: RiskLevel
    intent_category: IntentCategory
    recommended_action: ActionType
    action_reason: str = Field(..., description="Human-readable reason for the action")

    # Detailed sub-results
    engagement: EngagementResult
    payment_analysis: PaymentAnalysis
    margin_check: MarginCheck
    anomaly: AnomalyResult
    top_risk_factors: List[RiskFactor]
    audit: AuditRecord

    # Metadata
    model_version: str
    pipeline_latency_ms: float = Field(..., description="Total pipeline execution time in ms")
    twilio_dispatch: Optional[dict] = Field(None, description="Real-time Twilio SMS/WhatsApp dispatch status")

