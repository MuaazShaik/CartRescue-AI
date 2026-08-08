"""
SHAP Explainer — Explains XGBoost predictions

Uses SHAP TreeExplainer for XGBoost (exact, fast for tree models).
Falls back to feature-importance-based explanation when no SHAP model
is available.

Returns top-5 risk factors with SHAP values, direction, and
human-readable descriptions.
"""
import numpy as np
import logging
from typing import List

from config import FEATURE_COLUMNS
from schemas.prediction import RiskFactor

logger = logging.getLogger(__name__)

# Human-readable descriptions for each feature
FEATURE_DESCRIPTIONS = {
    "total_clicks": "Total number of clicks in session",
    "pages_viewed": "Number of pages viewed",
    "time_on_site_seconds": "Total time spent on site",
    "cart_value": "Current cart value (₹)",
    "cart_items_count": "Number of items in cart",
    "items_added": "Items added to cart",
    "items_removed": "Items removed from cart",
    "payment_attempts": "Number of payment attempts",
    "payment_failures": "Number of payment failures",
    "scroll_depth_avg": "Average scroll depth",
    "checkout_progress": "Checkout step reached",
    "time_since_last_action": "Time since last action (seconds)",
    "unique_pages": "Unique pages visited",
    "avg_time_per_page": "Average time per page",
    "cart_value_changes": "Cart value change count",
    "has_searched": "Used search feature",
    "device_type_mobile": "Using mobile device",
    "returning_user": "Returning customer",
    "session_hour": "Time of day (hour)",
    "day_of_week": "Day of week",
}


def _format_value(feature_name: str, value: float) -> str:
    """Format a feature value for human display."""
    if feature_name == "cart_value":
        return f"₹{value:,.0f}"
    elif feature_name == "time_on_site_seconds":
        minutes = int(value // 60)
        secs = int(value % 60)
        return f"{minutes}m {secs}s"
    elif feature_name == "time_since_last_action":
        if value >= 60:
            return f"{value / 60:.1f} minutes"
        return f"{value:.0f} seconds"
    elif feature_name == "scroll_depth_avg":
        return f"{value * 100:.0f}%"
    elif feature_name in ("device_type_mobile", "returning_user", "has_searched"):
        return "Yes" if value > 0.5 else "No"
    elif feature_name == "checkout_progress":
        steps = ["Not started", "Cart", "Address", "Shipping", "Payment", "Confirmation"]
        idx = min(int(value), len(steps) - 1)
        return steps[idx]
    elif feature_name == "session_hour":
        return f"{int(value)}:00"
    elif feature_name == "day_of_week":
        days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        return days[min(int(value), 6)]
    else:
        return f"{value:.1f}" if value != int(value) else str(int(value))


class ShapExplainer:
    """Generates SHAP-based explanations for XGBoost predictions."""

    def __init__(self):
        self.explainer = None
        self.explainer_ready = False

    def initialize(self, model):
        """Initialize SHAP explainer with a trained XGBoost model."""
        try:
            import shap

            # Use shap.Explainer for XGBoost v3 compatibility
            self.explainer = shap.Explainer(model)
            self.explainer_ready = True
            logger.info("SHAP Explainer initialized successfully")
        except Exception as e:
            try:
                import shap
                self.explainer = shap.TreeExplainer(model)
                self.explainer_ready = True
                logger.info("SHAP TreeExplainer initialized successfully")
            except Exception as e2:
                logger.warning("Failed to initialize SHAP: %s. Using feature-importance fallback.", e2)
                self.explainer_ready = False

    def explain(
        self,
        feature_vector: np.ndarray,
        risk_score: float,
        top_n: int = 5,
    ) -> List[RiskFactor]:
        """Generate top-N risk factors for a prediction.

        Args:
            feature_vector: numpy array of shape (1, n_features)
            risk_score: the predicted abandonment risk score
            top_n: number of top factors to return

        Returns:
            List of RiskFactor objects sorted by absolute SHAP value
        """
        if self.explainer_ready and self.explainer is not None:
            return self._shap_explain(feature_vector, top_n)
        else:
            return self._heuristic_explain(feature_vector, risk_score, top_n)

    def _shap_explain(self, feature_vector: np.ndarray, top_n: int) -> List[RiskFactor]:
        """Use SHAP TreeExplainer for exact feature attribution."""
        shap_values = self.explainer.shap_values(feature_vector)

        # For binary classification, shap_values may be a list [class0, class1]
        if isinstance(shap_values, list):
            values = shap_values[0][0]  # Class 0 (abandon) SHAP values
        else:
            values = shap_values[0]

        feature_values = feature_vector[0]

        # Build risk factors sorted by absolute SHAP value
        factors = []
        for i, (shap_val, feat_val) in enumerate(zip(values, feature_values)):
            if i < len(FEATURE_COLUMNS):
                feat_name = FEATURE_COLUMNS[i]
                direction = "increases_risk" if shap_val > 0 else "decreases_risk"
                formatted_val = _format_value(feat_name, feat_val)
                desc = FEATURE_DESCRIPTIONS.get(feat_name, feat_name)

                factors.append(
                    RiskFactor(
                        feature=feat_name,
                        shap_value=round(abs(float(shap_val)), 4),
                        direction=direction,
                        description=f"{desc}: {formatted_val}",
                    )
                )

        # Sort by absolute SHAP value and return top N
        factors.sort(key=lambda f: f.shap_value, reverse=True)
        return factors[:top_n]

    def _heuristic_explain(
        self,
        feature_vector: np.ndarray,
        risk_score: float,
        top_n: int,
    ) -> List[RiskFactor]:
        """Heuristic explanation when SHAP is not available.

        Uses domain knowledge to identify which features likely
        contributed most to the risk score.
        """
        v = feature_vector[0]
        idx = {name: i for i, name in enumerate(FEATURE_COLUMNS)}
        factors = []

        # Assign pseudo-SHAP values based on feature deviation from "safe" values
        risk_signals = {
            "time_since_last_action": (v[idx["time_since_last_action"]], 30, True),
            "payment_failures": (v[idx["payment_failures"]], 0, True),
            "cart_value": (v[idx["cart_value"]], 5000, False),
            "checkout_progress": (v[idx["checkout_progress"]], 5, False),
            "pages_viewed": (v[idx["pages_viewed"]], 10, False),
            "items_removed": (v[idx["items_removed"]], 0, True),
            "scroll_depth_avg": (v[idx["scroll_depth_avg"]], 0.8, False),
            "time_on_site_seconds": (v[idx["time_on_site_seconds"]], 300, False),
            "cart_items_count": (v[idx["cart_items_count"]], 3, False),
            "total_clicks": (v[idx["total_clicks"]], 20, False),
        }

        for feat_name, (val, baseline, higher_is_risk) in risk_signals.items():
            if higher_is_risk:
                deviation = (val - baseline) / max(abs(baseline), 1)
            else:
                deviation = (baseline - val) / max(abs(baseline), 1)

            pseudo_shap = max(0, deviation) * 0.3  # Scale to reasonable SHAP range
            direction = "increases_risk" if deviation > 0 else "decreases_risk"
            formatted_val = _format_value(feat_name, val)
            desc = FEATURE_DESCRIPTIONS.get(feat_name, feat_name)

            factors.append(
                RiskFactor(
                    feature=feat_name,
                    shap_value=round(abs(pseudo_shap), 4),
                    direction=direction,
                    description=f"{desc}: {formatted_val}",
                )
            )

        factors.sort(key=lambda f: f.shap_value, reverse=True)
        return factors[:top_n]
