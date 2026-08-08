"""
Twilio Real-Time Messaging Service

Sends real-time SMS or WhatsApp recovery alerts when high abandonment risk,
payment failure, or recovery discount interventions occur.

Supports both live Twilio API credentials and instant demo simulation mode.
"""
import os
import logging
import datetime
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)


class TwilioService:
    """Manages real-time Twilio SMS and WhatsApp notifications."""

    def __init__(self):
        self.account_sid = os.getenv("TWILIO_ACCOUNT_SID", "")
        self.auth_token = os.getenv("TWILIO_AUTH_TOKEN", "")
        self.from_number = os.getenv("TWILIO_PHONE_NUMBER", "+18005550199")
        self.default_to_number = os.getenv("TWILIO_TO_NUMBER", "+919876543210")

        self.is_configured = bool(
            self.account_sid
            and self.auth_token
            and not self.account_sid.startswith("AC_YOUR")
        )

        if self.is_configured:
            logger.info("Twilio Service initialized with LIVE API credentials.")
        else:
            logger.info("Twilio Service initialized in SIMULATION DEMO mode.")

    def format_recovery_message(
        self, session_id: str, action_type: str, reason: str, cart_value: float = 4499
    ) -> str:
        """Format a personalized recovery message based on AI recommendation."""
        if action_type == "RETRY_PAYMENT":
            return (
                f"🚨 [Cart Rescue Payment Alert] We noticed a payment gateway glitch on your order #{session_id[:12]}. "
                f"Tap here to complete purchase instantly via Razorpay 1-Click: https://store.example.com/pay/{session_id}"
            )
        elif action_type in ("COUPON_10", "COUPON_5"):
            pct = "10%" if "10" in action_type else "5%"
            code = "SAVE10" if "10" in action_type else "SAVE5"
            return (
                f"🎁 [Special Offer] Good news! We unlocked an exclusive {pct} discount on your ₹{cart_value:,.0f} cart! "
                f"Use code {code} at checkout: https://store.example.com/checkout?code={code}"
            )
        elif action_type == "FREE_SHIPPING":
            return (
                f"🚚 [Free Shipping Unlocked] We noticed you were filling your delivery address! "
                f"Enjoy FREE express shipping on your order today: https://store.example.com/checkout?free_shipping=true"
            )
        elif action_type in ("WHATSAPP_REMINDER", "EMAIL_REMINDER"):
            return (
                f"💬 [Cart Recovery] Hi! Your cart (₹{cart_value:,.0f}) is waiting for you. "
                f"Return now to complete your order before items run out of stock: https://store.example.com/cart"
            )
        else:
            return (
                f"✨ [Cart Rescue] Thanks for visiting! Your cart items are saved. "
                f"Resume shopping anytime: https://store.example.com/cart"
            )

    def send_recovery_notification(
        self,
        session_id: str,
        action_type: str,
        reason: str,
        cart_value: float = 4499,
        to_number: Optional[str] = None,
        is_whatsapp: bool = False,
    ) -> Dict[str, Any]:
        """Dispatch real-time SMS / WhatsApp recovery message via Twilio."""
        recipient = to_number or self.default_to_number
        message_body = self.format_recovery_message(session_id, action_type, reason, cart_value)
        timestamp = datetime.datetime.now().strftime("%I:%M:%S %p")

        if self.is_configured:
            try:
                from twilio.rest import Client

                client = Client(self.account_sid, self.auth_token)

                sender = f"whatsapp:{self.from_number}" if is_whatsapp else self.from_number
                target = f"whatsapp:{recipient}" if is_whatsapp else recipient

                message = client.messages.create(
                    body=message_body,
                    from_=sender,
                    to=target,
                )

                logger.info(
                    "Twilio LIVE dispatch success: SID=%s, recipient=%s, action=%s",
                    message.sid,
                    recipient,
                    action_type,
                )

                return {
                    "dispatched": True,
                    "mode": "LIVE_TWILIO",
                    "sid": message.sid,
                    "status": message.status or "queued",
                    "channel": "WhatsApp" if is_whatsapp else "SMS",
                    "recipient": recipient,
                    "message_body": message_body,
                    "timestamp": timestamp,
                }
            except Exception as err:
                logger.error("Twilio LIVE API dispatch failed: %s. Falling back to simulation mode.", err)

        # Fallback / Simulation mode for demo
        simulated_sid = f"SM{datetime.datetime.now().strftime('%Y%m%d%H%M%S')}{session_id[:6]}"
        logger.info(
            "Twilio SIMULATION dispatch: SID=%s, recipient=%s, action=%s",
            simulated_sid,
            recipient,
            action_type,
        )

        return {
            "dispatched": True,
            "mode": "DEMO_SIMULATION",
            "sid": simulated_sid,
            "status": "delivered",
            "channel": "WhatsApp" if is_whatsapp else "SMS",
            "recipient": recipient,
            "message_body": message_body,
            "timestamp": timestamp,
        }
