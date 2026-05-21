# Doc #18 — Environment Variables Registry: M2

## Document Control

- **Document name:** Environment Variables Registry — M2 Conversation Intelligence 
- **Product scope:** M2 Conversation Intelligence, which includes AI Call Reviewer, AI Topic Tagger, AI Theme Spotter, AI Smart Tracker, AI Translator, AI Transcriber, and Searchable Conversation Library. 
- **Architecture scope:** Mainly M-04 Conversation Intelligence and M-05 Smart Tracking and Search. 
- **Primary owners:** Backend Lead, AI Lead, DevOps Lead, Security Owner. 
- **Secrets source of truth:** Doppler. No secrets should live in repo `.env` files, container images, or ad hoc deployment notes. 
- **Runtime environments:** local, development, staging, production. 

## Purpose

This document is the working registry for environment variables used by the M2 runtime path. It exists so engineers can quickly understand what each variable is for, where it is used, whether it is required, and how it should be managed safely. 

M2 is product-facing, but its actual runtime is split across M-04 and M-05. That means the env registry must cover call scoring, topic tagging, theme analysis, tracker detection, transcript correction, translation, search indexing, hybrid search, queue workers, and observability together in one place. 

## Usage Rules

- All secrets must come from **Doppler** and be injected at runtime as normal environment variables. 
- Never hardcode secrets, tokens, hostnames, internal shared secrets, or API keys in code, scripts, sample JSON, or Docker images. 
- The NestJS API layer must call internal AI services through approved internal endpoints and internal auth headers, not direct OpenAI or model SDK calls from product code. 
- AI inference belongs in Python services, while TypeScript services only orchestrate workflows, queues, APIs, and persistence. 
- Redis-backed BullMQ is required for async event-driven behavior, so queue-related variables are not optional for real M2 processing flows. 
- Every environment variable added for a new dependency should match an approved architecture decision or reviewed stack choice. 
- Prefer stable naming and avoid duplicate aliases like `REDIS_URL` and `QUEUE_REDIS_URL` unless there is a real separation in infrastructure. 
- Feature flags should disable behavior safely without breaking unrelated flows. For example, disabling theme analysis should not break topic tagging or search. 

## Runtime Groups

The main M2 environment groups are: 

- **App basics and module flags** for environment identity, service names, and module enablement. 
- **PostgreSQL and Redis** for persistence, row-level tenant-safe processing, and BullMQ queue execution. 
- **AI service endpoints** for score-call, tag-topics, detect-themes, detect-trackers, embedding, translation, and transcript correction style processing. 
- **Search engine config** for Meilisearch and semantic retrieval support. 
- **Batch processing and worker concurrency** for delayed jobs, retries, throughput, and queue isolation. 
- **Admin configuration and export support** for scorecards, vocabulary rules, translation preferences, tracker definitions, and optional admin data export behavior. 
- **Observability and alerts** for Sentry, logs, and metrics-friendly operation. 
- **Feature flags** for trackers, theme analysis, search indexing, translation, and transcript correction. 

## Variable Registry Table

| Variable | Group | Required | Example | Used By | Purpose | Notes |
|---|---|---:|---|---|---|---|
| `NODE_ENV` | App basics | Yes | `development` | M-04, M-05 | Standard runtime mode selector.  | Use standard values only.  |
| `APP_ENV` | App basics | Yes | `local` | M-04, M-05 | Identifies deployment environment across configs and logs.  | Keep aligned with Doppler config names.  |
| `APP_NAME` | App basics | Yes | `conversation-intelligence-api` | M-04, M-05 | Human-readable service identity for logs and monitoring.  | Helps with multi-service observability.  |
| `APP_VERSION` | App basics | Yes | `1.0.0` | M-04, M-05 | Release version used in health output and debugging.  | Often injected from CI.  |
| `PORT` | App basics | Yes | `3000` | M-04, M-05 | HTTP port for NestJS service.  | Required in local and deployed containers.  |
| `M04_ENABLED` | Module flags | Yes | `true` | M-04 | Enables Conversation Intelligence module runtime.  | Should default true in M2-enabled environments.  |
| `M05_ENABLED` | Module flags | Yes | `true` | M-05 | Enables Smart Tracking and Search runtime.  | Can be disabled for partial rollout.  |
| `DATABASE_URL` | PostgreSQL | Yes | `postgresql://...` | M-04, M-05 | Primary PostgreSQL connection string.  | Must use TLS where applicable.  |
| `DIRECT_DATABASE_URL` | PostgreSQL | Optional | `postgresql://...` | migrations, admin jobs | Direct DB connection for migrations or tooling.  | Keep separate if pooling is used.  |
| `PGSSLMODE` | PostgreSQL | Optional | `require` | M-04, M-05 | Forces SSL mode for DB connections.  | Use in hosted environments.  |
| `REDIS_URL` | Redis | Yes | `redis://...` | M-04, M-05, BullMQ workers | Redis connection for queue backing and short-lived cache.  | Critical dependency for async flows.  |
| `BULLMQ_PREFIX` | Queue basics | Yes | `rri` | M-04, M-05 | Prefix for queue keys to avoid collisions.  | Keep stable per environment.  |
| `QUEUE_DEFAULT_ATTEMPTS` | Queue basics | Yes | `3` | workers | Default retry count for async jobs.  | Matches documented retry patterns.  |
| `QUEUE_DEFAULT_BACKOFF_MS` | Queue basics | Yes | `30000` | workers | Default retry backoff for worker failures.  | Tune carefully to avoid retry storms.  |
| `QUEUE_REMOVE_ON_COMPLETE` | Queue basics | Optional | `true` | workers | Controls job cleanup after success.  | Keep enough history for debugging in non-prod.  |
| `QUEUE_REMOVE_ON_FAIL` | Queue basics | Optional | `false` | workers | Controls failed-job retention.  | Keep failures visible for diagnosis.  |
| `SCORING_QUEUE_CONCURRENCY` | Worker concurrency | Yes | `5` | M-04 worker | Concurrency for score-call jobs.  | Heavy AI jobs should be tuned conservatively.  |
| `TOPIC_TAGGING_QUEUE_CONCURRENCY` | Worker concurrency | Yes | `8` | M-04 worker | Concurrency for tag-topics jobs.  | Usually cheaper than full scoring.  |
| `THEME_ANALYSIS_QUEUE_CONCURRENCY` | Worker concurrency | Yes | `2` | M-04 worker | Concurrency for detect-themes jobs.  | Keep low because theme jobs are expensive and long-running.  |
| `TRACKER_DETECTION_QUEUE_CONCURRENCY` | Worker concurrency | Yes | `6` | M-05 worker | Concurrency for tracker detection jobs.  | Tune with Redis and AI capacity.  |
| `SEARCH_INDEX_QUEUE_CONCURRENCY` | Worker concurrency | Yes | `10` | M-05 worker | Concurrency for indexing jobs into Meilisearch and vectors.  | High values can overload downstream search infra.  |
| `TRANSLATION_QUEUE_CONCURRENCY` | Worker concurrency | Yes | `5` | M-04 worker | Concurrency for translation jobs.  | Tune based on external AI translation provider limits.  |
| `CALL_SCORE_DELAY_MS` | Worker timing | Yes | `300000` | M-04 | Delay before score finalization if entity linking has not arrived.  | Architecture calls out a 5-minute wait pattern.  |
| `AI_SERVICE_URL` | AI service | Yes | `http://ai-service:8000` | M-04, M-05 | Base URL for internal AI service calls.  | Product services should call internal AI endpoints only.  |
| `INTERNAL_SERVICE_SECRET` | AI service auth | Yes | `***` | M-04, M-05 | Shared internal secret used in headers for service-to-service auth.  | Must come from Doppler.  |
| `AI_SCORE_CALL_PATH` | AI endpoints | Yes | `/internal/score-call` | M-04 | Internal path for call scoring.  | Explicit path config helps versioning and gateway separation.  |
| `AI_TAG_TOPICS_PATH` | AI endpoints | Yes | `/internal/tag-topics` | M-04 | Internal path for topic tagging.  | Keep versioned if contract changes.  |
| `AI_DETECT_THEMES_PATH` | AI endpoints | Yes | `/internal/detect-themes` | M-04 | Internal path for theme analysis.  | Long-running async AI call.  |
| `AI_DETECT_TRACKERS_PATH` | AI endpoints | Yes | `/internal/detect-trackers` | M-05 | Internal path for tracker detection.  | Used by transcript and email-driven signal detection.  |
| `AI_EMBED_PATH` | AI endpoints | Yes | `/internal/generate-embeddings` | M-05 | Internal path for embeddings used in semantic search.  | Needed for hybrid search quality.  |
| `AI_TRANSLATE_PATH` | AI endpoints | Optional | `/internal/translate` | M-04 | Internal translation endpoint path if translation is separated.  | Not explicitly named in the architecture excerpt, but valid as an M2 internal AI endpoint pattern.  |
| `AI_TRANSCRIPT_CORRECTION_PATH` | AI endpoints | Optional | `/internal/correct-transcript` | M-04 | Internal correction endpoint path if transcript correction is AI-backed.  | Useful when correction is not purely rules-based.  |
| `AI_SCORE_CALL_TIMEOUT_MS` | AI timeouts | Yes | `120000` | M-04 | Timeout for score-call requests.  | Matches documented 120s pattern.  |
| `AI_TAG_TOPICS_TIMEOUT_MS` | AI timeouts | Yes | `120000` | M-04 | Timeout for topic tagging requests.  | Keep aligned with worker retry rules.  |
| `AI_DETECT_THEMES_TIMEOUT_MS` | AI timeouts | Yes | `300000` | M-04 | Timeout for theme detection requests.  | Architecture allows up to 5 minutes for this type.  |
| `AI_DETECT_TRACKERS_TIMEOUT_MS` | AI timeouts | Yes | `120000` | M-05 | Timeout for tracker detection requests.  | Important for queue throughput planning.  |
| `AI_EMBED_TIMEOUT_MS` | AI timeouts | Yes | `60000` | M-05 | Timeout for embedding generation requests.  | Use fallback behavior where possible.  |
| `MEILISEARCH_URL` | Search | Required for M-05 | `http://meilisearch:7700` | M-05 | Search engine endpoint for conversation library indexing and querying.  | Required if search is enabled.  |
| `MEILISEARCH_MASTER_KEY` | Search | Required for M-05 | `***` | M-05 | Credential for Meilisearch operations.  | Secret from Doppler only.  |
| `MEILISEARCH_INDEX_CONVERSATIONS` | Search | Required for M-05 | `conversations` | M-05 | Main search index name for conversation library docs.  | Keep stable to avoid index drift.  |
| `MEILISEARCH_INDEX_TOPIC_TAGS` | Search | Optional | `conversation_topic_tags` | M-05 | Optional dedicated tag index or alias.  | Use only if separate indexing strategy exists.  |
| `VECTOR_SEARCH_ENABLED` | Search flags | Yes | `true` | M-05 | Enables semantic retrieval path.  | If false, system should fall back to text search only.  |
| `PGVECTOR_ENABLED` | Search flags | Yes | `true` | M-05 | Enables pgvector-backed retrieval support.  | Keep aligned with DB extension setup.  |
| `EMBEDDING_MODEL_NAME` | Semantic search | Optional | `text-embedding-3-large` | M-05, AI service | Identifies active embedding model.  | Pin model versions to avoid silent retrieval drift.  |
| `SEARCH_RESULT_LIMIT_DEFAULT` | Search | Yes | `25` | M-05 | Default number of returned search results.  | Keep user-facing defaults modest.  |
| `SEARCH_RESULT_LIMIT_MAX` | Search | Yes | `100` | M-05 | Hard upper bound for search responses.  | Prevent expensive queries.  |
| `SCORECARD_EXPORT_BUCKET` | Admin/export | Optional | `m2-admin-exports` | admin jobs | Bucket or artifact target for admin exports if used.  | Useful for scorecard or review export workflows.  |
| `M2_ADMIN_CONFIG_EXPORT_ENABLED` | Admin/export | Optional | `false` | admin jobs | Enables export of scorecards, trackers, or related admin config snapshots.  | Keep off unless there is an approved admin export flow.  |
| `DEFAULT_TRANSLATION_LANGUAGE` | Translation | Optional | `en` | M-04 | Fallback target language when no user or team preference exists.  | Should not override explicit stored preferences.  |
| `SUPPORTED_TRANSLATION_LANGUAGES` | Translation | Optional | `en,es,fr,de` | M-04 | Allowed language list for translation flows.  | Match BCP 47 style where possible.  |
| `VOCAB_CORRECTION_ENABLED` | Feature flags | Yes | `true` | M-04 | Enables transcript correction logic.  | Can be rule-based, AI-assisted, or hybrid.  |
| `TRANSLATION_ENABLED` | Feature flags | Yes | `true` | M-04 | Enables translation workflows.  | Disable safely without affecting scoring or tagging.  |
| `THEME_ANALYSIS_ENABLED` | Feature flags | Yes | `true` | M-04 | Enables batch theme analysis jobs.  | Long-running path, useful for staged rollout.  |
| `TOPIC_TAGGING_ENABLED` | Feature flags | Yes | `true` | M-04 | Enables topic tagging.  | Keep on for searchable topic metadata.  |
| `CALL_SCORING_ENABLED` | Feature flags | Yes | `true` | M-04 | Enables AI Call Reviewer scoring jobs.  | Disable if scorecard rollout is incomplete.  |
| `TRACKER_DETECTION_ENABLED` | Feature flags | Yes | `true` | M-05 | Enables Smart Tracker detection jobs.  | Important for M-05 downstream value.  |
| `SEARCH_INDEXING_ENABLED` | Feature flags | Yes | `true` | M-05 | Enables event-driven indexing into search stores.  | Can be disabled temporarily during maintenance.  |
| `HYBRID_SEARCH_ENABLED` | Feature flags | Yes | `true` | M-05 | Enables merged Meilisearch plus semantic ranking flow.  | If false, use full-text only.  |
| `DEAL_CONTEXT_ENRICHMENT_ENABLED` | Feature flags | Optional | `true` | M-04, M-05 | Enables deal or account context enrichment after `revenuegraph.entity.linked`.  | Useful for staged dependency rollout.  |
| `SENTRY_DSN` | Observability | Yes | `***` | M-04, M-05 | Sentry error tracking DSN.  | Required for production-grade monitoring.  |
| `LOG_LEVEL` | Observability | Yes | `info` | M-04, M-05 | Controls application log verbosity.  | Use structured logs.  |
| `BETTERSTACK_SOURCE_TOKEN` | Observability | Optional | `***` | M-04, M-05 | Token for structured log shipping where configured.  | Treat as secret.  |
| `METRICS_ENABLED` | Observability | Optional | `true` | M-04, M-05 | Enables metrics export for dashboards and alerts.  | Useful for queue depth and latency visibility.  |
| `HEALTHCHECK_VERBOSE` | Observability | Optional | `false` | M-04, M-05 | Enables richer health output in non-production environments.  | Avoid leaking internals publicly.  |
| `DOPPLER_TOKEN` | Secrets management | Environment-specific | `***` | deploy/runtime integration | Service-scoped token for secret injection where required by platform setup.  | Scope by service and environment.  |

## Minimum Required Variables by Flow

### 1. AI Call Reviewer flow

Minimum variables for call scoring are: 

- `M04_ENABLED` 
- `DATABASE_URL` 
- `REDIS_URL` 
- `AI_SERVICE_URL` 
- `INTERNAL_SERVICE_SECRET` 
- `AI_SCORE_CALL_PATH` 
- `AI_SCORE_CALL_TIMEOUT_MS` 
- `SCORING_QUEUE_CONCURRENCY` 
- `CALL_SCORING_ENABLED` 

### 2. AI Topic Tagger flow

Minimum variables for topic tagging are: 

- `M04_ENABLED` 
- `DATABASE_URL` 
- `REDIS_URL` 
- `AI_SERVICE_URL` 
- `INTERNAL_SERVICE_SECRET` 
- `AI_TAG_TOPICS_PATH` 
- `AI_TAG_TOPICS_TIMEOUT_MS` 
- `TOPIC_TAGGING_QUEUE_CONCURRENCY` 
- `TOPIC_TAGGING_ENABLED` 

### 3. AI Theme Spotter flow

Minimum variables for theme analysis are: 

- `M04_ENABLED` 
- `DATABASE_URL` 
- `REDIS_URL` 
- `AI_SERVICE_URL` 
- `INTERNAL_SERVICE_SECRET` 
- `AI_DETECT_THEMES_PATH` 
- `AI_DETECT_THEMES_TIMEOUT_MS` 
- `THEME_ANALYSIS_QUEUE_CONCURRENCY` 
- `THEME_ANALYSIS_ENABLED` 

### 4. AI Smart Tracker flow

Minimum variables for tracker detection are: 

- `M05_ENABLED` 
- `DATABASE_URL` 
- `REDIS_URL` 
- `AI_SERVICE_URL` 
- `INTERNAL_SERVICE_SECRET` 
- `AI_DETECT_TRACKERS_PATH` 
- `AI_DETECT_TRACKERS_TIMEOUT_MS` 
- `TRACKER_DETECTION_QUEUE_CONCURRENCY` 
- `TRACKER_DETECTION_ENABLED` 

### 5. Searchable Conversation Library flow

Minimum variables for indexing and search are: 

- `M05_ENABLED` 
- `DATABASE_URL` 
- `REDIS_URL` 
- `MEILISEARCH_URL` 
- `MEILISEARCH_MASTER_KEY` 
- `MEILISEARCH_INDEX_CONVERSATIONS` 
- `SEARCH_INDEXING_ENABLED` 
- `SEARCH_INDEX_QUEUE_CONCURRENCY` 
- `VECTOR_SEARCH_ENABLED` 
- `PGVECTOR_ENABLED` 
- `AI_SERVICE_URL` 
- `INTERNAL_SERVICE_SECRET` 
- `AI_EMBED_PATH` 
- `AI_EMBED_TIMEOUT_MS` 

### 6. Translation flow

Minimum variables for translation are: 

- `M04_ENABLED` 
- `DATABASE_URL` 
- `AI_SERVICE_URL` 
- `INTERNAL_SERVICE_SECRET` 
- `TRANSLATION_ENABLED` 
- `DEFAULT_TRANSLATION_LANGUAGE` or stored DB preference 
- `AI_TRANSLATE_PATH` if translation is exposed as a dedicated internal endpoint. 

### 7. Transcript correction flow

Minimum variables for transcript correction are: 

- `M04_ENABLED` 
- `DATABASE_URL` 
- `VOCAB_CORRECTION_ENABLED` 
- `AI_SERVICE_URL` and `AI_TRANSCRIPT_CORRECTION_PATH` if correction is AI-assisted rather than only rule-based. 

## Rotation and Security Notes

- All secrets must be stored in **Doppler**, with environment-specific values separated across local, development, staging, and production. 
- Secret rotation should happen centrally through Doppler, and application instances should pick up new values on restart or redeploy according to the deployment model. 
- Internal service auth values such as `INTERNAL_SERVICE_SECRET`, DB credentials, Redis URLs, Meilisearch keys, and observability tokens should never appear in logs, screenshots, markdown examples, or sample `.env` files shared in chat. 
- Service-scoped access matters. The NestJS API should not automatically receive unrelated AI provider secrets if it only needs the internal AI gateway contract. 
- Keep feature flags non-secret when possible, but treat anything that reveals internal infrastructure, credentials, or tenant-isolation boundaries as sensitive configuration. 
- If encryption-at-rest helper keys or field-level encryption keys are introduced for M2-owned sensitive fields, they must also be stored and rotated through Doppler under security-owner control. 
- Never accept `tenantid` from request bodies or env overrides in a way that can bypass the platform’s tenant interceptor and RLS enforcement. 

## Validation Checklist

Before an environment is marked ready for M2, verify the following: 

- `DATABASE_URL` connects successfully and migrations are up to date. 
- Redis is reachable and BullMQ workers can start. 
- `AI_SERVICE_URL` is reachable from the NestJS runtime. 
- `INTERNAL_SERVICE_SECRET` matches on both sides of internal service communication. 
- Required M-04 flags are enabled for scoring, tagging, theme analysis, translation, and transcript correction as expected. 
- Required M-05 flags are enabled for tracker detection, indexing, and hybrid search as expected. 
- Meilisearch connectivity and index names are valid when search is enabled. 
- Embedding generation path works when semantic search is enabled. 
- Sentry is configured and receiving test events in non-local environments. 
- Structured logs appear in the expected sink if Better Stack or equivalent logging is enabled. 
- Queue concurrency values are sane for available CPU and AI service capacity. 
- No secrets are committed to the repository, copied into Dockerfiles, or embedded in sample configs. 
- Doppler config names and actual deployed environment names are aligned. 
- Feature-flag combinations have been smoke-tested so disabled features fail gracefully instead of crashing workers. 

## Notes for engineers

A simple way to think about M2 env vars is this: 

- **M-04** needs DB + Redis + AI endpoint config to score, tag, detect themes, correct transcript terms, and translate outputs. 
- **M-05** needs DB + Redis + AI endpoint config + search config to detect trackers, index conversations, and serve hybrid search. 
- If Redis is broken, async M2 flows stall. If AI service routing is broken, enrichment stops. If Meilisearch or embeddings are broken, search quality drops, but PostgreSQL still remains the source of truth. 