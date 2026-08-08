"""
MarginProtectionService (Agent 4 in presentation)

Enforces business guardrails on discounting:
  - Per-user lifetime discount budget
  - Per-campaign discount budget
  - Profit margin constraints
  - LTV-based discount eligibility

Decides:
  - Is a coupon allowed?
  - What is the maximum discount percentage?
"""
from schemas.features import SessionFeatures
from schemas.prediction import MarginCheck


class MarginProtectionService:
    """Enforces margin guardrails and budget constraints on discounting."""

    # Minimum profit margin to protect (don't discount below this)
    MIN_MARGIN_PCT = 5.0

    # LTV tiers for discount eligibility
    LTV_TIERS = {
        "high": {"min_ltv": 10000, "max_discount": 15, "budget_multiplier": 1.5},
        "medium": {"min_ltv": 3000, "max_discount": 10, "budget_multiplier": 1.0},
        "low": {"min_ltv": 0, "max_discount": 5, "budget_multiplier": 0.5},
    }

    def analyze(self, features: SessionFeatures) -> MarginCheck:
        """Check if a discount is allowed and determine maximum discount.

        Returns:
            MarginCheck with coupon_allowed, max_discount_pct, budget_remaining, reason
        """
        reasons = []

        # 1. Check campaign budget
        if features.campaign_budget_remaining <= 0:
            return MarginCheck(
                coupon_allowed=False,
                max_discount_pct=0,
                budget_remaining=0,
                reason="Campaign discount budget exhausted",
            )

        # 2. Check per-user discount budget
        if features.discount_budget_remaining <= 0:
            return MarginCheck(
                coupon_allowed=False,
                max_discount_pct=0,
                budget_remaining=0,
                reason="Per-user discount budget exhausted",
            )

        # 3. Check profit margin constraint
        effective_margin = features.profit_margin_pct
        max_possible_discount = effective_margin - self.MIN_MARGIN_PCT
        if max_possible_discount <= 0:
            return MarginCheck(
                coupon_allowed=False,
                max_discount_pct=0,
                budget_remaining=features.discount_budget_remaining,
                reason=f"Profit margin too thin ({effective_margin}%) to offer discount",
            )

        # 4. Determine LTV tier
        ltv = features.user_lifetime_value
        if ltv >= self.LTV_TIERS["high"]["min_ltv"]:
            tier = self.LTV_TIERS["high"]
            tier_name = "high"
        elif ltv >= self.LTV_TIERS["medium"]["min_ltv"]:
            tier = self.LTV_TIERS["medium"]
            tier_name = "medium"
        else:
            tier = self.LTV_TIERS["low"]
            tier_name = "low"

        # 5. Calculate maximum discount
        max_discount = min(
            tier["max_discount"],           # LTV tier cap
            max_possible_discount,          # margin constraint
        )

        # 6. Check if discount amount fits within budgets
        discount_amount = features.cart_value * (max_discount / 100)
        if discount_amount > features.discount_budget_remaining:
            max_discount = (features.discount_budget_remaining / max(features.cart_value, 1)) * 100
            max_discount = max(0, min(max_discount, tier["max_discount"]))
            reasons.append("Discount capped by remaining user budget")

        if discount_amount > features.campaign_budget_remaining:
            max_discount = (features.campaign_budget_remaining / max(features.cart_value, 1)) * 100
            max_discount = max(0, min(max_discount, tier["max_discount"]))
            reasons.append("Discount capped by remaining campaign budget")

        max_discount = round(max_discount, 1)
        coupon_allowed = max_discount > 0

        if coupon_allowed and not reasons:
            reasons.append(
                f"LTV tier '{tier_name}' (₹{ltv:,.0f}), "
                f"margin {effective_margin}%, max discount {max_discount}%"
            )

        return MarginCheck(
            coupon_allowed=coupon_allowed,
            max_discount_pct=max_discount,
            budget_remaining=round(features.discount_budget_remaining, 2),
            reason=" | ".join(reasons) if reasons else "Discount approved within guardrails",
        )
