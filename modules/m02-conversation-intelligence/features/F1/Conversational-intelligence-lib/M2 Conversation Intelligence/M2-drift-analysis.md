# M2 Conversation Intelligence — Drift Analysis

**Prepared by:** Architecture Review  
**Date:** 2026-05-05  
**Scope:** All files in `M2 Conversation Intelligence/` including root docs and all TDDs  
**Files reviewed:**
- `README-M2 Conversation Intelligence.md`
- `Environment Variables Registry-M2.md`
- `Sequence Diagrams for M2.md`
- `TDD/AI Call Reviewer.md`
- `TDD/AI Topic Tagger.md`
- `TDD/AI Theme Spotter.md`
- `TDD/AI Smart Tracker.md`
- `TDD/AI Translator.md`
- `TDD/AI Transcriber.md`
- `TDD/Searchable Conversation Library.md`

**Reference documents used for cross-check:**
- `docs/markdown documents/System_architecture.md`
- `docs/markdown documents/Module boundary document.md`
- `docs/markdown documents/Event Schema registry.md`
- `docs/markdown documents/Database Schema.md`
- `docs/markdown documents/Security architecture.md`

---

## Executive Summary

The M2 documentation suite is well-structured overall. TDD documents are thorough, ownership boundaries between M-04 and M-05 are consistently clarified, and the event-driven architecture is correctly described across all files. However, 14 specific drifts were identified ranging from **critical** (architectural naming conflicts, unanswered open questions blocking implementation) to **minor** (missing env var, inconsistent AI endpoint path style). All are documented below with recommended actions.

---

## Severity Legend

| Severity | Meaning |
|---|---|
| 🔴 Critical | Blocks implementation or creates architectural ambiguity |
| 🟠 High | Will cause confusion for engineers; should be fixed before dev begins |
| 🟡 Medium | Inconsistency that creates documentation debt |
| 🟢 Low | Minor quality or formatting issue |

---

## Drift #1 — Module Number Mismatch: README vs System Architecture

**Severity:** 🔴 Critical  
**File:** `README-M2 Conversation Intelligence.md` — Sections 1, 2, 3, 4, 5  
**Cross-reference:** `System_architecture.md`, `Module boundary document.md`

### What was found

The README and all TDDs in this folder consistently refer to the product module as **M2** (product label) while mapping it internally to **M-04** and **M-05**. This split is documented correctly. However, the README references two different lifecycle stages inconsistently across sections:

- Section 1 correctly states: **"Understand"** stage.
- Section 1 (Downstream impact line 15): lists **M-10 Performance and Coaching** as a downstream consumer.

The System Architecture document numbers Performance and Coaching as **M-09**, not M-10. The M-10 label in the system architecture belongs to **Data & Compliance** (product-level grouping). At the architecture level, coaching is assigned to **M-09**.

### Where the conflict appears

| Location | What it says | What the Architecture says |
|---|---|---|
| README line 15 | "Downstream impact: ... M-10 Performance and Coaching" | M-09 is Coaching, M-10 is Data & Compliance |
| README line 111 | "...M-09, and M-10..." | Correctly mentions M-09 but still uses "M-10" to mean coaching elsewhere |
| AI Call Reviewer TDD line 85-86 | "M-10 Performance and Coaching consumes call.scored" | Should be M-09 |
| Sequence Diagram SD-01 lines 27, 46, 95 | `M-10 Coaching` as actor and event consumer | Should be M-09 |
| AI Topic Tagger TDD line 84 | Lists M-10 as a downstream user | Ambiguous without knowing intended reference |
| AI Smart Tracker TDD line 16 | "grouped under M2 ... because it helps users understand what is happening in calls" | ✅ Correct |
| AI Smart Tracker TDD line 577 | "event registry also lists M-07 as a consumer" | Needs verification (see Drift #7) |

### Recommended fix

Replace all references to **"M-10 Performance and Coaching"** with **"M-09 Coaching and Training"** throughout:
- README line 15, 111, 129, 181
- AI Call Reviewer TDD lines 85, 86, 658, 659
- Sequence Diagram SD-01 actor label and delivery arrow (lines 27, 79, 95)

---

## Drift #2 — AI Endpoint Path Style Inconsistency

**Severity:** 🟠 High  
**Files:** `README-M2 Conversation Intelligence.md` vs `TDD/AI Call Reviewer.md`, `TDD/AI Topic Tagger.md`, `TDD/AI Smart Tracker.md`, `Environment Variables Registry-M2.md`

### What was found

The README (Section 5, line 152) describes AI service endpoints using the format:
```
v1score-call, v1detect-themes, v1tag-topics, v1detect-trackers, v1embed
```

All TDDs and the env registry use the correct REST-style format:
```
POST /v1/score-call
POST /v1/tag-topics
POST /v1/detect-themes
POST /v1/detect-trackers
POST /v1/embed
```

The README's compressed format (`v1score-call`) looks like a concatenated slug and is inconsistent with both the event registry and the TDD contracts. This will confuse engineers reading the README as a starting point.

Additionally, the env registry uses `/internal/` prefix for AI paths (e.g. `AI_SCORE_CALL_PATH = /internal/score-call`) while TDDs use `/v1/` prefix (e.g. `POST /v1/score-call`). This is a real routing ambiguity.

### Recommended fix

1. **README:** Update Section 5 (Architecture Snapshot) to use the full path format: `POST /v1/score-call`, `POST /v1/tag-topics`, etc.
2. **Env Registry vs TDDs:** Decide and document whether the AI gateway exposes routes under `/internal/` or `/v1/`. Both cannot be correct simultaneously. The likely intent is that NestJS calls the internal AI service at `/internal/...` endpoints, while the TDDs describe the logical AI operation path `/v1/...`. Document this explicitly as: *"NestJS calls the AI service at `/internal/<endpoint>`. The `/v1/...` paths in TDDs represent the logical AI service contract name."*

---

## Drift #3 — AI Transcriber Ownership Conflict

**Severity:** 🔴 Critical  
**Files:** `TDD/AI Transcriber.md` vs `README-M2 Conversation Intelligence.md`

### What was found

The README (Section 3, line 84) says:

> "M-04 Conversation Intelligence ... owns ... vocabulary correction rules and translation preferences."

But the AI Transcriber TDD (line 8) explicitly contradicts this:

> "Architecture owner module: M-01 Data Ingestion, with conversation-consumption surfaces in M-04."

And the TDD section 3 says:

> "The correction pipeline and persistent transcript correction storage belong to M-01 Data Ingestion."

This is the clearest real ownership conflict in the M2 documentation. The README says correction rules belong to M-04. The TDD says they belong to M-01.

### Resolution

The **AI Transcriber TDD is architecturally correct**. The system architecture defines vocabulary correction as a **post-transcription, pre-storage** step inside the M-01 pipeline. The `vocabularycorrections` and `transcriptcorrections` tables are in the M-01 schema, not the M-04 schema.

### Recommended fix

Update the README Section 3 (Product vs Architecture Mapping) to state:
> *"M-04 Conversation Intelligence ... owns call scoring, topic tagging, theme spotting, and translation preferences. Vocabulary correction rules (`vocabularycorrections`) are owned by M-01 Data Ingestion, because correction runs post-transcription before storage."*

This aligns the README with the AI Transcriber TDD and the system architecture.

---

## Drift #4 — `vocabularycorrections` Table Schema Ownership Conflict

**Severity:** 🔴 Critical  
**Files:** `TDD/AI Transcriber.md` vs `TDD/AI Translator.md` vs `README-M2 Conversation Intelligence.md`

### What was found

The `vocabularycorrections` table is referenced in **three different ownership contexts**:

| File | What it says about vocabularycorrections |
|---|---|
| AI Transcriber TDD (§7) | Owned by M-01, in transcription schema |
| README Section 8 (line 227) | "M-04 owns ... vocabularycorrections" |
| AI Translator TDD (§3 scope) | "Vocabulary correction belongs to AI Transcriber and vocabularycorrections" — no module specified |
| Sequence Diagram SD-06 (line 547) | Admin creates vocabulary rules via `POST /api/v1/conversation-intelligence/vocabulary` (M-04 API prefix) |

The SD-06 diagram and README assign M-04 ownership; the Transcriber TDD assigns M-01 ownership.

### Recommended fix

Align all docs to the Transcriber TDD: **`vocabularycorrections` lives in the M-01 `ingestion` schema.** The correction admin API should use the M-01 API prefix, not M-04's `conversation-intelligence` prefix.

Action items:
1. Update README Section 8 to remove `vocabularycorrections` from the M-04 table list.
2. Update SD-06 to change the admin vocabulary rule endpoint from `POST /api/v1/conversation-intelligence/vocabulary` to an M-01-scoped endpoint (e.g. `POST /api/v1/ingestion/vocabulary` or equivalent as decided by the M-01 TDD).
3. Clarify in the Translator TDD which module's API surface manages vocabulary correction rules.

---

## Drift #5 — Missing `savedSearches` Table in Architecture

**Severity:** 🟠 High  
**File:** `TDD/Searchable Conversation Library.md` — Section 16.4

### What was found

The Searchable Conversation Library TDD explicitly calls for saved search behavior as a product requirement (Section 16.4), including:
- Save query string + filters
- Per user and tenant
- Nameable saved searches
- Persistent state reopen

However, the TDD itself notes: *"the architecture does not yet define a dedicated saved-search table in the provided snippet."*

There is **no `savedsearches` table** defined anywhere in the M2 documentation, the Database Schema doc, or the system architecture.

### This is an open question — answered here

A `savedsearches` table must be created in the M-05 schema (`smarttracking`). Recommended schema:

```sql
CREATE TABLE smarttracking.savedsearches (
  searchid        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenantid        UUID NOT NULL,
  userid          UUID NOT NULL,
  name            VARCHAR NOT NULL,
  querystring     TEXT NULL,
  filters         JSONB NOT NULL DEFAULT '{}',
  createdat       TIMESTAMPTZ DEFAULT NOW(),
  updatedat       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_savedsearches_tenant_user ON smarttracking.savedsearches (tenantid, userid);

ALTER TABLE smarttracking.savedsearches ENABLE ROW LEVEL SECURITY;
ALTER TABLE smarttracking.savedsearches FORCE ROW LEVEL SECURITY;
```

### Recommended fix

1. Add the `savedsearches` table to the Database Schema doc under the M-05 schema section.
2. Add it to the Searchable Conversation Library TDD data model section.
3. Add `GET /api/v1/smart-tracking/saved-searches` and `POST /api/v1/smart-tracking/saved-searches` to the M-05 API surface in the README.

---

## Drift #6 — `translatedtexts` Table Not in Architecture or Database Schema

**Severity:** 🟠 High  
**File:** `TDD/AI Translator.md` — Section 7

### What was found

The AI Translator TDD proposes a new `translatedtexts` table (Section 7, lines 194-208) with a well-formed schema. This table does not appear in:
- The Database Schema document
- The System Architecture document
- Any other M2 documentation

This table is a **TDD-only recommendation** that has not been promoted to platform-level schema documentation.

### This is an open question — answered here

The `translatedtexts` table design in the TDD is architecturally sound. It follows the platform's database golden rules (UUID PK, `tenantid` as second column, `createdat` timestamp). The UNIQUE constraint on `(tenantid, entitytype, entityid, targetlanguage)` correctly implements idempotent translation storage.

### Recommended fix

1. Add `translatedtexts` to the Database Schema doc under the M-04 `conversationintelligence` schema.
2. Confirm that RLS and FORCE ROW LEVEL SECURITY are enforced.
3. Ensure the Translator TDD references the schema migration requirement explicitly.

---

## Drift #7 — Event Registry Consumers: `tracker.detection.created`

**Severity:** 🟠 High  
**File:** `TDD/AI Smart Tracker.md` — Section 16.5, line 577

### What was found

The AI Smart Tracker TDD (line 577) states:
> "the event registry also lists M-07 as a consumer in the broader downstream chain."

Cross-referencing the Event Schema Registry and System Architecture:
- The system architecture defines `tracker.detection.created` as consumed by **M-06 Insight Generation** and **M-08 Execution and Automation**.
- M-07 (Deal and Account Management) is listed as a **downstream user of tracker detections** through deal-driver snapshots, not as a **direct event consumer** of `tracker.detection.created`.

This is a subtle but important distinction. If M-07 consumes the event directly, it violates the boundary between M-05 and M-07 that requires access to go through approved APIs or M-06-mediated outputs, not direct event subscription.

### Recommended fix

1. Update the Smart Tracker TDD to clarify: *"M-07 consumes tracker-derived outputs through deal-driver snapshots and M-05 public APIs, not by directly consuming `tracker.detection.created` from the event bus."*
2. Verify the Event Schema Registry entry for `tracker.detection.created` to confirm official consumer list is M-06 and M-08 only.

---

## Drift #8 — Missing Queue Name for Translation in Env Registry

**Severity:** 🟡 Medium  
**File:** `Environment Variables Registry-M2.md`

### What was found

The env registry defines queue concurrency variables for:
- `SCORING_QUEUE_CONCURRENCY` (M-04)
- `TOPIC_TAGGING_QUEUE_CONCURRENCY` (M-04)
- `THEME_ANALYSIS_QUEUE_CONCURRENCY` (M-04)
- `TRACKER_DETECTION_QUEUE_CONCURRENCY` (M-05)
- `SEARCH_INDEX_QUEUE_CONCURRENCY` (M-05)

But there is **no `TRANSLATION_QUEUE_CONCURRENCY`** variable despite the AI Translator TDD (Section 8) explicitly saying:
> "Translation should run asynchronously through BullMQ-backed workflows."

Translation is an async AI call. Without a concurrency variable, there is no way to tune the translation worker queue independently from scoring or tagging queues.

### Recommended fix

Add to the env registry:

| Variable | Group | Required | Example | Used By | Purpose |
|---|---|---|---|---|---|
| `TRANSLATION_QUEUE_CONCURRENCY` | Worker concurrency | Yes | `4` | M-04 worker | Concurrency for async translation jobs. Translation is AI-backed and should be independently tuned. |

---

## Drift #9 — Sequence Diagram SD-06 Shows Synchronous Translation

**Severity:** 🟡 Medium  
**File:** `Sequence Diagrams for M2.md` — SD-06

### What was found

The SD-06 (Transcript correction and translation flow) Mermaid diagram shows translation as a **synchronous in-request path**:

```
FE → M04: GET /translations/:id
M04 → DB: Read transcript
M04 → AI: Translate corrected text
AI → M04: Translated output
M04 → DB: Store or cache translated result
M04 → FE: Return translated content
```

However, the AI Translator TDD (Section 8, line 229) explicitly states:
> "Translation should run asynchronously through BullMQ-backed workflows where processing is not trivial or may be retried."

The diagram contradicts the TDD design decision. A synchronous AI call inside a GET request is an anti-pattern for this platform because it blocks the HTTP thread and breaks retry semantics.

### Recommended fix

Update SD-06 to split into two flows:
1. **Async translation trigger** — on transcript availability, M-04 enqueues a translation job → worker → AI service → store `translatedtexts`.
2. **Read path** — `GET /translations/:id` reads the already-computed stored translation from `translatedtexts` (or returns "pending" if not yet ready).

This aligns the sequence diagram with the async-first architecture mandate.

---

## Drift #10 — `transcriptcorrections` Not Listed as M-04 Consumed Table in README

**Severity:** 🟡 Medium  
**File:** `README-M2 Conversation Intelligence.md` — Section 8

### What was found

README Section 8 (Data Ownership) lists tables for M-04 and M-05 but does not mention `transcriptcorrections` or `transcripts` as a table that M-04 reads for downstream processing. The AI Transcriber TDD correctly notes that M-04 consumes corrected transcripts from M-01-owned tables.

This is a missing cross-module read contract that should be documented.

### Recommended fix

Add a note in the README Data Ownership section:
> *"M-04 reads corrected transcript content from M-01-owned tables (`transcripts.correctedtext`, `speakersegments`) through approved cross-module read contracts. M-04 does not own these tables and must not write to them directly."*

---

## Drift #11 — Open Question: `scorecards` Versioning Strategy (AI Call Reviewer)

**Severity:** 🟠 High  
**File:** `TDD/AI Call Reviewer.md` — Section 15, lines 499-501

### Open question recorded in TDD

> "Should scorecard version be explicit as a first-class field in `scorecards` and `callscores`, or derived from document history?"

### Answer

**Scorecard version must be a first-class field.** The TDD itself requires every `callscores` row to be tied to the exact scorecard version used during evaluation (Section 16.1). Deriving version from document history is fragile — document history can be pruned, migrated, or reset without preserving evaluation traceability.

**Recommended implementation:**
- Add `version` as a `VARCHAR` field on `scorecards` (already shown in the TDD payload example as `"version": "v1"`).
- Store `scorecardversion` on `callscores` as a foreign-key-adjacent string to preserve the point-in-time evaluation identity.
- Implement scorecard lifecycle as: `draft` → `published` → `retired`.
- A new published version creates a new `scorecards` row with incremented version, not an update to the existing row.

### Recommended fix

Update the AI Call Reviewer TDD Open Questions section to mark this as **resolved** with the above decision, and add the `version` and lifecycle state fields to the `scorecards` schema definition in Section 7.

---

## Drift #12 — Open Question: AI Theme Spotter Call Limit

**Severity:** 🟡 Medium  
**File:** `TDD/AI Theme Spotter.md` — Section 15, line 477

### Open question recorded in TDD

> "Should there be a hard limit on selected calls per analysis in the public API, even if the internal agent can process up to 500?"

### Answer

**Yes, a hard limit should exist in the public API.** The reasons are:

1. **Cost control:** Uncapped analysis jobs running against 5,000+ calls would create runaway AI API costs.
2. **Queue fairness:** Large unbounded jobs starve smaller tenants waiting for queue capacity.
3. **User experience:** A job running indefinitely gives users no progress expectation.

**Recommended limits:**
- Default cap: **500 calls per analysis** (matching the documented agent capacity).
- Allow admin override up to **1,000 calls** via a future config flag for enterprise tenants.
- Return HTTP 422 with a clear message if the filter produces more calls than the cap allows, and ask the user to narrow filters.

### Recommended fix

Update the Theme Spotter TDD to mark this resolved and add input validation logic to the create-job endpoint contract.

---

## Drift #13 — Open Question: AI Translator — Proactive vs Lazy Translation

**Severity:** 🟡 Medium  
**File:** `TDD/AI Translator.md` — Section 15, line 431

### Open question recorded in TDD

> "Should translation happen proactively for all supported languages or lazily only when requested?"

### Answer

**Lazy (on-demand) translation is the correct default for v1.** Proactive translation for all supported languages would multiply AI API costs by the number of supported languages on every transcript, summary, and brief. At `$19/user` price point, this is not viable without explicit premium pricing.

**Recommended approach:**
- Trigger translation lazily when a user or system first requests a specific language pair for an entity.
- Cache the result in `translatedtexts` with a UNIQUE constraint on `(tenantid, entitytype, entityid, targetlanguage)` so subsequent reads are free.
- Optionally: run **auto-translation for the workspace default language** if it differs from the source transcript language. This is the one proactive case that gives real user value without multiplying cost.

### Recommended fix

Update the Translator TDD to mark this resolved with the lazy + workspace-default-exception approach.

---

## Drift #14 — No Meilisearch Tenant Isolation Strategy Documented

**Severity:** 🔴 Critical  
**File:** `TDD/Searchable Conversation Library.md` — Section 10, Section 15

### What was found

Both the TDD's security section and the open questions section explicitly acknowledge:
> "The architecture raises the open design question of shared versus per-tenant Meilisearch indexing, which means tenant isolation must be explicitly enforced in either model."
> "Should Meilisearch be one shared index with tenantId filter or separate index per tenant."

This is **unresolved** and is a security-critical design gap. Without a formal decision, implementations may:
- Use a shared index without consistent `tenantId` filters (data leak risk)
- Build per-tenant indexes without a management strategy (scaling risk)

### Answer

**Use a shared index with mandatory `tenantId` filter enforcement** for v1. Per-tenant indexes create operational complexity (dynamic index creation, separate Meilisearch API key management, index lifecycle management at tenant offboarding). A shared index with enforced `tenantId` filtering is the standard pattern used in the platform's PostgreSQL RLS model and should be mirrored in Meilisearch.

**Implementation requirements:**
1. Every Meilisearch document must include `tenantId` as a filterable attribute.
2. Every M-05 search query must inject `tenantId = <current_tenant>` as a mandatory filter that the caller cannot override.
3. The `tenantId` filter must be server-enforced, not supplied by the frontend request body.
4. Add `MEILISEARCH_TENANT_FILTER_ENFORCEMENT` as a feature flag in the env registry so this can be audited.

### Recommended fix

1. Update the Searchable Conversation Library TDD Open Questions to mark this resolved with the shared-index + server-enforced-filter decision.
2. Add `tenantId` to the mandatory filterable attributes list in the Meilisearch document shape.
3. Add a note to the Security Architecture document under the Meilisearch section documenting this enforcement pattern.

---

## Summary Table

| # | Drift | Files Affected | Severity | Action |
|---|---|---|---|---|
| 1 | M-10 vs M-09 naming (Coaching) | README, AI Call Reviewer TDD, SD-01 | 🔴 Critical | Rename M-10 → M-09 everywhere |
| 2 | AI endpoint path format inconsistency | README, Env Registry, all TDDs | 🟠 High | Standardize path format; clarify `/internal/` vs `/v1/` |
| 3 | AI Transcriber ownership conflict (M-01 vs M-04) | README, AI Transcriber TDD | 🔴 Critical | Correct README to assign vocab correction to M-01 |
| 4 | `vocabularycorrections` table ownership conflict | README, AI Transcriber TDD, SD-06 | 🔴 Critical | Align all to M-01 schema ownership; fix SD-06 API path |
| 5 | Missing `savedsearches` table | Searchable Conversation Library TDD | 🟠 High | Define table in DB schema doc; add to M-05 APIs |
| 6 | Missing `translatedtexts` table in architecture | AI Translator TDD | 🟠 High | Add table to DB schema doc under M-04 schema |
| 7 | M-07 listed as direct event consumer of `tracker.detection.created` | AI Smart Tracker TDD | 🟠 High | Clarify M-07 accesses via API, not direct event bus |
| 8 | Missing `TRANSLATION_QUEUE_CONCURRENCY` env var | Env Registry | 🟡 Medium | Add variable to registry |
| 9 | SD-06 shows synchronous translation (contradicts TDD async model) | Sequence Diagrams | 🟡 Medium | Refactor SD-06 into async trigger + read path |
| 10 | `transcriptcorrections` cross-module read contract undocumented | README | 🟡 Medium | Add cross-module read note to Data Ownership section |
| 11 | Scorecard versioning open question — unresolved | AI Call Reviewer TDD | 🟠 High | Resolved: use first-class `version` field on scorecards |
| 12 | Theme Spotter call limit open question — unresolved | AI Theme Spotter TDD | 🟡 Medium | Resolved: 500 call default cap with 422 on exceed |
| 13 | AI Translator lazy vs proactive translation — unresolved | AI Translator TDD | 🟡 Medium | Resolved: lazy + workspace default language exception |
| 14 | Meilisearch tenant isolation strategy — unresolved | Searchable Conversation Library TDD | 🔴 Critical | Resolved: shared index + server-enforced tenantId filter |

---

## Critical Path Recommendation

Before any M2 implementation begins, the following drifts **must** be resolved:

1. **Drift #1** — Fix the M-09 vs M-10 naming in all files. This affects event contracts and downstream module mapping.
2. **Drift #3 and #4** — Resolve the `vocabularycorrections` and AI Transcriber ownership conflict. This determines which schema owns the table and which API prefix serves the admin vocabulary endpoint.
3. **Drift #14** — Formally adopt the Meilisearch shared-index + server-enforced tenantId filter pattern. This is a security decision that must precede any search index implementation.
4. **Drift #2** — Standardize the AI endpoint path format. Engineers will build against these paths from day one.

Drifts #5, #6, and #11 should be resolved before the first DB migration is written for M-04 or M-05 features.

---

## Notes on Documents with No Drift

The following items were reviewed and found to be internally consistent and aligned with the platform architecture. No changes are recommended:

- **Event schemas** for `call.scored`, `call.topics.tagged`, and `tracker.detection.created` — payloads are consistent across TDDs and sequence diagrams.
- **BullMQ async-first model** — all TDDs correctly describe async processing. No synchronous AI calls from TypeScript product services appear in any TDD data flow.
- **RLS and tenant isolation** — all TDDs include `tenantid` in their table schemas. The database golden rules are followed.
- **AI service separation** — TypeScript orchestrates, Python infers. No violation of this rule found in any TDD.
- **Confidence-score gating** — all AI-backed features (scoring, tagging, tracking, translation) document confidence thresholds and handling for low-confidence outputs.
- **Idempotency** — all queue-backed flows document idempotency keys or uniqueness constraints.
- **Doppler / secrets** — env registry correctly routes all secrets through Doppler with no hardcoded examples.
