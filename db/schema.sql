-- ILRP Database Schema
-- PostgreSQL 15 Alpine

-- Enable UUID extension for DLT audit IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- BRANDS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS brands (
    id              SERIAL PRIMARY KEY,
    brand_key       VARCHAR(64) UNIQUE NOT NULL,
    name            VARCHAR(128) NOT NULL,
    logo_url        VARCHAR(512),
    category        VARCHAR(64),
    points_per_gbp  NUMERIC(10,2) DEFAULT 1.0,
    reward_types    JSONB DEFAULT '[]'::jsonb,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CUSTOMERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS customers (
    id                  SERIAL PRIMARY KEY,
    customer_id         VARCHAR(32) UNIQUE NOT NULL,
    name                VARCHAR(128) NOT NULL,
    email               VARCHAR(256),
    points              INTEGER DEFAULT 0,
    tier                VARCHAR(32) DEFAULT 'Silver',
    engagement_score    NUMERIC(4,3) DEFAULT 0.0,
    behaviors           JSONB DEFAULT '{}'::jsonb,
    signals             JSONB DEFAULT '[]'::jsonb,
    rewards_history     JSONB DEFAULT '[]'::jsonb,
    expiring_points     INTEGER DEFAULT 0,
    days_until_expiry   INTEGER,
    goals               JSONB DEFAULT '[]'::jsonb,
    challenges_completed INTEGER DEFAULT 0,
    badges              INTEGER DEFAULT 0,
    streak_days         INTEGER DEFAULT 0,
    leaderboard_rank    INTEGER,
    personality_insights JSONB DEFAULT '{}'::jsonb,
    motive_scores       JSONB DEFAULT '{}'::jsonb,
    wallet_address      VARCHAR(128),
    alphamed_points     INTEGER DEFAULT 0,
    cavendish_points    INTEGER DEFAULT 0,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TRANSACTIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS transactions (
    id              SERIAL PRIMARY KEY,
    customer_id     VARCHAR(32) NOT NULL,
    tx_type         VARCHAR(32) NOT NULL, -- 'EARN', 'REDEEM', 'EXPIRE', 'TRANSFER', 'CONVERT'
    points          INTEGER NOT NULL,
    description     VARCHAR(256),
    brand_key       VARCHAR(64),
    reward_name     VARCHAR(128),
    status          VARCHAR(32) DEFAULT 'COMPLETED', -- 'PENDING', 'COMPLETED', 'FAILED', 'REVERSED'
    dlt_tx_hash     VARCHAR(128),
    blockchain_metadata JSONB DEFAULT '{}'::jsonb,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- DLT_AUDIT TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS dlt_audit (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id     VARCHAR(32) NOT NULL,
    operation       VARCHAR(32) NOT NULL, -- 'MINT', 'BURN', 'TRANSFER'
    amount          INTEGER NOT NULL,
    from_address    VARCHAR(128),
    to_address      VARCHAR(128),
    tx_hash         VARCHAR(128),
    block_number    BIGINT,
    block_timestamp TIMESTAMPTZ,
    gas_used        NUMERIC(20,0),
    gas_price_gwei  NUMERIC(18,8),
    network         VARCHAR(64) DEFAULT 'besu-local',
    status          VARCHAR(32) DEFAULT 'CONFIRMED', -- 'PENDING', 'CONFIRMED', 'FAILED'
    error_message   TEXT,
    metadata        JSONB DEFAULT '{}'::jsonb,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_customers_customer_id ON customers(customer_id);
CREATE INDEX IF NOT EXISTS idx_customers_tier ON customers(tier);
CREATE INDEX IF NOT EXISTS idx_transactions_customer_id ON transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(tx_type);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_dlt_audit_customer_id ON dlt_audit(customer_id);
CREATE INDEX IF NOT EXISTS idx_dlt_audit_operation ON dlt_audit(operation);
CREATE INDEX IF NOT EXISTS idx_dlt_audit_tx_hash ON dlt_audit(tx_hash);

-- ============================================================
-- UPDATED_AT trigger
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_brands_updated_at
    BEFORE UPDATE ON brands
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
