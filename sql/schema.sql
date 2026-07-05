-- UdyamAI · AgamiAI dataset schema for AWS RDS Postgres
-- Run once against your fresh DB:  psql $DATABASE_URL -f sql/schema.sql

-- ─── Bank statement accounts ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS agami_accounts (
    account_id           TEXT PRIMARY KEY,
    bank_name            TEXT,
    account_holder       TEXT,
    account_holder_address TEXT,
    account_number       TEXT UNIQUE,
    ifsc_code            TEXT,
    micr_code            TEXT,
    branch_name          TEXT,
    branch_code          TEXT,
    branch_phone         TEXT,
    account_type         TEXT,
    currency             TEXT DEFAULT 'INR',
    customer_id          TEXT,
    opening_balance      DOUBLE PRECISION,
    closing_balance      DOUBLE PRECISION,
    start_date           TIMESTAMP,
    end_date             TIMESTAMP,
    statement_date       TIMESTAMP,
    interest_rate        DOUBLE PRECISION,
    city                 TEXT,
    -- Optional GSTIN linkage (populated by matcher)
    linked_gstin         TEXT,
    ingested_at          TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_accounts_gstin ON agami_accounts (linked_gstin);
CREATE INDEX IF NOT EXISTS idx_accounts_holder ON agami_accounts (account_holder);

-- ─── Transactions ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS agami_transactions (
    txn_id           BIGSERIAL PRIMARY KEY,
    account_id       TEXT REFERENCES agami_accounts (account_id) ON DELETE CASCADE,
    txn_date         TIMESTAMP,
    value_date       DATE,
    description      TEXT,
    cheque_no        TEXT,
    debit            DOUBLE PRECISION,
    credit           DOUBLE PRECISION,
    balance          DOUBLE PRECISION,
    branch_code      TEXT,
    failed           BOOLEAN DEFAULT FALSE,
    -- Parsed fields (populated by parser at ingest time)
    txn_type         TEXT,          -- NEFT · RTGS · UPI · IMPS · CHEQUE · INTEREST · CHARGE · CASH · OTHER
    direction        TEXT,          -- 'in' or 'out'
    counterparty     TEXT,
    counterparty_ifsc TEXT,
    ref_number       TEXT
);

CREATE INDEX IF NOT EXISTS idx_txns_account ON agami_transactions (account_id);
CREATE INDEX IF NOT EXISTS idx_txns_date ON agami_transactions (txn_date);
CREATE INDEX IF NOT EXISTS idx_txns_counterparty ON agami_transactions (counterparty);
CREATE INDEX IF NOT EXISTS idx_txns_type ON agami_transactions (txn_type);

-- ─── ITR filings ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS agami_itr (
    pan                     TEXT NOT NULL,
    acknowledgement_number  TEXT PRIMARY KEY,
    name                    TEXT,
    address                 TEXT,
    area                    TEXT,
    city                    TEXT,
    state                   TEXT,
    pincode                 INT,
    state_code              TEXT,
    country_code            TEXT DEFAULT '91-INDIA',
    aadhaar                 TEXT,
    entity_type             TEXT,          -- Individual · Firm · Company
    form                    TEXT,          -- ITR-4 · ITR-5 · ITR-6
    assessment_year         TEXT,
    filing_date             DATE,
    filing_time             TIMESTAMP,
    late_filing             BOOLEAN,
    signatory               TEXT,
    income                  BIGINT,
    tax                     BIGINT,
    cess                    BIGINT,
    interest                BIGINT,
    loss                    BIGINT,
    total_payable           BIGINT,
    -- Optional GSTIN linkage (populated by matcher)
    linked_gstin            TEXT,
    ingested_at             TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_itr_pan ON agami_itr (pan);
CREATE INDEX IF NOT EXISTS idx_itr_gstin ON agami_itr (linked_gstin);
CREATE INDEX IF NOT EXISTS idx_itr_ay ON agami_itr (assessment_year);

-- ─── LR training snapshots (retrain output) ──────────────────────
CREATE TABLE IF NOT EXISTS lr_training_runs (
    run_id           BIGSERIAL PRIMARY KEY,
    started_at       TIMESTAMP DEFAULT NOW(),
    lender           TEXT NOT NULL,
    sample_count     INT,
    epochs           INT,
    accuracy         DOUBLE PRECISION,
    auc              DOUBLE PRECISION,
    weights          JSONB,
    feature_names    TEXT[]
);

CREATE INDEX IF NOT EXISTS idx_lr_lender_run ON lr_training_runs (lender, started_at DESC);
