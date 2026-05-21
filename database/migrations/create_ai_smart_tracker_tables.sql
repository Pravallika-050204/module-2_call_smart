-- Create the trackers table
CREATE TABLE trackers (
    id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    business_question TEXT NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL,
    scope VARCHAR(50) NOT NULL,
    speaker_side VARCHAR(50) NOT NULL,
    is_published BOOLEAN DEFAULT FALSE,
    status VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create the tracker_detections table
CREATE TABLE tracker_detections (
    id SERIAL PRIMARY KEY,
    tracker_id INT REFERENCES trackers(id) ON DELETE CASCADE,
    call_id UUID,
    email_id UUID,
    tenant_id UUID NOT NULL,
    deal_id UUID,
    contact_id UUID,
    snippet TEXT,
    timestamp_ms BIGINT,
    confidence_score FLOAT,
    detection_source VARCHAR(50),
    detected_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);