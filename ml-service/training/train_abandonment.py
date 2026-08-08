"""
Train XGBoost Abandonment Classifier

Trains a binary classifier to predict cart abandonment (purchase yes/no).
Saves the model to saved_models/xgboost_abandonment.json
Also initializes and saves the SHAP explainer.

Usage:
    cd ml-service
    python -m training.train_abandonment
"""
import os
import sys
import logging
import json
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    roc_auc_score,
    precision_score,
    recall_score,
    f1_score,
    classification_report,
    confusion_matrix,
)
import xgboost as xgb
import joblib

# Add parent dir to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import MODEL_DIR, FEATURE_COLUMNS
from training.data_loader import load_and_prepare_data

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s │ %(levelname)-7s │ %(message)s",
)
logger = logging.getLogger(__name__)


def train():
    """Train XGBoost abandonment classifier and save model."""
    logger.info("=" * 60)
    logger.info("  Training XGBoost Abandonment Classifier")
    logger.info("=" * 60)

    # Load data
    X, y = load_and_prepare_data()
    logger.info("Data shape: X=%s, y=%s", X.shape, y.shape)
    logger.info("Class distribution: purchased=%.1f%%, abandoned=%.1f%%",
                y.mean() * 100, (1 - y.mean()) * 100)

    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    logger.info("Train: %d, Test: %d", len(X_train), len(X_test))

    # Train XGBoost
    model = xgb.XGBClassifier(
        n_estimators=200,
        max_depth=6,
        learning_rate=0.1,
        subsample=0.8,
        colsample_bytree=0.8,
        min_child_weight=3,
        gamma=0.1,
        reg_alpha=0.1,
        reg_lambda=1.0,
        random_state=42,
        eval_metric="logloss",
    )

    model.fit(
        X_train,
        y_train,
        eval_set=[(X_test, y_test)],
        verbose=True,
    )

    # Evaluate
    y_pred = model.predict(X_test)
    y_proba = model.predict_proba(X_test)[:, 1]

    roc_auc = roc_auc_score(y_test, y_proba)
    precision = precision_score(y_test, y_pred)
    recall = recall_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred)

    logger.info("\n" + "=" * 40)
    logger.info("  MODEL EVALUATION RESULTS")
    logger.info("=" * 40)
    logger.info("  ROC-AUC:   %.4f", roc_auc)
    logger.info("  Precision: %.4f", precision)
    logger.info("  Recall:    %.4f", recall)
    logger.info("  F1-Score:  %.4f", f1)
    logger.info("=" * 40)
    logger.info("\nClassification Report:\n%s", classification_report(y_test, y_pred))
    logger.info("Confusion Matrix:\n%s", confusion_matrix(y_test, y_pred))

    # Feature importance
    importance = model.feature_importances_
    feature_importance = sorted(
        zip(FEATURE_COLUMNS, importance), key=lambda x: x[1], reverse=True
    )
    logger.info("\nTop 10 Feature Importances:")
    for feat, imp in feature_importance[:10]:
        logger.info("  %-30s  %.4f", feat, imp)

    # Save model
    os.makedirs(MODEL_DIR, exist_ok=True)
    model_path = os.path.join(MODEL_DIR, "xgboost_abandonment.json")
    model.save_model(model_path)
    logger.info("\nModel saved to %s", model_path)

    # Save evaluation metrics
    metrics = {
        "roc_auc": round(roc_auc, 4),
        "precision": round(precision, 4),
        "recall": round(recall, 4),
        "f1_score": round(f1, 4),
        "train_samples": len(X_train),
        "test_samples": len(X_test),
        "feature_importance": {feat: round(float(imp), 4) for feat, imp in feature_importance},
    }
    metrics_path = os.path.join(MODEL_DIR, "xgboost_metrics.json")
    with open(metrics_path, "w") as f:
        json.dump(metrics, f, indent=2)
    logger.info("Metrics saved to %s", metrics_path)

    return model, metrics


if __name__ == "__main__":
    train()
