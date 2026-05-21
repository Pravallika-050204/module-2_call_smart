# Doc #13 — Module README: M2 Conversation Intelligence

## 1. Module Overview

M2 Conversation Intelligence is the **Understand** stage of the Revenue Intelligence lifecycle. It helps teams understand what happened inside customer interactions by turning transcripts and interaction data into structured signals such as call scores, topics, themes, tracked signals, translated outputs, corrected terminology, and searchable conversation archives. 

In the product mapping, M2 includes these user-facing features: AI Call Reviewer, AI Topic Tagger, AI Theme Spotter, AI Smart Tracker, AI Translator, AI Transcriber, and Searchable Conversation Library.   
Why it matters is simple: this module takes raw conversation data and makes it usable for insight generation, search, coaching, risk detection, and later execution workflows. 

### Lifecycle stage

- **Lifecycle stage:** Understand. 
- **Primary job:** Track what is happening in calls and conversations and convert that into useful signals. 
- **Upstream dependency:** M-01 Call Transcription and M-03 Revenue Graph context. 
- **Downstream impact:** Feeds M-06 Insight Generation, M-07 Deal and Account Management, M-08 Execution, and M-09 Coaching and Training. 

### What M2 does

From a product point of view, M2 analyzes completed conversations and gives users searchable, structured, AI-enriched understanding of those conversations.   
It helps answer questions like: What topics were discussed, what themes are repeating, what risks appeared, how should this call be scored, and where can I find the right conversation later. 

### Why it matters

Without M2, the platform mostly has captured transcripts and linked CRM context, but not usable intelligence.   
M2 is the bridge between raw conversation capture and the later analysis, execution, forecasting, and coaching modules. 

### Core outputs

The main outputs tied to M2 are call review scores, topic tags, theme analysis results, tracker detections, corrected business terminology, translated transcript outputs, and searchable conversation records.   
At the architecture level, the most explicit event outputs are `call.scored`, `call.topics.tagged`, and `tracker.detection.created`, which are consumed by later modules. 

---

## 2. Features in This Module

M2 contains the following product-facing features. 

### AI Call Reviewer

AI Call Reviewer evaluates sales or support calls using predefined scorecards and AI-generated insights.   
In architecture terms, this belongs to M-04 Conversation Intelligence and stores scorecard definitions and call score results. 

### AI Topic Tagger

AI Topic Tagger labels key discussion topics in calls, such as pricing, next steps, objections, and product issues, so conversations become structured and searchable.   
This is part of M-04 and emits `call.topics.tagged` for downstream search and insight workflows. 

### AI Theme Spotter

AI Theme Spotter analyzes many conversations together to detect recurring themes, trends, objections, and patterns that are not obvious from one call alone.   
This is also implemented inside M-04 Conversation Intelligence through theme analysis jobs and theme result storage. 

### AI Smart Tracker

AI Smart Tracker detects business signals across calls and emails using semantic intent detection instead of simple keyword matching.   
Architecturally, this belongs to M-05 Smart Tracking and Search and emits `tracker.detection.created`. 

### AI Translator

AI Translator converts transcripts and AI-generated outputs into the preferred language of the user or workspace, helping multilingual teams work from the same source interaction data.   
In the architecture, translation preference storage is grouped with M-04 Conversation Intelligence. 

### AI Transcriber

AI Transcriber improves transcript quality by correcting mis-transcribed business-specific terms such as product names, competitor names, acronyms, and jargon.   
Product-wise it belongs to M2, but correction rules and transcript correction behavior touch transcript-domain ownership and are closely tied to M-04 and M-01 flows in the system design. 

### Searchable Conversation Library

Searchable Conversation Library lets users find, filter, analyze, and export calls, accounts, and customer interactions using search and AI-enriched metadata.   
Architecturally, this belongs to M-05 Smart Tracking and Search, which owns the hybrid search APIs and index synchronization logic. 

---

## 3. Product vs Architecture Mapping

This is the most important section for engineers. 

### Product module M2 scope

In the product map, M2 is one sellable and understandable module called **Conversation Intelligence**. It groups together the features that help users understand customer conversations after capture.   
That packaging is useful for roadmap, pricing, UI grouping, and customer communication. 

### Internal split between M-04 and M-05

Inside the architecture, M2 is not implemented as one backend module. Instead, it is split mainly across: 

- **M-04 Conversation Intelligence**, which owns call scoring, topic tagging, theme spotting, and translation preferences. Vocabulary correction rules (`vocabularycorrections`) are owned by M-01 Data Ingestion, because correction runs post-transcription before storage. 
- **M-05 Smart Tracking and Search**, which owns smart trackers, tracker detections, searchable conversation library behavior, hybrid search, and related search sync logic. 

### Ownership clarification note

Use this simple rule:

- If the feature is about **scoring, tagging, themes, or translation preferences**, think **M-04**. 
- If the feature is about **trackers, detections, search, conversation library, or hybrid retrieval**, think **M-05**. 
- If you are writing a product or module README, you can still refer to the combined experience as **M2 Conversation Intelligence**. 

---

## 4. Module Boundaries

### What M2 owns from a product point of view

From a product point of view, M2 owns the features that help users understand captured conversations through AI review, topic understanding, trend detection, tracker detection, translation, transcript cleanup, and library search.   
It owns the “understand the conversation” experience, not the raw capture itself and not the final analytical summaries. 

### What M2 does not own

M2 does **not** own raw transcription generation, call ingestion, CRM syncing, revenue entity linking, summary generation, deal boards, forecasting, dashboards, or coaching outputs.   
Those belong to upstream or downstream modules such as M-01, M-03, M-06, M-07, M-08, and M-09. 

### Allowed dependencies

M2 is allowed to depend on:

- **M-01 Data Ingestion** for completed transcripts and transcript-related source data. 
- **M-03 Revenue Graph** for deal, account, and contact context used in scoring and enrichment. 
- **AI Services Layer** for scoring, theme detection, topic tagging, tracker detection, and embeddings. 
- **Platform Core** for auth, tenant context, audit, and RBAC. 

### Downstream consumers

The main downstream consumers are:

- **M-05** from M-04, especially through `call.topics.tagged`. 
- **M-06 Insight Generation**, which uses topic tags and tracker detections. 
- **M-07 Deal and Account Management**, which uses tracker detections and later insights. 
- **M-08 Execution and Automation** and **M-09 Coaching and Training**, which consume later outputs like detections and scores. 

---

## 5. Architecture Snapshot

### Main components

The main architecture pieces behind M2 are: 

- **M-04 ConversationIntelligenceModule** with API prefix `api/v1/conversation-intelligence`. 
- **M-05 SmartTrackingModule** with API prefix `api/v1/smart-tracking`. 
- **AI Services Layer** in Python FastAPI, called for scoring, theme detection, topic tagging, tracker detection, and embeddings. 
- **Meilisearch** for search and **pgvector** for semantic retrieval. 

### Queue and event flows

The architecture is event-driven, so M2 does not directly pull everything synchronously.   
It reacts to upstream events like `call.transcription.completed` and `revenuegraph.entity.linked`, then emits downstream events like `call.scored`, `call.topics.tagged`, and `tracker.detection.created`. 

### AI service interactions

TypeScript product services must orchestrate business workflows, while Python AI services handle inference and NLP.   
For M2, that means NestJS modules call AI endpoints such as `POST /v1/score-call`, `POST /v1/detect-themes`, `POST /v1/tag-topics`, `POST /v1/detect-trackers`, and `POST /v1/embed` instead of embedding AI logic inside product services.

*Note: NestJS calls the AI service at `/internal/<endpoint>`. The `/v1/...` paths in TDDs represent the logical AI service contract name.* 

### Search and storage dependencies

M2 depends on PostgreSQL for persistent records, Redis plus BullMQ for async queues, Meilisearch for fast text search, and pgvector for semantic retrieval.   
That combination is what makes the searchable conversation library both filterable and AI-aware. 

---

## 6. Events

### Events consumed

The most important upstream events consumed by the M2 implementation are: 

- `call.transcription.completed` from M-01. 
- `revenuegraph.entity.linked` from M-03. 
- `email.sent` for tracker-related M-05 flows. 

A key rule is that M-04 should wait for `revenuegraph.entity.linked` before finalizing call scores when revenue context is needed. 

### Events emitted

The main emitted events are:

- `call.scored` from M-04. 
- `call.topics.tagged` from M-04. 
- `tracker.detection.created` from M-05. 

These events feed M-05, M-06, M-07, M-08, and M-09 depending on the feature flow. 

### Event ownership and idempotency

Each producing module owns its own event contract.   
Idempotency is required because retries can happen, so handlers must avoid duplicating call scores, tags, tracker detections, or index sync runs. 

---

## 7. APIs

### M-04 feature endpoints

M-04 exposes these main endpoints: 

- `GET /api/v1/conversation-intelligence/calls/:id/score` 
- `POST /api/v1/conversation-intelligence/scorecards` 
- `GET /api/v1/conversation-intelligence/scorecards` 
- `POST /api/v1/conversation-intelligence/theme-analyses` 
- `GET /api/v1/conversation-intelligence/theme-analyses/:id` 
- `GET /api/v1/conversation-intelligence/calls/:id/topics` 
- `POST /api/v1/conversation-intelligence/vocabulary` 
- `GET /api/v1/conversation-intelligence/translations/:id` 

### M-05 search and tracker endpoints

M-05 exposes these main endpoints: 

- `GET /api/v1/smart-tracking/trackers` 
- `POST /api/v1/smart-tracking/trackers` 
- `GET /api/v1/smart-tracking/trackers/:id/detections` 
- `GET /api/v1/smart-tracking/conversations/search` 
- `GET /api/v1/smart-tracking/conversations` 
- `GET /api/v1/smart-tracking/deal-drivers` 
- `GET /api/v1/smart-tracking/saved-searches`
- `POST /api/v1/smart-tracking/saved-searches` 

### Admin configuration endpoints

Admin-style configuration mainly includes scorecards, theme analyses, vocabulary correction rules, and tracker configuration endpoints.   
These must be RBAC-protected because they affect tenant-wide AI behavior and review logic. 

---

## 8. Data Ownership

### Core tables and indexes

M-04 owns tables such as `scorecards`, `callscores`, `themes`, `themeanalyses`, `topictags`, `topicmodels`, and `translationpreferences`.   
M-05 owns tables such as `trackers`, `trackerdetections`, `searchindexsynclog`, and `dealdriversnapshots`. 

*M-04 reads corrected transcript content and correction logs from M-01-owned tables (`transcripts.correctedtext`, `speakersegments`, `transcriptcorrections`) through approved cross-module read contracts. M-04 does not own these tables and must not write to them directly.* 

Important indexes include tenant-plus-call indexes for call scores and topic tags, plus tenant-plus-tracker and tenant-plus-deal indexes for tracker detections. 

### Search index ownership

Search index behavior belongs to M-05, with Meilisearch used for full-text search and pgvector used for semantic retrieval support.   
That means if you are working on searchable conversation library internals, M-05 is the backend owner even though the product feature is shown under M2. 

### Tenant isolation and retention

Every table must include `tenantid`, and row-level security is a non-negotiable platform rule.   
Conversation and transcript data are tenant-owned, and client data must not be used for shared model training without explicit consent. 

---

## 9. Local Development

### Prerequisites

To work locally on M2-related features, developers typically need the standard local stack: Docker, Docker Compose, the NestJS backend, Python AI services, PostgreSQL, Redis, and search dependencies such as Meilisearch.   
TypeScript is used for product services and Python is used for AI services, so both runtimes matter for M2 work. 

### Setup steps

A normal local setup should start the multi-service stack through Docker Compose so that backend APIs, AI services, database, Redis, and supporting infra run together.   
This is important because M2 behavior depends heavily on queues, events, and service-to-service calls, not just isolated controller code. 

### Background workers

BullMQ-backed workers must be running locally if you want scoring jobs, tagging jobs, tracker detection, or indexing flows to behave correctly.   
Without workers, the APIs may enqueue jobs but nothing meaningful will happen after that. 

### Search and index setup

For M2 search-related development, you need Meilisearch available and any required index bootstrapping or seed data ready.   
If you are testing semantic search, you also need the embedding flow and pgvector-backed data path available. 

### Test commands

Use the approved stack tools for testing: Jest for unit and service tests, Supertest for HTTP integration tests, Playwright for UI flows, Testcontainers for realistic infra-backed tests, and k6 for load or concurrency validation when needed. 

---

## 10. Configuration

### Required env vars

The exact env registry is project-managed, but M2 work will depend on the usual backend, AI, queue, database, and search configuration values for PostgreSQL, Redis, Meilisearch, auth, and AI service connectivity.   
If a feature touches semantic search or AI scoring, environment variables for the AI service and embedding path are also required. 

### Optional env vars

Optional values may include local overrides for search tuning, feature flags, fallback providers, and observability integrations.   
These should stay out of source control and come from approved secret delivery paths. 

### Secret sources

Secrets must be managed through Doppler and must not be committed into repos or baked into images.   
This includes API keys, provider credentials, database URLs, and integration secrets. 

### Link to env registry

Use the team-maintained environment registry or secrets inventory defined by the project’s operational setup, not ad hoc local notes.   
That keeps onboarding cleaner and prevents drift between engineers. 

---

## 11. Operational Notes

### Common failure modes

Common M2 failure modes include missing upstream entity linkage, AI service timeouts, queue backlog growth, Redis issues, search index lag, Meilisearch degradation, and duplicate event delivery.   
For M-04 specifically, finalization can be delayed if `revenuegraph.entity.linked` has not arrived yet. 

### Reprocessing guidance

Reprocessing may be needed when topic models, vocabulary corrections, tracker logic, or embedding strategies change.   
Any replay or reindex flow must be idempotent so that old calls are not duplicated and new outputs do not corrupt tenant records. 

### Search reindex guidance

If search documents or ranking logic change materially, M-05-owned search data may need reindexing in Meilisearch and possibly regeneration of semantic retrieval support data.   
Do this through controlled batch jobs, not manual ad hoc scripts against production data. 

### Support ownership

In practice, support ownership is split by architecture responsibility: M-04 issues go to the Conversation Intelligence backend owner, M-05 issues go to the Smart Tracking and Search owner, and shared AI-service issues go to the AI team.   
From a product or support desk perspective, however, they can still be grouped under the M2 Conversation Intelligence umbrella. 

---

## 12. Related Docs

Use these as the main follow-up documents for deeper implementation detail: 

- **System Architecture Document (SAD)** for full module boundaries, flows, events, and storage design. 
- **Feature TDDs** for each M2 feature such as AI Transcriber and Searchable Conversation Library. 
- **Sequence diagrams and flow docs** for event-driven execution order and async processing. 
- **API docs and runbooks** for endpoint contracts, operational guidance, and troubleshooting. 