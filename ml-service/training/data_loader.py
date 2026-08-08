"""
Data Loader — Kaggle dataset ingestion and feature engineering

Loads e-commerce clickstream/transaction datasets and transforms them
into the feature format expected by the ML models.

Supports multiple Kaggle datasets:
  1. E-commerce Clickstream and Transaction Dataset
  2. E-commerce Transactions + Clickstream
  3. Ecommerce Clickstream Dataset
  4. e-Shop Clickstream Dataset

Place CSV files in the ml-service/data/ directory.
"""
import os
import pandas as pd
import numpy as np
import logging
from typing import Tuple, Optional

from config import DATA_DIR, FEATURE_COLUMNS

logger = logging.getLogger(__name__)


def load_and_prepare_data(
    data_dir: Optional[str] = None,
) -> Tuple[pd.DataFrame, pd.Series]:
    """Load data and return (features_df, labels).

    Tries to load real Kaggle data first. If no CSV files are found,
    generates synthetic data for development/testing.

    Returns:
        (X, y) where X is a DataFrame with FEATURE_COLUMNS and y is
        a binary Series (1=purchased, 0=abandoned).
    """
    data_dir = data_dir or DATA_DIR

    # Try to find CSV files
    csv_files = [f for f in os.listdir(data_dir) if f.endswith(".csv")] if os.path.isdir(data_dir) else []

    if csv_files:
        logger.info("Found %d CSV files in %s", len(csv_files), data_dir)
        return _load_from_csv(data_dir, csv_files)
    else:
        logger.info("No CSV files found in %s. Generating synthetic data.", data_dir)
        return _generate_synthetic_data()


def _load_from_csv(
    data_dir: str, csv_files: list
) -> Tuple[pd.DataFrame, pd.Series]:
    """Load real data from all CSV files, engineer features for each, and combine."""
    all_X = []
    all_y = []

    for filename in csv_files:
        filepath = os.path.join(data_dir, filename)
        try:
            temp_df = pd.read_csv(filepath, nrows=5)
            logger.info("Loaded preview of %s: %d columns: %s", filename, len(temp_df.columns), list(temp_df.columns))
            df = pd.read_csv(filepath)
            logger.info("Loaded %s: %d rows, %d columns", filename, len(df), len(df.columns))

            res = _auto_engineer_features(df)
            if res is not None:
                X_part, y_part = res
                all_X.append(X_part)
                all_y.append(y_part)
        except Exception as e:
            logger.warning("Failed to load or process %s: %s", filename, e)

    if not all_X:
        logger.warning("Could not engineer features from any CSV files. Falling back to synthetic data.")
        return _generate_synthetic_data()

    combined_X = pd.concat(all_X, ignore_index=True)
    combined_y = pd.concat(all_y, ignore_index=True)

    logger.info("Combined total engineered sessions across %d CSV file(s): %d", len(all_X), len(combined_X))
    return combined_X, combined_y


def _auto_engineer_features(df: pd.DataFrame) -> Optional[Tuple[pd.DataFrame, pd.Series]]:
    """Automatically detect and map columns to our feature schema.

    Handles various Kaggle dataset formats.
    """
    cols_lower = {c.lower().strip(): c for c in df.columns}

    # Identify user and session columns
    user_col = None
    session_col = None
    for candidate in ["session_id", "sessionid", "session", "user_session"]:
        if candidate in cols_lower:
            session_col = cols_lower[candidate]
            break
    for candidate in ["user_id", "userid", "customer_id", "visitor_id", "visitorid"]:
        if candidate in cols_lower:
            user_col = cols_lower[candidate]
            break

    if user_col and session_col:
        group_cols = [user_col, session_col]
    elif session_col:
        group_cols = [session_col]
    elif user_col:
        group_cols = [user_col]
    else:
        logger.warning("No session/user column found. Cannot engineer features.")
        return None

    # Try to identify event type column
    event_col = None
    for candidate in ["event_type", "eventtype", "action", "event", "activity"]:
        if candidate in cols_lower:
            event_col = cols_lower[candidate]
            break

    # Try to identify purchase/conversion label column
    label_col = None
    for candidate in ["outcome", "purchased", "purchase", "converted", "conversion", "revenue", "transaction_id", "order_id", "status"]:
        if candidate in cols_lower:
            label_col = cols_lower[candidate]
            break

    logger.info("Auto-detected columns — grouping: %s, event: %s, label: %s", group_cols, event_col, label_col)

    # Engineer features per session
    sessions = df.groupby(group_cols)

    features_list = []
    labels = []

    for session_id, group in sessions:
        feat = {}
        feat["total_clicks"] = len(group)
        feat["pages_viewed"] = group[event_col].value_counts().get("view", len(group)) if event_col else len(group)
        feat["unique_pages"] = group.iloc[:, 1].nunique() if len(group.columns) > 1 else 1

        # Time features (if timestamp available)
        time_col = None
        for candidate in ["timestamp", "event_time", "time", "datetime", "date"]:
            if candidate in cols_lower:
                time_col = cols_lower[candidate]
                break

        if time_col and time_col in group.columns:
            try:
                times = pd.to_datetime(group[time_col], format='mixed', errors='coerce')
                duration = (times.max() - times.min()).total_seconds()
                feat["time_on_site_seconds"] = max(duration, 1)
                feat["avg_time_per_page"] = duration / max(feat["unique_pages"], 1)
                feat["session_hour"] = times.iloc[0].hour
                feat["day_of_week"] = times.iloc[0].dayofweek
                feat["time_since_last_action"] = max(0, (pd.Timestamp.now() - times.max()).total_seconds()) % 600
            except Exception:
                feat["time_on_site_seconds"] = len(group) * 15
                feat["avg_time_per_page"] = 15
                feat["session_hour"] = 12
                feat["day_of_week"] = 2
                feat["time_since_last_action"] = 60
        else:
            feat["time_on_site_seconds"] = len(group) * 15
            feat["avg_time_per_page"] = 15
            feat["session_hour"] = np.random.randint(8, 23)
            feat["day_of_week"] = np.random.randint(0, 7)
            feat["time_since_last_action"] = np.random.exponential(120)

        # Cart features
        if event_col:
            events = group[event_col].str.lower() if group[event_col].dtype == "object" else group[event_col].astype(str)
            feat["items_added"] = events.isin(["add_to_cart", "add", "cart"]).sum()
            feat["items_removed"] = events.isin(["remove_from_cart", "remove"]).sum()
            feat["cart_items_count"] = max(0, feat["items_added"] - feat["items_removed"])
            feat["cart_value_changes"] = feat["items_added"] + feat["items_removed"]

            # Checkout progress
            checkout_events = events.isin(["checkout", "begin_checkout", "purchase", "payment"])
            feat["checkout_progress"] = min(checkout_events.sum(), 5)

            # Payment features
            payment_events = events.isin(["payment", "purchase", "transaction"])
            feat["payment_attempts"] = payment_events.sum()
            feat["payment_failures"] = 0
        else:
            feat["items_added"] = np.random.randint(0, 5)
            feat["items_removed"] = np.random.randint(0, 2)
            feat["cart_items_count"] = max(0, feat["items_added"] - feat["items_removed"])
            feat["cart_value_changes"] = feat["items_added"] + feat["items_removed"]
            feat["checkout_progress"] = np.random.randint(0, 4)
            feat["payment_attempts"] = np.random.randint(0, 2)
            feat["payment_failures"] = 0

        # Price/value features
        price_col = None
        for candidate in ["price", "amount", "value", "revenue", "product_price"]:
            if candidate in cols_lower and cols_lower[candidate] in group.columns:
                price_col = cols_lower[candidate]
                break

        if price_col:
            try:
                feat["cart_value"] = float(pd.to_numeric(group[price_col], errors='coerce').fillna(0).sum())
            except Exception:
                feat["cart_value"] = np.random.uniform(200, 5000)
        else:
            feat["cart_value"] = np.random.uniform(200, 5000)

        # Other features
        feat["scroll_depth_avg"] = np.random.uniform(0.2, 0.9)
        feat["has_searched"] = 1 if np.random.random() > 0.7 else 0
        feat["device_type_mobile"] = 1 if np.random.random() > 0.5 else 0
        feat["returning_user"] = 1 if np.random.random() > 0.6 else 0

        features_list.append(feat)

        # Determine label (1 = purchased, 0 = abandoned)
        purchased = False
        if label_col and label_col in group.columns:
            l_vals = group[label_col].dropna().astype(str).str.lower()
            if (l_vals.isin(["yes", "true", "1", "purchase", "converted", "success"])).any():
                purchased = True
        if not purchased and event_col and event_col in group.columns:
            e_vals = group[event_col].dropna().astype(str).str.lower()
            if (e_vals.isin(["purchase", "transaction", "bought", "completed"])).any():
                purchased = True

        labels.append(1 if purchased else 0)

    # Build DataFrame
    features_df = pd.DataFrame(features_list)

    # Ensure all FEATURE_COLUMNS exist
    for col in FEATURE_COLUMNS:
        if col not in features_df.columns:
            features_df[col] = 0

    features_df = features_df[FEATURE_COLUMNS]
    labels_series = pd.Series(labels, name="purchased")

    logger.info(
        "Engineered %d sessions. Purchase rate: %.1f%%",
        len(features_df),
        labels_series.mean() * 100,
    )

    return features_df, labels_series


def _generate_synthetic_data(
    n_sessions: int = 5000,
) -> Tuple[pd.DataFrame, pd.Series]:
    """Generate realistic synthetic e-commerce session data.

    Creates sessions across different customer archetypes:
      - Window shoppers (browse, don't buy)
      - Price comparers (browse, compare, sometimes buy)
      - Genuine buyers (add to cart, checkout, buy)
      - Payment failure (try to buy, payment fails)
      - Accidental exits (engaged, then suddenly leave)
    """
    np.random.seed(42)
    data = []
    labels = []

    for i in range(n_sessions):
        # Randomly assign an archetype
        archetype = np.random.choice(
            ["window_shopper", "price_comparer", "genuine_buyer", "payment_failure", "accidental_exit"],
            p=[0.25, 0.20, 0.30, 0.15, 0.10],
        )

        if archetype == "window_shopper":
            feat = {
                "total_clicks": np.random.randint(5, 30),
                "pages_viewed": np.random.randint(3, 15),
                "time_on_site_seconds": np.random.uniform(60, 400),
                "cart_value": 0,
                "cart_items_count": 0,
                "items_added": 0,
                "items_removed": 0,
                "payment_attempts": 0,
                "payment_failures": 0,
                "scroll_depth_avg": np.random.uniform(0.2, 0.6),
                "checkout_progress": 0,
                "time_since_last_action": np.random.exponential(200),
                "unique_pages": np.random.randint(3, 12),
                "cart_value_changes": 0,
                "has_searched": np.random.choice([0, 1], p=[0.5, 0.5]),
            }
            labels.append(0)  # Doesn't buy

        elif archetype == "price_comparer":
            feat = {
                "total_clicks": np.random.randint(15, 50),
                "pages_viewed": np.random.randint(5, 20),
                "time_on_site_seconds": np.random.uniform(120, 600),
                "cart_value": np.random.uniform(500, 5000),
                "cart_items_count": np.random.randint(1, 4),
                "items_added": np.random.randint(2, 6),
                "items_removed": np.random.randint(1, 4),
                "payment_attempts": 0,
                "payment_failures": 0,
                "scroll_depth_avg": np.random.uniform(0.4, 0.8),
                "checkout_progress": np.random.randint(0, 2),
                "time_since_last_action": np.random.exponential(150),
                "unique_pages": np.random.randint(5, 15),
                "cart_value_changes": np.random.randint(3, 8),
                "has_searched": 1,
            }
            labels.append(np.random.choice([0, 1], p=[0.75, 0.25]))

        elif archetype == "genuine_buyer":
            will_buy = np.random.random() < 0.70  # 70% actually buy
            feat = {
                "total_clicks": np.random.randint(10, 40),
                "pages_viewed": np.random.randint(3, 10),
                "time_on_site_seconds": np.random.uniform(120, 480),
                "cart_value": np.random.uniform(300, 8000),
                "cart_items_count": np.random.randint(1, 6),
                "items_added": np.random.randint(1, 6),
                "items_removed": np.random.randint(0, 2),
                "payment_attempts": 1 if will_buy else 0,
                "payment_failures": 0,
                "scroll_depth_avg": np.random.uniform(0.5, 0.9),
                "checkout_progress": np.random.randint(3, 5) if will_buy else np.random.randint(1, 3),
                "time_since_last_action": np.random.exponential(60) if will_buy else np.random.exponential(180),
                "unique_pages": np.random.randint(3, 8),
                "cart_value_changes": np.random.randint(0, 3),
                "has_searched": np.random.choice([0, 1], p=[0.4, 0.6]),
            }
            labels.append(1 if will_buy else 0)

        elif archetype == "payment_failure":
            feat = {
                "total_clicks": np.random.randint(12, 35),
                "pages_viewed": np.random.randint(3, 8),
                "time_on_site_seconds": np.random.uniform(180, 500),
                "cart_value": np.random.uniform(500, 6000),
                "cart_items_count": np.random.randint(1, 5),
                "items_added": np.random.randint(1, 5),
                "items_removed": np.random.randint(0, 1),
                "payment_attempts": np.random.randint(1, 4),
                "payment_failures": np.random.randint(1, 3),
                "scroll_depth_avg": np.random.uniform(0.5, 0.85),
                "checkout_progress": np.random.randint(3, 5),
                "time_since_last_action": np.random.exponential(120),
                "unique_pages": np.random.randint(3, 7),
                "cart_value_changes": np.random.randint(0, 2),
                "has_searched": np.random.choice([0, 1], p=[0.5, 0.5]),
            }
            labels.append(np.random.choice([0, 1], p=[0.85, 0.15]))  # Usually doesn't complete

        else:  # accidental_exit
            feat = {
                "total_clicks": np.random.randint(8, 25),
                "pages_viewed": np.random.randint(2, 6),
                "time_on_site_seconds": np.random.uniform(30, 120),
                "cart_value": np.random.uniform(200, 4000),
                "cart_items_count": np.random.randint(1, 4),
                "items_added": np.random.randint(1, 4),
                "items_removed": 0,
                "payment_attempts": 0,
                "payment_failures": 0,
                "scroll_depth_avg": np.random.uniform(0.3, 0.7),
                "checkout_progress": np.random.randint(2, 5),
                "time_since_last_action": np.random.uniform(0, 30),
                "unique_pages": np.random.randint(2, 5),
                "cart_value_changes": np.random.randint(0, 2),
                "has_searched": np.random.choice([0, 1], p=[0.6, 0.4]),
            }
            labels.append(0)  # Abandoned due to accident

        # Common features for all archetypes
        feat["avg_time_per_page"] = feat["time_on_site_seconds"] / max(feat["pages_viewed"], 1)
        feat["device_type_mobile"] = np.random.choice([0, 1], p=[0.45, 0.55])
        feat["returning_user"] = np.random.choice([0, 1], p=[0.6, 0.4])
        feat["session_hour"] = np.random.randint(8, 23)
        feat["day_of_week"] = np.random.randint(0, 7)

        data.append(feat)

    df = pd.DataFrame(data)[FEATURE_COLUMNS]
    y = pd.Series(labels, name="purchased")

    logger.info(
        "Generated %d synthetic sessions. Purchase rate: %.1f%%",
        len(df),
        y.mean() * 100,
    )

    return df, y
