"""
SessionIntelligenceService (Agent 1 in presentation)

Observes clickstream signals and computes an engagement score (0-100)
indicating how actively the user is interacting with the site.

Signals observed:
  - clicks, time on page, inactivity, scroll depth
  - add/remove cart, checkout progress
"""
from schemas.features import SessionFeatures
from schemas.prediction import EngagementResult


class SessionIntelligenceService:
    """Computes a weighted engagement score from session features."""

    # Weights for each engagement signal (sum = 1.0)
    WEIGHTS = {
        "click_intensity": 0.15,       # clicks per minute
        "page_depth": 0.12,            # pages viewed
        "time_on_site": 0.10,          # total time
        "scroll_engagement": 0.13,     # average scroll depth
        "cart_interaction": 0.20,      # add/remove cart activity
        "checkout_progress": 0.20,     # how far into checkout
        "recency": 0.10,              # time since last action (inverse)
    }

    def analyze(self, features: SessionFeatures) -> EngagementResult:
        """Compute engagement score from session features.

        Returns:
            EngagementResult with score (0-100) and level (low/medium/high)
        """
        scores = {}

        # Click intensity: clicks per minute of session time
        session_minutes = max(features.time_on_site_seconds / 60, 0.1)
        clicks_per_min = features.total_clicks / session_minutes
        scores["click_intensity"] = min(clicks_per_min / 10, 1.0)  # cap at 10 cpm

        # Page depth: how many pages explored
        scores["page_depth"] = min(features.pages_viewed / 15, 1.0)  # cap at 15 pages

        # Time on site: longer = more engaged (up to a point)
        scores["time_on_site"] = min(features.time_on_site_seconds / 600, 1.0)  # cap at 10 min

        # Scroll engagement: how far they scroll on average
        scores["scroll_engagement"] = features.scroll_depth_avg

        # Cart interaction: adds + removes = active shopping
        cart_actions = features.items_added + features.items_removed
        scores["cart_interaction"] = min(cart_actions / 8, 1.0)  # cap at 8 actions

        # Checkout progress: 0-5 steps, reaching payment = highly engaged
        scores["checkout_progress"] = features.checkout_progress / 5

        # Recency: inverse of time since last action (recent = engaged)
        if features.time_since_last_action < 30:
            scores["recency"] = 1.0
        elif features.time_since_last_action < 120:
            scores["recency"] = 0.7
        elif features.time_since_last_action < 300:
            scores["recency"] = 0.4
        else:
            scores["recency"] = max(0.1, 1.0 - features.time_since_last_action / 1800)

        # Weighted sum
        engagement_score = sum(
            scores[key] * weight for key, weight in self.WEIGHTS.items()
        ) * 100

        engagement_score = round(max(0, min(100, engagement_score)), 1)

        # Classify level
        if engagement_score >= 65:
            level = "high"
        elif engagement_score >= 35:
            level = "medium"
        else:
            level = "low"

        return EngagementResult(
            engagement_score=engagement_score,
            engagement_level=level,
        )
