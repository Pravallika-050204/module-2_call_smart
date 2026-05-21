-- ==========================================
-- PostgreSQL Migration/Init Script for Module M2
-- AI Call Reviewer Tables
-- ==========================================

-- Scorecards Table
CREATE TABLE IF NOT EXISTS scorecards (
    id VARCHAR(255) PRIMARY KEY,
    tenant_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    questions JSONB NOT NULL DEFAULT '[]'::jsonb,
    scoring_conditions JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    version VARCHAR(50) NOT NULL DEFAULT 'v1',
    lifecycle_state VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Call Scores Table
CREATE TABLE IF NOT EXISTS call_scores (
    id VARCHAR(255) PRIMARY KEY,
    call_id VARCHAR(255) NOT NULL,
    tenant_id VARCHAR(255) NOT NULL,
    scorecard_id VARCHAR(255) NOT NULL,
    scorecard_version VARCHAR(50) NOT NULL,
    ai_answers JSONB NOT NULL DEFAULT '[]'::jsonb,
    total_score INTEGER NOT NULL,
    confidence_score NUMERIC(4,3) NOT NULL,
    flagged_review BOOLEAN NOT NULL DEFAULT FALSE,
    talk_ratio JSONB NOT NULL DEFAULT '{}'::jsonb,
    question_rate NUMERIC(6,2) NOT NULL DEFAULT 0.00,
    longest_monologue INTEGER NOT NULL DEFAULT 0,
    scoring_source VARCHAR(50) NOT NULL DEFAULT 'AI_MODEL',
    scored_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT unique_call_scorecard_version UNIQUE (call_id, scorecard_id, scorecard_version)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_scorecards_tenant ON scorecards(tenant_id);
CREATE INDEX IF NOT EXISTS idx_call_scores_tenant_call ON call_scores(tenant_id, call_id);
CREATE INDEX IF NOT EXISTS idx_call_scores_scorecard ON call_scores(scorecard_id);

-- Ensure tags and summary columns exist
ALTER TABLE call_scores ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb;
ALTER TABLE call_scores ADD COLUMN IF NOT EXISTS summary TEXT DEFAULT '';
ALTER TABLE call_scores ADD COLUMN IF NOT EXISTS is_reviewed BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE call_scores ADD COLUMN IF NOT EXISTS reviewer_notes TEXT DEFAULT '';
ALTER TABLE call_scores ADD COLUMN IF NOT EXISTS original_score INTEGER DEFAULT NULL;


-- Trackers Table
CREATE TABLE IF NOT EXISTS trackers (
    id VARCHAR(255) PRIMARY KEY,
    tenant_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    business_question TEXT NOT NULL,
    description TEXT,
    type VARCHAR(100) NOT NULL,
    scope VARCHAR(100) NOT NULL,
    speaker_side VARCHAR(100) NOT NULL,
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Tracker Detections Table
CREATE TABLE IF NOT EXISTS tracker_detections (
    id VARCHAR(255) PRIMARY KEY,
    tracker_id VARCHAR(255) NOT NULL,
    call_id VARCHAR(255),
    email_id VARCHAR(255),
    tenant_id VARCHAR(255) NOT NULL,
    deal_id VARCHAR(255),
    contact_id VARCHAR(255),
    snippet TEXT NOT NULL,
    timestamp_ms BIGINT,
    confidence_score NUMERIC(4,3) NOT NULL,
    detection_source VARCHAR(100) NOT NULL,
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT fk_tracker FOREIGN KEY(tracker_id) REFERENCES trackers(id) ON DELETE CASCADE,
    CONSTRAINT unique_tracker_detection UNIQUE (tracker_id, call_id, email_id)
);

CREATE INDEX IF NOT EXISTS idx_trackers_tenant ON trackers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tracker_detections_tenant ON tracker_detections(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tracker_detections_tracker ON tracker_detections(tracker_id);
