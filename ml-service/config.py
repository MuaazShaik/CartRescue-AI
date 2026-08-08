"""
Cart Rescue ML Service — Configuration
"""
import os
from dotenv import load_dotenv

load_dotenv()

# Server
ML_HOST = os.getenv("ML_SERVICE_HOST", "0.0.0.0")
ML_PORT = int(os.getenv("ML_SERVICE_PORT", "8000"))

# Redis Feature Cache
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", "6379"))
REDIS_PASSWORD = os.getenv("REDIS_PASSWORD", "")

# Model paths
MODEL_DIR = os.path.join(os.path.dirname(__file__), "saved_models")
DATA_DIR = os.path.join(os.path.dirname(__file__), "data")

# Model configuration
MODEL_VERSION = os.getenv("MODEL_VERSION", "1.0.0")
RISK_THRESHOLD = float(os.getenv("RISK_THRESHOLD", "0.7"))
MAX_DISCOUNT_PCT = int(os.getenv("MAX_DISCOUNT_PCT", "15"))
DEFAULT_CAMPAIGN_BUDGET = float(os.getenv("DEFAULT_CAMPAIGN_BUDGET", "100000"))

# Feature columns used by XGBoost (order matters for prediction)
FEATURE_COLUMNS = [
    "total_clicks",
    "pages_viewed",
    "time_on_site_seconds",
    "cart_value",
    "cart_items_count",
    "items_added",
    "items_removed",
    "payment_attempts",
    "payment_failures",
    "scroll_depth_avg",
    "checkout_progress",
    "time_since_last_action",
    "unique_pages",
    "avg_time_per_page",
    "cart_value_changes",
    "has_searched",
    "device_type_mobile",
    "returning_user",
    "session_hour",
    "day_of_week",
]
