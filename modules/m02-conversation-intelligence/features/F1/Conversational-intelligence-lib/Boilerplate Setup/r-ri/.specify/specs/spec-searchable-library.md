# SPEC-001: Searchable Conversation Library

## 1. Description & Motivation
The **Searchable Conversation Library** gives users a unified, searchable, and filterable workspace containing all recorded calls, outbound/inbound emails, and metadata. By combining typo-tolerant full-text search (via Meilisearch) and conceptual semantic retrieval (via vector embeddings and pgvector), sales reps and managers can easily locate key client interactions, analyze risk signals, and track sales performance.

This feature belongs conceptually to **M2 Conversation Intelligence** for user packaging, but is implemented inside **M-05 Smart Tracking and Search** to leverage unified retrieval indexes, tracking detections, and index sync logs.

---

## 2. Requirements & Acceptance Criteria
- [ ] **Multi-Tenant Scope:** Every search query, filter query, and result merge must strictly enforce `tenantId` boundaries. Cross-tenant leakage is a critical failure.
- [ ] **Hybrid Search Orchestration:** Parallel execution of Meilisearch full-text query and pgvector semantic query. Results must be merged and ranked, favoring exact matching terms for highly specific queries while expanding to conceptual matches for vague queries.
- [ ] **Saved Search Capability:** Users must be able to save search criteria (query string + JSON filter configurations) and load them later.
- [ ] **Observability & Freshness:** Indexing operations must be logged in `searchindexsynclog` to track indexing lag, sync status, and enforce strict idempotency (no duplicate entries processed).
- [ ] **Asynchronous Exports:** Filtered search results must be exportable to CSV asynchronously using BullMQ.
- [ ] **Performance:** Hybrid query execution and result blending must run under 200ms p99 latency.

---

## 3. User Experience & User Interface
- **Search Workspace:** A clean search bar with a robust filter drawer supporting date ranges, channel types (calls/emails), linked deals, accounts, and topic tags.
- **Search Results:** Display ranked results with highlighted matching snippets, topic tags, deal linkages, and competitor mentions.
- **Saved Queries:** A sidebar or dropdown displaying "My Saved Views" allowing users to save the active search state or trigger a previously saved state.
- **Deep-linking:** "Share Search" generates an authenticated deep link reproducing the exact filters and query string for colleagues within the same tenant.

---

## 4. Boundary Conditions & Edge Cases
- **Degraded Execution:** If the AI embedding service fails or pgvector is unavailable, the search must degrade gracefully to Meilisearch full-text-only search with a warning rather than returning an error.
- **Empty Queries:** An empty query string with active filters should act as a filtered conversation list sorted by recency (`createdAt DESC`).
- **Idempotency Safeguard:** Under rapid webhook re-delivery, BullMQ workers must use `idempotencyKey` to avoid adding duplicate transcripts or emails to the search indexes.
- **RLS Enforcement:** If a query bypasses the application-level `tenantId` filter, PostgreSQL database RLS must reject the operation automatically.
