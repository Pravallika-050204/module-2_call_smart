# TASKS-001: Implementation Task List

## Phase 1 — Database & Shared Types
- [ ] Create raw SQL schema script `postgres_schema.sql` at the root of `r-revenue-intelligence` containing tables, indexes, and RLS policies.
- [ ] Implement database client service `postgres.service.ts` in `platform-core/database/` using standard PostgreSQL driver (`pg`).
- [ ] Expose shared types in `packages/shared-types/src/index.ts` for search operations.

## Phase 2 — Repository and Query Logic
- [ ] Implement `m05.repository.ts` containing:
  - Setting session tenant context: `SET LOCAL app.current_tenant_id`
  - Saved searches CRUD
  - Search index sync log entry write & check (idempotency support)
  - pgvector similarity retrieval queries
- [ ] Create `m05-saved-searches.repository.ts` for cleaner isolation.

## Phase 3 — Hybrid Search Service & Fallback
- [ ] Implement `m05.service.ts` containing:
  - `hybridSearch` running pgvector similarity query and Meilisearch search in parallel via `Promise.all`
  - Fallback logic to full-text only if Python AI service or pgvector fails
  - BLEND and RANK logic: custom scoring combining cosine distance and keyword relevancy.
- [ ] Implement AI embedding translation call `POST /v1/embed` to python endpoint.

## Phase 4 — Endpoints, Workers, and Events
- [ ] Implement `m05.controller.ts` with `/search`, `/saved-searches` endpoints validated by Zod.
- [ ] Implement `m05.worker.ts` listening to `call.completed` and `email.received` to build embeddings and update indexes.
- [ ] Write integration test cases under `apps/api/src/modules/m05-smart-tracking/tests/` to verify RLS, search Blending, and fallback behaviors.
