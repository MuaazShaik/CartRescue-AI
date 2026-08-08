"""
Cart Rescue — ML Service (FastAPI)

AI-Powered Real-Time Cart Recovery & Decision Intelligence Platform
ML Service entry point with /predict endpoint.

Pipeline: Features → XGBoost → SHAP → Business Rules → Recommendation
"""
import logging
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from config import ML_HOST, ML_PORT, MODEL_VERSION
from schemas.features import SessionFeatures
from schemas.prediction import PredictionRequest, PredictionResponse
from pipeline.prediction_pipeline import PredictionPipeline

# ── Logging ────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s │ %(name)-30s │ %(levelname)-7s │ %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("cart-rescue-ml")

# ── Global pipeline instance ──────────────────────────────────────────
pipeline: PredictionPipeline = None  # type: ignore


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize the prediction pipeline on startup."""
    global pipeline
    logger.info("=" * 60)
    logger.info("  Cart Rescue ML Service Starting...")
    logger.info("  Model Version: %s", MODEL_VERSION)
    logger.info("=" * 60)

    pipeline = PredictionPipeline()

    logger.info("Pipeline initialized. Ready to serve predictions.")
    yield
    logger.info("ML Service shutting down.")


# ── FastAPI App ───────────────────────────────────────────────────────
app = FastAPI(
    title="Cart Rescue ML Service",
    description=(
        "AI-Powered Real-Time Cart Recovery & Decision Intelligence. "
        "Provides abandonment risk scoring, intent classification, "
        "margin-protected recovery recommendations, and SHAP explainability."
    ),
    version=MODEL_VERSION,
    lifespan=lifespan,
)

# CORS — allow frontend and backend to call this service
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



# ── Twilio Real-Time Messaging Routes ────────────────────────────────
@app.post("/twilio/send")
async def send_twilio_notification(payload: dict):
    """Direct real-time Twilio SMS/WhatsApp dispatch endpoint."""
    if pipeline is None:
        raise HTTPException(status_code=503, detail="Pipeline not initialized")

    session_id = payload.get("session_id", f"sess_{int(time.time())}")
    action_type = payload.get("action_type", "RETRY_PAYMENT")
    reason = payload.get("reason", "Payment failure detected on gateway.")
    cart_value = float(payload.get("cart_value", 4499))
    to_number = payload.get("to_number", None)
    is_whatsapp = bool(payload.get("is_whatsapp", False))

    res = pipeline.twilio_service.send_recovery_notification(
        session_id=session_id,
        action_type=action_type,
        reason=reason,
        cart_value=cart_value,
        to_number=to_number,
        is_whatsapp=is_whatsapp,
    )
    return res


@app.get("/twilio/status")
async def get_twilio_status():
    """Returns Twilio configuration status."""
    if pipeline is None:
        return {"configured": False, "mode": "SIMULATION"}
    return {
        "configured": pipeline.twilio_service.is_configured,
        "mode": "LIVE_TWILIO" if pipeline.twilio_service.is_configured else "DEMO_SIMULATION",
        "from_number": pipeline.twilio_service.from_number,
        "default_to": pipeline.twilio_service.default_to_number,
    }


# ── Health Check ──────────────────────────────────────────────────────
@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "cart-rescue-ml",
        "model_version": MODEL_VERSION,
        "model_loaded": pipeline.classifier.model_loaded if pipeline else False,
        "twilio_configured": pipeline.twilio_service.is_configured if pipeline else False,
    }



# ── Prediction Endpoint ──────────────────────────────────────────────
@app.post("/predict", response_model=PredictionResponse)
async def predict(request: PredictionRequest):
    """Run the full AI prediction pipeline for a session.

    Pipeline:
        SessionIntelligenceService → PaymentFailureAnalyzer
        → XGBoost → SHAP → AnomalyDetector
        → MarginProtectionService → RecoveryRecommendationService
        → AuditLogger

    Returns:
        Complete PredictionResponse with risk score, recommended action,
        SHAP explanations, and full audit trail.
    """
    if pipeline is None:
        raise HTTPException(status_code=503, detail="Pipeline not initialized")

    try:
        response = pipeline.predict(request.features)
        return response
    except Exception as e:
        logger.exception("Prediction failed for session %s", request.features.session_id)
        raise HTTPException(
            status_code=500,
            detail=f"Prediction pipeline error: {str(e)}",
        )


# ── Batch Prediction ─────────────────────────────────────────────────
@app.post("/predict/batch", response_model=list[PredictionResponse])
async def predict_batch(requests: list[PredictionRequest]):
    """Run predictions for multiple sessions (for evaluation/testing)."""
    if pipeline is None:
        raise HTTPException(status_code=503, detail="Pipeline not initialized")

    results = []
    for req in requests:
        try:
            result = pipeline.predict(req.features)
            results.append(result)
        except Exception as e:
            logger.error("Batch prediction failed for session %s: %s", req.features.session_id, e)
            raise HTTPException(
                status_code=500,
                detail=f"Batch prediction error for session {req.features.session_id}: {str(e)}",
            )
    return results


# ── Model Info ────────────────────────────────────────────────────────
@app.get("/model/info")
async def model_info():
    """Return information about loaded models and their status."""
    if pipeline is None:
        raise HTTPException(status_code=503, detail="Pipeline not initialized")

    return {
        "model_version": MODEL_VERSION,
        "xgboost_loaded": pipeline.classifier.model_loaded,
        "isolation_forest_loaded": pipeline.anomaly_detector.model_loaded,
        "shap_available": pipeline.shap_explainer.explainer_ready,
        "feature_columns": pipeline.classifier.get_feature_vector.__doc__,
        "services": [
            "SessionIntelligenceService",
            "PaymentFailureAnalyzer",
            "MarginProtectionService",
            "RecoveryRecommendationService",
            "AuditLogger",
            "AnomalyDetector",
        ],
    }


# ── Real Dataset Live Sessions ───────────────────────────────────────
@app.get("/dataset/live-sessions", response_model=list[PredictionResponse])
async def dataset_live_sessions(count: int = 6):
    """Retrieve real engineered sessions from the Kaggle dataset and evaluate them live through the ML pipeline."""
    if pipeline is None:
        raise HTTPException(status_code=503, detail="Pipeline not initialized")

    try:
        from training.data_loader import load_and_prepare_data
        X_df, _ = load_and_prepare_data()
        
        # Take up to 'count' distinct sessions from dataset
        sample_df = X_df.head(count)
        results = []
        
        for idx, row in sample_df.iterrows():
            session_id = f"ds_sess_{idx+101}"
            features = SessionFeatures(
                session_id=session_id,
                user_id=f"usr_kg_{idx+1000}",
                total_clicks=int(row["total_clicks"]),
                pages_viewed=int(row["pages_viewed"]),
                time_on_site_seconds=float(row["time_on_site_seconds"]),
                unique_pages=int(row["unique_pages"]),
                avg_time_per_page=float(row["avg_time_per_page"]),
                scroll_depth_avg=float(row["scroll_depth_avg"]),
                has_searched=int(row["has_searched"]),
                cart_value=float(row["cart_value"]),
                cart_items_count=int(row["cart_items_count"]),
                items_added=int(row["items_added"]),
                items_removed=int(row["items_removed"]),
                cart_value_changes=int(row["cart_value_changes"]),
                checkout_progress=int(row["checkout_progress"]),
                payment_attempts=int(row["payment_attempts"]),
                payment_failures=int(row["payment_failures"]),
                time_since_last_action=float(row["time_since_last_action"]),
                device_type_mobile=int(row["device_type_mobile"]),
                returning_user=int(row["returning_user"]),
                session_hour=int(row["session_hour"]),
                day_of_week=int(row["day_of_week"]),
                user_lifetime_value=float(row["cart_value"]) * 2.5 + 2000,
                profit_margin_pct=22.0,
                discount_budget_remaining=500.0,
                campaign_budget_remaining=50000.0,
                last_payment_method="UPI" if row["payment_attempts"] > 0 else None,
                last_payment_error="UPITimeout" if row["payment_failures"] > 0 else None,
                consent_email=True,
                consent_sms=False,
                consent_whatsapp=True,
                consent_push=True,
            )
            
            res = pipeline.predict(features)
            results.append(res)
            
        return results
    except Exception as e:
        logger.exception("Failed to generate live dataset sessions")
        raise HTTPException(status_code=500, detail=f"Error evaluating dataset sessions: {str(e)}")


# ── Run ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host=ML_HOST,
        port=ML_PORT,
        reload=True,
        log_level="info",
    )
