"""
Cart Rescue ML Service — Pydantic Schemas for Features
"""
from pydantic import BaseModel, Field
from typing import Optional


class SessionFeatures(BaseModel):
    """Aggregated session features sent from the backend Feature Cache (Redis)."""

    session_id: str = Field(..., description="Unique session identifier")
    user_id: Optional[str] = Field(None, description="User identifier if known")

    # Clickstream features
    total_clicks: int = Field(0, ge=0, description="Total clicks in session")
    pages_viewed: int = Field(0, ge=0, description="Number of page views")
    time_on_site_seconds: float = Field(0, ge=0, description="Total time on site in seconds")
    unique_pages: int = Field(0, ge=0, description="Number of unique pages visited")
    avg_time_per_page: float = Field(0, ge=0, description="Average seconds per page")
    scroll_depth_avg: float = Field(0, ge=0, le=1, description="Average scroll depth (0-1)")
    has_searched: int = Field(0, ge=0, le=1, description="1 if user performed a search")

    # Cart features
    cart_value: float = Field(0, ge=0, description="Current cart value in INR")
    cart_items_count: int = Field(0, ge=0, description="Number of items in cart")
    items_added: int = Field(0, ge=0, description="Total items added to cart")
    items_removed: int = Field(0, ge=0, description="Total items removed from cart")
    cart_value_changes: int = Field(0, ge=0, description="Number of times cart value changed")

    # Checkout & Payment features
    checkout_progress: int = Field(0, ge=0, le=5, description="Checkout step reached (0-5)")
    payment_attempts: int = Field(0, ge=0, description="Number of payment attempts")
    payment_failures: int = Field(0, ge=0, description="Number of failed payments")

    # Timing features
    time_since_last_action: float = Field(0, ge=0, description="Seconds since last user action")

    # Context features
    device_type_mobile: int = Field(0, ge=0, le=1, description="1 if mobile device")
    returning_user: int = Field(0, ge=0, le=1, description="1 if returning user")
    session_hour: int = Field(0, ge=0, le=23, description="Hour of day (0-23)")
    day_of_week: int = Field(0, ge=0, le=6, description="Day of week (0=Mon, 6=Sun)")

    # User context (for margin protection)
    user_lifetime_value: float = Field(0, ge=0, description="Customer LTV in INR")
    profit_margin_pct: float = Field(20, ge=0, le=100, description="Product profit margin %")
    discount_budget_remaining: float = Field(1000, ge=0, description="User discount budget remaining INR")
    campaign_budget_remaining: float = Field(100000, ge=0, description="Campaign budget remaining INR")

    # Payment details (for PaymentFailureAnalyzer)
    last_payment_method: Optional[str] = Field(None, description="UPI/Card/NetBanking/COD")
    last_payment_error: Optional[str] = Field(None, description="Timeout/Declined/InsufficientFunds/GatewayError")
    last_payment_gateway: Optional[str] = Field(None, description="Razorpay/Paytm/PhonePe")

    # Consent (for notification)
    consent_email: bool = Field(True, description="User consented to email")
    consent_sms: bool = Field(False, description="User consented to SMS")
    consent_whatsapp: bool = Field(False, description="User consented to WhatsApp")
    consent_push: bool = Field(True, description="User consented to push notifications")
