-- ==========================================
-- Postgres Schema Setup
-- Searchable Conversation Library (Module M-02)
-- Supports Multi-Tenancy (RLS) & Standard Array-Based Semantic Search
-- ==========================================

-- Ensure UUID generation functions are present
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. BASE ENTITIES (Mocking Core Modules)
-- ==========================================

-- Calls Table (Module M-01 Concept)
CREATE TABLE IF NOT EXISTS m01_calls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    duration_seconds INTEGER NOT NULL,
    transcript TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Emails Table (Module M-02 Concept)
CREATE TABLE IF NOT EXISTS m02_emails (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    subject VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    sender VARCHAR(255) NOT NULL,
    recipient VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ==========================================
-- 2. SALES ENGAGEMENT / CONVERSATIONAL LIBRARY ENTITIES (Module M-02)
-- ==========================================

-- Saved Searches Table
CREATE TABLE IF NOT EXISTS m02_saved_searches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    query_string TEXT,
    filters JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Search Index Sync Logs Table
CREATE TABLE IF NOT EXISTS m02_search_index_sync_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) NOT NULL, -- 'CALL' or 'EMAIL'
    entity_id UUID NOT NULL,
    sync_status VARCHAR(20) NOT NULL, -- 'PENDING', 'COMPLETED', 'FAILED'
    sync_error TEXT,
    idempotency_key VARCHAR(255) NOT NULL UNIQUE,
    indexed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Trackers Table
CREATE TABLE IF NOT EXISTS m02_trackers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    keywords TEXT[] NOT NULL DEFAULT '{}'::text[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Tracker Detections Table
CREATE TABLE IF NOT EXISTS m02_tracker_detections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    tracker_id UUID NOT NULL REFERENCES m02_trackers(id) ON DELETE CASCADE,
    entity_type VARCHAR(50) NOT NULL, -- 'CALL' or 'EMAIL'
    entity_id UUID NOT NULL,
    matched_keyword VARCHAR(255) NOT NULL,
    snippet TEXT NOT NULL,
    timestamp_seconds INTEGER, -- Only for calls
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Embeddings Table (Standard Float Array Semantic Storage)
CREATE TABLE IF NOT EXISTS m02_embeddings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) NOT NULL, -- 'CALL' or 'EMAIL'
    entity_id UUID NOT NULL,
    vector DOUBLE PRECISION[] NOT NULL, -- OpenAI text-embedding-3-small dimension
    content_chunk TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ==========================================
-- 3. INDEXES FOR PERFORMANCE & LOOKUPS
-- ==========================================

-- Multi-Tenant Context Left-Most Indexes
CREATE INDEX IF NOT EXISTS idx_calls_tenant_created ON m01_calls(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_emails_tenant_created ON m02_emails(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_saved_searches_m02_tenant_user ON m02_saved_searches(tenant_id, user_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_m02_tenant_entity ON m02_search_index_sync_logs(tenant_id, entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_m02_idempotency ON m02_search_index_sync_logs(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_trackers_m02_tenant ON m02_trackers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tracker_detections_m02_entity ON m02_tracker_detections(tenant_id, entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_embeddings_m02_entity ON m02_embeddings(tenant_id, entity_type, entity_id);

-- ==========================================
-- 4. ROW-LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- Enable Row-Level Security on all tables
ALTER TABLE m01_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE m02_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE m02_saved_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE m02_search_index_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE m02_trackers ENABLE ROW LEVEL SECURITY;
ALTER TABLE m02_tracker_detections ENABLE ROW LEVEL SECURITY;
ALTER TABLE m02_embeddings ENABLE ROW LEVEL SECURITY;

-- Tenant Isolation Policies based on app.current_tenant_id session parameter
DROP POLICY IF EXISTS tenant_isolation_calls ON m01_calls;
CREATE POLICY tenant_isolation_calls ON m01_calls
    FOR ALL USING (tenant_id = COALESCE(current_setting('app.current_tenant_id', true), '00000000-0000-0000-0000-000000000000')::uuid);

DROP POLICY IF EXISTS tenant_isolation_emails ON m02_emails;
CREATE POLICY tenant_isolation_emails ON m02_emails
    FOR ALL USING (tenant_id = COALESCE(current_setting('app.current_tenant_id', true), '00000000-0000-0000-0000-000000000000')::uuid);

DROP POLICY IF EXISTS tenant_isolation_saved_searches ON m02_saved_searches;
CREATE POLICY tenant_isolation_saved_searches ON m02_saved_searches
    FOR ALL USING (tenant_id = COALESCE(current_setting('app.current_tenant_id', true), '00000000-0000-0000-0000-000000000000')::uuid);

DROP POLICY IF EXISTS tenant_isolation_sync_logs ON m02_search_index_sync_logs;
CREATE POLICY tenant_isolation_sync_logs ON m02_search_index_sync_logs
    FOR ALL USING (tenant_id = COALESCE(current_setting('app.current_tenant_id', true), '00000000-0000-0000-0000-000000000000')::uuid);

DROP POLICY IF EXISTS tenant_isolation_trackers ON m02_trackers;
CREATE POLICY tenant_isolation_trackers ON m02_trackers
    FOR ALL USING (tenant_id = COALESCE(current_setting('app.current_tenant_id', true), '00000000-0000-0000-0000-000000000000')::uuid);

DROP POLICY IF EXISTS tenant_isolation_tracker_detections ON m02_tracker_detections;
CREATE POLICY tenant_isolation_tracker_detections ON m02_tracker_detections
    FOR ALL USING (tenant_id = COALESCE(current_setting('app.current_tenant_id', true), '00000000-0000-0000-0000-000000000000')::uuid);

DROP POLICY IF EXISTS tenant_isolation_embeddings ON m02_embeddings;
CREATE POLICY tenant_isolation_embeddings ON m02_embeddings
    FOR ALL USING (tenant_id = COALESCE(current_setting('app.current_tenant_id', true), '00000000-0000-0000-0000-000000000000')::uuid);

-- ==========================================
-- 5. LIBRARY FOLDERS & ACCESS LOGS (Pic 3 Acceptance Criteria)
-- ==========================================

-- Folders Table
CREATE TABLE IF NOT EXISTS m02_folders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    library_type VARCHAR(50) NOT NULL, -- 'COMPANY' or 'PERSONAL'
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Folder Items Link Table
CREATE TABLE IF NOT EXISTS m02_folder_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    folder_id UUID NOT NULL REFERENCES m02_folders(id) ON DELETE CASCADE,
    entity_type VARCHAR(50) NOT NULL, -- 'CALL' or 'EMAIL'
    entity_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Folder Access Logs Table (for Folder Usage Reports)
CREATE TABLE IF NOT EXISTS m02_folder_access_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    folder_id UUID NOT NULL REFERENCES m02_folders(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    entity_id UUID NOT NULL,
    accessed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Multi-Tenant Context Left-Most Indexes
CREATE INDEX IF NOT EXISTS idx_folders_m02_tenant ON m02_folders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_folder_items_m02_folder ON m02_folder_items(folder_id);
CREATE INDEX IF NOT EXISTS idx_folder_access_logs_m02_tenant ON m02_folder_access_logs(tenant_id, folder_id);

-- Enable Row-Level Security
ALTER TABLE m02_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE m02_folder_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE m02_folder_access_logs ENABLE ROW LEVEL SECURITY;

-- Tenant Isolation Policies
DROP POLICY IF EXISTS tenant_isolation_folders ON m02_folders;
CREATE POLICY tenant_isolation_folders ON m02_folders
    FOR ALL USING (tenant_id = COALESCE(current_setting('app.current_tenant_id', true), '00000000-0000-0000-0000-000000000000')::uuid);

DROP POLICY IF EXISTS tenant_isolation_folder_items ON m02_folder_items;
CREATE POLICY tenant_isolation_folder_items ON m02_folder_items
    FOR ALL USING (true); -- Governed by folder parent tenant and service layer checks

DROP POLICY IF EXISTS tenant_isolation_folder_access_logs ON m02_folder_access_logs;
CREATE POLICY tenant_isolation_folder_access_logs ON m02_folder_access_logs
    FOR ALL USING (tenant_id = COALESCE(current_setting('app.current_tenant_id', true), '00000000-0000-0000-0000-000000000000')::uuid);

