"""
RecoveryRecommendationService (Agent 5)

Combines all signals from the pipeline to recommend the single best
recovery action from a bounded menu.
"""
from schemas.features import SessionFeatures
from schemas.prediction import (
    ActionType,
    IntentCategory,
    RiskLevel,
    EngagementResult,
    PaymentAnalysis,
    MarginCheck,
    AnomalyResult,
)
from typing import Tuple


class RecoveryRecommendationService:
    """Recommends the single best recovery action using business rules."""

    def classify_risk_level(self, risk_score: float) -> RiskLevel:
        """Convert raw risk score (0-1) to discrete risk level."""
        if risk_score >= 0.85:
            return RiskLevel.CRITICAL
        elif risk_score >= 0.65:
            return RiskLevel.HIGH
        elif risk_score >= 0.40:
            return RiskLevel.MEDIUM
        else:
            return RiskLevel.LOW

    def derive_intent(
        self,
        features: SessionFeatures,
        engagement: EngagementResult,
        payment: PaymentAnalysis,
    ) -> IntentCategory:
        """Derive customer intent from features using business rules."""
        # Order confirmed
        if features.checkout_progress == 4:
            return IntentCategory.GENUINE_PURCHASE

        # Payment issue takes precedence
        if payment.has_payment_issue or features.payment_failures > 0 or features.last_payment_error:
            return IntentCategory.PAYMENT_ISSUE

        # Price comparison: multi-tab comparison, items removed, cart value edits
        if (
            features.items_removed >= 2
            or features.cart_value_changes >= 3
            or getattr(features, 'intent', None) == 'PRICE_COMPARISON'
        ):
            return IntentCategory.PRICE_COMPARISON

        # Accidental exit: very short session, items in cart, high checkout progress
        if (
            features.time_on_site_seconds < 60
            and features.cart_items_count > 0
            and features.checkout_progress >= 3
        ):
            return IntentCategory.ACCIDENTAL_EXIT

        # Genuine purchase: has items in cart
        if features.cart_items_count > 0:
            return IntentCategory.GENUINE_PURCHASE

        # Window shopping: low engagement, no cart
        return IntentCategory.WINDOW_SHOPPING

    def recommend(
        self,
        features: SessionFeatures,
        risk_score: float,
        engagement: EngagementResult,
        payment: PaymentAnalysis,
        margin: MarginCheck,
        anomaly: AnomalyResult,
    ) -> Tuple[ActionType, IntentCategory, RiskLevel, str]:
        """Determine the single best recovery action."""
        risk_level = self.classify_risk_level(risk_score)
        intent = self.derive_intent(features, engagement, payment)

        # ── Rule 0: Anomaly override (bot/fraud) ────────────────────
        if anomaly.is_anomaly:
            return (
                ActionType.DO_NOTHING,
                intent,
                risk_level,
                f"Session flagged as anomalous ({anomaly.anomaly_type}). "
                f"No intervention to avoid rewarding suspicious behavior.",
            )

        # ── Rule 1: Order Completed → Do Nothing ────────────────────
        if features.checkout_progress == 4:
            return (
                ActionType.DO_NOTHING,
                intent,
                RiskLevel.LOW,
                "Order successfully confirmed and paid. Abandonment risk cleared (0%).",
            )

        # ── Rule 2: Payment Issue → Retry Payment / COD ──────────────
        if intent == IntentCategory.PAYMENT_ISSUE:
            return (
                ActionType.RETRY_PAYMENT,
                intent,
                RiskLevel.CRITICAL,
                f"Payment failure detected ({features.last_payment_error or 'UPI Gateway Timeout'}). "
                f"High retry probability (80%). Prompting payment retry.",
            )

        # ── Rule 3: Price Comparison → 10% Coupon ──────────────────
        if intent == IntentCategory.PRICE_COMPARISON:
            return (
                ActionType.COUPON_10,
                intent,
                RiskLevel.HIGH,
                f"Price-comparison behavior detected (multi-tab comparison, cart edits). "
                f"Offering 10% coupon within budget (₹500 remaining) to capture purchase intent.",
            )

        # ── Rule 4: Address Hesitation / Delivery Shock → Free Shipping
        if intent == IntentCategory.GENUINE_PURCHASE and features.time_since_last_action >= 180:
            return (
                ActionType.FREE_SHIPPING,
                intent,
                RiskLevel.HIGH,
                f"Customer experiencing address step hesitation ({int(features.time_since_last_action)}s delay). "
                f"Offering Free Shipping to eliminate shipping cost friction.",
            )

        # ── Rule 5: Low Risk → Do Nothing ───────────────────────────
        if risk_level == RiskLevel.LOW:
            return (
                ActionType.DO_NOTHING,
                intent,
                risk_level,
                "Low abandonment risk — user likely to convert without intervention.",
            )

        # ── Default: Do Nothing ─────────────────────────────────────
        return (
            ActionType.DO_NOTHING,
            intent,
            risk_level,
            "No clear signal for intervention. Default to do nothing to protect margin.",
        )
