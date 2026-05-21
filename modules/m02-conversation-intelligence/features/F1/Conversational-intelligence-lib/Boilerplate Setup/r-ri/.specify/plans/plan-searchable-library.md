# PLAN-001: Technical Plan for Searchable Conversation Library

## 1. System Architecture Impact
This implementation is focused in **M-05 Smart Tracking and Search** (`apps/api/src/modules/m05-smart-tracking`) and acts as the search indexer and query orchestrator.
- **Data Flow:**
  1. Transcription/emails arrive via BullMQ events (`call.completed`, `email.received`).
  2. M-05 Worker consumes events and queues them for indexing.
  3. Indexing calls Python AI services (`POST /v1/embed`) to fetch semantic vector embeddings.
  4. Indexing writes to local PostgreSQL `m05_embeddings` and posts to Meilisearch index.
  5. API queries execute hybrid search by running a PostgreSQL pgvector similarity query and a Meilisearch keyword search in parallel, merging and ranking results.

---

## 2. API Design & Routing
All routes are prefixed with `/api/v1/smart-tracking` and guarded with standard JWT authentication and multi-tenancy verification.

### Endpoint: `POST /api/v1/smart-tracking/search`
- **Description:** Hybrid keyword and semantic search.
- **Payload Zod Validation:**
  ```typescript
  export const SearchQuerySchema = z.object({
    query: z.string().optional(),
    filters: z.object({
      channels: z.array(z.enum(['CALL', 'EMAIL'])).optional(),
      dateRange: z.object({
        start: z.string().datetime().optional(),
        end: z.string().datetime().optional(),
      }).optional(),
      linkedDeals: z.array(z.string().uuid()).optional(),
      trackers: z.array(z.string().uuid()).optional(),
    }).default({}),
    limit: z.number().int().min(1).max(100).default(20),
    offset: z.number().int().min(0).default(0),
  });
  ```
- **Response:**blended, ranked array of conversation records.

### Endpoint: `POST /api/v1/smart-tracking/saved-searches`
- **Description:** Saves a search filter view.
- **Payload:** `{ name: string, query: string, filters: Record<string, any> }`

### Endpoint: `GET /api/v1/smart-tracking/saved-searches`
- **Description:** Retrieve all saved search views for the authenticated user and tenant.

---

## 3. Database Schema Mutations
We define a raw SQL migration script `postgres_schema.sql` at the root of `r-revenue-intelligence` containing:
- Extension loading: `vector`.
- Tables: `m05_saved_searches`, `m05_search_index_sync_logs`, `m05_trackers`, `m05_tracker_detections`, `m05_embeddings`.
- Row-Level Security (RLS) policies:
  ```sql
  ALTER TABLE m05_saved_searches ENABLE ROW LEVEL SECURITY;
  CREATE POLICY tenant_isolation_policy ON m05_saved_searches
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
  ```
- Composite indexes supporting rapid queries:
  - `idx_saved_searches_tenant_user (tenant_id, user_id)`
  - `idx_sync_logs_tenant_idempotency (tenant_id, idempotency_key)`
  - `idx_embeddings_tenant_entity (tenant_id, entity_type, entity_id)`

---

## 4. Events Consumed & Emitted
- **Events Consumed:**
  - `call.completed` (Starts indexing transcription content)
  - `email.received` (Starts indexing email bodies)
- **Events Emitted:**
  - `search.index_synced` (Signals completion of transcription/email search indexing)
  - `search.export_requested` (Triggers asynchronous CSV export)

---

## 5. Security & Isolation
- **Application Context RLS:** Every database operation begins by setting the session variable:
  `SET LOCAL app.current_tenant_id = 'tenant-uuid-here';`
  This ensures that even if application logic misses a `tenant_id` check, PostgreSQL will strictly restrict data access.
- **JWT & Role Verification:** Endpoints ensure the request payload carries validated tenant boundaries.

---

## 6. Testing & Validation Plan
- **Unit Tests:** Mock database and Meilisearch interfaces using Jest to verify hybrid ranking logic, Zod validation, and error fallback scenarios.
- **Integration Tests:** Execute integration scenarios directly against a local PostgreSQL database using the `pg` client, verifying RLS policies, indexing idempotency, and saved searches.
