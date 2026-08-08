-- ============================================================================
-- Cart Rescue Platform — PostgreSQL Schema (12 Tables)
-- Track 2: Cart Rescue — Abandonment Diagnosis & Remediation Agent
-- ============================================================================

-- 1. Users
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    lifetime_value DECIMAL(12, 2) DEFAULT 0.00,
    consent_email BOOLEAN DEFAULT TRUE,
    consent_sms BOOLEAN DEFAULT FALSE,
    consent_whatsapp BOOLEAN DEFAULT TRUE,
    consent_push BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Sessions
CREATE TABLE IF NOT EXISTS sessions (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) REFERENCES users(id),
    status VARCHAR(32) DEFAULT 'ACTIVE',
    device_type VARCHAR(32) DEFAULT 'mobile',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP WITH TIME ZONE
);

-- 3. Clickstream Events
CREATE TABLE IF NOT EXISTS clickstream_events (
    id BIGSERIAL PRIMARY KEY,
    session_id VARCHAR(64) REFERENCES sessions(id),
    event_type VARCHAR(64) NOT NULL,
    page_url VARCHAR(512),
    payload JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Cart Items
CREATE TABLE IF NOT EXISTS cart_items (
    id BIGSERIAL PRIMARY KEY,
    session_id VARCHAR(64) REFERENCES sessions(id),
    product_id VARCHAR(64) NOT NULL,
    product_name VARCHAR(255),
    price DECIMAL(10, 2) NOT NULL,
    quantity INT DEFAULT 1,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Payment Attempts
CREATE TABLE IF NOT EXISTS payment_attempts (
    id BIGSERIAL PRIMARY KEY,
    session_id VARCHAR(64) REFERENCES sessions(id),
    payment_method VARCHAR(32), -- UPI, Card, NetBanking, COD
    gateway VARCHAR(32),        -- Razorpay, Paytm, PhonePe
    status VARCHAR(32) NOT NULL, -- SUCCESS, FAILED, PENDING
    error_code VARCHAR(64),
    error_message TEXT,
    attempt_number INT DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Discount Budget (Per-user)
CREATE TABLE IF NOT EXISTS discount_budget (
    user_id VARCHAR(64) PRIMARY KEY REFERENCES users(id),
    total_budget DECIMAL(10, 2) DEFAULT 1000.00,
    spent_budget DECIMAL(10, 2) DEFAULT 0.00,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Campaign Budget
CREATE TABLE IF NOT EXISTS campaign_budget (
    id VARCHAR(64) PRIMARY KEY,
    campaign_name VARCHAR(255) NOT NULL,
    total_budget DECIMAL(12, 2) DEFAULT 100000.00,
    spent_budget DECIMAL(12, 2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Recommendations (AI Agent Decisions)
CREATE TABLE IF NOT EXISTS recommendations (
    id VARCHAR(64) PRIMARY KEY,
    session_id VARCHAR(64) REFERENCES sessions(id),
    risk_score DECIMAL(5, 4) NOT NULL,
    risk_level VARCHAR(32) NOT NULL,
    intent_category VARCHAR(32) NOT NULL,
    recommended_action VARCHAR(64) NOT NULL,
    action_reason TEXT,
    is_delivered BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(64) PRIMARY KEY,
    session_id VARCHAR(64) REFERENCES sessions(id),
    user_id VARCHAR(64) REFERENCES users(id),
    channel VARCHAR(32) NOT NULL, -- EMAIL, SMS, WHATSAPP, PUSH
    provider VARCHAR(32) NOT NULL, -- SendGrid, Twilio, Firebase, Mock
    status VARCHAR(32) DEFAULT 'SENT',
    payload JSONB,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. Audit Logs (Satisfies Auditability Guardrail)
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    session_id VARCHAR(64) NOT NULL,
    risk_score DECIMAL(5, 4) NOT NULL,
    risk_level VARCHAR(32) NOT NULL,
    intent_category VARCHAR(32) NOT NULL,
    recommended_action VARCHAR(64) NOT NULL,
    engagement_score DECIMAL(5, 2),
    has_payment_issue BOOLEAN,
    coupon_allowed BOOLEAN,
    max_discount_pct DECIMAL(5, 2),
    is_anomaly BOOLEAN,
    model_version VARCHAR(32) NOT NULL,
    top_risk_factors JSONB,
    reason TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. Experiments (A/B Testing Control vs AI Platform)
CREATE TABLE IF NOT EXISTS experiments (
    id BIGSERIAL PRIMARY KEY,
    session_id VARCHAR(64) REFERENCES sessions(id),
    group_name VARCHAR(32) NOT NULL, -- CONTROL, TREATMENT
    action_taken VARCHAR(64) NOT NULL,
    converted BOOLEAN DEFAULT FALSE,
    revenue_recovered DECIMAL(10, 2) DEFAULT 0.00,
    discount_spent DECIMAL(10, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 12. Purchase Labels (Ground Truth for ML Evaluation)
CREATE TABLE IF NOT EXISTS purchase_labels (
    session_id VARCHAR(64) PRIMARY KEY REFERENCES sessions(id),
    purchased BOOLEAN NOT NULL,
    order_id VARCHAR(64),
    total_amount DECIMAL(10, 2),
    labeled_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
