"""
PaymentFailureAnalyzer (Agent 2 in presentation)

Analyzes payment attempt signals to determine:
  - Whether a payment issue exists
  - The failure reason (UPI timeout, card decline, etc.)
  - Confidence in retry probability

Input signals:
  - Payment retries, UPI timeout, bank failure
  - Gateway response, card decline
"""
from schemas.features import SessionFeatures
from schemas.prediction import PaymentAnalysis


class PaymentFailureAnalyzer:
    """Classifies payment failures and estimates retry success probability."""

    # Known payment error patterns and their retry probabilities
    ERROR_PROFILES = {
        "Timeout": {
            "reason": "Payment gateway timed out",
            "retry_prob": 0.75,
            "detail": "Likely a temporary network issue — high chance of success on retry",
        },
        "Declined": {
            "reason": "Card/payment declined by bank",
            "retry_prob": 0.15,
            "detail": "Bank declined the transaction — suggest alternate payment method",
        },
        "InsufficientFunds": {
            "reason": "Insufficient funds in account",
            "retry_prob": 0.10,
            "detail": "Account balance too low — suggest smaller cart or COD",
        },
        "GatewayError": {
            "reason": "Payment gateway internal error",
            "retry_prob": 0.80,
            "detail": "Gateway-side issue — retry will likely succeed",
        },
        "UPITimeout": {
            "reason": "UPI app did not respond in time",
            "retry_prob": 0.70,
            "detail": "User may not have opened UPI app — resend payment request",
        },
        "BankServerDown": {
            "reason": "Bank server temporarily unavailable",
            "retry_prob": 0.60,
            "detail": "Bank maintenance or overload — retry after a few minutes",
        },
    }

    def analyze(self, features: SessionFeatures) -> PaymentAnalysis:
        """Analyze payment failure signals.

        Returns:
            PaymentAnalysis with failure classification and retry probability.
        """
        # No payment attempts = no payment issue
        if features.payment_attempts == 0:
            return PaymentAnalysis(
                has_payment_issue=False,
                failure_reason=None,
                retry_probability=0.0,
                failure_details=None,
            )

        # Has payment attempts but no failures = user is progressing normally
        if features.payment_failures == 0:
            return PaymentAnalysis(
                has_payment_issue=False,
                failure_reason=None,
                retry_probability=0.0,
                failure_details="Payment attempt in progress, no failures detected",
            )

        # We have payment failures — classify the failure
        error_code = features.last_payment_error or "Unknown"
        profile = self.ERROR_PROFILES.get(error_code)

        if profile:
            failure_reason = profile["reason"]
            retry_prob = profile["retry_prob"]
            detail = profile["detail"]
        else:
            failure_reason = f"Unknown payment error: {error_code}"
            retry_prob = 0.30
            detail = "Unrecognized error — recommend alternate payment method"

        # Adjust retry probability based on number of failures
        # More failures = lower chance of success on next retry
        failure_penalty = 0.15 * (features.payment_failures - 1)
        retry_prob = max(0.05, retry_prob - failure_penalty)

        # Adjust based on payment method
        if features.last_payment_method == "UPI":
            retry_prob = min(1.0, retry_prob + 0.10)  # UPI retries often succeed
        elif features.last_payment_method == "NetBanking":
            retry_prob = max(0.05, retry_prob - 0.10)  # NetBanking retries less reliable

        return PaymentAnalysis(
            has_payment_issue=True,
            failure_reason=failure_reason,
            retry_probability=round(retry_prob, 2),
            failure_details=detail,
        )
