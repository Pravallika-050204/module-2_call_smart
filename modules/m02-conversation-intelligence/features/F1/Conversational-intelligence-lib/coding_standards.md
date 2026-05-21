```markdown
# Doc #7 — Coding Standards & Style Guide

**Version:** 1.0
**Status:** Draft
**Owner:** Tech Lead
**Last Updated:** 2026-04-21
**Applies To:** All contributors — fulltime engineers, freshers, interns, contractors

---

# Chapter 1 — Purpose & Scope

## 1.1 Why This Document Exists

R-Revenue Intelligence is built by a mixed team — senior engineers, freshers, and interns
working across TypeScript, Python, and infrastructure layers simultaneously.

Without a single, enforced standard, the codebase drifts. One developer uses raw SQL,
another uses Prisma. One writes AI logic in TypeScript, another in Python. One names
events `callDone`, another names them `call.transcription.completed`. Every inconsistency
becomes a bug, a security gap, or a maintenance burden that the next developer — often a
fresher — inherits.

This document exists to eliminate that drift entirely.

Every rule in this document has one of three sources:
- A deliberate architecture decision recorded in our ADR registry (`docs/adr/`)
- A production incident or near-miss that taught us the rule the hard way
- A security or compliance requirement that is non-negotiable

This is not a preferences document. These are the rules the team has committed to. If
you disagree with a rule, the process to change it is in Section 1.4. Until a rule is
formally changed, it is enforced without exception.

---

## 1.2 Who This Document Applies To

This document applies to **every person who writes, reviews, or merges code** into the
R-Revenue Intelligence repository. There are no exceptions based on role, seniority, or
employment type.

| Role | Applies? | Notes |
|---|---|---|
| Senior Engineers | ✅ Yes | Also responsible for enforcing standards in PR reviews |
| Mid-level Engineers | ✅ Yes | |
| Freshers (0–1 yr exp) | ✅ Yes | Must complete Chapter 15 onboarding checklist before first PR |
| Interns | ✅ Yes | Must complete Chapter 15 onboarding checklist before first PR |
| Contractors / Freelancers | ✅ Yes | Must be briefed on this document before access is granted |
| Tech Lead | ✅ Yes | Sets the standard and is the final decision authority on exceptions |

> **Note for Freshers and Interns:** You are not expected to memorise every section
> before you start. You are expected to read Chapters 1, 2, 3, and 15 in full before
> writing your first line of production code, and to refer back to the relevant chapter
> every time you work on a new area. When in doubt, ask — do not guess and merge.

---

## 1.3 How This Document Is Enforced

Standards without enforcement are suggestions. Every critical rule in this document is
backed by one or more of the following enforcement mechanisms:

### CI Gates (Automated — Blocks Merge)
Every pull request must pass all of the following checks before it can be merged to
`main` or `develop`. These run automatically on every push:

```yaml
pr-checks:
  steps:
    - name: TypeScript type check
      run: tsc --noEmit

    - name: Unit & Integration tests (≥80% coverage)
      run: jest --coverage --coverageThreshold='{"global":{"lines":80}}'

    - name: Zod schema validation
      run: ts-node scripts/validate-schemas.ts

    - name: Prisma schema validation
      run: prisma validate

    - name: RLS enforcement check
      run: ts-node scripts/check-rls-all-tables.ts

    - name: No cross-module imports
      run: ts-node scripts/check-module-boundaries.ts

    - name: Sentry source maps upload
      run: sentry-cli releases files upload-sourcemaps
```

A PR with **any failing gate cannot be merged** — not by the author, not by the Tech
Lead. Fix the gate, then merge.

### PR Code Review (Human — Blocks Merge)
Every PR requires:
- **At least one peer review** from another engineer on the team
- **Tech Lead sign-off** for any change that touches module boundaries, database
  schemas, event contracts, ADRs, or security configuration

Reviewers are expected to check for standard compliance, not just functional
correctness. If a PR passes CI but violates a standard in this document, the reviewer
must request changes — not just leave a comment.

### Tech Lead Sign-Off (Human — Blocks Deploy)
No deployment to production happens without Tech Lead approval. This is the final gate
where architectural compliance is verified before code reaches users.

### Violation Escalation Path
If a violation is found after merge (in code review of a later PR, in a postmortem,
or in an audit):

1. Raise a `fix/` branch immediately
2. Tag the Tech Lead in the PR description with the violation reference
3. The fix must merge before any new feature work in that module proceeds
4. Repeat violations from the same developer trigger a 1:1 with the Tech Lead

---

## 1.4 How to Propose a Change to This Document

This document is a living standard. Rules can and should evolve as the platform grows.
However, no individual developer changes a rule unilaterally — including the Tech Lead.

### Process to Propose a Change

**Step 1 — Raise a Draft ADR** (if the change involves a technology or architecture
decision)
Create a new ADR in `docs/adr/` using the standard ADR format. Set `Status: Draft`.
Link to the specific section of this document the ADR affects.

**Step 2 — Open a Discussion**
Create a GitHub Discussion or bring it to the next team sync. Describe:
- Which rule you want to change and why
- What problem the current rule causes
- What you propose instead
- Any risks or trade-offs of the change

**Step 3 — Tech Lead Review**
The Tech Lead reviews the proposal. If approved, the Tech Lead updates this document
and the relevant ADR status to `Approved`. If rejected, the Tech Lead documents why in
the ADR so the reasoning is on record.

**Step 4 — Version Bump**
Any change to this document increments the version number at the top of the file and
adds a changelog entry below.

> **Rule:** Do not merge code that contradicts this document while a proposal to change
> it is pending. If you believe an existing rule is wrong, raise the proposal — do not
> work around the rule.

---

## 1.5 Relationship to Other Documents

This document does not exist in isolation. It is one part of the R-Revenue Intelligence
documentation system. Understand how it connects to the other documents before you
start work.

| Document | What It Contains | When to Read It |
|---|---|---|
| **Doc #1 — System Architecture Document (SAD)** | Platform architecture, 10 modules, event contracts, data layer design, ADR registry, deployment phases | Before writing any code — the SAD is the source of truth for all architectural decisions |
| **Doc #7 — Coding Standards & Style Guide (this document)** | How to implement the architecture correctly — naming, patterns, testing, security, deployment | Before your first PR and as a reference throughout |
| **`docs/adr/` — ADR Registry** | Every technology decision formally recorded with context, options, and rationale | When you encounter a technology choice you don't understand, or before introducing any new technology |
| **Doc #2 — API Reference** | All public API endpoints, request/response schemas, versioning | When building or consuming an API endpoint |
| **Doc #3 — Data Model Reference** | Prisma schema, table ownership, RLS policies, index requirements | When writing any database migration or query |
| **Doc #4 — Event Contract Registry** | All BullMQ event names, payload schemas, publisher/consumer ownership | When publishing or subscribing to any event |

### Priority Order
If this document and the SAD ever appear to contradict each other, the **SAD takes
precedence** for architectural decisions. Raise the contradiction with the Tech Lead
immediately — it means one of the two documents needs to be updated.

If this document and an ADR appear to contradict each other, the **ADR takes
precedence** — it is the formal decision record. Raise it with the Tech Lead so this
document can be corrected.

---

## 1.6 Document Changelog

| Version | Date | Author | Changes |
|---|---|---|---|
| 1.0 | 2026-04-21 | Tech Lead | Initial release |
```



# Chapter 2 — The 10 Golden Rules

These are the non-negotiable rules of this codebase. Every developer — senior or
fresher — must know these before writing a single line of production code.

These are not suggestions. A PR that violates any of these rules **will not merge**.

---

## The Rules

---

### Rule 1 — Never write AI logic in TypeScript

**What this means:**
No `import OpenAI from 'openai'`. No LangChain npm packages. No model calls, no prompt
strings, no embedding generation inside any NestJS or Next.js file.

All AI logic lives in the Python FastAPI services — full stop.

**Why:**
The TypeScript layer is the product brain. The Python layer is the AI brain. Mixing
them creates untestable, unmaintainable spaghetti. → `ADR-002`, `ADR-003`

**Violation:** PR blocked. Immediate refactor required before resubmission.

---

### Rule 2 — Never import one module's code directly into another module

**What this means:**
If you are working in Module M-04 and you need data from Module M-01, you do **not**
do this:

```ts
// ❌ WRONG — direct cross-module import
import { TranscriptionService } from '../m01-data-ingestion/transcription.service';
```

You publish or subscribe to a BullMQ event, or call the module's public API endpoint.

```ts
// ✅ CORRECT — communicate via event
await this.eventBus.publish('call.transcription.completed', { ... });
```

**Why:**
Modules must be logically independent. Direct imports create hidden coupling that
breaks the entire modular architecture. → `ADR-001`

**Violation:** PR blocked. The cross-module boundary check CI script will catch this
automatically.

---

### Rule 3 — Never put secrets in code, .env files, or Docker images

**What this means:**
No API keys, database passwords, JWT secrets, or credentials anywhere in the
repository — not in source files, not in `.env` files committed to git, not baked into
a Docker image.

All secrets are managed exclusively through **Doppler**.

```ts
// ❌ WRONG
const openaiKey = 'sk-abc123...';

// ✅ CORRECT — Doppler injects this at runtime
const openaiKey = process.env.OPENAI_API_KEY;
```

**Why:**
A secret committed to git is a compromised secret — even if you delete it later, it
lives in git history. → `ADR-026`

**Violation:** PR blocked. Secret must be rotated immediately. Tech Lead notified.

---

### Rule 4 — Never write raw SQL in services — use Prisma only

**What this means:**
All database reads and writes go through Prisma ORM. No `db.query('SELECT * FROM...')`,
no `pg.Client`, no raw SQL strings anywhere in TypeScript service files.

```ts
// ❌ WRONG
const result = await db.query('SELECT * FROM m01_transcriptions WHERE tenant_id = $1');

// ✅ CORRECT
const result = await this.prisma.m01Transcription.findMany({
  where: { tenantId },
});
```

**Why:**
Prisma gives us type safety, schema validation, and automatic multi-tenancy checks.
Raw SQL bypasses all of that and creates injection risk. → `ADR-004`

**Violation:** PR blocked.

---

### Rule 5 — Every API request must be validated with Zod before reaching business logic

**What this means:**
Every controller endpoint must have a Zod DTO. No unvalidated `req.body` object ever
reaches a service function.

```ts
// ✅ CORRECT — Zod DTO defined and used
const CreateCallSchema = z.object({
  tenantId: z.string().uuid(),
  audioUrl: z.string().url(),
  duration: z.number().positive(),
});

type CreateCallDto = z.infer<typeof CreateCallSchema>;
```

**Why:**
Unvalidated input is the root cause of the majority of application bugs and security
vulnerabilities. Zod catches bad data at the boundary before it corrupts anything.
→ `ADR-015`

**Violation:** PR blocked.

---

### Rule 6 — Never call AI services synchronously from a request handler

**What this means:**
AI processing takes time — sometimes seconds, sometimes minutes. A user's HTTP request
must never sit and wait for an AI job to finish.

```ts
// ❌ WRONG — user waits for AI to finish
app.post('/calls', async (req, res) => {
  const summary = await aiService.summarize(transcript); // could take 30s
  res.json(summary);
});

// ✅ CORRECT — queue the job, return immediately
app.post('/calls', async (req, res) => {
  await this.eventBus.publish('call.transcription.completed', { callId });
  res.json({ status: 'processing' }); // user gets instant response
});
```

**Why:**
Synchronous AI calls time out, block threads, and create terrible user experience.
All AI work is async via BullMQ. → `ADR-005`

**Violation:** PR blocked.

---

### Rule 7 — Never use `latest` for Docker base image tags

**What this means:**
Every `FROM` statement in every Dockerfile must pin an exact version.

```dockerfile
# ❌ WRONG
FROM node:latest

# ✅ CORRECT
FROM node:20.11.1-alpine3.19
```

**Why:**
`latest` changes without warning. Today's working build breaks tomorrow when the base
image silently updates. Pinned versions make builds reproducible and safe.

**Violation:** PR blocked.

---

### Rule 8 — No new technology without an approved ADR

**What this means:**
Before you add any new library, framework, database, or service to the codebase, you
must:
1. Write a Draft ADR in `docs/adr/`
2. Get Tech Lead approval (Status: Approved)
3. Then — and only then — write the integration code

This includes npm packages, pip packages, Docker base images from a new registry, and
any new cloud service.

**Why:**
Every technology we add is something the whole team must understand, secure, maintain,
and eventually migrate away from. Undocumented technology choices become technical debt.
→ ADR Registry in `docs/adr/`

**Violation:** PR blocked. New tech dependency removed. ADR process must be followed.

---

### Rule 9 — Every query must filter by `tenantId`

**What this means:**
This is a multi-tenant platform. Every single database query — whether reading or
writing — must include a `tenantId` filter. No exceptions.

```ts
// ❌ WRONG — returns data for ALL tenants
const calls = await this.prisma.m01Transcription.findMany();

// ✅ CORRECT — scoped to this tenant only
const calls = await this.prisma.m01Transcription.findMany({
  where: { tenantId: currentUser.tenantId },
});
```

**Why:**
Without tenantId scoping, one customer can see another customer's data. This is a
critical data isolation failure. Row Level Security (RLS) is a backup — application
layer filtering is mandatory too. → `ADR-008`

**Violation:** PR blocked. Security review triggered. Tech Lead notified immediately.

---

### Rule 10 — No merge to `main` without all CI gates passing + Tech Lead approval

**What this means:**
All 7 CI checks must be green. Then at least one peer review. Then Tech Lead sign-off.
All three. In that order. Every time.

There is no "I'll fix it in the next PR." There is no "it's just a small change."
Every merge to `main` follows the full process.

**Why:**
`main` is always production-ready. The moment we allow exceptions, the process breaks
down and `main` becomes unreliable.

**Violation:** PR rejected. Merge reverted if it somehow bypasses the gate.

---

## Quick Reference Card

> Print this. Pin it to your monitor. Read it every morning until it is automatic.


┌─────────────────────────────────────────────────────────────────────┐
│ R-REVENUE INTELLIGENCE — THE 10 GOLDEN RULES │
├────┬────────────────────────────────────────────────────────────────┤
│ 1 │ No AI logic in TypeScript — Python only ADR-002/003 │
│ 2 │ No cross-module imports — events or API only ADR-001 │
│ 3 │ No secrets in code / .env / Docker — Doppler ADR-026 │
│ 4 │ No raw SQL — Prisma only ADR-004 │
│ 5 │ Validate every API request with Zod ADR-015 │
│ 6 │ No synchronous AI calls from request handlers ADR-005 │
│ 7 │ Never use latest Docker tags — pin exact version │
│ 8 │ No new tech without an approved ADR ADR Registry │
│ 9 │ Every DB query must filter by tenantId ADR-008 │
│ 10 │ No merge to main without CI gates + TL approval │
├────┴────────────────────────────────────────────────────────────────┤
│ When in doubt — ASK the Tech Lead. Do not guess and merge. │
└─────────────────────────────────────────────────────────────────────┘


---

## What Happens When a Rule Is Violated

| Severity | Situation | Consequence |
|---|---|---|
| 🔴 **Critical** | Secret committed to git | PR blocked, secret rotated immediately, Tech Lead notified, security review |
| 🔴 **Critical** | `tenantId` missing from query — data isolation breach | PR blocked, security review, 1:1 with Tech Lead |
| 🟠 **High** | AI logic written in TypeScript | PR blocked, refactor required |
| 🟠 **High** | Cross-module direct import | PR blocked, refactor required |
| 🟠 **High** | New tech merged without ADR | PR reverted, ADR process must be followed |
| 🟡 **Medium** | Missing Zod validation | PR blocked, DTO required |
| 🟡 **Medium** | Raw SQL in service | PR blocked, Prisma migration required |
| 🟡 **Medium** | `latest` Docker tag | PR blocked, version must be pinned |
| ⚪ **Process** | Merge without all CI gates | PR rejected or reverted |
| ⚪ **Process** | Repeat violations (same dev) | 1:1 with Tech Lead |

---
---

# Chapter 3 — Project Structure & File Conventions

Before writing any code, you need to know **where everything lives** and **what
everything is called**. This chapter is your map.

---

## 3.1 Full Monorepo Directory Tree

This is the top-level structure of the entire repository.

r-revenue-intelligence/
│
├── apps/ ← All runnable services live here
│ ├── api/ ← NestJS Modular Monolith (TypeScript)
│ ├── frontend/ ← Next.js 15 (TypeScript)
│ ├── ai-services/ ← FastAPI AI inference (Python)
│ └── transcription-service/ ← FastAPI Whisper/pyannote (Python)
│
├── packages/ ← Shared code used across apps
│ ├── types/ ← Shared TypeScript types & Zod schemas
│ ├── event-contracts/ ← BullMQ event payload types (source of truth)
│ └── config/ ← Shared ESLint, Prettier, TypeScript configs
│
├── docs/ ← All project documentation
│ ├── adr/ ← Architecture Decision Records (ADR-001, ADR-002...)
│ ├── sad/ ← System Architecture Document (Doc #1)
│ └── coding-standards.md ← THIS document (Doc #7)
│
├── docker/ ← Dockerfiles for each service
│ ├── api.Dockerfile
│ ├── frontend.Dockerfile
│ ├── ai-services.Dockerfile
│ └── transcription.Dockerfile
│
├── scripts/ ← CI validation scripts
│ ├── check-module-boundaries.ts
│ ├── check-rls-all-tables.ts
│ └── validate-schemas.ts
│
├── .github/
│ └── workflows/
│ ├── pr-checks.yml ← Runs all 7 CI gates on every PR
│ └── deploy.yml ← Production deployment pipeline
│
├── docker-compose.yml ← Local dev — spins up full stack
├── docker-compose.test.yml ← Integration test environment
├── turbo.json ← Turborepo build orchestration
└── package.json ← Root workspace config



> **Rule for freshers:** If you are unsure where a new file belongs, check Section 3.7
> (decision tree) before creating it anywhere.

---

## 3.2 NestJS API — Module Folder Structure

The `apps/api/` folder is the Modular Monolith. Each of the 10 platform modules
(M-01 to M-10) has its own folder under `src/modules/`.

apps/api/
│
├── src/
│ ├── modules/
│ │ │
│ │ ├── m01-data-ingestion/ ← One folder per module
│ │ │ ├── m01.module.ts ← NestJS module definition
│ │ │ ├── m01.controller.ts ← HTTP route handlers
│ │ │ ├── m01.service.ts ← Business logic
│ │ │ ├── m01.events.ts ← BullMQ publish & subscribe handlers
│ │ │ ├── dto/ ← Zod schemas + inferred TS types
│ │ │ │ └── create-call.dto.ts
│ │ │ ├── entities/ ← Prisma model helper types
│ │ │ └── _tests_/ ← Unit and integration tests
│ │ │ ├── m01.service.spec.ts
│ │ │ └── m01.controller.spec.ts
│ │ │
│ │ ├── m02-sales-engagement/ ← Same structure for every module
│ │ ├── m03-revenue-graph/
│ │ ├── m04-conversation-intelligence/
│ │ ├── m05-smart-tracking/
│ │ ├── m06-insight-generation/
│ │ ├── m07-deal-account-management/
│ │ ├── m08-execution-automation/
│ │ ├── m09-forecasting/
│ │ └── m10-performance-coaching/
│ │
│ ├── common/ ← Shared guards, interceptors, filters
│ │ ├── guards/
│ │ │ └── jwt.guard.ts
│ │ ├── interceptors/
│ │ │ └── logging.interceptor.ts
│ │ └── filters/
│ │ └── global-exception.filter.ts
│ │
│ ├── config/ ← App configuration (loaded from Doppler)
│ ├── prisma/ ← Prisma client singleton
│ └── main.ts ← App entry point
│
├── prisma/
│ ├── schema.prisma ← Database schema (source of truth)
│ └── migrations/ ← Auto-generated migration files
│
├── tsconfig.json
└── package.json


> **Rule:** Every module must have exactly these files: `.module.ts`, `.controller.ts`,
> `.service.ts`, `.events.ts`. Do not skip any of them, even if a module has no HTTP
> endpoints yet (the controller can be empty).

---

## 3.3 FastAPI AI Services — Folder Structure


apps/ai-services/
│
├── routers/ ← One file per endpoint group
│ ├── summarize.py ← POST /v1/summarize
│ ├── score_call.py ← POST /v1/score-call
│ ├── detect_themes.py ← POST /v1/detect-themes
│ ├── detect_trackers.py ← POST /v1/detect-trackers
│ ├── embed.py ← POST /v1/embed
│ ├── answer_query.py ← POST /v1/answer-query
│ ├── generate_email.py ← POST /v1/generate-email
│ └── simulate_turn.py ← POST /v1/simulate-turn
│
├── services/ ← Business logic per task
│ ├── summarizer.py
│ ├── call_scorer.py
│ └── rag_pipeline.py
│
├── prompts/ ← Versioned Jinja2 prompt templates
│ ├── summarize/
│ │ ├── v1.jinja2
│ │ └── v2.jinja2
│ ├── score_call/
│ │ └── v1.jinja2
│ └── generate_email/
│ └── v1.jinja2
│
├── schemas/ ← Pydantic v2 input/output models
│ ├── summarize_schema.py
│ └── score_call_schema.py
│
├── tests/ ← pytest test files
│ ├── test_summarize.py
│ └── test_score_call.py
│
├── main.py ← FastAPI app entry point
├── requirements.txt
└── pyproject.toml ← ruff + black config


---

## 3.4 FastAPI Transcription Service — Folder Structure


apps/transcription-service/
│
├── routers/
│ └── transcribe.py ← POST /v1/transcribe
│
├── services/
│ ├── whisper_service.py ← Primary ASR (Whisper)
│ ├── assemblyai_service.py ← Fallback ASR (AssemblyAI)
│ └── diarization_service.py ← Speaker diarization (pyannote)
│
├── schemas/
│ └── transcription_schema.py
│
├── tests/
│ └── test_transcribe.py
│
├── main.py
├── requirements.txt
└── pyproject.toml


> **Note for freshers:** This service is separate from `ai-services` intentionally.
> Transcription is the most critical pipeline in the platform — it must be independently
> scalable and independently monitored. Never merge these two services.

---

## 3.5 Next.js Frontend — Folder Structure


apps/frontend/
│
├── app/ ← Next.js 15 App Router (all pages here)
│ ├── (auth)/
│ │ ├── login/
│ │ │ └── page.tsx
│ │ └── signup/
│ │ └── page.tsx
│ ├── (dashboard)/
│ │ ├── calls/
│ │ │ ├── page.tsx ← Call list page
│ │ │ └── [id]/
│ │ │ └── page.tsx ← Single call review page
│ │ ├── deals/
│ │ └── settings/
│ └── layout.tsx ← Root layout
│
├── components/ ← Reusable UI components
│ ├── ui/ ← shadcn/ui base components (do not edit)
│ └── features/ ← Feature-specific components
│ ├── calls/
│ └── deals/
│
├── lib/
│ ├── api/ ← TanStack Query hooks (all API calls)
│ │ ├── calls.ts
│ │ └── deals.ts
│ ├── store/ ← Zustand stores (UI state only)
│ │ ├── ui.store.ts
│ │ └── sidebar.store.ts
│ └── utils.ts
│
├── types/ ← Frontend-specific TypeScript types
├── public/ ← Static assets
├── tailwind.config.ts
├── tsconfig.json
└── package.json


---

## 3.6 Shared `packages/` Conventions

The `packages/` folder contains code that is shared across multiple apps. Do not put
business logic here — only shared contracts and configuration.


packages/
│
├── types/ ← Shared TypeScript interfaces
│ ├── src/
│ │ ├── call.types.ts
│ │ ├── deal.types.ts
│ │ └── user.types.ts
│ └── package.json
│
├── event-contracts/ ← BullMQ event payload types (SINGLE SOURCE OF TRUTH)
│ ├── src/
│ │ ├── call.events.ts ← call.transcription.completed payload type
│ │ ├── deal.events.ts ← deal.stage.changed payload type
│ │ └── index.ts
│ └── package.json
│
└── config/ ← Shared tooling configuration
├── eslint-config/
├── prettier-config/
└── tsconfig/




> **Rule:** If you add a new BullMQ event, you must add its payload type to
> `packages/event-contracts/` first. Both the publisher and the subscriber import
> from this package. Never define event payload types locally inside a module.

---

## 3.7 Where Does My New File Go? (Decision Tree for Freshers)


I need to create a new file. Where does it go?
│
├── Is it a database schema change?
│ └── → Edit apps/api/prisma/schema.prisma, then run prisma migrate dev
│
├── Is it a new API endpoint?
│ └── → Goes in the relevant module folder under apps/api/src/modules/m0X-.../
│ ├── Route handler → m0X.controller.ts
│ ├── Business logic → m0X.service.ts
│ └── Request/response type → m0X/dto/your-dto.ts
│
├── Is it an AI inference endpoint?
│ └── → Goes in apps/ai-services/routers/ and apps/ai-services/services/
│
├── Is it a prompt template?
│ └── → Goes in apps/ai-services/prompts/<task-name>/v1.jinja2
│
├── Is it a UI page?
│ └── → Goes in apps/frontend/app/<route>/page.tsx
│
├── Is it a reusable UI component?
│ └── → Goes in apps/frontend/components/features/<feature-name>/
│
├── Is it a shared type used by multiple apps?
│ └── → Goes in packages/types/src/
│
├── Is it a new BullMQ event type?
│ └── → Goes in packages/event-contracts/src/
│
├── Is it a test file?
│ └── → Goes in __tests__/ inside the same module folder as the file being tested
│
└── Still not sure?
└── → Ask the Tech Lead before creating the file. Do not guess.


---

## 3.8 Naming Conventions

Apply these consistently. When in doubt, follow the table exactly.

### TypeScript (NestJS + Next.js)

| What | Convention | Example |
|---|---|---|
| File names | `kebab-case` | `call-review.service.ts` |
| Class names | `PascalCase` | `CallReviewService` |
| Function names | `camelCase` | `getCallById` |
| Variable names | `camelCase` | `transcriptText` |
| Constants | `SCREAMING_SNAKE_CASE` | `MAX_RETRY_ATTEMPTS` |
| Interface names | `PascalCase` with `I` prefix optional | `CreateCallDto` |
| Enum names | `PascalCase` | `CallStatus` |
| Enum values | `SCREAMING_SNAKE_CASE` | `CallStatus.IN_PROGRESS` |
| Test files | `<filename>.spec.ts` | `call-review.service.spec.ts` |
| DTO files | `<action>-<resource>.dto.ts` | `create-call.dto.ts` |

### Python (FastAPI)

| What | Convention | Example |
|---|---|---|
| File names | `snake_case` | `call_scorer.py` |
| Class names | `PascalCase` | `CallScorerService` |
| Function names | `snake_case` | `get_call_by_id` |
| Variable names | `snake_case` | `transcript_text` |
| Constants | `SCREAMING_SNAKE_CASE` | `MAX_TOKENS` |
| Pydantic models | `PascalCase` | `SummarizeRequest` |
| Test files | `test_<filename>.py` | `test_call_scorer.py` |

### Database Tables

| Convention | Rule | Example |
|---|---|---|
| Format | `snake_case` | `transcription_jobs` |
| Prefix | Module code prefix always first | `m01_transcriptions` |
| Join tables | Both module prefixes | `m03_m07_entity_deal_links` |

> **Rule:** Never create a table without the module prefix. `transcriptions` is wrong.
> `m01_transcriptions` is correct.

### BullMQ Event Names

| Convention | Format | Example |
|---|---|---|
| Pattern | `<domain>.<entity>.<past-tense-verb>` | `call.transcription.completed` |
| All lowercase | Yes | `deal.stage.changed` |
| Words separated by dots | Yes | `tracker.detection.created` |
| No abbreviations | Yes | `call.transcription.completed` not `call.trans.done` |

### Environment Variables

| Convention | Format | Example |
|---|---|---|
| All caps | Yes | `DATABASE_URL` |
| Words separated by underscores | Yes | `OPENAI_API_KEY` |
| Service prefix for non-obvious vars | Yes | `BULLMQ_REDIS_HOST` |
| Never hardcoded | Ever | Use `process.env.VAR_NAME` |

### API Endpoint URLs

| Convention | Format | Example |
|---|---|---|
| Always versioned | `/v1/` prefix | `/v1/calls` |
| Plural nouns | Yes | `/v1/calls` not `/v1/call` |
| kebab-case | Yes | `/v1/call-reviews` not `/v1/callReviews` |
| Sub-resources | Nested with ID | `/v1/calls/:id/transcriptions` |
| No verbs in URL | Use HTTP method instead | `/v1/calls` + `POST` not `/v1/create-call` |

### Prompt Template Files

| Convention | Format | Example |
|---|---|---|
| Location | `prompts/<task-name>/` | `prompts/summarize/` |
| File name | `v{version-number}.jinja2` | `v1.jinja2`, `v2.jinja2` |
| Task name | `snake_case` | `score_call`, `generate_email` |
| Version bump rule | Any prompt change = new version | Change `v1` → create `v2`, keep `v1` |

# Chapter 4 — TypeScript Standards

TypeScript is the language for all product services — NestJS API and Next.js frontend.
These rules apply to every `.ts` and `.tsx` file in the repository.

---

## 4.1 Compiler & Language Rules

### `strict: true` is mandatory

Every TypeScript app in this repo has `strict: true` in its `tsconfig.json`. This is
not optional. Strict mode enables a set of compiler checks that catch real bugs before
they reach production.

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

**What strict mode enforces (that you must follow):**
- No `any` type — if you do not know the type, use `unknown` and narrow it with a
  type guard
- No implicit `any` — every function parameter must have a type
- Strict null checks — `string` and `string | null` are different types

```ts
// ❌ WRONG — any defeats the purpose of TypeScript
function processCall(call: any) { ... }

// ❌ WRONG — non-null assertion is a lie you tell the compiler
const name = user!.name;

// ✅ CORRECT — unknown + type guard
function processCall(call: unknown) {
  if (!isValidCall(call)) throw new BadRequestException('Invalid call');
  // call is now narrowed to the correct type
}

// ✅ CORRECT — optional chaining
const name = user?.name ?? 'Unknown';
```

---

### `interface` vs `type` — When to Use Each

This is a simple rule. Follow it consistently.

| Use `interface` for... | Use `type` for... |
|---|---|
| Object shapes (DTOs, API responses, entities) | Unions (`'admin' \| 'rep' \| 'viewer'`) |
| Class contracts (`implements`) | Intersections (`TypeA & TypeB`) |
| Anything that might be extended later | Mapped types, utility types |

```ts
// ✅ interface — object shape
interface CallSummary {
  callId: string;
  tenantId: string;
  summary: string;
  confidenceScore: number;
}

// ✅ type — union
type UserRole = 'admin' | 'manager' | 'rep' | 'viewer';

// ✅ type — utility
type PartialCallSummary = Partial<CallSummary>;
```

---

### Null Handling

```ts
// ❌ WRONG — non-null assertion operator
const dealName = deal!.name;

// ❌ WRONG — loose null check
if (user != null) { ... }

// ✅ CORRECT — optional chaining
const dealName = deal?.name;

// ✅ CORRECT — nullish coalescing for defaults
const label = deal?.name ?? 'Unnamed Deal';

// ✅ CORRECT — explicit null check before use
if (!deal) throw new NotFoundException(`Deal not found`);
const dealName = deal.name;
```

---

### Async/Await Over Raw Promises

All asynchronous code uses `async/await`. No `.then()` chains in service or controller
files. `.then()` chains are harder to read, harder to debug, and make error handling
inconsistent.

```ts
// ❌ WRONG — .then() chain
getCall(callId)
  .then(call => summarize(call))
  .then(summary => saveToDb(summary))
  .catch(err => logger.error(err));

// ✅ CORRECT — async/await
try {
  const call = await this.getCall(callId);
  const summary = await this.summarize(call);
  await this.saveToDb(summary);
} catch (error) {
  this.logger.error('Failed to process call', error);
  throw error;
}
```

---

## 4.2 NestJS Patterns

### Module Structure

Every module must have exactly these five files. No more, no less in the root of the
module folder.


m04-conversation-intelligence/
├── m04.module.ts ← Registers controllers, services, imports
├── m04.controller.ts ← HTTP routes only — no business logic
├── m04.service.ts ← All business logic lives here
├── m04.events.ts ← BullMQ publish and subscribe handlers
└── dto/
└── score-call.dto.ts ← Zod schema + inferred TypeScript type


```ts
// m04.module.ts
@Module({
  imports: [PrismaModule, BullMQModule],
  controllers: [M04Controller],
  providers: [M04Service],
})
export class M04Module {}
```

---

### Every Endpoint Must Have a Zod-Validated DTO

No request body ever reaches a service function without being validated by Zod first.
This is a CI gate — it will be checked automatically.

```ts
// dto/score-call.dto.ts
import { z } from 'zod';

export const ScoreCallSchema = z.object({
  tenantId: z.string().uuid(),
  callId:   z.string().uuid(),
  scorecardId: z.string().uuid(),
});

export type ScoreCallDto = z.infer<typeof ScoreCallSchema>;
```

```ts
// m04.controller.ts
@Post('score')
@UseGuards(JwtGuard)
async scoreCall(@Body() body: unknown, @Req() req: AuthRequest) {
  // Parse and validate — throws 400 automatically if invalid
  const dto = ScoreCallSchema.parse(body);
  return this.m04Service.scoreCall(dto, req.user.tenantId);
}
```

> **Rule:** The controller does validation. The service does logic. Never mix them.

---

### Dependency Injection — Never Use `new`

NestJS manages service instances. You never create them manually.

```ts
// ❌ WRONG — manual instantiation
@Injectable()
export class M04Service {
  private prisma = new PrismaService(); // Wrong
}

// ✅ CORRECT — constructor injection
@Injectable()
export class M04Service {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: Logger,
    private readonly eventBus: EventBusService,
  ) {}
}
```

---

### Guards — Every Route Must Be Protected

Every controller method must have `@UseGuards(JwtGuard)`. There are zero unguarded
routes in this platform. If a route is accidentally left unguarded, the RLS check CI
script will catch it.

```ts
// ✅ CORRECT — guard on every route
@Controller('v1/calls')
@UseGuards(JwtGuard)          // ← applies to ALL methods in this controller
export class M04Controller {

  @Get(':id/score')
  async getScore(@Param('id') callId: string, @Req() req: AuthRequest) {
    return this.m04Service.getScore(callId, req.user.tenantId);
  }
}
```

The `JwtGuard` automatically:
- Validates the JWT token
- Attaches `req.user` with `userId`, `tenantId`, and `role`
- Rejects the request with `401` if the token is invalid or missing

---

### `@UseInterceptors` for Logging and Response Transformation

Two interceptors are applied globally — you do not need to add them per controller.
They are registered in `main.ts`.

| Interceptor | What It Does |
|---|---|
| `LoggingInterceptor` | Logs every request in/out with `tenantId`, `traceId`, duration |
| `ResponseTransformInterceptor` | Wraps every response in the standard `{ success, data, meta }` shape |

If you need custom behaviour for a specific endpoint, you can add a local interceptor:

```ts
@Get(':id')
@UseInterceptors(CacheInterceptor)   // ← local interceptor, only for this route
async getCall(@Param('id') id: string) { ... }
```

---

### Exception Handling

Never throw raw JavaScript `Error` objects in NestJS services. Always throw the
correct NestJS `HttpException` subclass. The global exception filter catches all of
them and formats the response correctly.

```ts
// ❌ WRONG
throw new Error('Call not found');

// ✅ CORRECT — NestJS exception types
throw new NotFoundException(`Call ${callId} not found`);
throw new BadRequestException('tenantId is required');
throw new ForbiddenException('You do not have access to this resource');
throw new UnprocessableEntityException('Transcript is empty');
throw new InternalServerErrorException('AI service unavailable');
```

The global filter in `common/filters/global-exception.filter.ts` automatically:
- Catches all exceptions
- Formats them as `{ success: false, error: { code, message } }`
- Sends them to Sentry
- Logs them with structured context

---

### Health Check Endpoint — Every Module

Every module must expose a `GET /v1/m0X/health` endpoint. This is used by Railway
(and AWS ECS in Phase 3) to check if the module is running correctly.

```ts
// m04.controller.ts
@Get('health')
health() {
  return { status: 'ok', module: 'M04', timestamp: new Date().toISOString() };
}
```

---

### Logging — Never Use `console.log`

`console.log` does not include structured context and does not integrate with Better
Stack or Sentry. Use NestJS's built-in `Logger` in every service.

```ts
// ❌ WRONG
console.log('Processing call', callId);
console.error('Something failed', error);

// ✅ CORRECT
import { Logger } from '@nestjs/common';

@Injectable()
export class M04Service {
  private readonly logger = new Logger(M04Service.name);

  async scoreCall(dto: ScoreCallDto) {
    this.logger.log(`Scoring call ${dto.callId}`, { tenantId: dto.tenantId });

    try {
      // ...
    } catch (error) {
      this.logger.error(`Failed to score call ${dto.callId}`, error.stack);
      throw error;
    }
  }
}
```

---

## 4.3 Inter-Module Communication Rules

### The Rule

Modules communicate in **exactly two ways** — nothing else is permitted:
1. **BullMQ events** — for async, fire-and-forget communication
2. **Public API contracts** — for the one documented exception (M-02 → M-03)

Direct imports between modules are caught by the CI boundary check and will block
your PR.

---

### ✅ Correct — Publish a BullMQ Event

```ts
// m01.events.ts — Module M-01 publishes after transcription completes
import { EventBusService } from '../../common/event-bus.service';
import { CallTranscriptionCompletedEvent } from '@r-revenue/event-contracts';

@Injectable()
export class M01Events {
  constructor(private readonly eventBus: EventBusService) {}

  async publishTranscriptionCompleted(payload: CallTranscriptionCompletedEvent) {
    await this.eventBus.publish('call.transcription.completed', {
      eventId:           uuidv4(),           // always generate a new UUID
      tenantId:          payload.tenantId,
      callId:            payload.callId,
      transcriptId:      payload.transcriptId,
      languageDetected:  payload.languageDetected,
      confidenceScore:   payload.confidenceScore,
      timestamp:         new Date().toISOString(),
    });

    this.logger.log(`Published call.transcription.completed for call ${payload.callId}`);
  }
}
```

---

### ❌ Wrong — Direct Cross-Module Import

```ts
// ❌ THIS WILL BE CAUGHT BY CI AND BLOCK YOUR PR
import { RevenueGraphService } from '../m03-revenue-graph/m03.service';

@Injectable()
export class M04Service {
  constructor(private revenueGraph: RevenueGraphService) {} // WRONG
}
```

---

### ✅ Correct — Subscribe to an Event with Idempotency Check

```ts
// m03.events.ts — Module M-03 subscribes to M-01's event
@Injectable()
export class M03Events implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly m03Service: M03Service,
    private readonly logger: Logger,
  ) {}

  onModuleInit() {
    new Worker(
      'call.transcription.completed',
      async (job: Job<CallTranscriptionCompletedEvent>) => {

        // ✅ IDEMPOTENCY CHECK — process each event exactly once
        const alreadyProcessed = await this.prisma.m03ProcessedEvent.findUnique({
          where: { eventId: job.data.eventId },
        });
        if (alreadyProcessed) {
          this.logger.log(`Skipping duplicate event ${job.data.eventId}`);
          return;
        }

        await this.m03Service.linkToRevenueGraph(job.data);

        // Record that we processed this event
        await this.prisma.m03ProcessedEvent.create({
          data: { eventId: job.data.eventId, processedAt: new Date() },
        });
      },
      { connection: redisConnection },
    );
  }
}
```

> **Why idempotency?** BullMQ retries failed jobs. Without an idempotency check, the
> same event could be processed twice — creating duplicate records or double-charging
> actions.

---

### What to Do When the Event You Need Doesn't Exist Yet

If you are building a feature that needs data from another module but the event for
it has not been created yet:

1. **Do not** create a direct import or synchronous call
2. **Raise it with the Tech Lead** — describe what data you need and which module
   owns it
3. The Tech Lead will decide: create the event, extend an existing event payload, or
   use a public API contract
4. Add the new event type to `packages/event-contracts/` as part of the same PR

Never block your own work by guessing — always escalate.

---

## 4.4 Standard Response & Event Payload Shapes

### API Success Response

All API responses use this shape — applied automatically by `ResponseTransformInterceptor`.

```ts
// Success — single item
{
  "success": true,
  "data": {
    "callId": "uuid",
    "summary": "..."
  }
}

// Success — list with pagination
{
  "success": true,
  "data": [ ... ],
  "meta": {
    "total": 150,
    "page": 1,
    "pageSize": 20,
    "hasNextPage": true
  }
}
```

### API Error Response

```ts
// Error — always this shape
{
  "success": false,
  "error": {
    "code": "CALL_NOT_FOUND",       // machine-readable, SCREAMING_SNAKE_CASE
    "message": "Call abc-123 not found"  // human-readable
  }
}
```

### BullMQ Event Payload Shape

Every event payload — regardless of which module publishes it — must include these
base fields. Domain-specific fields are added on top.

```ts
// packages/event-contracts/src/base.event.ts
interface BaseEvent {
  eventId:   string;   // uuidv4 — for idempotency checks
  tenantId:  string;   // always present — no cross-tenant events
  timestamp: string;   // ISO 8601 — new Date().toISOString()
}

// Example: full event extending base
interface CallTranscriptionCompletedEvent extends BaseEvent {
  callId:           string;
  transcriptId:     string;
  languageDetected: string;
  confidenceScore:  number;
  durationSeconds:  number;
}
```

---

## 4.5 BullMQ Job Patterns

### How to Publish a Job

```ts
// common/event-bus.service.ts
@Injectable()
export class EventBusService {
  private queues: Map<string, Queue> = new Map();

  async publish<T extends BaseEvent>(eventName: string, payload: T): Promise<void> {
    let queue = this.queues.get(eventName);
    if (!queue) {
      queue = new Queue(eventName, { connection: this.redisConnection });
      this.queues.set(eventName, queue);
    }

    await queue.add(eventName, payload, {
      attempts:    3,                   // retry up to 3 times
      backoff: {
        type:  'exponential',
        delay: 1000,                    // 1s, 2s, 4s
      },
      removeOnComplete: 100,            // keep last 100 completed jobs for debugging
      removeOnFail:     false,          // keep all failed jobs for inspection
    });
  }
}
```

---

### How to Consume a Job with Idempotency Guard

```ts
// Full pattern — copy this for every new event consumer
new Worker(
  'tracker.detection.created',
  async (job: Job<TrackerDetectionCreatedEvent>) => {

    const { eventId, tenantId, callId, detectionType } = job.data;

    // Step 1 — idempotency check
    const exists = await prisma.m06ProcessedEvent.findUnique({
      where: { eventId },
    });
    if (exists) return;

    // Step 2 — do the actual work
    await m06Service.generateInsight({ tenantId, callId, detectionType });

    // Step 3 — record as processed
    await prisma.m06ProcessedEvent.create({
      data: { eventId, processedAt: new Date() },
    });
  },
  {
    connection:  redisConnection,
    concurrency: 5,               // process up to 5 jobs in parallel
  },
);
```

---

### Retry Policy

All jobs are configured with this retry policy. Do not change these values without
a Tech Lead discussion.

| Setting | Value | Why |
|---|---|---|
| Max attempts | 3 | Enough for transient failures; not so many it hammers a broken service |
| Backoff type | Exponential | 1s → 2s → 4s — gives downstream time to recover |
| Failed jobs | Never auto-deleted | Kept for inspection and manual replay |
| Completed jobs | Last 100 kept | Enough for debugging without filling Redis |

---

### Dead-Letter Queue

A job lands in the dead-letter queue after all retry attempts fail. This means:

1. Sentry receives an alert automatically (configured in global BullMQ error handler)
2. The job is visible in the BullMQ dashboard (Bull Board)
3. A `@here` Slack alert fires to the engineering channel

**Your responsibility as the developer:**
- Dead-letter jobs are your responsibility to investigate
- Do not delete them without understanding why they failed
- If the failure was due to a bug, fix the bug, then manually replay the job
- If the failure was due to bad input data, log it, move it to an audit table, and
  close it

---

### Timeout Limits

AI and processing jobs have different timeout budgets depending on whether a user is
waiting for the result.

| Job Type | Max Timeout | Example |
|---|---|---|
| User-facing (user waiting) | 30 seconds | `POST /v1/ask-anything` — user sees loading spinner |
| Background processing | 5 minutes | Transcription job, theme detection, deep research |

```ts
// User-facing AI call — circuit breaker pattern
const result = await this.aiServicesClient.post('/v1/summarize', payload, {
  timeout: 30_000,                     // 30 seconds max
});

// Background job — longer timeout is acceptable
// This runs inside a BullMQ worker, not a request handler
const result = await this.aiServicesClient.post('/v1/detect-themes', payload, {
  timeout: 300_000,                    // 5 minutes max
});
```

---

## 4.6 Prisma & Database Access

### All DB Access via Prisma — Zero Raw SQL

```ts
// ❌ WRONG — raw SQL
const rows = await this.prisma.$queryRaw`
  SELECT * FROM m01_transcriptions WHERE tenant_id = ${tenantId}
`;

// ✅ CORRECT — Prisma ORM
const transcriptions = await this.prisma.m01Transcription.findMany({
  where: { tenantId },
  orderBy: { createdAt: 'desc' },
  take: 20,
});
```

The only exception is database migrations. Prisma generates the SQL for migrations
automatically — you never write migration SQL by hand either.

---

### Schema Ownership — Only Write to Your Own Module's Tables

Each module owns its own tables. Module M-04 cannot write to M-01's tables.
Module M-01 cannot write to M-03's tables. Ever.

```ts
// ❌ WRONG — M-04 writing to M-01's table
await this.prisma.m01Transcription.update({ ... }); // M-04 does NOT own this table

// ✅ CORRECT — M-04 writes only to its own tables
await this.prisma.m04CallScore.create({ ... });

// ✅ CORRECT — M-04 reads M-01 data via published event, not direct DB access
// (The event already contains the transcriptId you need)
```

---

### Multi-Tenancy — Every Query Must Filter by `tenantId`

This is also Golden Rule #9. It is repeated here because it must be applied at the
database access layer even though RLS is also active.

```ts
// ❌ WRONG — returns ALL tenants' data
const calls = await this.prisma.m01Transcription.findMany();

// ✅ CORRECT — scoped to this tenant
const calls = await this.prisma.m01Transcription.findMany({
  where: {
    tenantId: currentUser.tenantId,   // always from authenticated user
    // ... other filters
  },
});
```

**Never accept `tenantId` from the request body for queries.** Always use
`req.user.tenantId` — the value the JWT Guard extracted from the verified token.

```ts
// ❌ WRONG — user can pass any tenantId in body and access other tenants' data
const { tenantId } = body;

// ✅ CORRECT — tenantId comes from the verified JWT only
const { tenantId } = req.user;
```

---

### Required Indexes for Every New Table

Every new table you create must have at minimum these two composite indexes.
Without them, queries on a large tenant's data will be extremely slow.

```sql
-- Always: tenantId first, then the most common lookup field
CREATE INDEX idx_m04_call_scores_tenant_call
  ON m04_call_scores(tenant_id, call_id);

-- Always: tenantId + created_at for sorted listing queries
CREATE INDEX idx_m04_call_scores_tenant_created
  ON m04_call_scores(tenant_id, created_at DESC);
```

In Prisma schema, define indexes like this:

```prisma
model M04CallScore {
  id        String   @id @default(uuid())
  tenantId  String
  callId    String
  score     Float
  createdAt DateTime @default(now())

  @@index([tenantId, callId])
  @@index([tenantId, createdAt(sort: Desc)])
}
```

---

### Migration Rules

| Rule | Detail |
|---|---|
| Only `prisma migrate dev` | Never write or run raw SQL migration files manually |
| One migration per PR | Do not bundle unrelated schema changes in one migration |
| Breaking changes need a deprecation PR first | Drop a column? First PR adds the new column. Second PR removes the old one. |
| Tech Lead review required | All migrations reviewed before merge |
| Never edit a committed migration file | Create a new migration instead |

```bash
# ✅ CORRECT — create a new migration
npx prisma migrate dev --name add_confidence_score_to_call_scores

# ❌ WRONG — never do this
# Manually editing a file in prisma/migrations/
```

---

## 4.7 Frontend Rules (Next.js)

### Server State — TanStack Query Only

Any data that comes from the API is "server state." All server state is managed
exclusively by TanStack Query. Never store API data in Zustand.

```ts
// ✅ CORRECT — fetch calls with TanStack Query
const { data: calls, isLoading } = useQuery({
  queryKey:  ['calls', tenantId, filters],   // cache key — include all params
  queryFn:   () => api.getCalls(filters),
  staleTime: 30_000,                         // 30 seconds — data considered fresh
});

// staleTime guidance:
// - Frequently changing data (call status, deal stage): 10_000  (10 sec)
// - Moderately changing data (call list, deals):        30_000  (30 sec)
// - Rarely changing data (settings, users):             300_000 (5 min)
```

---

### Client/UI State — Zustand Only

UI state — what panels are open, which row is selected, sidebar state — lives in
Zustand stores. Never use `useState` for state that is shared across components.

```ts
// lib/store/ui.store.ts
interface UIStore {
  sidebarOpen:    boolean;
  selectedCallId: string | null;
  setSidebarOpen: (open: boolean) => void;
  setSelectedCall:(id: string | null) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen:    true,
  selectedCallId: null,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setSelectedCall:(id)   => set({ selectedCallId: id }),
}));
```

---

### State Management Quick Reference

| Data Type | Store | Example |
|---|---|---|
| API data — calls, deals, users | TanStack Query | `useQuery(['calls'])` |
| UI state — open/closed, selected row | Zustand | `useUIStore()` |
| Form state | React Hook Form | `useForm()` |
| URL state — filters, pagination | Next.js router | `useSearchParams()` |

```ts
// ❌ WRONG — API data in Zustand
const callStore = create(() => ({ calls: [], fetchCalls: async () => { ... } }));

// ❌ WRONG — UI state in TanStack Query
const { data: sidebarOpen } = useQuery({ queryKey: ['sidebar-open'] });

// ✅ CORRECT — right tool for the right state
const { data: calls }    = useQuery({ queryKey: ['calls'] });    // server state
const { sidebarOpen }    = useUIStore();                          // UI state
const { register }       = useForm();                            // form state
const searchParams       = useSearchParams();                    // URL state
```

---

### No Business Logic in Components

Components render. They do not calculate, decide, or transform.

```tsx
// ❌ WRONG — business logic inside a component
function DealCard({ deal }) {
  const riskScore = deal.lostSignals * 2.5 - deal.engagementScore; // belongs in API
  const isAtRisk  = riskScore > 7.0;
  return <div className={isAtRisk ? 'red' : 'green'}>{deal.name}</div>;
}

// ✅ CORRECT — API returns pre-computed values
function DealCard({ deal }) {
  return (
    <div className={deal.isAtRisk ? 'text-red-500' : 'text-green-500'}>
      {deal.name}
    </div>
  );
}
```

---

### Real-Time Data — WebSocket/SSE Only

```ts
// ❌ WRONG — polling
useEffect(() => {
  const interval = setInterval(() => refetch(), 3000);
  return () => clearInterval(interval);
}, []);

// ✅ CORRECT — WebSocket for real-time alerts
useEffect(() => {
  const socket = io('/alerts', { auth: { token: jwtToken } });

  socket.on('competitor.detected', (alert) => {
    notificationStore.addAlert(alert);
  });

  return () => socket.disconnect();
}, [jwtToken]);
```

---

### Styling — TailwindCSS Only

```tsx
// ❌ WRONG — custom CSS file
import styles from './DealCard.module.css';
<div className={styles.riskCard}>...</div>

// ❌ WRONG — inline styles
<div style={{ backgroundColor: 'red', padding: '12px' }}>...</div>

// ✅ CORRECT — Tailwind utility classes only
<div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
  At Risk
</div>
```

---

### Form State — React Hook Form Only

```tsx
// ✅ CORRECT
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const { register, handleSubmit, formState: { errors } } = useForm<CreateCallDto>({
  resolver: zodResolver(CreateCallSchema),  // Zod validation on the frontend too
});
```

---

### URL State — `useSearchParams` Only

Filters, sort order, and pagination belong in the URL — not in component state.
This makes pages shareable and browser-back-compatible.

```tsx
// ✅ CORRECT — filters in URL
const searchParams    = useSearchParams();
const router          = useRouter();

const currentPage     = Number(searchParams.get('page') ?? '1');
const currentFilter   = searchParams.get('status') ?? 'all';

function setFilter(status: string) {
  const params = new URLSearchParams(searchParams);
  params.set('status', status);
  params.set('page', '1');        // reset to page 1 on filter change
  router.push(`?${params.toString()}`);
}
```

---
---

# Chapter 5 — Python Standards

Python is the language for all AI and ML services — the AI Services layer and the
Transcription Service. These rules apply to every `.py` file in `apps/ai-services/`
and `apps/transcription-service/`.

---

## 5.1 Language & Runtime Rules

### Python 3.12 Only

```toml
# pyproject.toml
[tool.poetry.dependencies]
python = "^3.12"
```

Never use Python 3.10 or 3.11 features that are replaced by 3.12 improvements. Do not
mix Python versions across services. Both `ai-services` and `transcription-service` run
on 3.12.

---

### Linting and Formatting — `ruff` + `black`

```toml
# pyproject.toml — add this to both services
[tool.ruff]
target-version = "py312"
line-length    = 100
select         = ["E", "F", "I", "N", "UP", "ANN"]  # errors, imports, naming, annotations

[tool.black]
line-length    = 100
target-version = ["py312"]
```

Before every commit:
```bash
ruff check .     # lint check
black .          # auto-format
```

The CI pipeline runs both. A PR with linting errors will not merge.

---

### All Models → Pydantic v2 `BaseModel`

No raw Python `dict` objects cross service boundaries — between functions, between
routers and services, or in HTTP responses. Everything is a typed Pydantic model.

```python
# ❌ WRONG — raw dict
def summarize(payload: dict) -> dict:
    transcript = payload["transcript"]
    return {"summary": "...", "confidence": 0.9}

# ✅ CORRECT — Pydantic v2 models
from pydantic import BaseModel, Field

class SummarizeRequest(BaseModel):
    tenant_id:     str
    call_id:       str
    transcript:    str
    context:       dict[str, str] = Field(default_factory=dict)

class SummarizeResponse(BaseModel):
    summary:           str
    key_points:        list[str]
    next_steps:        list[str]
    confidence_score:  float
    flagged_for_review: bool
```

---

### All Endpoints → `async def`

Every FastAPI route function and every service function that calls an external service
(LiteLLM, database, HTTP) must be `async`.

```python
# ❌ WRONG — synchronous, blocks the event loop
@router.post("/v1/summarize")
def summarize(request: SummarizeRequest) -> SummarizeResponse:
    result = litellm.completion(...)    # blocks all other requests
    return result

# ✅ CORRECT — async, non-blocking
@router.post("/v1/summarize")
async def summarize(request: SummarizeRequest) -> SummarizeResponse:
    result = await litellm.acompletion(...)
    return result
```

---

### Type Hints on Every Function Signature

Every function — in routers, services, and utilities — must have complete type hints
on parameters and return types. No untyped functions. `ruff` will flag violations.

```python
# ❌ WRONG — no type hints
def build_prompt(transcript, context):
    return f"Summarise this: {transcript}"

# ✅ CORRECT — fully typed
def build_prompt(transcript: str, context: dict[str, str]) -> str:
    return f"Summarise this: {transcript}"
```

---

## 5.2 FastAPI Service Rules

### No Business Logic in AI Services

AI services are dumb inference pipelines. They receive structured data, run a model,
and return structured output. They do not make CRM decisions, update databases, send
notifications, or contain any product logic.

Receives: Structured input (transcript, context, parameters)
Does: Runs AI model / LLM / NLP pipeline
Returns: Structured output (result + confidence_score + flagged_for_review)
Does NOT: Write to database, call CRM, make business decisions


```python
# ❌ WRONG — business logic in AI service
async def summarize(request: SummarizeRequest) -> SummarizeResponse:
    summary = await run_llm(request.transcript)
    await db.save_summary(summary)               # WRONG — no DB writes here
    await crm.update_deal(request.deal_id)       # WRONG — no CRM calls here
    return summary

# ✅ CORRECT — inference only
async def summarize(request: SummarizeRequest) -> SummarizeResponse:
    summary = await run_llm(request.transcript)
    return SummarizeResponse(
        summary           = summary.text,
        confidence_score  = summary.confidence,
        flagged_for_review= summary.confidence < 0.7,
    )
```

---

### Every Endpoint Returns `confidence_score` and `flagged_for_review`

These two fields are mandatory on every AI endpoint response. No exceptions.

```python
class BaseAIResponse(BaseModel):
    confidence_score:   float = Field(ge=0.0, le=1.0)
    flagged_for_review: bool

class SummarizeResponse(BaseAIResponse):  # extends BaseAIResponse
    summary:    str
    key_points: list[str]
    next_steps: list[str]

# In the service — always compute both fields
confidence = compute_confidence(raw_output)

return SummarizeResponse(
    summary            = raw_output.text,
    key_points         = raw_output.key_points,
    next_steps         = raw_output.next_steps,
    confidence_score   = confidence,
    flagged_for_review = confidence < 0.7,   # threshold defined in config
)
```

The NestJS API layer must check `flagged_for_review`. If `True`, it must NOT
auto-write to CRM — hold for human review.

---

### Endpoint Versioning Rule

```python
# ✅ CORRECT — new breaking schema = new version
@router.post("/v1/summarize")      # original — stays live for 30+ days after v2 ships
async def summarize_v1(request: SummarizeRequestV1) -> SummarizeResponseV1: ...

@router.post("/v2/summarize")      # new version — new input/output schema
async def summarize_v2(request: SummarizeRequestV2) -> SummarizeResponseV2: ...

# ❌ WRONG — modifying the existing v1 endpoint schema
# (breaks all callers silently)
```

---

### Internal-Only Services

AI services are never exposed to the public internet. They only accept connections
from the NestJS API layer inside the private Docker network.

```yaml
# docker-compose.yml — ai-services has no public port mapping
ai-services:
  build: ./docker/ai-services.Dockerfile
  # ❌ No 'ports:' entry here — internal only
  networks:
    - internal
```

---

## 5.3 Prompt Engineering Standards

### Versioned Jinja2 Templates — No Hardcoded Strings

Every prompt is a Jinja2 template file in `prompts/<task>/v{n}.jinja2`. There are
zero prompt strings hardcoded inside Python files.

```python
# ❌ WRONG — hardcoded prompt string in Python
prompt = f"You are a sales analyst. Summarise this call: {transcript}"

# ✅ CORRECT — load from versioned template
from jinja2 import Environment, FileSystemLoader

env = Environment(loader=FileSystemLoader('prompts'))

def load_prompt(task: str, version: int, **kwargs: str) -> str:
    template = env.get_template(f"{task}/v{version}.jinja2")
    return template.render(**kwargs)

prompt = load_prompt('summarize', version=1, transcript=transcript, language=lang)
```

---

### Required Sections in Every Prompt Template

Every prompt template file must contain all four of these sections, in this order:

```jinja2
{# prompts/summarize/v1.jinja2 #}

{# ── 1. PERSONA ────────────────────────────────────────────────────── #}
You are an expert B2B sales analyst working for a revenue intelligence platform.
You analyse sales call transcripts to extract structured insights for account executives.

{# ── 2. TASK INSTRUCTION ─────────────────────────────────────────────#}
Your task is to summarise the following sales call transcript.
Focus on: customer pain points, objections raised, agreed next steps, and competitor mentions.

Transcript:
{{ transcript }}

Context:
- Deal Stage: {{ deal_stage }}
- Account: {{ account_name }}

{# ── 3. OUTPUT FORMAT ────────────────────────────────────────────────#}
Respond ONLY with valid JSON in this exact format. No markdown. No explanation.
{
  "summary": "2-3 sentence summary of the call",
  "key_points": ["point 1", "point 2"],
  "next_steps": ["step 1", "step 2"],
  "competitor_mentions": ["competitor name or null if none"]
}

{# ── 4. HALLUCINATION GUARD ──────────────────────────────────────────#}
If you cannot find information for a field, return null for that field.
Do NOT invent or infer information that is not explicitly stated in the transcript.
```

---

### Prompt Change Process


Make your changes in a NEW file: prompts/summarize/v2.jinja2
(Never edit v1.jinja2 — it may still be in production use)

Write a regression test in tests/test_summarize_v2.py
Compare output against stored baseline examples

Run regression tests — they must pass before the PR merges

Update the version reference in the service file:
load_prompt('summarize', version=2, ...)

Keep v1.jinja2 in the repo until all callers have migrated to v2


---

### Temperature by Task Type

Temperature controls how "creative" or "random" the LLM's output is. Use the wrong
temperature and you get hallucinations (too high) or robotic output (too low).

| Task Type | Temperature | Examples |
|---|---|---|
| Extraction, classification, scoring | `0.0` | Call scoring, topic tagging, entity extraction, tracker detection |
| Summarisation | `0.2` | Call summaries, deal briefs, account briefs |
| Generation | `0.7` | Email drafts, AI Trainer persona responses |

```python
# ✅ CORRECT — temperature set per task
response = await litellm.acompletion(
    model       = settings.PRIMARY_MODEL,
    messages    = [{"role": "user", "content": prompt}],
    temperature = 0.0,      # extraction task — deterministic output required
    response_format = {"type": "json_object"},
)
```

---

### LLM Calls Always via LiteLLM — Never Direct OpenAI SDK

```python
# ❌ WRONG — direct OpenAI SDK call
from openai import AsyncOpenAI
client = AsyncOpenAI(api_key=os.environ["OPENAI_API_KEY"])
response = await client.chat.completions.create(...)

# ✅ CORRECT — LiteLLM gateway
import litellm

response = await litellm.acompletion(
    model    = settings.PRIMARY_MODEL,    # "openai/gpt-4o" — from config
    messages = messages,
    temperature = temperature,
)
```

**Why LiteLLM?**
LiteLLM is the abstraction layer. If we switch from OpenAI to Anthropic (or add
Anthropic as a fallback), we change one config value — not every service file.

---

## 5.4 LangGraph Agent Rules

LangGraph is used for complex, multi-step AI workflows where the output of one step
feeds into the next. It is not a general-purpose tool — use it only where justified.

### When to Use LangGraph

| Feature | Uses LangGraph? | Why |
|---|---|---|
| AI Deep Researcher | ✅ Yes | Multi-step: retrieve → analyse → synthesise → format |
| Ask Anything (RAG) | ✅ Yes | Multi-step: embed query → retrieve → rerank → generate |
| Call Summarisation | ❌ No | Single LLM call — no multi-step needed |
| Email Generation | ❌ No | Single LLM call with context |
| Call Scoring | ❌ No | Single structured extraction call |

---

### State Schema Must Be a Typed `TypedDict`

```python
# ✅ CORRECT — typed state
from typing import TypedDict, Annotated
from langgraph.graph import add_messages

class ResearchAgentState(TypedDict):
    tenant_id:       str
    query:           str
    retrieved_docs:  list[str]
    analysis:        str | None
    final_report:    str | None
    step_count:      int            # used to enforce max step limit
```

---

### Every Node Must Be Independently Testable

Each node in a LangGraph graph is a plain async Python function. It takes state as
input and returns updated state as output. Test each node in isolation.

```python
# ✅ CORRECT — node is a plain function, easy to test
async def retrieve_documents(state: ResearchAgentState) -> ResearchAgentState:
    docs = await vector_store.search(state["query"], tenant_id=state["tenant_id"])
    return { **state, "retrieved_docs": [doc.text for doc in docs] }

# tests/test_deep_researcher.py
async def test_retrieve_documents():
    state = ResearchAgentState(
        tenant_id="test-tenant", query="Q3 churn risk", retrieved_docs=[],
        analysis=None, final_report=None, step_count=0
    )
    result = await retrieve_documents(state)
    assert len(result["retrieved_docs"]) > 0
```

---

### Max Step Limit — No Unbounded Loops

Every LangGraph agent must define a maximum number of steps. An agent that loops
forever will exhaust the LLM budget and time out.

```python
# ✅ CORRECT — enforce step limit in every conditional edge
def should_continue(state: ResearchAgentState) -> str:
    if state["step_count"] >= 10:          # hard limit — never exceed
        return "end"
    if state["final_report"] is not None:
        return "end"
    return "continue"

# ✅ Increment step count in every node that loops
async def analyse_documents(state: ResearchAgentState) -> ResearchAgentState:
    analysis = await run_analysis(state["retrieved_docs"])
    return {
        **state,
        "analysis":   analysis,
        "step_count": state["step_count"] + 1,   # always increment
    }
```

# Chapter 6 — Database & Data Layer Standards

R-Revenue Intelligence uses five data stores. Each one has a specific job. Using the
wrong store for the wrong data is one of the most common and expensive mistakes a
developer can make. Read this chapter before writing any database code.

| Store | What It Is For |
|---|---|
| PostgreSQL (Supabase) | All transactional data — calls, deals, users, CRM state |
| Redis (Upstash) | Queue state, session cache, rate limits — nothing persistent |
| Meilisearch | Full-text search indexes — not source of truth |
| ClickHouse | Analytics and metrics — append-only, never transactional |
| pgvector | Vector embeddings for RAG and semantic search — lives inside PostgreSQL |

---

## 6.1 PostgreSQL / Prisma Rules

PostgreSQL is the primary database. Every module owns a slice of it. All access goes
through Prisma ORM. No raw SQL, no direct `pg` client, no exceptions.

---

### Schema Prefix Ownership Table

Every table in the database is prefixed with the module code that owns it. A module
may only write to tables it owns. Reading another module's table is permitted only
via the module's public API or event — never by direct cross-module query.

| Module | Prefix | Example Tables |
|---|---|---|
| M-01 Data Ingestion | `m01_` | `m01_transcriptions`, `m01_processed_events` |
| M-02 Sales Engagement | `m02_` | `m02_email_sequences`, `m02_tasks` |
| M-03 Revenue Graph | `m03_` | `m03_entities`, `m03_entity_links` |
| M-04 Conversation Intelligence | `m04_` | `m04_call_scores`, `m04_themes` |
| M-05 Smart Tracking & Search | `m05_` | `m05_tracker_detections`, `m05_embeddings` |
| M-06 Insight Generation | `m06_` | `m06_summaries`, `m06_rag_queries` |
| M-07 Deal & Account Management | `m07_` | `m07_deals`, `m07_accounts` |
| M-08 Execution & Automation | `m08_` | `m08_workflows`, `m08_actions` |
| M-09 Forecasting | `m09_` | `m09_forecasts`, `m09_submissions` |
| M-10 Performance & Coaching | `m10_` | `m10_benchmarks`, `m10_training_sessions` |
| Shared / Auth | `shared_` | `shared_tenants`, `shared_users` |

```prisma
// ✅ CORRECT — table name in Prisma matches the module prefix
model M04CallScore {
  id        String   @id @default(uuid())
  tenantId  String
  callId    String
  score     Float
  createdAt DateTime @default(now())

  @@map("m04_call_scores")    // ← actual DB table name
}

// ❌ WRONG — no prefix, no ownership
model CallScore {
  @@map("call_scores")        // which module owns this? nobody knows
}
```

---

### Required Composite Indexes for Every New Table

Every new table **must** have at minimum these two indexes before the migration is
approved. Without them, queries on large tenant datasets will scan millions of rows
and time out in production.

```prisma
// prisma/schema.prisma

model M04CallScore {
  id        String   @id @default(uuid())
  tenantId  String
  callId    String
  dealId    String?
  score     Float
  createdAt DateTime @default(now())

  // ✅ REQUIRED — tenantId first on every index (RLS partition key)
  @@index([tenantId, callId])              // lookup by tenant + specific call
  @@index([tenantId, createdAt(sort: Desc)]) // listing queries — newest first

  // ✅ OPTIONAL — add more only when there is a known query pattern
  @@index([tenantId, dealId])              // if you query by deal frequently

  @@map("m04_call_scores")
}
```

**Rule:** `tenantId` is always the leftmost column in every index. PostgreSQL uses
indexes from left to right. If `tenantId` is not first, the index will not be used
for tenant-scoped queries — which is every query in this platform.

---

### RLS Policy Pattern — How to Write and Verify

Row Level Security (RLS) is the database-level enforcement of multi-tenancy. Even if
the application layer forgets to filter by `tenantId`, RLS will prevent cross-tenant
data leakage.

**Every table must have RLS enabled and a policy applied.**

```sql
-- Enable RLS on the table
ALTER TABLE m04_call_scores ENABLE ROW LEVEL SECURITY;

-- Policy: a row is only visible if its tenant_id matches the current session
CREATE POLICY tenant_isolation_policy
  ON m04_call_scores
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
```

The NestJS API layer sets the tenant context on every database connection before
running queries:

```ts
// prisma/prisma.service.ts — sets tenant context for RLS
async runWithTenant<T>(tenantId: string, fn: () => Promise<T>): Promise<T> {
  return this.prisma.$transaction(async (tx) => {
    await tx.$executeRaw`
      SELECT set_config('app.current_tenant_id', ${tenantId}, true)
    `;
    return fn();
  });
}
```

**How to verify RLS is working on your table:**
```sql
-- Run this in Supabase SQL editor to test
SET app.current_tenant_id = 'tenant-A-uuid';
SELECT * FROM m04_call_scores;
-- Should return ONLY tenant-A rows

SET app.current_tenant_id = 'tenant-B-uuid';
SELECT * FROM m04_call_scores;
-- Should return ONLY tenant-B rows — if you see tenant-A rows, RLS is broken
```

The CI script `scripts/check-rls-all-tables.ts` verifies that every table in the
schema has RLS enabled. It runs on every PR and blocks merge if any table is missing
a policy.

---

### PITR — Point-in-Time Recovery

PITR allows us to restore the database to any point in the past (up to 30 days).
It is enabled by default on Supabase production instances.

**Rules:**
- PITR must never be disabled on the production database — ever
- PITR must never be disabled on the staging database
- If you see a Supabase configuration change that touches PITR, escalate to Tech Lead
  before applying it
- Local dev and test environments do not need PITR

**Why this matters for developers:**
If a bad migration runs in production and corrupts data, PITR is what lets us recover.
Without it, data loss is permanent. This is not a setting to experiment with.

---

### pgvector — Embedding Storage and Similarity Search

pgvector is a PostgreSQL extension that stores vector embeddings alongside relational
data. It powers the RAG (Retrieval-Augmented Generation) pipeline in M-05 and M-06.

**Where embeddings are stored:**

```prisma
// M-05 owns transcript embeddings
model M05TranscriptEmbedding {
  id           String                    @id @default(uuid())
  tenantId     String
  transcriptId String
  chunkIndex   Int                       // which chunk of the transcript
  chunkText    String                    // the actual text chunk
  embedding    Unsupported("vector(1536)") // 1536 dims = OpenAI text-embedding-3-small

  @@index([tenantId, transcriptId])
  @@map("m05_transcript_embeddings")
}
```

**Similarity search pattern — always filter by `tenantId` first:**

```ts
// ✅ CORRECT — tenant-scoped vector search
const results = await this.prisma.$queryRaw<EmbeddingResult[]>`
  SELECT
    chunk_text,
    transcript_id,
    1 - (embedding <=> ${queryEmbedding}::vector) AS similarity
  FROM m05_transcript_embeddings
  WHERE tenant_id = ${tenantId}          -- ← filter tenant FIRST
  ORDER BY embedding <=> ${queryEmbedding}::vector
  LIMIT 10
`;

// ❌ WRONG — no tenant filter — returns embeddings across ALL tenants
const results = await this.prisma.$queryRaw`
  SELECT chunk_text
  FROM m05_transcript_embeddings
  ORDER BY embedding <=> ${queryEmbedding}::vector
  LIMIT 10
`;
```

**⚠️ 1 Million Vector Ceiling Warning:**

pgvector performs well up to approximately **1 million embeddings**. Beyond that,
similarity search latency degrades significantly.

Monitor this actively:

```sql
-- Run weekly — alert Tech Lead if any tenant approaches 800k
SELECT tenant_id, COUNT(*) as embedding_count
FROM m05_transcript_embeddings
GROUP BY tenant_id
ORDER BY embedding_count DESC;
```

| Embedding Count | Action |
|---|---|
| < 800,000 | No action needed |
| 800,000 – 1,000,000 | Alert Tech Lead — begin evaluating Qdrant/Weaviate migration |
| > 1,000,000 | Raise ADR immediately — pgvector ceiling reached for this tenant |

---

## 6.2 Redis / BullMQ Rules

Redis is a fast, in-memory data store. It is not a database. Data in Redis can
disappear on restart, eviction, or network partition. Never store anything in Redis
that you cannot reconstruct from PostgreSQL.

---

### What Redis Is For (and Not For)

| ✅ Use Redis For | ❌ Never Use Redis For |
|---|---|
| BullMQ job queues | Storing transcripts or call data |
| Session tokens (short-lived) | User profile data |
| Rate limit counters | Deal or account records |
| Short-lived computation cache (seconds/minutes) | Anything you cannot reconstruct |
| Pub/Sub for WebSocket events | Audit logs |

```ts
// ✅ CORRECT — cache a computation result with TTL
await redis.set(
  `tenant:${tenantId}:call:${callId}:summary`,
  JSON.stringify(summary),
  'EX', 300,    // expires in 5 minutes
);

// ❌ WRONG — storing primary data with no TTL
await redis.set(`call:${callId}`, JSON.stringify(fullCallRecord));
// No expiry = memory leak. Grows forever. Evicts unpredictably.
```

---

### TTL Required on ALL Redis Keys — No Indefinite Keys

Every `SET` command must include an expiry (`EX` for seconds, `PX` for milliseconds).
No key in Redis is ever set without a TTL.

```ts
// ❌ WRONG — no TTL
await redis.set(`session:${userId}`, token);

// ✅ CORRECT — TTL always set
await redis.set(`session:${userId}`, token, 'EX', 3600);   // 1 hour

// TTL reference guide:
// Session tokens:          3600   (1 hour)
// Rate limit counters:     60     (1 minute window)
// Computation cache:       300    (5 minutes)
// WebSocket presence:      30     (30 seconds — refreshed on heartbeat)
```

---

### BullMQ Queue Naming Convention

Queue names follow the same dot-notation pattern as event names:


<domain>.<entity>.<action>




```ts
// ✅ CORRECT — descriptive, dot-separated queue names
'call.transcription.process'        // M-01 transcription jobs
'revenue-graph.entity.link'         // M-03 entity linking jobs
'conversation.call.score'           // M-04 scoring jobs
'tracker.detection.create'          // M-05 tracker detection jobs
'insight.summary.generate'          // M-06 summary generation jobs

// ❌ WRONG — vague, no structure
'transcription'
'jobs'
'aiQueue'
'processing-queue'
```

**Dead-letter queue naming — always append `.failed`:**
```ts
'call.transcription.process.failed'
'insight.summary.generate.failed'
```

---

## 6.3 Meilisearch Rules

Meilisearch is the full-text search engine. It provides fast, typo-tolerant search
across transcripts, emails, and deal metadata. It is a search index — not a database.

---

### What Goes in Meilisearch

```ts
// ✅ Index these — search is the primary use case
- Call transcripts          (so reps can search "competitor mentioned pricing")
- Email threads             (so reps can search past email conversations)
- Account metadata          (company name, industry, domain)
- Deal metadata             (deal name, stage, owner)
- Contact names and titles  (search by person name)
```

### What Does NOT Go in Meilisearch

```ts
// ❌ Never index these
- Raw audio files or binary data
- JWT tokens or credentials
- Full CRM sync state (too large, too frequently changing)
- Analytics data (ClickHouse handles this)
- Source of truth records (PostgreSQL owns these — Meilisearch is a copy)
```

**The golden rule:** If the Meilisearch index was wiped clean right now, you could
rebuild it completely from PostgreSQL. If you cannot rebuild it, you are storing
something that should not be in Meilisearch.

---

### Index Naming Convention

```ts
// Format: <module-prefix>_<entity>_<environment>
// Environment suffix prevents dev/staging/prod indexes from colliding

'm01_transcripts_production'
'm01_transcripts_staging'
'm01_transcripts_development'

'm07_deals_production'
'm02_emails_production'
```

```ts
// ✅ CORRECT — index name includes environment
const index = meilisearch.index(`m01_transcripts_${process.env.APP_ENV}`);

// ❌ WRONG — no environment suffix (dev and prod share the same index)
const index = meilisearch.index('transcripts');
```

---

### Re-Index Trigger Rules

Meilisearch indexes are populated from PostgreSQL. They must be kept in sync.
Re-indexing is triggered in these specific situations only:

| Trigger | Who Triggers It | How |
|---|---|---|
| New record created | Module service — after DB write | Publish `search.index.update` BullMQ event |
| Record updated (searchable fields only) | Module service — after DB update | Publish `search.index.update` BullMQ event |
| Record deleted | Module service — after DB delete | Publish `search.index.delete` BullMQ event |
| Full re-index (schema change) | Tech Lead only | Run `scripts/reindex-all.ts` manually |
| Meilisearch outage recovery | Tech Lead only | Run `scripts/reindex-all.ts` manually |

```ts
// ✅ CORRECT — trigger re-index via event after DB write
async createTranscription(data: CreateTranscriptionDto) {
  // Step 1 — write to PostgreSQL (source of truth)
  const record = await this.prisma.m01Transcription.create({ data });

  // Step 2 — trigger search index update via event
  await this.eventBus.publish('search.index.update', {
    eventId:    uuidv4(),
    tenantId:   data.tenantId,
    index:      `m01_transcripts_${process.env.APP_ENV}`,
    documentId: record.id,
    document: {
      id:          record.id,
      tenantId:    record.tenantId,
      callId:      record.callId,
      text:        record.transcriptText,
      createdAt:   record.createdAt,
    },
  });

  return record;
}

// ❌ WRONG — writing directly to Meilisearch from the service
await meilisearch.index('transcripts').addDocuments([record]);
// Direct write bypasses event log, makes re-index logic inconsistent
```

---

## 6.4 ClickHouse Rules

ClickHouse is a columnar analytics database. It is designed for fast read aggregations
across millions of rows. It is not designed for transactional operations.

**Mental model for freshers:** PostgreSQL is your filing cabinet — you can add, edit,
and remove individual documents. ClickHouse is an audit ledger — you only ever add
new lines. You never erase or change what is already written.

---

### Append-Only — Never UPDATE or DELETE

```sql
-- ❌ WRONG — ClickHouse supports UPDATE/DELETE syntax but it is
--            extremely expensive and breaks analytics consistency
ALTER TABLE revenue_metrics UPDATE score = 9.5 WHERE call_id = 'abc';
ALTER TABLE revenue_metrics DELETE WHERE tenant_id = 'xyz';

-- ✅ CORRECT — insert a new record with the updated value
-- The latest record per (tenant_id, call_id) is the current state
INSERT INTO revenue_metrics (tenant_id, call_id, score, recorded_at)
VALUES ('tenant-a', 'abc', 9.5, now());
```

If you need to "correct" a value in ClickHouse, insert a new row with the correct
value and a newer `recorded_at` timestamp. Queries always take the latest row.

---

### What Goes in ClickHouse

```ts
// ✅ Store these in ClickHouse
- Revenue metrics per call, deal, rep, team (for dashboards)
- Call activity streams — who called who, when, duration
- Coaching benchmarks — rep score over time
- Forecast accuracy tracking — predicted vs actual
- Pipeline velocity metrics — deal stage transition times
- AI model usage per tenant — tokens used, calls made, costs
```

```ts
// ❌ Do NOT store these in ClickHouse
- Individual call transcripts (PostgreSQL + Meilisearch)
- User authentication data (PostgreSQL)
- CRM sync state (PostgreSQL)
- Anything that needs to be updated or deleted
```

---

### Write Pattern — Batched Inserts Only

ClickHouse is optimised for bulk inserts. Single-row inserts are extremely inefficient
and will degrade performance.

```ts
// ❌ WRONG — inserting one row at a time
for (const metric of metrics) {
  await clickhouse.insert({
    table: 'revenue_metrics',
    values: [metric],
  });
}

// ✅ CORRECT — batch all rows in a single insert
await clickhouse.insert({
  table: 'revenue_metrics',
  values: metrics,              // insert the whole array at once
  format: 'JSONEachRow',
});
```

**Batching rule:** Collect events in a BullMQ queue. Flush to ClickHouse in batches
of at least 100
rows every 30 seconds, or immediately when the batch reaches 500 rows — whichever
comes first.

```ts
// ✅ CORRECT — BullMQ batch flush pattern
@Injectable()
export class ClickHouseFlusher implements OnModuleInit {
  private buffer: RevenueMetric[] = [];
  private readonly BATCH_SIZE     = 500;
  private readonly FLUSH_INTERVAL = 30_000;  // 30 seconds

  onModuleInit() {
    setInterval(() => this.flush(), this.FLUSH_INTERVAL);
  }

  async add(metric: RevenueMetric) {
    this.buffer.push(metric);
    if (this.buffer.length >= this.BATCH_SIZE) {
      await this.flush();             // flush early if batch is full
    }
  }

  private async flush() {
    if (this.buffer.length === 0) return;

    const batch = [...this.buffer];
    this.buffer = [];                 // clear buffer before async write

    await this.clickhouse.insert({
      table:  'revenue_metrics',
      values: batch,
      format: 'JSONEachRow',
    });

    this.logger.log(`Flushed ${batch.length} rows to ClickHouse`);
  }
}
```

---

### Query Rules — Always Filter by `tenant_id` First

ClickHouse stores data from all tenants in the same table. Every query must filter
by `tenant_id` as the first condition — without it, the query will scan all tenants'
rows, which is extremely slow and a data isolation violation.

```sql
-- ❌ WRONG — no tenant filter, full table scan across all tenants
SELECT
  rep_id,
  AVG(call_score) as avg_score
FROM m04_call_scores_analytics
WHERE recorded_at >= now() - INTERVAL 30 DAY
GROUP BY rep_id;

-- ✅ CORRECT — tenant_id first, then date range
SELECT
  rep_id,
  AVG(call_score) as avg_score
FROM m04_call_scores_analytics
WHERE tenant_id  = 'tenant-uuid-here'      -- ← always first
  AND recorded_at >= now() - INTERVAL 30 DAY
GROUP BY rep_id
ORDER BY avg_score DESC;
```

**Additional ClickHouse query rules:**

```sql
-- ✅ Always specify a time range — never query without one
WHERE tenant_id = '...' AND recorded_at >= now() - INTERVAL 90 DAY

-- ✅ Use ORDER BY only when necessary — it is expensive on large datasets
-- ✅ Use LIMIT on all exploratory queries
SELECT * FROM revenue_metrics WHERE tenant_id = '...' LIMIT 1000;

-- ❌ Never run aggregations without tenant_id + time range
SELECT COUNT(*) FROM revenue_metrics;   -- will scan billions of rows in production
```

**ClickHouse table design rule — partition by `tenant_id` and `toYYYYMM(recorded_at)`:**

```sql
-- ✅ CORRECT — table design that makes tenant + time queries fast
CREATE TABLE revenue_metrics (
  tenant_id    UUID,
  call_id      UUID,
  rep_id       UUID,
  deal_id      UUID,
  call_score   Float32,
  recorded_at  DateTime
)
ENGINE = MergeTree()
PARTITION BY (tenant_id, toYYYYMM(recorded_at))   -- ← partition key
ORDER BY (tenant_id, recorded_at, call_id);        -- ← sort key
```

---
---

# Chapter 7 — API Design Standards

Every HTTP API endpoint in R-Revenue Intelligence follows the same structure,
versioning, and response conventions. Consistency here means every frontend developer
and every integration partner can predict how any endpoint behaves without reading
its specific documentation.

---

## 7.1 URL Structure


/v{version}/{plural-noun}/{id}/{sub-resource}




```ts
// ✅ CORRECT examples
GET    /v1/calls                         // list all calls for tenant
GET    /v1/calls/:id                     // get one call
GET    /v1/calls/:id/transcriptions      // sub-resource of a call
GET    /v1/calls/:id/scores              // another sub-resource
POST   /v1/calls                         // create a call
PATCH  /v1/calls/:id                     // partial update
DELETE /v1/calls/:id                     // delete a call

GET    /v1/deals                         // list all deals
GET    /v1/deals/:id/insights            // insights sub-resource of a deal
GET    /v1/accounts/:id/contacts         // contacts under an account

// ❌ WRONG — verbs in URLs
POST   /v1/createCall
GET    /v1/getCallById/:id
POST   /v1/calls/:id/generateSummary

// ❌ WRONG — singular nouns
GET    /v1/call
GET    /v1/deal/:id

// ❌ WRONG — camelCase or snake_case in URL
GET    /v1/callReviews
GET    /v1/call_reviews

// ✅ CORRECT — kebab-case for multi-word resources
GET    /v1/call-reviews
GET    /v1/deal-stages
GET    /v1/tracker-detections
```

---

## 7.2 HTTP Method Usage

Use HTTP methods exactly as defined below. Do not invent new meanings.

| Method | When to Use | Request Body | Response |
|---|---|---|---|
| `GET` | Read data — list or single item | None | `200 OK` + data |
| `POST` | Create a new resource | Full resource body | `201 Created` + created item |
| `PUT` | Full replace of an existing resource | Complete resource body | `200 OK` + updated item |
| `PATCH` | Partial update — change one or more fields | Only the fields changing | `200 OK` + updated item |
| `DELETE` | Remove a resource | None | `204 No Content` |

```ts
// ✅ CORRECT — PATCH for partial update (only send changed fields)
PATCH /v1/deals/:id
Body: { "stage": "negotiation" }     // only the field being changed

// ✅ CORRECT — PUT for full replace
PUT /v1/deals/:id
Body: { "name": "...", "stage": "...", "value": 50000, "ownerId": "..." }

// ❌ WRONG — POST to update
POST /v1/deals/:id/update

// ❌ WRONG — GET with a body
GET /v1/deals
Body: { "filters": { "stage": "open" } }    // use query params instead
```

---

## 7.3 Versioning Rule

All endpoints are versioned from day one. Breaking changes always create a new version.

**What counts as a breaking change (requires `v2`):**
- Removing a field from the response
- Renaming a field in the request or response
- Changing a field's data type
- Changing a required field to optional or vice versa
- Removing an endpoint entirely

**What does NOT require a new version:**
- Adding a new optional field to the response
- Adding a new optional query parameter
- Performance improvements with no schema change

```ts
// ✅ CORRECT — breaking schema change creates v2, v1 stays live
@Get('v1/calls/:id')                  // original — kept alive for 30+ days
async getCallV1(@Param('id') id: string) { ... }

@Get('v2/calls/:id')                  // new version — new response shape
async getCallV2(@Param('id') id: string) { ... }
```

**Deprecation process:**
1. Ship `v2` endpoint
2. Add `Deprecation` and `Sunset` headers to `v1` responses:

```ts
// ✅ Add deprecation headers to the old version
@Get('v1/calls/:id')
async getCallV1(@Res() res: Response, @Param('id') id: string) {
  res.setHeader('Deprecation', 'true');
  res.setHeader('Sunset',      'Sat, 01 Aug 2026 00:00:00 GMT');
  res.setHeader('Link',        '</v2/calls/:id>; rel="successor-version"');
  // ... return response
}
```

3. Notify all consumers (frontend team, integration partners)
4. Remove `v1` only after the Sunset date — minimum 30 days after `v2` ships

---

## 7.4 Pagination Standard

Two pagination strategies are used depending on the dataset size.

| Strategy | When to Use | How It Works |
|---|---|---|
| **Cursor-based** | Large datasets (calls, transcripts, events) | Use an opaque `cursor` from the previous response |
| **Offset-based** | Small, bounded datasets (users, settings, modules) | Use `page` and `pageSize` query params |

### Cursor-Based Pagination (default for most endpoints)

```ts
// Request
GET /v1/calls?cursor=eyJpZCI6IjEyMyJ9&pageSize=20

// Response
{
  "success": true,
  "data": [ ...20 calls... ],
  "meta": {
    "pageSize":      20,
    "hasNextPage":   true,
    "nextCursor":    "eyJpZCI6IjE0MyJ9",   // opaque — frontend just passes it back
    "hasPrevPage":   false,
    "prevCursor":    null
  }
}
```

```ts
// NestJS implementation pattern
async getCalls(tenantId: string, cursor?: string, pageSize = 20) {
  const cursorId = cursor ? decodeCursor(cursor) : undefined;

  const items = await this.prisma.m01Transcription.findMany({
    where:   { tenantId },
    take:    pageSize + 1,               // fetch one extra to check hasNextPage
    cursor:  cursorId ? { id: cursorId } : undefined,
    orderBy: { createdAt: 'desc' },
  });

  const hasNextPage = items.length > pageSize;
  const data        = hasNextPage ? items.slice(0, pageSize) : items;

  return {
    data,
    meta: {
      pageSize,
      hasNextPage,
      nextCursor: hasNextPage ? encodeCursor(data[data.length - 1].id) : null,
    },
  };
}
```

### Offset-Based Pagination (small datasets only)

```ts
// Request
GET /v1/users?page=2&pageSize=10

// Response
{
  "success": true,
  "data": [ ...10 users... ],
  "meta": {
    "total":       45,
    "page":        2,
    "pageSize":    10,
    "totalPages":  5,
    "hasNextPage": true
  }
}
```

---

## 7.5 Filtering and Sorting Conventions

All filters and sort options are passed as **query parameters**. Never in the request
body for `GET` requests.

### Filtering

```ts
// ✅ CORRECT — filters as query params
GET /v1/calls?status=completed&assignedTo=userId123&fromDate=2026-01-01

// ✅ CORRECT — array filter (comma-separated)
GET /v1/deals?stage=prospecting,negotiation,closed-won

// ✅ CORRECT — range filter
GET /v1/calls?durationMin=300&durationMax=3600    // seconds

// ❌ WRONG — filter in request body on a GET
GET /v1/calls
Body: { "filters": { "status": "completed" } }
```

### Sorting

```ts
// ✅ CORRECT — sort field and direction
GET /v1/calls?sortBy=createdAt&sortOrder=desc
GET /v1/deals?sortBy=value&sortOrder=asc

// Default sort for all list endpoints:
// sortBy=createdAt, sortOrder=desc  (newest first)
// Always document the default in the API reference

// ✅ CORRECT — multi-field sort (pipe-separated)
GET /v1/deals?sortBy=stage|createdAt&sortOrder=asc|desc
```

### Zod Validation for Query Params

```ts
// dto/list-calls.dto.ts
export const ListCallsQuerySchema = z.object({
  status:      z.enum(['processing', 'completed', 'failed']).optional(),
  assignedTo:  z.string().uuid().optional(),
  fromDate:    z.string().datetime().optional(),
  toDate:      z.string().datetime().optional(),
  sortBy:      z.enum(['createdAt', 'duration', 'score']).default('createdAt'),
  sortOrder:   z.enum(['asc', 'desc']).default('desc'),
  cursor:      z.string().optional(),
  pageSize:    z.coerce.number().min(1).max(100).default(20),
});
```

---

## 7.6 Rate Limiting Headers

Every API response — success or error — must include rate limiting headers. These
tell the client how many requests they have left before they are throttled.

```ts
// ✅ CORRECT — rate limit headers on every response
HTTP/1.1 200 OK
X-RateLimit-Limit:     1000       // max requests allowed in the window
X-RateLimit-Remaining: 847        // requests remaining in current window
X-RateLimit-Reset:     1745231400 // Unix timestamp when window resets
X-RateLimit-Window:    3600       // window duration in seconds (1 hour)
```

When the rate limit is exceeded:

```ts
// Rate limit exceeded response
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit:     1000
X-RateLimit-Remaining: 0
X-RateLimit-Reset:     1745231400
Retry-After:           347        // seconds until the client can retry

{
  "success": false,
  "error": {
    "code":    "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please retry after 347 seconds."
  }
}
```

Rate limits are applied per tenant, per endpoint category:

| Endpoint Category | Limit | Window |
|---|---|---|
| Standard reads (`GET`) | 1,000 req | 1 hour |
| Standard writes (`POST`, `PATCH`, `DELETE`) | 500 req | 1 hour |
| AI endpoints (`/v1/ask-anything`, `/v1/deep-research`) | 100 req | 1 hour |
| Webhook ingestion | 5,000 req | 1 hour |

---

## 7.7 Internal vs External API Distinction

Not all APIs in this platform are meant for the outside world. Know the difference.

| API Layer | Who Can Call It | Exposed to Internet? | Auth Method |
|---|---|---|---|
| **NestJS API (`/v1/...`)** | Frontend, integration partners, webhooks | ✅ Yes — via Cloudflare | JWT Bearer token |
| **AI Services FastAPI** | NestJS API layer only | ❌ No — internal Docker network | Internal network only (no auth header needed) |
| **Transcription Service FastAPI** | NestJS API layer only | ❌ No — internal Docker network | Internal network only |
| **BullMQ** | NestJS API layer only | ❌ No — Redis is private | Redis auth (internal) |
| **ClickHouse** | NestJS API layer only | ❌ No — private network | ClickHouse credentials via Doppler |

```ts
// ✅ CORRECT — AI service is called from NestJS, never from frontend
// In NestJS service:
const summary = await this.aiServicesClient.post('/v1/summarize', payload);

// ❌ WRONG — frontend calling AI service directly
// In Next.js component:
const summary = await fetch('http://ai-services:8000/v1/summarize', { ... });
// This must never happen. AI services have no public port.
```

**Cloudflare sits in front of the NestJS API only.** It provides:
- DDoS protection
- TLS termination
- WAF (Web Application Firewall)
- Rate limiting at the edge (first line of defence before NestJS rate limiter)

Internal services communicate over the private Docker network with no public exposure.
In Phase 3 (AWS), this becomes a private VPC subnet.


# Chapter 8 — Event Bus Standards (BullMQ)

Events are the nervous system of R-Revenue Intelligence. When something happens in one
module, it tells other modules by publishing an event. No module ever reaches directly
into another module — it only listens to what gets announced on the event bus.

Think of it like a public notice board. Module M-01 pins a note saying
"transcription completed." Modules M-03, M-04, and others read that note and react
independently. M-01 never needs to know who is reading.

---

## 8.1 Event Naming Convention

Every event name follows this exact pattern — no exceptions:


<domain>.<entity>.<past-tense-verb>




| Part | Rule | Example |
|---|---|---|
| `domain` | The business area | `call`, `deal`, `tracker`, `insight`, `forecast` |
| `entity` | The specific thing that changed | `transcription`, `stage`, `detection`, `summary` |
| `past-tense-verb` | What happened to it | `completed`, `changed`, `created`, `submitted` |

```ts
// ✅ CORRECT event names
'call.transcription.completed'       // M-01 finished transcribing a call
'revenue_graph.entity.linked'         // M-03 linked an entity to the revenue graph
'call.scored'                 // M-04 finished scoring a call
'tracker.detection.created'          // M-05 detected a tracker signal
'call.summary.generated'              // M-06 generated a summary
'deal.stage.changed'                 // M-07 deal moved to a new stage
'email.sent'                         // M-02 sent an email
'forecast.submitted'                 // M-09 rep submitted a forecast

// ❌ WRONG — do not do any of these
'callDone'                           // camelCase, no structure
'TRANSCRIPTION_COMPLETE'             // screaming snake, wrong tense
'm01-finished'                       // module prefix in event name
'processCall'                        // verb first, present tense
'call-transcription-completed'       // hyphens instead of dots
```

---

## 8.2 Full Event Registry

This is the complete set of platform events for Phase 1–2. Every event that exists
in the system must be registered here and in `packages/event-contracts/src/`.

> **Reference:** For the full payload schema of each event, see SAD Doc #1, Section
> 2.4 — Event Flow Verification Checklist and Core Platform Events.

| Event Name | Published By | Consumed By | Phase | Status |
|---|---|---|---|---|
| `call.transcription.completed` | M-01 Data Ingestion | M-03 Revenue Graph | Phase 1 | ✅ Required |
| `revenue_graph.entity.linked` | M-03 Revenue Graph | M-04, M-05 | Phase 2 | ✅ Required |
| `call.scored` | M-04 Conv. Intelligence | M-05 | Phase 2 | Planned |
| `tracker.detection.created` | M-05 Smart Tracking | M-06, M-08 | Phase 2 | Planned |
| `call.summary.generated` | M-06 Insight Generation | M-07, M-08 | Phase 2 | Planned |
| `deal.stage.changed` | M-07 Deal Management | M-08, M-09 | Phase 3 | Planned |
| `email.sent` | M-02 Sales Engagement | M-03, M-07 | Phase 2 | Planned |
| `forecast.submitted` | M-09 Forecasting | M-10 | Phase 3 | Planned |
| `search.index.update` | Any module | Search Worker | Phase 1 | ✅ Required |
| `search.index.delete` | Any module | Search Worker | Phase 1 | ✅ Required |
| `analytics.metric.record` | Any module | ClickHouse Flusher | Phase 2 | Planned |

**Rule:** If the event you need is not in this table, do not invent it unilaterally.
Raise it with the Tech Lead → add it to this registry → add its type to
`packages/event-contracts/` → then build the publisher and subscriber.

---

## 8.3 Idempotency Requirement — Mandatory on Every Consumer

BullMQ retries failed jobs automatically (up to 3 times with exponential backoff).
This means the same event payload can be delivered more than once. Your consumer
**must** handle this safely — processing the same event twice must produce the same
result as processing it once.

This is not optional. Missing an idempotency check is a bug that causes duplicate
records, double CRM writes, and incorrect analytics.

### The Standard Idempotency Pattern

```ts
// ✅ CORRECT — full idempotency pattern, copy this for every new consumer

new Worker(
  'call.transcription.completed',
  async (job: Job<CallTranscriptionCompletedEvent>) => {

    const { eventId, tenantId, callId, transcriptId } = job.data;

    // ── Step 1: Check if already processed ──────────────────────────
    const alreadyProcessed = await prisma.m03ProcessedEvent.findUnique({
      where: { eventId },     // eventId is the unique deduplication key
    });

    if (alreadyProcessed) {
      logger.log(`Skipping duplicate event ${eventId} for call ${callId}`);
      return;                 // exit cleanly — not an error
    }

    // ── Step 2: Do the actual work ───────────────────────────────────
    await m03Service.linkToRevenueGraph({ tenantId, callId, transcriptId });

    // ── Step 3: Record as processed ─────────────────────────────────
    await prisma.m03ProcessedEvent.create({
      data: {
        eventId,
        processedAt: new Date(),
        module: 'M-03',
      },
    });
  },
  { connection: redisConnection, concurrency: 5 },
);
```

### The Processed Events Table (Required in Every Module)

Every module that consumes events must have a `m0X_processed_events` table:

```prisma
// Add this to every module that subscribes to events
model M03ProcessedEvent {
  eventId     String   @id           // eventId from the event payload
  processedAt DateTime @default(now())
  module      String                 // which module processed it

  @@map("m03_processed_events")
}
```

---

## 8.4 Event Contract Ownership

**The publisher owns the event schema.** This is the single most important rule in
the event bus system.

What this means in practice:

| Rule | Detail |
|---|---|
| Publisher defines the payload type | The module that publishes `call.transcription.completed` owns its TypeScript type in `packages/event-contracts/` |
| Consumers must not redefine the type | Import from `@r-revenue/event-contracts` — never define a local copy |
| Schema changes go through the publisher | If M-03 needs a new field in `call.transcription.completed`, M-03 asks M-01 to add it — M-03 cannot add it unilaterally |
| Publisher is responsible for backward compatibility | Adding a field is fine. Removing or renaming a field requires a new event name |

```ts
// packages/event-contracts/src/call.events.ts
// M-01 owns this — only M-01 can change it

export interface CallTranscriptionCompletedEvent {
  eventId:          string;    // base field — always present
  tenantId:         string;    // base field — always present
  timestamp:        string;    // base field — always present
  callId:           string;
  transcriptId:     string;
  languageDetected: string;
  confidenceScore:  number;
  durationSeconds:  number;
}
```

```ts
// ✅ CORRECT — consumer imports from shared package
import { CallTranscriptionCompletedEvent } from '@r-revenue/event-contracts';

// ❌ WRONG — consumer redefines the type locally
interface CallTranscriptionCompletedEvent {   // local copy — will drift
  callId: string;
  transcriptId: string;
  // missing fields that M-01 added later
}
```

---

## 8.5 Schema Evolution Rules — Additive Only

As the platform grows, event payloads will need new fields. There is a safe way and
an unsafe way to do this.

### ✅ Safe Change — Add an Optional Field

Adding a new optional field is always backward-compatible. Existing consumers that
do not use the field are unaffected.

```ts
// BEFORE — original schema (v1)
export interface TrackerDetectionCreatedEvent {
  eventId:       string;
  tenantId:      string;
  timestamp:     string;
  callId:        string;
  detectionType: string;
  confidence:    number;
}

// AFTER — safe evolution, optional field added
export interface TrackerDetectionCreatedEvent {
  eventId:        string;
  tenantId:       string;
  timestamp:      string;
  callId:         string;
  detectionType:  string;
  confidence:     number;
  detectionLabel?: string;    // ← new optional field — safe to add
  segmentStart?:  number;     // ← new optional field — safe to add
}
```

All consumers must be written to handle optional fields gracefully:

```ts
// ✅ CORRECT — consumer handles optional field safely
const label = job.data.detectionLabel ?? 'unlabelled';
```

### ❌ Breaking Change — Requires a New Event Name

Any of these changes break existing consumers and require a **new event name**:

```ts
// These are ALL breaking changes — require new event name:

// 1. Removing a field
// BEFORE: { callId: string; transcriptId: string; }
// AFTER:  { callId: string; }                        ← transcriptId removed — BREAKING

// 2. Renaming a field
// BEFORE: { confidenceScore: number; }
// AFTER:  { confidence: number; }                    ← renamed — BREAKING

// 3. Changing a field's type
// BEFORE: { duration: number; }                      // seconds as integer
// AFTER:  { duration: string; }                      // changed to "00:05:30" — BREAKING

// 4. Making an optional field required
// BEFORE: { dealId?: string; }
// AFTER:  { dealId: string; }                        ← now required — BREAKING
```

**When you have a breaking change, create a new event name:**

```ts
// Old event — kept alive until all consumers migrate
'call.transcription.completed'      // v1 schema

// New event — new name signals a schema change
'call.transcription.completed.v2'   // v2 schema with breaking changes

// Migration window:
// 1. Publish BOTH events temporarily (publisher emits both)
// 2. Consumers migrate to v2 one by one
// 3. After all consumers are on v2, deprecate v1
// 4. Remove v1 after 30 days
```

---
---

# Chapter 9 — Security Standards

Security is not a feature you add at the end. Every decision in this chapter was made
to protect customer data — sales conversations, deal information, revenue forecasts —
that businesses trust us to keep private.

A security violation in this platform does not just break code. It breaks customer
trust and can expose confidential business data. Every rule here is mandatory.

---

## 9.1 Authentication — Zero Unguarded Routes

Every single HTTP route in the NestJS API must be protected by `JwtGuard`. There are
no public endpoints — not even health checks that return tenant data.

```ts
// ✅ CORRECT — guard applied at controller level (covers all methods)
@Controller('v1/calls')
@UseGuards(JwtGuard)
export class M04Controller {

  @Get()
  listCalls(@Req() req: AuthRequest) {
    return this.m04Service.listCalls(req.user.tenantId);
  }

  @Get(':id')
  getCall(@Param('id') id: string, @Req() req: AuthRequest) {
    return this.m04Service.getCall(id, req.user.tenantId);
  }
}

// ❌ WRONG — no guard, anyone can call this
@Controller('v1/calls')
export class M04Controller {
  @Get()
  listCalls() { ... }
}
```

**Exception — the only two truly public endpoints:**

```ts
// These two endpoints are intentionally unguarded
POST /v1/auth/login       // user is not logged in yet — cannot have a token
POST /v1/auth/signup      // same reason

// ✅ Mark them explicitly so the RLS CI script does not flag them
@Post('login')
@Public()                 // ← custom decorator that marks this as intentionally public
async login(@Body() body: unknown) { ... }
```

The `@Public()` decorator tells the CI script "this route is intentionally unguarded"
so it does not trigger a security alert.

**The `AuthRequest` type — always use this, never use Express's `Request` directly:**

```ts
// common/types/auth-request.type.ts
export interface AuthRequest extends Request {
  user: {
    userId:   string;
    tenantId: string;
    role:     UserRole;
    email:    string;
  };
}
```

---

## 9.2 Multi-Tenancy — Two Layers of Enforcement

Tenant isolation is enforced at two independent layers. Both must be present. One
layer failing does not mean data leaks — the second layer catches it.


Layer 1 — Application Layer (NestJS)
Every query includes: where: { tenantId: req.user.tenantId }
tenantId always comes from req.user (JWT) — never from request body

Layer 2 — Database Layer (PostgreSQL RLS)
Every table has RLS enabled
Session variable app.current_tenant_id is set before every query
Even if application layer forgets tenantId, RLS blocks the query



```ts
// ✅ CORRECT — tenantId from JWT, applied at both layers
@Get(':id')
async getDeal(@Param('id') id: string, @Req() req: AuthRequest) {
  // Application layer — explicit tenantId filter
  const deal = await this.prisma.m07Deal.findFirst({
    where: {
      id:       id,
      tenantId: req.user.tenantId,    // ← from JWT, not from request body
    },
  });

  if (!deal) throw new NotFoundException('Deal not found');
  return deal;
}

// ❌ WRONG — tenantId from request body (user can pass any tenantId)
@Get(':id')
async getDeal(@Param('id') id: string, @Body() body: { tenantId: string }) {
  const deal = await this.prisma.m07Deal.findFirst({
    where: { id, tenantId: body.tenantId },   // NEVER do this
  });
}
```

---

## 9.3 Secrets Management — Doppler Only

No secret of any kind is ever stored outside of Doppler. This includes:

```ts
// ❌ These are ALL violations — any one of them is a critical security incident:

// 1. Hardcoded in source code
const apiKey = 'sk-abc123...';

// 2. In a .env file committed to git
// .env
DATABASE_URL=postgresql://user:password@host/db   // committed to repo — violation

// 3. In a .env file that is .gitignored but shared via Slack/email
// (Doppler eliminates the need to share .env files entirely)

// 4. In a Dockerfile
ENV OPENAI_API_KEY=sk-abc123

// 5. In GitHub Actions as a plain text env var
// (use GitHub Secrets + Doppler integration instead)
```

```ts
// ✅ CORRECT — all secrets via process.env, injected by Doppler at runtime
const openaiKey  = process.env.OPENAI_API_KEY;
const dbUrl      = process.env.DATABASE_URL;
const jwtSecret  = process.env.JWT_SECRET;
```

**Doppler environments map to deployment environments:**

| Doppler Environment | Used In |
|---|---|
| `development` | Local dev (`docker compose up`) |
| `staging` | Railway staging deployment |
| `production` | Railway / AWS production deployment |
| `test` | CI pipeline (GitHub Actions) |

**If you accidentally commit a secret:**
1. Immediately rotate the secret in the relevant service (OpenAI, Supabase, etc.)
2. Notify the Tech Lead within 5 minutes
3. Force-push to remove it from git history (Tech Lead does this)
4. Run `git log` audit to confirm it is gone from all branches

---

## 9.4 Sensitive Field Encryption

Some fields are so sensitive that even full database access should not expose them
in plain text. These fields are encrypted at the application layer before being
written to PostgreSQL.

**Fields that require application-layer encryption:**

| Field | Table | Why |
|---|---|---|
| OAuth access tokens | `shared_integrations` | CRM credentials — full account access |
| OAuth refresh tokens | `shared_integrations` | CRM credentials — permanent access |
| Webhook signing secrets | `shared_webhooks` | Used to verify inbound webhooks |
| API keys (third-party) | `shared_api_keys` | External service credentials |
| User PII beyond email (if stored) | Any | Compliance requirement |

```ts
// ✅ CORRECT — encrypt before write, decrypt after read
import { encrypt, decrypt } from '../common/crypto.service';

// Writing
await this.prisma.sharedIntegration.create({
  data: {
    tenantId:          tenantId,
    provider:          'salesforce',
    accessToken:       encrypt(tokens.access_token),    // ← encrypted
    refreshToken:      encrypt(tokens.refresh_token),   // ← encrypted
  },
});

// Reading
const integration = await this.prisma.sharedIntegration.findFirst({
  where: { tenantId, provider: 'salesforce' },
});
const accessToken = decrypt(integration.accessToken);  // ← decrypted at use time
```

The encryption key itself lives in Doppler as `FIELD_ENCRYPTION_KEY` and is never
in the codebase.

---

## 9.5 No Logging of Tokens, Credentials, or PII

Logs are stored in Better Stack and accessible to the engineering team. Sensitive data
in logs is a compliance violation. The rule is simple: if it is sensitive, it does
not appear in any log — not `info`, not `debug`, not `error`.

**What counts as PII in this platform:**

| Category | Examples |
|---|---|
| Identity | Full name, email address, phone number |
| Authentication | JWT tokens, OAuth tokens, API keys, passwords |
| Call content | Full transcript text, audio file URLs |
| Financial | Deal values above summary level, revenue figures |
| CRM data | Contact details, account-specific information |

```ts
// ❌ WRONG — logging sensitive data
this.logger.log(`User logged in: ${user.email}, token: ${token}`);
this.logger.error(`OAuth failed for token: ${accessToken}`);
this.logger.debug(`Processing transcript: ${fullTranscriptText}`);

// ✅ CORRECT — log identifiers only, never the sensitive value itself
this.logger.log(`User logged in`, { userId: user.id, tenantId: user.tenantId });
this.logger.error(`OAuth token refresh failed`, { tenantId, provider: 'salesforce' });
this.logger.debug(`Processing transcript`, { transcriptId, callId, tenantId });
```

**Sentry rule — scrub before capture:**

```ts
// common/filters/global-exception.filter.ts
Sentry.configureScope((scope) => {
  scope.addEventProcessor((event) => {
    // Remove any request body fields that may contain sensitive data
    if (event.request?.data) {
      delete event.request.data.password;
      delete event.request.data.token;
      delete event.request.data.accessToken;
    }
    return event;
  });
});
```

---

## 9.6 RBAC — Role-Based Access Control

Every authenticated user has one of four roles. The role is stored in the JWT and
enforced by the `RolesGuard` on sensitive endpoints.

**Role Definitions:**

| Role | Who It Is | What They Can Do |
|---|---|---|
| `admin` | Tenant administrator | Full access — all modules, all data, all settings, user management |
| `manager` | Sales manager / team lead | All data in their team, coaching reports, forecasts, all calls |
| `rep` | Individual sales rep | Their own calls, deals, and tasks only |
| `viewer` | Read-only stakeholder | Read access to dashboards and reports — no writes |

**Permission Matrix:**

| Action | admin | manager | rep | viewer |
|---|---|---|---|---|
| View all calls (tenant-wide) | ✅ | ✅ | ❌ (own only) | ✅ |
| View own calls | ✅ | ✅ | ✅ | ✅ |
| Score / review calls | ✅ | ✅ | ❌ | ❌ |
| View all deals | ✅ | ✅ | ❌ (own only) | ✅ |
| Submit forecast | ✅ | ✅ | ✅ | ❌ |
| View coaching reports | ✅ | ✅ | ❌ | ❌ |
| Manage users | ✅ | ❌ | ❌ | ❌ |
| Manage integrations | ✅ | ❌ | ❌ | ❌ |
| Configure trackers | ✅ | ✅ | ❌ | ❌ |

**Applying role guards in NestJS:**

```ts
// ✅ CORRECT — restrict endpoint to specific roles
@Delete(':id')
@UseGuards(JwtGuard, RolesGuard)
@Roles('admin')                         // only admins can delete
async deleteCall(@Param('id') id: string, @Req() req: AuthRequest) {
  return this.m01Service.deleteCall(id, req.user.tenantId);
}

@Get('team/calls')
@UseGuards(JwtGuard, RolesGuard)
@Roles('admin', 'manager')              // admins and managers only
async getTeamCalls(@Req() req: AuthRequest) {
  return this.m01Service.getTeamCalls(req.user.tenantId);
}

// common/decorators/roles.decorator.ts
export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);
```

---

## 9.7 External Webhook Validation — Signature Verification Required

R-Revenue Intelligence receives webhooks from external services (Salesforce, HubSpot,
Zoom, etc.). Every inbound webhook must have its signature verified before any payload
data is processed.

**Never trust an inbound webhook without verifying its signature.**

```ts
// ✅ CORRECT — verify HMAC signature before processing webhook
@Post('webhooks/salesforce')
@Public()                              // webhook receiver is public — no JWT
async handleSalesforceWebhook(
  @Headers('x-salesforce-signature') signature: string,
  @RawBody() rawBody: Buffer,          // ← must use raw body for HMAC
  @Req() req: Request,
) {
  // Step 1 — verify signature FIRST, before touching payload
  const isValid = this.webhookService.verifySalesforceSignature(
    rawBody,
    signature,
    process.env.SALESFORCE_WEBHOOK_SECRET,
  );

  if (!isValid) {
    this.logger.warn('Invalid webhook signature received from Salesforce');
    throw new UnauthorizedException('Invalid webhook signature');
  }

  // Step 2 — only now parse and process the payload
  const payload = JSON.parse(rawBody.toString());
  await this.m03Service.handleCrmUpdate(payload);
}

// webhook.service.ts
verifySalesforceSignature(body: Buffer, signature: string, secret: string): boolean {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');

  // Use timingSafeEqual to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(`sha256=${expected}`),
  );
}
```

---

## 9.8 Dependency Audit — Every PR

Every pull request runs automated dependency audits. These check for known
vulnerabilities in npm and pip packages.

```yaml
# .github/workflows/pr-checks.yml
- name: npm dependency audit
  run: npm audit --audit-level=high
  # Fails if any HIGH or CRITICAL vulnerability is found

- name: pip dependency audit
  run: pip-audit --severity high
  working-directory: apps/ai-services
  # Fails if any HIGH or CRITICAL vulnerability is found
```

**What to do when an audit fails:**

| Vulnerability Level | Action |
|---|---|
| `critical` | Block merge immediately. Update the package or find an alternative today. |
| `high` | Block merge. Update within 24 hours. |
| `moderate` | Does not block merge. Create a ticket. Fix within the sprint. |
| `low` | Does not block merge. Fix in next dependency update cycle. |

```bash
# Fix a specific vulnerability
npm audit fix                          # auto-fix where possible
npm audit fix --force                  # force major version bump (check for breaking changes)

# If no fix is available yet — document the exception
# Create a file: docs/security/audit-exceptions.md
# Include: package name, CVE number, reason no fix exists, review date
```

**Weekly dependency update rule:**
Every Monday, one engineer (rotating responsibility) runs:
```bash
npx npm-check-updates -u    # updates package.json
npm install
npm audit
```
If all tests pass and audit is clean, the PR is merged as a `chore: update dependencies` commit.



# Chapter 10 — Testing Standards

Writing tests is not optional. It is part of the definition of "done." A feature is
not complete until its tests are written and passing. A PR without tests for new logic
will not be approved.

This chapter tells you what to test, how to test it, and where to put the files.

---

## 10.1 Philosophy — Test Behaviour, Not Implementation

This is the most important testing principle. Test what a function **does**, not
**how** it does it internally.

```ts
// ❌ WRONG — testing implementation details
it('should call prisma.findMany once', async () => {
  await service.getCalls(tenantId);
  expect(mockPrisma.findMany).toHaveBeenCalledTimes(1);  // who cares how many times?
});

// ✅ CORRECT — testing behaviour (what the user actually gets)
it('should return only calls belonging to the tenant', async () => {
  const calls = await service.getCalls('tenant-A');
  expect(calls.every(c => c.tenantId === 'tenant-A')).toBe(true);
});
```

**Why this matters:** If you test implementation, every internal refactor breaks your
tests — even when the feature still works perfectly. If you test behaviour, your tests
survive refactors and only break when something actually stops working.

---

## 10.2 Coverage Requirement — ≥80% Line Coverage

The CI gate enforces a minimum of **80% line coverage** across unit and integration
tests combined. This is measured automatically on every PR.

```json
// jest.config.ts
{
  "coverageThreshold": {
    "global": {
      "lines":      80,
      "functions":  80,
      "branches":   75,
      "statements": 80
    }
  }
}
```

**What 80% means in practice:**
- 80% is a floor, not a target. Aim for 90%+ on service files.
- Controllers, DTOs, and module files typically have lower coverage — that is fine.
- The 20% you do not cover should be genuinely hard-to-test infrastructure paths
  (e.g., process crash handlers), not skipped business logic.

```bash
# Run coverage locally before pushing
npm run test:cov

# View the coverage report
open coverage/lcov-report/index.html
```

---

## 10.3 Test Types Reference

| Test Type | Tool | Scope | What to Test |
|---|---|---|---|
| **Unit** | Jest (TS) / pytest (Python) | Single function or class in isolation | Business logic, edge cases, error paths, calculations |
| **Integration** | Jest + Testcontainers | Full module with real DB + Redis | API → Service → DB → Event flow end-to-end |
| **E2E** | Playwright | Critical user journeys in browser | Login → upload call → view insight |
| **AI Regression** | pytest | Prompt output quality | Score drift, summary format, JSON validity |

---

## 10.4 Unit Tests

Unit tests cover a single service, function, or class in isolation. External
dependencies (database, Redis, AI services) are mocked.

### File Location


apps/api/src/modules/m04-conversation-intelligence/
└── _tests_/
├── m04.service.spec.ts ← unit tests for the service
└── m04.controller.spec.ts ← unit tests for the controller


### Naming Convention

Every test follows this sentence pattern:


should <expected behaviour> when <condition>




```ts
// ✅ CORRECT test names — read like plain English sentences
it('should return a scored call when transcript is valid')
it('should throw NotFoundException when call does not exist')
it('should set flagged_for_review to true when confidence score is below 0.7')
it('should not write to CRM when flagged_for_review is true')
it('should return empty array when tenant has no calls')

// ❌ WRONG test names — vague, not descriptive
it('test score call')
it('works correctly')
it('handles error')
it('scoreCall function')
```

### Unit Test Structure (Jest — TypeScript)

```ts
// m04.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { M04Service }          from '../m04.service';
import { PrismaService }       from '../../../prisma/prisma.service';
import { NotFoundException }   from '@nestjs/common';

// Mock Prisma — unit tests never hit a real database
const mockPrisma = {
  m04CallScore: {
    findFirst:  jest.fn(),
    create:     jest.fn(),
    findMany:   jest.fn(),
  },
};

describe('M04Service', () => {
  let service: M04Service;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        M04Service,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<M04Service>(M04Service);
  });

  afterEach(() => jest.clearAllMocks());   // reset mocks between tests

  // ── Happy path ─────────────────────────────────────────────────────
  describe('scoreCall', () => {

    it('should return scored call when transcript is valid', async () => {
      const mockScore = { callId: 'call-1', tenantId: 'tenant-1', score: 8.5 };
      mockPrisma.m04CallScore.create.mockResolvedValue(mockScore);

      const result = await service.scoreCall({
        tenantId: 'tenant-1',
        callId:   'call-1',
        scorecardId: 'scorecard-1',
      });

      expect(result.score).toBe(8.5);
      expect(result.tenantId).toBe('tenant-1');
    });

    // ── Error path ────────────────────────────────────────────────────
    it('should throw NotFoundException when call does not exist', async () => {
      mockPrisma.m04CallScore.findFirst.mockResolvedValue(null);

      await expect(
        service.getScore('nonexistent-call', 'tenant-1')
      ).rejects.toThrow(NotFoundException);
    });

    // ── Edge case ─────────────────────────────────────────────────────
    it('should set flagged_for_review true when confidence score is below 0.7', async () => {
      const result = await service.evaluateConfidence(0.65);
      expect(result.flaggedForReview).toBe(true);
    });

    it('should not flag for review when confidence score is 0.7 or above', async () => {
      const result = await service.evaluateConfidence(0.7);
      expect(result.flaggedForReview).toBe(false);
    });
  });
});
```

### Unit Test Structure (pytest — Python)

```python
# tests/test_call_scorer.py
import pytest
from unittest.mock import AsyncMock, patch
from services.call_scorer import CallScorerService
from schemas.score_call_schema import ScoreCallRequest

@pytest.fixture
def scorer():
    return CallScorerService()

class TestCallScorerService:

    # ── Happy path ──────────────────────────────────────────────────
    @pytest.mark.asyncio
    async def test_returns_score_when_transcript_is_valid(self, scorer):
        request = ScoreCallRequest(
            tenant_id    = "tenant-1",
            call_id      = "call-1",
            transcript   = "Customer said they are interested in the product.",
            scorecard_id = "scorecard-1",
        )
        result = await scorer.score(request)
        assert 0.0 <= result.score <= 10.0
        assert result.confidence_score >= 0.0

    # ── Edge case ────────────────────────────────────────────────────
    @pytest.mark.asyncio
    async def test_flags_for_review_when_confidence_below_threshold(self, scorer):
        result = await scorer.evaluate_confidence(0.65)
        assert result.flagged_for_review is True

    # ── Error path ───────────────────────────────────────────────────
    @pytest.mark.asyncio
    async def test_raises_value_error_when_transcript_is_empty(self, scorer):
        with pytest.raises(ValueError, match="Transcript cannot be empty"):
            await scorer.score(ScoreCallRequest(
                tenant_id="t1", call_id="c1", transcript="", scorecard_id="s1"
            ))
```

---

## 10.5 Integration Tests

Integration tests verify that an entire module works end-to-end — from the HTTP
request, through the service, into a real database, and out to the event bus.

**The key rule: Never mock the database in integration tests.** Use Testcontainers
to spin up a real PostgreSQL and Redis instance for each test run.

```ts
// m01.integration.spec.ts
import { Test, TestingModule }         from '@nestjs/testing';
import { INestApplication }            from '@nestjs/common';
import { PostgreSqlContainer }         from '@testcontainers/postgresql';
import { RedisContainer }              from '@testcontainers/redis';
import * as request                    from 'supertest';

describe('M01 Data Ingestion — Integration', () => {
  let app:       INestApplication;
  let pgContainer;
  let redisContainer;

  // ── Spin up real containers before all tests ──────────────────────
  beforeAll(async () => {
    pgContainer    = await new PostgreSqlContainer().start();
    redisContainer = await new RedisContainer().start();

    // Override env vars to point at test containers
    process.env.DATABASE_URL = pgContainer.getConnectionUri();
    process.env.REDIS_URL    = redisContainer.getConnectionUrl();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await pgContainer.stop();
    await redisContainer.stop();
  });

  // ── Test the full flow ────────────────────────────────────────────
  it('should transcribe a call and publish transcription completed event', async () => {
    // Step 1 — POST to API
    const response = await request(app.getHttpServer())
      .post('/v1/calls')
      .set('Authorization', `Bearer ${testJwtToken}`)
      .send({ audioUrl: 'https://test-bucket.s3.amazonaws.com/test-call.mp3' })
      .expect(201);

    const { callId } = response.body.data;

    // Step 2 — verify DB record created
    const transcript = await prisma.m01Transcription.findFirst({
      where: { callId },
    });
    expect(transcript).not.toBeNull();
    expect(transcript.tenantId).toBe(testTenantId);

    // Step 3 — verify event published to BullMQ
    const jobs = await transcriptionQueue.getCompleted();
    expect(jobs.some(j => j.data.callId === callId)).toBe(true);
  });
});
```

---

## 10.6 E2E Tests (Playwright)

E2E tests simulate a real user clicking through the application in a browser. They
cover only the most critical user journeys — not every feature.

**Critical journeys that must always have E2E coverage:**

```ts
// e2e/journeys/
├── auth.spec.ts          // sign up → login → logout
├── call-upload.spec.ts   // upload call → processing → transcript visible
├── insight.spec.ts       // view call → request summary → summary displayed
├── deal-board.spec.ts    // view deal → see risk score → drill into call
└── forecast.spec.ts      // submit forecast → manager sees it
```

```ts
// e2e/journeys/call-upload.spec.ts
import { test, expect } from '@playwright/test';

test('should show transcript after call is uploaded and processed', async ({ page }) => {
  // Step 1 — login
  await page.goto('/login');
  await page.fill('[data-testid="email"]',    'rep@testcompany.com');
  await page.fill('[data-testid="password"]', 'TestPassword123!');
  await page.click('[data-testid="login-btn"]');
  await expect(page).toHaveURL('/dashboard');

  // Step 2 — upload call
  await page.click('[data-testid="upload-call-btn"]');
  await page.setInputFiles('[data-testid="audio-input"]', 'e2e/fixtures/test-call.mp3');
  await page.click('[data-testid="submit-upload"]');

  // Step 3 — wait for processing (polling for status change)
  await expect(
    page.locator('[data-testid="call-status"]')
  ).toHaveText('Completed', { timeout: 60_000 });   // allow up to 60s for processing

  // Step 4 — verify transcript is visible
  await page.click('[data-testid="view-transcript"]');
  await expect(page.locator('[data-testid="transcript-content"]')).not.toBeEmpty();
});
```

**Playwright rules:**
- Use `data-testid` attributes only — never CSS selectors or text content for test targeting
- Add `data-testid` to every interactive element when building UI components
- E2E tests run in CI against the staging environment — never against production

---

## 10.7 AI Regression Tests

AI outputs change when prompts change, models update, or temperature settings shift.
AI regression tests catch this drift before it reaches production.

### How It Works


For each AI endpoint, store a set of "golden" baseline examples
(known inputs with approved expected outputs)

On every PR that touches a prompt template or AI service, the CI pipeline
runs the actual LLM against the baseline inputs

The test compares the output structure, key field presence, and score ranges
against the baseline — it does NOT require word-for-word identical output

If output format breaks or scores drift beyond threshold, CI fails


```python
# tests/regression/test_summarize_regression.py
import pytest, json
from pathlib import Path
from services.summarizer import SummarizerService

# Load baseline examples from fixture files
BASELINES = json.loads(
    Path('tests/fixtures/summarize_baselines.json').read_text()
)

@pytest.mark.regression
@pytest.mark.asyncio
@pytest.mark.parametrize("baseline", BASELINES)
async def test_summarize_output_matches_baseline_structure(baseline):
    service = SummarizerService()
    result  = await service.summarize(baseline["input"])

    # ── Structure checks — output must always have these fields ───────
    assert isinstance(result.summary,    str),  "summary must be a string"
    assert isinstance(result.key_points, list), "key_points must be a list"
    assert isinstance(result.next_steps, list), "next_steps must be a list"
    assert len(result.summary) > 50,            "summary must not be empty"
    assert len(result.key_points) >= 1,         "must have at least one key point"

    # ── Confidence score check ────────────────────────────────────────
    assert 0.0 <= result.confidence_score <= 1.0

    # ── Score drift check — score must stay within ±1.5 of baseline ──
    if "expected_score" in baseline:
        assert abs(result.confidence_score - baseline["expected_score"]) <= 0.15, \
            f"Score drifted: got {result.confidence_score}, expected ~{baseline['expected_score']}"
```

```json
// tests/fixtures/summarize_baselines.json
[
  {
    "id": "baseline-001",
    "description": "Standard discovery call with clear next steps",
    "input": {
      "tenant_id":   "test-tenant",
      "call_id":     "test-call-001",
      "transcript":  "Rep: What are your main challenges with your current CRM?...",
      "deal_stage":  "discovery",
      "account_name":"Acme Corp"
    },
    "expected_score": 0.88
  }
]
```

**When to update baselines:**
- When a prompt is intentionally improved (version bumped)
- When the expected output format changes
- Never to "fix" a failing test by relaxing the threshold without Tech Lead approval

---

## 10.8 Additional Testing Rules

### No `test.only` or `test.skip` on `main` Branch

```ts
// ❌ These will be caught by CI and block the merge
test.only('this test runs alone', () => { ... });
test.skip('this test is broken', () => { ... });
it.only('debugging this', () => { ... });

// ✅ If a test is broken, fix it — do not skip it
// ✅ If you need to isolate a test locally, use .only locally but
//    NEVER commit it to a PR
```

The CI script `scripts/check-test-only-skip.ts` scans all test files for `.only`
and `.skip` and fails the build if found.

### No Mocking the Database in Integration Tests

```ts
// ❌ WRONG — mocked Prisma in an integration test defeats the purpose
const mockPrisma = { m01Transcription: { create: jest.fn() } };
// This does not test that your Prisma schema is correct
// This does not test that your indexes work
// This does not test that RLS is configured correctly

// ✅ CORRECT — real PostgreSQL via Testcontainers
// If the schema migration is wrong, the integration test catches it
// If the index is missing, the integration test will be slow and you will notice
```

### Test Data Rules

```ts
// ✅ Always use clearly fake data — never real customer data in tests
const testTenantId = 'test-tenant-00000000-0000-0000-0000-000000000001';
const testUserId   = 'test-user-00000000-0000-0000-0000-000000000001';
const testCallId   = 'test-call-00000000-0000-0000-0000-000000000001';

// ✅ Clean up test data after each test — do not leave orphaned records
afterEach(async () => {
  await prisma.m01Transcription.deleteMany({ where: { tenantId: testTenantId } });
});
```

---
---

# Chapter 11 — Git & PR Standards

A clean git history and a consistent PR process are not bureaucracy — they are the
difference between a codebase you can debug at 2am and one you cannot. Every rule
here exists because its absence caused a real problem.

---

## 11.1 Branch Naming Convention

Every branch must follow this naming pattern exactly:

<type>/<module-or-scope>/<short-description>




| Type | When to Use | Example |
|---|---|---|
| `feature/` | New functionality | `feature/m04-conv-intelligence/add-theme-spotter` |
| `fix/` | Bug fix | `fix/m01-ingestion/retry-on-transcription-timeout` |
| `chore/` | Maintenance, dependencies, config | `chore/update-nestjs-to-v11` |
| `docs/` | Documentation only | `docs/update-coding-standards-chapter-4` |
| `refactor/` | Code restructure, no behaviour change | `refactor/m03-revenue-graph/extract-entity-resolver` |
| `test/` | Adding or fixing tests only | `test/m06-insight/add-rag-integration-tests` |

```bash
# ✅ CORRECT branch names
git checkout -b feature/m06-insight/add-ask-anything-endpoint
git checkout -b fix/m03-revenue-graph/handle-null-crm-account-id
git checkout -b chore/upgrade-prisma-to-v6

# ❌ WRONG branch names
git checkout -b my-feature
git checkout -b john/working-on-stuff
git checkout -b fix
git checkout -b newbranch123
```

**Branch rules:**
- Branch off from `develop` — never from `main`
- `main` always reflects what is in production
- `develop` is the integration branch — all features merge here first
- `main` ← `develop` merges only happen at release time with Tech Lead approval

---

## 11.2 Commit Message Format — Conventional Commits

Every commit message follows the Conventional Commits specification. This enables
automatic changelog generation and makes `git log` readable.


<type>(<scope>): <short description>

[optional body — explain WHY, not WHAT]

[optional footer — breaking changes, issue refs]


**Allowed types:**

| Type | When to Use |
|---|---|
| `feat` | A new feature |
| `fix` | A bug fix |
| `chore` | Build process, dependency update, config |
| `docs` | Documentation changes only |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `test` | Adding or fixing tests |
| `perf` | Performance improvement |
| `ci` | CI/CD pipeline changes |

```bash
# ✅ CORRECT commit messages
git commit -m "feat(m04): add AI theme spotter endpoint"
git commit -m "fix(m01): handle transcription timeout on retry attempt 3"
git commit -m "chore: bump NestJS to v11.1.0"
git commit -m "docs: update coding standards chapter 4 async rules"
git commit -m "test(m06): add integration tests for RAG pipeline"
git commit -m "refactor(m03): extract entity resolution into dedicated service"

# ✅ CORRECT with body (for complex changes)
git commit -m "feat(m09): add AI revenue forecasting endpoint

Added POST /v1/forecasts/predict which uses the Python revenue-forecast
service to generate weighted pipeline projections.

Requires M-07 deal stage events to be flowing — see SAD Section 2.3."

# ✅ CORRECT breaking change notation
git commit -m "feat(m01)!: change transcription event payload schema

BREAKING CHANGE: renamed transcriptText to transcriptContent in
call.transcription.completed event. Update all consumers before deploying."

# ❌ WRONG commit messages
git commit -m "fix stuff"
git commit -m "WIP"
git commit -m "asdfghjkl"
git commit -m "Updated files"
git commit -m "John's changes"
```

---

## 11.3 PR Size Rule — Max ~400 Lines

A PR that changes 400+ lines is extremely hard to review effectively. Large PRs get
rubber-stamped, which defeats the purpose of code review.

**The rule:** Keep PRs to approximately 400 lines changed (additions + deletions).


// ✅ Acceptable PR size
+180 lines / -40 lines = 220 lines total ← easy to review thoroughly

// ⚠️ Borderline — needs justification
+350 lines / -80 lines = 430 lines total ← discuss with Tech Lead

// ❌ Too large — must be split
+900 lines / -200 lines = 1100 lines total ← no reviewer can do this well


**How to split a large feature into stacked PRs:**


Feature: Add full AI call scoring pipeline (M-04)

Split into:

PR 1 — feat(m04): add call score Prisma schema and migration
(+80 lines — just the schema)

PR 2 — feat(m04): add score-call DTO and Zod validation
(+60 lines — just the input/output types)

PR 3 — feat(m04): add M04Service scoreCall business logic
(+150 lines — the core logic, builds on PR 1 + 2)

PR 4 — feat(m04): add M04Controller score endpoint
(+70 lines — the HTTP layer, builds on PR 3)

PR 5 — test(m04): add unit and integration tests for score pipeline
(+200 lines — all the tests)

Each PR is reviewable on its own. Each builds on the previous.


---

## 11.4 PR Description Template

Every PR must fill in this template. A PR with an empty or incomplete description
will be sent back for completion before review starts.

```markdown
## What does this PR do?
<!-- One or two sentences. What is the feature or fix? -->

## Why is this change needed?
<!-- Link to the relevant ticket, ADR, or SAD section -->

## What modules / services does this touch?
<!-- e.g. M-04 Conversation Intelligence, apps/api, packages/event-contracts -->

## How has this been tested?
<!-- Unit tests? Integration tests? Manual testing steps? -->

## Checklist
- [ ] I have read the relevant chapter of Doc #7 for this change
- [ ] All CI gates are green
- [ ] New DB tables have the required prefix and composite indexes
- [ ] New events are registered in packages/event-contracts/
- [ ] No secrets are hardcoded
- [ ] No console.log statements
- [ ] No cross-module direct imports
- [ ] Test coverage is ≥80% for files I changed

## Screenshots (if UI change)
<!-- Before / after screenshots -->

## Breaking changes?
<!-- Does this change any event contract, API response shape, or DB schema
     in a way that breaks existing consumers? If yes, describe migration plan. -->
```

---

## 11.5 Full CI Gate Checklist — All 7 Must Be Green

A PR cannot merge until all seven CI gates pass. There are no exceptions, no
overrides, and no "I'll fix it in the next PR."

```yaml
# .github/workflows/pr-checks.yml — runs on every push to a PR branch

pr-checks:
  steps:
    # Gate 1 — TypeScript compiles with zero errors
    - name: TypeScript type check
      run: tsc --noEmit

    # Gate 2 — All tests pass and coverage ≥80%
    - name: Unit & Integration tests
      run: jest --coverage --coverageThreshold='{"global":{"lines":80}}'

    # Gate 3 — All Zod schemas are valid
    - name: Zod schema validation
      run: ts-node scripts/validate-schemas.ts

    # Gate 4 — Prisma schema has no errors
    - name: Prisma schema validation
      run: prisma validate

    # Gate 5 — Every DB table has RLS enabled
    - name: RLS enforcement check
      run: ts-node scripts/check-rls-all-tables.ts

    # Gate 6 — No cross-module direct imports
    - name: No cross-module imports
      run: ts-node scripts/check-module-boundaries.ts

    # Gate 7 — Sentry sourcemaps uploaded
    - name: Sentry sourcemaps upload
      run: sentry-cli releases files upload-sourcemaps


Merge rule: If any one of these 7 gates is red, the PR does not merge.

11.6 Who Can Approve a PR
Not every PR needs the same approval level. The bigger the blast radius, the higher
the review bar.

| PR Type                                 | Peer Review Required | Tech Lead Sign-Off Required |
| --------------------------------------- | -------------------- | --------------------------- |
| Small bug fix in one module             | ✅ Yes                | ❌ No                        |
| New feature in one module               | ✅ Yes                | ❌ No                        |
| DB schema change / migration            | ✅ Yes                | ✅ Yes                       |
| New BullMQ event or event schema change | ✅ Yes                | ✅ Yes                       |
| Cross-module boundary change            | ✅ Yes                | ✅ Yes                       |
| Security-related change                 | ✅ Yes                | ✅ Yes                       |
| New technology / dependency with ADR    | ✅ Yes                | ✅ Yes                       |
| Docs-only change                        | ✅ Yes                | ❌ No                        |
| CI/CD pipeline change                   | ✅ Yes                | ✅ Yes                       |


Approval rules:

Minimum one peer reviewer for every PR

Tech Lead approval is mandatory for any architectural, security, or schema change

The PR author cannot self-approve

"Looks good to me" is not enough — the reviewer must verify the checklist items

Reviewer checklist:

Does the code follow Doc #7 standards?

Are there tests for new logic?

Is tenantId enforced correctly?

Are there any hidden cross-module imports?

If a DB change exists, does it include indexes + RLS?

If an event changed, is packages/event-contracts/ updated too?

11.7 No Force-Push to main or develop
Force-push rewrites git history. On shared long-lived branches, that is dangerous.

Rules:

Never force-push to main

Never force-push to develop

Force-push is allowed only on your own feature branch, and only before review if
you are cleaning up your commit history

Once a PR is under active review, avoid force-push unless the reviewer agrees



# ❌ NEVER do this
git push origin main --force
git push origin develop --force

# ✅ Allowed only on your own feature branch
git push origin feature/m04-conv-intelligence/add-theme-spotter --force-with-lease

Why --force-with-lease and not --force?
--force-with-lease is safer. It refuses to overwrite remote commits you do not have
locally. If you really must rewrite your own branch history, use that — never plain
--force.

Protected branch rules in GitHub must be enabled for:

main

develop

Protected branch settings:

Require pull request before merge

Require status checks to pass

Require review approvals

Disallow force pushes

Disallow deletion

11.8 Stale PR Policy
Open PRs that sit untouched become merge conflicts waiting to happen. They also get
stale in the reviewer's mind, making good review harder.

Rule: A PR open for more than 5 days with no activity is considered stale.

What counts as activity?
New commit pushed

Reviewer comment replied to

PR description updated after feedback

Rebase / merge from develop

What happens to stale PRs?

| PR Age                    | Action                          |
| ------------------------- | ------------------------------- |
| 0–5 days                  | Normal review window            |
| 5+ days with no activity  | Bot adds stale label + comment  |
| 7+ days with no activity  | Tech Lead pings author directly |
| 10+ days with no activity | PR is closed automatically      |

# .github/workflows/stale-pr.yml
name: stale-pr-check

on:
  schedule:
    - cron: '0 9 * * *'   # every day at 9am UTC

jobs:
  stale:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/stale@v9
        with:
          stale-pr-message: >
            This PR has had no activity for 5 days and is now marked stale.
            Please update it, rebase it, or comment with status.
          close-pr-message: >
            This PR has been closed after 10 days of inactivity.
            Re-open when ready with an updated branch.
          days-before-pr-stale: 5
          days-before-pr-close: 10

How to avoid a stale PR
Keep PRs small

Push follow-up fixes quickly after review comments

Rebase from develop if the branch falls behind

If you are blocked, leave a comment explaining why — that counts as activity

If your PR is closed as stale
Sync your branch with develop

Resolve conflicts

Re-open the PR if the work is still relevant

If the code is outdated, create a fresh PR instead of reviving an old one

# Chapter 12 — Logging & Observability Standards

If something breaks in production and we cannot quickly answer **what happened, where it
happened, and for which tenant**, then our observability is not good enough.

Logging and observability are not optional "nice to have" features. They are part of
the production contract of every service. Every endpoint, worker, job, and background
process must produce enough signal for an engineer — including a fresher on support
rotation — to debug issues safely.

---

## 12.1 Structured Logging Format

Every log must be structured. That means logs are written as key-value data, not as
random text strings.

**Every log entry must include these fields:**

| Field | Required | Why |
|---|---|---|
| `tenantId` | ✅ Yes | So we know which customer was affected |
| `module` | ✅ Yes | So we know which product module produced the log |
| `traceId` | ✅ Yes | So we can follow one request/job across systems |
| `level` | ✅ Yes | So alerts and dashboards can filter severity |
| `message` | ✅ Yes | Human-readable explanation of what happened |
| `service` | ✅ Yes | `api`, `frontend`, `ai-services`, `transcription-service` |
| `timestamp` | ✅ Yes | Ordering and incident reconstruction |
| `eventId` / `jobId` | Optional but recommended | Useful for BullMQ and event debugging |
| `userId` | Optional | Helpful when tied to a user-triggered action |

### Standard Log Shape

```ts
// ✅ CORRECT — structured log object
this.logger.log({
  level:     'info',
  message:   'Call scoring started',
  tenantId:  tenantId,
  module:    'M-04',
  traceId:   traceId,
  service:   'api',
  callId:    callId,
  timestamp: new Date().toISOString(),
});

// ❌ WRONG — plain text string only
this.logger.log(`Scoring call ${callId} for tenant ${tenantId}`);
```

### Required Fields by Layer

| Layer | Must Include |
|---|---|
| NestJS API | `tenantId`, `module`, `traceId`, `route`, `method`, `userId` |
| BullMQ Worker | `tenantId`, `module`, `traceId`, `jobId`, `eventName` |
| FastAPI AI Services | `tenantId`, `traceId`, `endpoint`, `model`, `latencyMs` |
| Transcription Service | `tenantId`, `traceId`, `callId`, `provider`, `durationMs` |
| Frontend | `traceId`, `route`, `component`, `userId` if available |

### Trace ID Propagation

A `traceId` starts at the frontend or incoming request and travels through all
downstream calls.

```ts
// ✅ CORRECT — create or forward traceId at request boundary
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const req     = context.switchToHttp().getRequest<AuthRequest>();
    const traceId = req.headers['x-trace-id'] ?? crypto.randomUUID();

    req.traceId = traceId;

    return next.handle().pipe(
      tap(() => {
        this.logger.log({
          level:    'info',
          message:  'Request completed',
          tenantId: req.user?.tenantId ?? 'public',
          module:   'API',
          traceId,
          route:    req.url,
          method:   req.method,
        });
      }),
    );
  }
}
```

When NestJS calls Python AI services, it must forward `x-trace-id` in headers:

```ts
await this.aiServicesClient.post('/v1/summarize', payload, {
  headers: { 'x-trace-id': traceId },
});
```

---

## 12.2 Log Levels — When to Use Each

Use log levels consistently. If everything is logged as `error`, nothing is useful.
If important problems are logged as `debug`, they will be missed.

| Level | When to Use | Example |
|---|---|---|
| `debug` | Detailed developer information, usually disabled in production except during investigation | SQL timing, prompt version used, cache hit/miss |
| `info` | Normal successful operations | Request completed, event published, call processed |
| `warn` | Unexpected but recoverable situation | AI confidence low, fallback provider used, retry attempt 2 |
| `error` | Actual failure requiring attention | DB connection failed, webhook signature invalid, job dead-lettered |

### Examples

```ts
// DEBUG — useful for investigation, not user-facing
this.logger.debug({
  level:    'debug',
  message:  'Cache miss for deal summary',
  tenantId,
  module:   'M-06',
  traceId,
  key:      `deal-summary:${dealId}`,
});

// INFO — normal successful action
this.logger.log({
  level:    'info',
  message:  'Tracker detection created',
  tenantId,
  module:   'M-05',
  traceId,
  detectionType: 'competitor-mention',
});

// WARN — unusual but system recovered
this.logger.warn({
  level:    'warn',
  message:  'Primary LLM timed out, fallback model used',
  tenantId,
  module:   'M-06',
  traceId,
  provider: 'anthropic-fallback',
});

// ERROR — operation failed
this.logger.error({
  level:    'error',
  message:  'BullMQ job moved to dead-letter queue',
  tenantId,
  module:   'M-05',
  traceId,
  jobId,
  eventName: 'tracker.detection.created',
});
```

### Simple Rule for Freshers

- If everything worked normally → `info`
- If something odd happened but the user still got a result → `warn`
- If the operation failed → `error`
- If the log is only useful while debugging code → `debug`

---

## 12.3 What Must Always Be Logged

Some events are mandatory logging points. If these are missing, debugging production
issues becomes much harder.

### Always Log These

| Event | What to Log |
|---|---|
| HTTP request in | `traceId`, `tenantId`, `route`, `method`, `userId` |
| HTTP request out | `traceId`, `statusCode`, `latencyMs` |
| AI job start | `traceId`, `tenantId`, `jobId`, `endpoint`, `model` |
| AI job end | `traceId`, `tenantId`, `jobId`, `latencyMs`, `confidenceScore` |
| BullMQ event publish | `traceId`, `tenantId`, `eventName`, `eventId` |
| BullMQ event consume | `traceId`, `tenantId`, `eventName`, `eventId`, `jobId` |
| DB migration start/end | migration name, duration, environment |
| External webhook received | provider, signature valid/invalid, traceId |
| Fallback activation | which fallback, why, which primary failed |

### Request Logging Example

```ts
// request start
this.logger.log({
  level:    'info',
  message:  'Request started',
  tenantId: req.user?.tenantId ?? 'public',
  module:   'API',
  traceId,
  route:    req.url,
  method:   req.method,
  userId:   req.user?.userId,
});

// request end
this.logger.log({
  level:      'info',
  message:    'Request completed',
  tenantId:   req.user?.tenantId ?? 'public',
  module:     'API',
  traceId,
  route:      req.url,
  method:     req.method,
  statusCode: res.statusCode,
  latencyMs:  Date.now() - startedAt,
});
```

### AI Job Logging Example

```python
# ai-services/routers/summarize.py
logger.info({
    "level":     "info",
    "message":   "AI summarize started",
    "tenantId":  request.tenant_id,
    "module":    "M-06",
    "traceId":   trace_id,
    "service":   "ai-services",
    "endpoint":  "/v1/summarize",
    "model":     settings.PRIMARY_MODEL,
})

# ... run model ...

logger.info({
    "level":            "info",
    "message":          "AI summarize completed",
    "tenantId":         request.tenant_id,
    "module":           "M-06",
    "traceId":          trace_id,
    "service":          "ai-services",
    "endpoint":         "/v1/summarize",
    "latencyMs":        latency_ms,
    "confidenceScore":  result.confidence_score,
})
```

---

## 12.4 What Must Never Be Logged

This is a hard rule. Sensitive data must never appear in logs, not even at `debug`
level, not even temporarily.

### Never Log These

| Data Type | Examples |
|---|---|
| Passwords | plaintext passwords, reset tokens |
| Auth tokens | JWT, OAuth access token, refresh token, API keys |
| Full PII | email address, phone number, full name if avoidable |
| Raw audio | S3 URLs to raw call files, file contents |
| Full transcript text | complete conversation text |
| Creditentials | DB passwords, webhook secrets, CRM secrets |
| Sensitive CRM data | unmasked contact data, confidential notes |

```ts
// ❌ WRONG — sensitive data in logs
this.logger.log({
  message: 'User logged in',
  email:   user.email,
  token:   jwtToken,
});

this.logger.error({
  message:    'Transcript processing failed',
  transcript: fullTranscriptText,
});

// ✅ CORRECT — log IDs and metadata only
this.logger.log({
  level:    'info',
  message:  'User logged in',
  tenantId: user.tenantId,
  userId:   user.id,
  traceId,
});

this.logger.error({
  level:       'error',
  message:     'Transcript processing failed',
  tenantId,
  transcriptId,
  callId,
  traceId,
});
```

### Safe Logging Rule

If a value is sensitive, log the **identifier**, not the **content**.

- Log `transcriptId`, not transcript text
- Log `integrationId`, not OAuth token
- Log `userId`, not email address where possible
- Log `callId`, not raw audio URL

---

## 12.5 Sentry Standards

Sentry is the system of record for application exceptions. If an exception happens
and it is not in Sentry, it did not happen from an operations point of view.

### Automatic Capture

All unhandled exceptions in NestJS must be captured by the global exception filter.

```ts
// common/filters/global-exception.filter.ts
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx      = host.switchToHttp();
    const request  = ctx.getRequest<AuthRequest>();

    Sentry.captureException(exception, {
      tags: {
        tenantId: request.user?.tenantId ?? 'public',
        module:   request.module ?? 'unknown',
        traceId:  request.traceId ?? 'missing-trace',
      },
    });

    // ... return formatted API error response
  }
}
```

### Manual Capture — When Needed

You should call `Sentry.captureException(...)` manually only when:
- You catch an exception and intentionally do not rethrow it
- A background worker fails outside the normal HTTP request path
- A BullMQ dead-letter event occurs
- A non-fatal issue should still be visible to operations

```ts
// ✅ CORRECT — manual capture in a BullMQ worker
try {
  await this.processJob(job);
} catch (error) {
  Sentry.captureException(error, {
    tags: {
      tenantId: job.data.tenantId,
      module:   'M-05',
      traceId:  job.data.traceId,
      jobId:    job.id,
    },
    extra: {
      eventName: 'tracker.detection.created',
      attempts:  job.attemptsMade,
    },
  });

  throw error;   // rethrow so BullMQ retry logic still works
}
```

### Sentry Rules

- Every exception must include `tenantId`, `module`, and `traceId` tags
- Do not attach raw request bodies if they may contain sensitive data
- Scrub secrets and tokens before sending
- Use releases so sourcemaps work correctly for frontend stack traces

---

## 12.6 Grafana Dashboards

Grafana is used for metrics and dashboards. Logs answer **what happened**. Metrics
answer **how often**, **how long**, and **how bad**.

### Minimum Dashboards Required

| Dashboard | Metrics |
|---|---|
| BullMQ / Queue Health | queue depth, processing rate, retries, dead-letter count |
| Database Health | connection pool usage, query latency, slow query count |
| AI Services | latency P50/P95/P99, timeout count, fallback rate, confidence distribution |
| API Health | request rate, status code breakdown, p95 response time |
| Infrastructure | CPU, memory, container restarts, network errors |

### Core Metrics to Track

```ts
// API metrics
- api_requests_total
- api_request_duration_ms_p95
- api_request_duration_ms_p99
- api_error_rate

// BullMQ metrics
- bullmq_queue_depth
- bullmq_job_retries_total
- bullmq_dead_letter_total

// Database metrics
- db_pool_in_use
- db_query_duration_ms_p95
- db_query_duration_ms_p99

// AI metrics
- ai_request_duration_ms_p95
- ai_request_duration_ms_p99
- ai_timeout_total
- ai_fallback_total
- ai_confidence_score_avg
```

### Alert Threshold Examples

| Metric | Alert When |
|---|---|
| Queue depth | > 1,000 jobs for 5 minutes |
| API p95 latency | > 2 seconds for 10 minutes |
| AI timeout count | > 10 in 15 minutes |
| DB pool usage | > 85% sustained for 5 minutes |
| Error rate | > 5% of requests for 10 minutes |

---

## 12.7 Better Stack Standards

Better Stack is used for:
- log aggregation
- uptime checks
- incident alerts
- on-call routing

### What Better Stack Must Contain

| Category | Requirement |
|---|---|
| Logs | All production logs from API, AI services, transcription service, frontend server |
| Uptime checks | API health endpoint, frontend URL, AI service health, transcription health |
| Alerts | Pager / Slack alert for service down, high error rate, high latency |
| On-call | Rotating weekly owner for engineering support |

### Uptime Checks

Every service must expose a health endpoint that Better Stack can monitor.

```ts
// API
GET /health

// AI Services
GET /health

// Transcription Service
GET /health

// Frontend
GET /
```

### On-Call Rotation Rule

- One engineer is primary on-call each week
- One engineer is backup
- Tech Lead is escalation point
- Critical production alerts must page primary + backup

For freshers: you are not expected to own production alone early on, but you should
still understand the dashboards and logs so you can assist safely.

---

## 12.8 AI Timeout Handling

AI services are the slowest and least predictable part of the stack. Timeouts must be
handled in a standard way every time.

### The Rule

When an AI call times out:
1. Log a `TIMEOUT` event with full context
2. Capture the exception in Sentry
3. Return HTTP `504 Gateway Timeout` for user-facing requests
4. For BullMQ background jobs, throw the error so BullMQ retries it
5. If configured, fall back to cached result or fallback model

### User-Facing Timeout Example

```ts
try {
  const result = await this.aiServicesClient.post('/v1/summarize', payload, {
    timeout: 30_000,   // 30 seconds max
    headers: { 'x-trace-id': traceId },
  });

  return result.data;

} catch (error) {
  if (isTimeoutError(error)) {
    this.logger.warn({
      level:    'warn',
      message:  'TIMEOUT',
      tenantId,
      module:   'M-06',
      traceId,
      endpoint: '/v1/summarize',
      timeoutMs: 30_000,
    });

    Sentry.captureException(error, {
      tags: { tenantId, module: 'M-06', traceId, type: 'timeout' },
    });

    throw new GatewayTimeoutException('AI service timed out');
  }

  throw error;
}
```

### Background Job Timeout Example

```ts
try {
  await this.aiServicesClient.post('/v1/detect-themes', payload, {
    timeout: 300_000,   // 5 minutes for background job
    headers: { 'x-trace-id': traceId },
  });

} catch (error) {
  if (isTimeoutError(error)) {
    this.logger.warn({
      level:     'warn',
      message:   'TIMEOUT',
      tenantId,
      module:    'M-04',
      traceId,
      jobId:     job.id,
      endpoint:  '/v1/detect-themes',
      timeoutMs: 300_000,
    });

    Sentry.captureException(error, {
      tags: { tenantId, module: 'M-04', traceId, jobId: job.id, type: 'timeout' },
    });
  }

  throw error;   // important — BullMQ must retry
}
```

### Timeout Budget Reference

| Call Type | Timeout |
|---|---|
| User-facing AI request | 30 seconds |
| Background AI job | 5 minutes |
| Webhook validation | 5 seconds |
| External CRM API call | 15 seconds |

---
---

# Chapter 13 — Docker & Deployment Standards

Containers are how we package and run every service in R-Revenue Intelligence.
A bad Dockerfile creates security issues, slow builds, flaky deployments, and hard
to debug runtime failures. This chapter defines the standard every service must follow.

---

## 13.1 Base Image Pinning

Never use `latest` in a Dockerfile. Always pin either:
- an exact version tag, or
- a version + distro tag, or
- a full image digest for maximum reproducibility

```dockerfile
# ❌ WRONG — changes without warning
FROM node:latest
FROM python:latest

# ✅ CORRECT — exact version pinned
FROM node:20.11.1-alpine3.19
FROM python:3.12.2-slim-bookworm

# ✅ EVEN BETTER — pinned by digest
FROM node:20.11.1-alpine3.19@sha256:abc123...
```

### Why This Rule Exists

If you use `latest`, today's working build can break tomorrow without a single code
change from your side. Pinned images make builds predictable and reviewable.

### Approved Base Images

| Service | Base Image |
|---|---|
| NestJS API | `node:20.11.1-alpine3.19` |
| Next.js Frontend | `node:20.11.1-alpine3.19` |
| AI Services | `python:3.12.2-slim-bookworm` |
| Transcription Service | `python:3.12.2-slim-bookworm` |

---

## 13.2 Non-Root User Required

Every container must run as a non-root user. Running as root inside a container is a
security risk. If the container is compromised, the attacker gets root inside it.

```dockerfile
# ✅ CORRECT — create and use a non-root user
FROM node:20.11.1-alpine3.19

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app
COPY . .

RUN npm ci && npm run build

USER appuser

CMD ["node", "dist/main.js"]
```

```dockerfile
# ❌ WRONG — no USER instruction, container runs as root
FROM node:20.11.1-alpine3.19
WORKDIR /app
COPY . .
RUN npm ci
CMD ["node", "dist/main.js"]
```

### Rule

- Every Dockerfile must end with a `USER <non-root-user>` instruction
- File permissions must allow that user to read the app files
- Do not use `chmod 777` as a shortcut

---

## 13.3 Multi-Stage Build Required

Every production Dockerfile must use multi-stage builds:
1. **Builder stage** — install dev deps, compile/build assets
2. **Runtime stage** — copy only the final build output and production deps

This keeps runtime images smaller, safer, and faster to deploy.

### NestJS Example

```dockerfile
# ── Stage 1: Builder ────────────────────────────────────────────────
FROM node:20.11.1-alpine3.19 AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ── Stage 2: Runtime ────────────────────────────────────────────────
FROM node:20.11.1-alpine3.19 AS runtime

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
WORKDIR /app

COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

USER appuser
CMD ["node", "dist/main.js"]
```

### Python Example

```dockerfile
# ── Stage 1: Builder ────────────────────────────────────────────────
FROM python:3.12.2-slim-bookworm AS builder

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

COPY . .

# ── Stage 2: Runtime ────────────────────────────────────────────────
FROM python:3.12.2-slim-bookworm AS runtime

RUN useradd -m appuser
WORKDIR /app

COPY --from=builder /install /usr/local
COPY --from=builder /app /app

USER appuser
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Why Multi-Stage Matters

| Benefit | Why It Matters |
|---|---|
| Smaller image | Faster pull time, lower storage, faster deploy |
| Fewer vulnerabilities | Build tools do not ship to production |
| Cleaner runtime | Only what the app actually needs |
| Better caching | Faster rebuilds in CI/CD |

---

## 13.4 `.dockerignore` Requirements

Every service must have a `.dockerignore` file. If not, Docker will send unnecessary
files into the build context, making builds slower and leaking unwanted content.

### Minimum `.dockerignore`

```dockerignore
# Node / Python dependencies
node_modules
__pycache__
.pytest_cache
.venv

# Build output
dist
build
coverage

# Git
.git
.gitignore

# Local env / secrets
.env
.env.*
!.env.example

# Docs / editor files
*.md
.vscode
.idea

# OS junk
.DS_Store

# Test files if not needed in runtime image
tests
e2e
```

### Rules

- `.env` and all secret files must always be excluded
- `node_modules` must always be excluded from build context
- `.git` must always be excluded
- Large local files (audio samples, downloads, temp files) must be excluded
- If the runtime image does not need tests, exclude them from the context or only copy needed files in the final stage

---

## 13.5 Environment Variable Injection — Doppler Only

Environment variables are injected at runtime by Doppler. They are never:
- hardcoded in the Dockerfile
- baked into the image with `ENV SECRET=...`
- copied from a local `.env` file into the image

```dockerfile
# ❌ WRONG — secret baked into image forever
ENV OPENAI_API_KEY=sk-abc123

# ❌ WRONG — copying .env into the image
COPY .env .env

# ✅ CORRECT — image expects env vars at runtime
ENV NODE_ENV=production   # non-secret config is okay if intentional
```

### Good Rule for Freshers

- Non-secret config like `PORT=3000` can be defined in compose or platform config
- Secrets like `DATABASE_URL`, `JWT_SECRET`, `OPENAI_API_KEY` come only from Doppler
- If you are unsure whether something is a secret, treat it as a secret

### Docker Compose Example

```yaml
services:
  api:
    build:
      context: .
      dockerfile: docker/api.Dockerfile
    env_file: []   # ← do not use local .env files for shared environments
    environment:
      NODE_ENV: production
    # Doppler injects secrets at runtime outside the image
```

---

## 13.6 Container Health Check

Every container must define a `HEALTHCHECK`. This is how Railway, Docker, and later
AWS ECS know whether the service is healthy or should be restarted.

### NestJS Health Check

```dockerfile
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1
```

### FastAPI Health Check

```dockerfile
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')"
```

### Health Endpoint Rules

Every service must expose a lightweight health endpoint:

```ts
// NestJS
@Get('/health')
health() {
  return {
    status:    'ok',
    service:   'api',
    timestamp: new Date().toISOString(),
  };
}
```

```python
# FastAPI
@app.get("/health")
async def health():
    return {"status": "ok", "service": "ai-services"}
```

### Health Check Principles

- Health endpoint must be fast — no heavy DB queries
- It may check basic connectivity if needed, but do not make it slow
- It must return 200 when healthy
- It must return non-200 when the service is unhealthy

---

## 13.7 Local Development Standard

Local development must be simple enough that a fresher can clone the repo and get
the full stack running reliably.

**Rule:** `docker compose up` must bring up the full stack in **under 3 minutes** on a
normal development laptop.

### Required Services in Local Dev

```yaml
services:
  frontend
  api
  ai-services
  transcription-service
  postgres
  redis
  meilisearch
  clickhouse
```

### Local Dev Rules

| Rule | Detail |
|---|---|
| One command startup | `docker compose up` should be enough |
| No manual secret editing | Doppler development env should provide values |
| Hot reload where possible | API/frontend dev containers should support it |
| Clear logs | Service names should be obvious in compose output |
| Deterministic startup | No "run this twice and hope it works" |

### Example Compose Quality Checklist

- `docker compose up --build` works on first run
- No service crashes on first boot
- Health checks go green within 3 minutes
- Frontend reachable on localhost
- API reachable on localhost
- AI services reachable internally
- Test user / seed data available for local development

### Freshers' Rule

If local setup requires undocumented manual fixes, the setup is broken — update the
docs or the compose config before asking the next fresher to repeat the pain.

---

## 13.8 Deployment Safety Rules

These rules apply to Railway now and AWS ECS later.

### Deployment Requirements

| Rule | Why |
|---|---|
| Build image once, deploy same image everywhere | Prevents "works in staging, fails in prod" drift |
| No manual SSH fixes in production | All changes must come from code and CI/CD |
| All deploys tied to a git commit SHA | Traceability and rollback |
| Rollback must be possible | If release fails, revert fast |
| Secrets injected at runtime | Prevents secret leakage through images |

### Image Tagging Convention

```bash
# ✅ CORRECT
api:git-sha-3f4a9bd
frontend:git-sha-3f4a9bd
ai-services:git-sha-3f4a9bd

# ❌ WRONG
api:latest
frontend:new
ai-services:test
```

### Deployment Readiness Checklist

Before a service image can be deployed:
- Dockerfile uses pinned base image
- Dockerfile runs as non-root
- Multi-stage build is used
- `.dockerignore` exists and excludes secrets
- `HEALTHCHECK` exists
- Secrets come from Doppler, not image
- Image tagged with commit SHA
- CI gates are all green

---

# Chapter 14 — ADR (Architecture Decision Record) Standards

Architecture decisions are expensive to reverse. A new framework, a new database, a
new queue pattern, or a new deployment tool affects every future engineer who touches
the codebase. That is why major technical choices must be written down formally.

An **ADR (Architecture Decision Record)** is the short document that explains:
- what decision was made
- why it was made
- what alternatives were considered
- what trade-offs were accepted

If the codebase changes but the reasoning is lost, the next engineer repeats the same
debate from zero. ADRs prevent that.

---

## 14.1 When an ADR Is Required

Create an ADR **before** writing code whenever the change affects architecture,
technology choice, or a shared platform rule.

### An ADR is required for:

| Situation | ADR Required? | Example |
|---|---|---|
| New technology added to the stack | ✅ Yes | Adding Kafka, Weaviate, LangSmith, new auth provider |
| New database / data store | ✅ Yes | Adding Qdrant, Elasticsearch, DynamoDB |
| Change to service boundary | ✅ Yes | Splitting M-03 into an independent service |
| Change to deployment model | ✅ Yes | Moving Railway to AWS ECS |
| Change to language rule | ✅ Yes | Allowing Go for one service |
| Change to event communication pattern | ✅ Yes | Moving some flows from BullMQ to direct gRPC |
| New security standard | ✅ Yes | Mandatory field-level encryption for more tables |
| New observability platform | ✅ Yes | Replacing Sentry or Better Stack |
| New library with architecture impact | ✅ Yes | Introducing LangGraph, LiteLLM, or Prisma |
| Small helper library with no architecture impact | ❌ Usually no | `date-fns`, `clsx`, `uuid` |
| Bug fix using existing stack | ❌ No | Fixing a NestJS service bug |
| New endpoint using existing patterns | ❌ No | Adding `/v1/calls/:id/score` |

### Easy Rule for Freshers

If your change affects **how the platform is built**, not just **what the feature does**,
raise an ADR.

If you are unsure, ask this question:

> "Will another engineer need to know why we chose this pattern/tool later?"

If the answer is yes, write an ADR.

---

## 14.2 ADR Format

Every ADR follows the same format. Keep it short, clear, and decision-focused.

### Standard ADR Template

```md
# ADR-0XX — Decision Title

**Status:** Draft | Approved | Superseded
**Date:** YYYY-MM-DD
**Owner:** Name / Role
**Review Date:** YYYY-MM-DD

## Context
What problem are we solving?
What constraints matter here?
Why is this decision needed now?

## Options Considered
### Option 1 — <name>
Pros:
- ...
Cons:
- ...

### Option 2 — <name>
Pros:
- ...
Cons:
- ...

### Option 3 — <name>
Pros:
- ...
Cons:
- ...

## Decision
What did we choose?

## Consequences
What becomes easier because of this decision?
What becomes harder?
What must engineers now follow because of this decision?
```

### What Each Section Means

| Section | What to Write |
|---|---|
| `Status` | Current stage of the ADR — Draft, Approved, or Superseded |
| `Date` | When the ADR was created |
| `Owner` | Usually Tech Lead or proposing engineer |
| `Review Date` | When the ADR should be revisited |
| `Context` | The business + technical problem and constraints |
| `Options Considered` | Real alternatives, not fake ones |
| `Decision` | The chosen option and why |
| `Consequences` | Trade-offs, implementation impact, rules created by this decision |

### Example ADR

```md
# ADR-011 — Use Meilisearch for Full-Text Search

**Status:** Approved
**Date:** 2026-04-21
**Owner:** Tech Lead
**Review Date:** 2026-10-21

## Context
The platform needs fast full-text search across transcripts, emails, and deal metadata.
PostgreSQL full-text search is acceptable at small scale but may not meet sub-50ms
search latency targets for large tenants.

## Options Considered

### Option 1 — PostgreSQL Full-Text Search
Pros:
- No additional infrastructure
- Simpler operations
Cons:
- Search relevance tuning is weaker
- Not ideal for typo tolerance
- May struggle at scale

### Option 2 — Meilisearch
Pros:
- Fast typo-tolerant full-text search
- Good developer experience
- Simpler than Elasticsearch
Cons:
- Extra infrastructure to maintain
- Index is eventually consistent

### Option 3 — Elasticsearch
Pros:
- Powerful search features
- Very flexible
Cons:
- Operationally heavy
- Too complex for current team size

## Decision
Use Meilisearch for full-text search in Phase 1–2.

## Consequences
- Search indexes are not source of truth
- Re-index logic must exist
- New searchable entities must publish search index events
```

---

## 14.3 ADR Lifecycle

Every ADR moves through one of three official states:


Draft → Approved → Superseded


### Status Definitions

| Status | Meaning | Can code merge based on it? |
|---|---|---|
| `Draft` | Proposal is being discussed | ❌ No |
| `Approved` | Decision accepted by Tech Lead | ✅ Yes |
| `Superseded` | Replaced by a newer ADR | ❌ No for new work |

### Lifecycle Flow

```text
1. Engineer identifies architectural decision needed
2. Engineer creates ADR with Status: Draft
3. Team discusses options
4. Tech Lead approves or rejects
5. If approved → Status becomes Approved
6. If a future decision replaces it → old ADR becomes Superseded
```

### Example

```md
ADR-005 — Use BullMQ on Redis as Event Bus
Status: Approved

Later...

ADR-024 — Move from BullMQ to managed Kafka for cross-service eventing
Status: Approved

Then ADR-005 becomes:
Status: Superseded
Superseded By: ADR-024
```

### Rule

A `Draft` ADR is not permission to start coding. It is only permission to discuss.

---

## 14.4 ADR Enforcement Rule

No new technology, architecture pattern, or platform-wide rule may merge to `main`
without an ADR in `Approved` status.

This is non-negotiable.

### What CI / Review Must Check

Before merging code that introduces a new technology, reviewers must confirm:
- an ADR exists
- the ADR is in `docs/adr/`
- the ADR status is `Approved`
- the PR description references the ADR number

### PR Example

```md
## Why is this change needed?
Adds Meilisearch for transcript search.

Related ADR:
- ADR-011 — Use Meilisearch for Full-Text Search (Approved)
```

### What happens if this rule is violated?

| Violation | Consequence |
|---|---|
| New tech added with no ADR | PR blocked |
| ADR exists but status is `Draft` | PR blocked |
| ADR exists but not referenced in PR | Reviewer requests change |
| Tech introduced directly on `main` | Revert PR, raise incident with Tech Lead |

### Simple Rule

If you cannot point to an **Approved ADR**, you cannot merge the architectural change.

---

## 14.5 ADR Registry Location

All ADRs live in this folder:

```text
docs/adr/
```

### Folder Rules

- One ADR per file
- File names use zero-padded numbering and kebab-case title
- ADR numbers are never reused
- Superseded ADRs stay in the folder for history

### Naming Convention

```text
docs/adr/
├── ADR-001-modular-monolith-phase-1-2.md
├── ADR-002-typescript-for-product-services.md
├── ADR-003-python-for-ai-services.md
├── ADR-004-postgresql-as-primary-db.md
├── ADR-005-bullmq-on-redis-event-bus.md
└── ADR-011-use-meilisearch-for-search.md
```

### Registry Rules

| Rule | Detail |
|---|---|
| Numbering | Increment sequentially — no gaps if possible |
| File name | `ADR-0XX-short-title.md` |
| Status in file | Must be visible near the top |
| Cross-links | ADRs can link to older or related ADRs |
| Never delete | Even rejected/superseded decisions are part of history |

### Why We Keep Old ADRs

A superseded ADR still explains:
- what we used to believe
- why we believed it
- what changed later

That history saves future engineers from repeating old experiments.

---

## 14.6 How Freshers Raise a Tech Proposal

Freshers and interns are absolutely allowed to suggest better tools or patterns.
What they are **not** allowed to do is merge those changes directly without process.

Here is the correct flow.

### Freshers' Proposal Process

```text
1. Notice a technical problem
2. Check if an ADR already exists
3. If no ADR exists, create a Draft ADR
4. Discuss with mentor / module owner
5. Submit ADR for Tech Lead review
6. Wait for decision
7. Only after approval, start implementation
```

### Step-by-Step

#### Step 1 — Confirm the problem is real
Do not write an ADR just because a tool looks interesting on YouTube.

Good reasons:
- current tool does not meet performance needs
- developer workflow is too painful
- security or reliability risk exists
- scale limit is approaching

Bad reasons:
- "This new framework is trending"
- "I personally like this library more"

#### Step 2 — Search existing ADRs first

Before drafting a new ADR, check:
```text
docs/adr/
```

Questions to ask:
- Has this decision already been made?
- Was it previously rejected?
- Is there already an approved standard?

#### Step 3 — Create a Draft ADR

Use the standard template. Keep it simple and factual.

```md
# ADR-0XX — Use Qdrant for Large Tenant Vector Search

**Status:** Draft
**Date:** 2026-04-21
**Owner:** Your Name
**Review Date:** 2026-07-21
```

#### Step 4 — Ask for review the right way

Start with:
- your mentor or module owner
- then Tech Lead for final review

Good message example:

> I found that pgvector may hit a scaling ceiling for large tenants. I created a
> Draft ADR comparing pgvector vs Qdrant vs Weaviate. Can you review whether the
> problem statement is valid before I go deeper?

#### Step 5 — Accept the outcome professionally

Possible outcomes:
- **Approved** → proceed
- **Rejected** → keep current standard
- **Needs more data** → collect benchmarks and revise ADR

A rejected ADR is not failure. It is documented learning.

### Good Habits for Freshers

- Bring evidence, not opinions
- Compare at least 2–3 real options
- Explain trade-offs, not just benefits
- Keep the ADR short and readable
- Do not start coding before approval

---
---

# Chapter 15 — Onboarding Checklist (Freshers & Interns)

This chapter is written especially for freshers and interns.

The goal is simple: before you write production code, you should understand the
platform well enough to avoid the most common mistakes. You do **not** need to know
everything on day one. But you must complete this checklist before your first PR.

---

## 15.1 Pre-Code Checklist — 6 Steps Before Writing Production Code

Complete these six steps in order.

### Step 1 — Read the core docs

You must read:
- **Doc #1 — System Architecture Document (SAD)**
- **Doc #7 — Coding Standards & Style Guide**
- the ADRs most relevant to your module

Minimum required ADRs to read:
- ADR-001 — Modular Monolith
- ADR-002 — TypeScript for Product Services
- ADR-003 — Python for AI Services
- ADR-004 — PostgreSQL as Primary DB
- ADR-005 — BullMQ on Redis as Event Bus

### Step 2 — Understand your assigned module

Before coding, answer these questions:
- Which module am I working in? (M-01 to M-10)
- What stage of the lifecycle does it belong to?
- Which upstream modules does it depend on?
- Which events does it publish and consume?
- Which tables does it own?

If you cannot answer these, stop and ask.

### Step 3 — Set up the local environment

Clone the repo, install required tools, start the stack, and verify services are healthy.

### Step 4 — Read at least one merged PR in your module

Pick one recently merged PR in your module and study:
- folder structure
- naming
- tests
- review comments

This is the fastest way to learn the team’s real coding style.

### Step 5 — Make one tiny non-risky change first

Before touching business logic, do something small:
- fix a typo
- improve docs
- add a test
- add a missing health check
- clean up a DTO

This helps you learn the PR flow with low risk.

### Step 6 — Get mentor / Tech Lead confirmation

Before starting your first real feature, ask:

> I have completed the onboarding checklist. Can you confirm I should start with
> `<task name>` in module `<module name>`?

That short check avoids days of going in the wrong direction.

---

## 15.2 Local Environment Setup — Step by Step

Follow this exactly.

### Prerequisites

Install these tools first:

| Tool | Version |
|---|---|
| Git | latest stable |
| Docker Desktop | latest stable |
| Node.js | 20.x |
| npm | version bundled with Node 20 |
| Python | 3.12 |
| Doppler CLI | latest stable |

### Setup Steps

#### 1. Clone the repository

```bash
git clone <repo-url>
cd r-revenue-intelligence
```

#### 2. Authenticate with Doppler

```bash
doppler login
doppler setup
```

Select the `development` environment when prompted.

#### 3. Install root dependencies

```bash
npm install
```

#### 4. Start the full local stack

```bash
docker compose up --build
```

Expected services:
- frontend
- api
- ai-services
- transcription-service
- postgres
- redis
- meilisearch
- clickhouse

#### 5. Verify health endpoints

Open or curl these:

```bash
curl http://localhost:3000/health     # frontend if applicable
curl http://localhost:4000/health     # api
curl http://localhost:8000/health     # ai-services
curl http://localhost:8001/health     # transcription-service
```

All should return healthy responses.

#### 6. Run tests once locally

```bash
npm run test
npm run test:cov
```

If your module uses Python tests too:

```bash
cd apps/ai-services
pytest
```

#### 7. Open the app in the browser

```text
http://localhost:3000
```

Log in with the provided local dev/test credentials.

### Local Setup Success Checklist

| Check | Expected |
|---|---|
| Docker compose starts cleanly | ✅ |
| No crash loops in containers | ✅ |
| API health endpoint works | ✅ |
| Frontend loads in browser | ✅ |
| Tests run locally | ✅ |
| You can inspect logs for each service | ✅ |

If any one of these fails, ask for help before coding.

---

## 15.3 First PR Expectations — What the Tech Lead Looks For

Your first PR is not expected to be perfect. But it **is** expected to show that you
can follow process, read standards, and ask good questions.

### What the Tech Lead checks first

| Area | What they look for |
|---|---|
| Scope | Is the PR small and focused? |
| File placement | Did you put files in the correct folders? |
| Naming | Does it follow the naming conventions? |
| Standards | Did you follow Doc #7 rules? |
| Testing | Did you add appropriate tests? |
| Safety | Did you avoid secrets, raw SQL, cross-module imports? |
| Clarity | Is the PR description complete? |

### What makes a strong first PR

- small and easy to review
- clear commit messages
- good PR description
- follows file structure correctly
- includes tests
- no unnecessary refactors
- asks questions early instead of making dangerous guesses

### What usually causes first PRs to be sent back

- missing tests
- wrong folder placement
- vague PR description
- missing `tenantId` filter
- direct module import
- `console.log` left in code
- trying to solve too much in one PR

---

## 15.4 Common Mistakes Freshers Make (and How to Fix Them)

These are normal mistakes. The goal is to catch them early.

| Common Mistake | Why It Happens | Fix |
|---|---|---|
| Creating files in the wrong folder | Not familiar with monorepo structure | Check Chapter 3 decision tree before creating files |
| Using `any` in TypeScript | Trying to move fast | Use `unknown` + type guards or proper DTO types |
| Forgetting `tenantId` filter | Not yet thinking multi-tenant | Always take `tenantId` from `req.user` |
| Directly importing another module’s service | Feels simpler at first | Use BullMQ event or approved public API |
| Adding `console.log` for debugging | Habit from tutorials | Use structured logger with context |
| Hardcoding prompt strings in Python | Faster in the moment | Put prompts in versioned Jinja2 files |
| Writing raw SQL | Copying internet examples | Use Prisma only |
| Making PR too large | Trying to finish everything at once | Split into smaller stacked PRs |
| Skipping docs and guessing | Fear of asking questions | Ask early — questions are cheaper than rework |

### Simple Advice

If you ever think:
> "This is probably okay"

stop and check the standard first.

---

## 15.5 Who to Ask for What — Escalation Map

You are not expected to solve every problem alone. The skill is knowing **who to ask**
and **when**.

| Situation | Ask First | Escalate To |
|---|---|---|
| Folder structure / file placement confusion | Mentor / module owner | Tech Lead |
| Business logic question in your module | Module owner | Tech Lead |
| Architectural decision / new pattern | Tech Lead | CTO if needed |
| CI failing and you do not understand why | Mentor / reviewer | Tech Lead |
| Local setup issues | Mentor / devops-support person | Tech Lead |
| Security concern / possible secret leak | Tech Lead immediately | CTO / security owner |
| Production incident | On-call engineer | Tech Lead |
| PR review disagreement | Reviewer | Tech Lead |

### Practical Rule

- Ask your **mentor or module owner** for local coding questions
- Ask the **Tech Lead** for architecture, security, or design questions
- Escalate **immediately** for anything involving secrets, production, or customer data

### Good Question Example

> I need account context in M-04 to finish this feature. I could either add a new
> event or call M-03’s public API. Which is the correct pattern here?

That is a strong engineering question because it shows:
- you understand the boundary
- you identified options
- you are asking before breaking the rules

---

## 15.6 Resources

These are the main resources every fresher and intern should know.

| Resource | Purpose | Location |
|---|---|---|
| System Architecture Document (Doc #1) | Overall platform architecture | `docs/` |
| Coding Standards (Doc #7) | Day-to-day coding rules | `docs/coding-standards.md` |
| ADR Registry | Why key technical decisions were made | `docs/adr/` |
| API Reference / Postman Collection | Endpoint testing and request examples | team shared workspace / `docs/api/` |
| Figma | UI designs and flows | team design workspace |
| Final Consolidated Features.xlsx | Feature mapping and understanding | Space files |
| System Architecture Diagram PDF | High-level architecture visual | Space files |

### Minimum Reading List for Freshers

Start with this order:
1. Chapter 1–3 of the SAD
2. Chapter 2 and 3 of this document
3. ADR-001 to ADR-005
4. One recent merged PR in your module
5. Relevant API docs / Postman examples

### Personal Working Folder Tip

Keep a small personal note with:
- module names and responsibilities
- event names you use often
- common commands
- important reviewers / mentors

This is not official documentation, but it helps you learn faster.

---

## 15.7 Final Onboarding Ready Check

Before your first production PR, you should be able to say **yes** to all of these:

- [ ] I know which module I am working in
- [ ] I know which tables my module owns
- [ ] I know which events my module publishes or consumes
- [ ] I can run the project locally
- [ ] I know where to put new files
- [ ] I know how to open a small PR
- [ ] I know who to ask if I am blocked
- [ ] I have read the required docs and ADRs

If any box is still "no", pause and finish the missing step first.

---

# Appendices

These appendices are practical copy-paste references. Freshers and interns should use
them as starter templates instead of creating files from scratch every time.

---
---

# Appendix A — Linting & Formatting Config Summary

This appendix shows the standard tooling used to keep code style consistent across the
entire repository.

## A.1 TypeScript / JavaScript Tooling

| Tool | Purpose | Standard Config File |
|---|---|---|
| ESLint | Finds code quality and style issues | `.eslintrc.js` |
| Prettier | Auto-formats code consistently | `.prettierrc` |
| TypeScript Compiler | Enforces static type safety | `tsconfig.json` |

### Standard ESLint Config

```js
// .eslintrc.js
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'import'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier',
  ],
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'import/order': [
      'error',
      {
        alphabetize: { order: 'asc', caseInsensitive: true },
        'newlines-between': 'always',
      },
    ],
    'no-console': 'error',
  },
};
```

### Standard Prettier Config

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2
}
```

### Standard TypeScript Compiler Rules

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitReturns": true,
    "noUncheckedIndexedAccess": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

---

## A.2 Python Tooling

| Tool | Purpose | Standard Config File |
|---|---|---|
| Ruff | Linting | `pyproject.toml` |
| Black | Formatting | `pyproject.toml` |
| mypy (optional future) | Static typing | `pyproject.toml` |

### Standard `pyproject.toml`

```toml
[tool.ruff]
target-version = "py312"
line-length = 100
select = ["E", "F", "I", "N", "UP", "ANN"]

[tool.black]
line-length = 100
target-version = ["py312"]
```

### Common Commands

```bash
# TypeScript
npm run lint
npm run format

# Python
ruff check .
black .

# Prisma
npx prisma validate
```

---
---

# Appendix B — Quick Reference: What Lives Where

This is the "do not guess" table. If you are unsure where something belongs, start here.

| Thing | Lives In | Never In |
|---|---|---|
| Business logic | NestJS module service | Frontend components, Python AI service |
| AI inference | FastAPI AI services | NestJS, Next.js |
| Transcription logic | Transcription service | NestJS API |
| Server/API state | TanStack Query | Zustand |
| UI state | Zustand | TanStack Query |
| Form state | React Hook Form | Zustand |
| URL filters / pagination | `useSearchParams` | local component state only |
| Secrets | Doppler | code, `.env` files, Docker images |
| Search indexes | Meilisearch | PostgreSQL source tables |
| Analytics metrics | ClickHouse | Redis |
| Queue state / rate limits | Redis | PostgreSQL source tables |
| Source of truth records | PostgreSQL | Meilisearch, Redis |
| Event payload types | `packages/event-contracts/` | local module-only copies |
| Shared TS types | `packages/types/` | copied into multiple apps |
| Prompt templates | `apps/ai-services/prompts/` | inline Python strings |
| DB schema | `apps/api/prisma/schema.prisma` | random SQL files |
| Tests for a module | `__tests__/` inside that module | one giant global test folder |

### Quick Examples

```text
Need to add a new BullMQ event type?
→ packages/event-contracts/

Need to add a new prompt?
→ apps/ai-services/prompts/<task>/v1.jinja2

Need to add a new table?
→ apps/api/prisma/schema.prisma

Need to add a new reusable UI component?
→ apps/frontend/components/features/<feature-name>/
```

---
---

# Appendix C — Standard Zod DTO Template

Use this template for all NestJS request DTOs.

## C.1 Request DTO Template

```ts
// dto/create-call.dto.ts
import { z } from 'zod';

export const CreateCallSchema = z.object({
  audioUrl: z.string().url(),
  dealId:   z.string().uuid().optional(),
  source:   z.enum(['zoom', 'teams', 'meet', 'upload']),
  durationSeconds: z.number().int().positive(),
});

export type CreateCallDto = z.infer<typeof CreateCallSchema>;
```

## C.2 Query DTO Template

```ts
// dto/list-calls.query.ts
import { z } from 'zod';

export const ListCallsQuerySchema = z.object({
  page:      z.coerce.number().int().min(1).default(1),
  pageSize:  z.coerce.number().int().min(1).max(100).default(25),
  sortBy:    z.enum(['createdAt', 'durationSeconds']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  status:    z.enum(['processing', 'completed', 'failed']).optional(),
});

export type ListCallsQueryDto = z.infer<typeof ListCallsQuerySchema>;
```

## C.3 Controller Usage Template

```ts
@Post()
@UseGuards(JwtGuard)
async createCall(@Body() body: unknown, @Req() req: AuthRequest) {
  const dto = CreateCallSchema.parse(body);

  return this.m01Service.createCall({
    ...dto,
    tenantId: req.user.tenantId,   // tenantId always from JWT
  });
}
```

## C.4 Rules

- Always validate at controller boundary
- Never trust raw `req.body`
- Never accept `tenantId` from request body
- Use `z.coerce.number()` for numeric query params
- Export both schema and inferred type

---
---

# Appendix D — Standard BullMQ Event Publish/Consume Template

Use this template whenever a module publishes or consumes events.

## D.1 Event Type Template

```ts
// packages/event-contracts/src/call.events.ts
export interface CallTranscriptionCompletedEvent {
  eventId:          string;
  tenantId:         string;
  timestamp:        string;
  traceId:          string;
  callId:           string;
  transcriptId:     string;
  languageDetected: string;
  confidenceScore:  number;
}
```

## D.2 Publish Template

```ts
// m01.events.ts
import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { EventBusService } from '../../common/event-bus.service';
import { CallTranscriptionCompletedEvent } from '@r-revenue/event-contracts';

@Injectable()
export class M01Events {
  private readonly logger = new Logger(M01Events.name);

  constructor(private readonly eventBus: EventBusService) {}

  async publishTranscriptionCompleted(data: {
    tenantId: string;
    traceId: string;
    callId: string;
    transcriptId: string;
    languageDetected: string;
    confidenceScore: number;
  }): Promise<void> {
    const payload: CallTranscriptionCompletedEvent = {
      eventId:          uuidv4(),
      tenantId:         data.tenantId,
      timestamp:        new Date().toISOString(),
      traceId:          data.traceId,
      callId:           data.callId,
      transcriptId:     data.transcriptId,
      languageDetected: data.languageDetected,
      confidenceScore:  data.confidenceScore,
    };

    await this.eventBus.publish('call.transcription.completed', payload);

    this.logger.log({
      level:    'info',
      message:  'Published call.transcription.completed',
      tenantId: data.tenantId,
      module:   'M-01',
      traceId:  data.traceId,
      eventId:  payload.eventId,
    });
  }
}
```

## D.3 Consume Template with Idempotency

```ts
// m03.events.ts
import { Worker, Job } from 'bullmq';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CallTranscriptionCompletedEvent } from '@r-revenue/event-contracts';

@Injectable()
export class M03Events implements OnModuleInit {
  private readonly logger = new Logger(M03Events.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly m03Service: M03Service,
  ) {}

  onModuleInit() {
    new Worker(
      'call.transcription.completed',
      async (job: Job<CallTranscriptionCompletedEvent>) => {
        const { eventId, tenantId, traceId } = job.data;

        const alreadyProcessed = await this.prisma.m03ProcessedEvent.findUnique({
          where: { eventId },
        });

        if (alreadyProcessed) {
          this.logger.log({
            level:    'info',
            message:  'Skipping duplicate event',
            tenantId,
            module:   'M-03',
            traceId,
            eventId,
          });
          return;
        }

        await this.m03Service.linkToRevenueGraph(job.data);

        await this.prisma.m03ProcessedEvent.create({
          data: {
            eventId,
            processedAt: new Date(),
            module: 'M-03',
          },
        });
      },
    );
  }
}
```

## D.4 Rules

- Publisher owns the event contract
- Consumers never redefine event types locally
- Every consumer must check idempotency before processing
- Breaking schema change = new event name

---
---

# Appendix E — Standard Prisma Table + Index Template

Use this when adding a new table.

## E.1 Table Template

```prisma
model M04CallScore {
  id               String   @id @default(uuid())
  tenantId         String
  callId           String
  scorecardId      String
  score            Float
  confidenceScore  Float
  flaggedForReview Boolean  @default(false)
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  @@index([tenantId, callId])
  @@index([tenantId, createdAt(sort: Desc)])
  @@index([tenantId, scorecardId])

  @@map("m04_call_scores")
}
```

## E.2 Processed Events Table Template

```prisma
model M04ProcessedEvent {
  eventId     String   @id
  processedAt DateTime @default(now())
  module      String

  @@map("m04_processed_events")
}
```

## E.3 SQL RLS Pattern

```sql
ALTER TABLE m04_call_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_policy
  ON m04_call_scores
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
```

## E.4 Rules

- Table name must have module prefix
- `tenantId` must exist on all tenant-owned tables
- Every table must have at least two composite indexes:
  - `tenantId + common lookup field`
  - `tenantId + createdAt DESC`
- RLS must be enabled
- Migration created via `prisma migrate dev`, never manual SQL

---
---

# Appendix F — Standard FastAPI AI Endpoint Template

Use this for AI service endpoints.

## F.1 Request / Response Models

```python
# schemas/summarize_schema.py
from pydantic import BaseModel, Field

class SummarizeRequest(BaseModel):
    tenant_id:  str
    trace_id:   str
    call_id:    str
    transcript: str
    deal_stage: str | None = None

class SummarizeResponse(BaseModel):
    summary:            str
    key_points:         list[str]
    next_steps:         list[str]
    confidence_score:   float = Field(ge=0.0, le=1.0)
    flagged_for_review: bool
```

## F.2 Endpoint Template

```python
# routers/summarize.py
from fastapi import APIRouter, Header
from schemas.summarize_schema import SummarizeRequest, SummarizeResponse
from services.summarizer import SummarizerService

router = APIRouter()
service = SummarizerService()

@router.post("/v1/summarize", response_model=SummarizeResponse)
async def summarize(
    request: SummarizeRequest,
    x_trace_id: str | None = Header(default=None),
) -> SummarizeResponse:
    trace_id = x_trace_id or request.trace_id
    return await service.summarize(request, trace_id)
```

## F.3 Service Template

```python
# services/summarizer.py
import time
from schemas.summarize_schema import SummarizeRequest, SummarizeResponse

class SummarizerService:
    async def summarize(self, request: SummarizeRequest, trace_id: str) -> SummarizeResponse:
        started_at = time.time()

        # 1. Load versioned prompt
        # 2. Call LiteLLM
        # 3. Parse JSON
        # 4. Compute confidence score

        confidence = 0.91

        return SummarizeResponse(
            summary="Customer is interested but pricing is a concern.",
            key_points=["Pricing objection raised", "Pilot requested"],
            next_steps=["Send pricing comparison", "Schedule follow-up demo"],
            confidence_score=confidence,
            flagged_for_review=confidence < 0.7,
        )
```

## F.4 Rules

- Use `async def`
- All input/output must be Pydantic models
- Return `confidence_score` and `flagged_for_review`
- No DB writes in AI service
- No hardcoded prompt string in endpoint file

---
---

# Appendix G — Standard Dockerfile Template (NestJS + FastAPI)

Use these as base templates for new services.

## G.1 NestJS Dockerfile Template

```dockerfile
# ── Builder Stage ────────────────────────────────────────────────────
FROM node:20.11.1-alpine3.19 AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ── Runtime Stage ────────────────────────────────────────────────────
FROM node:20.11.1-alpine3.19 AS runtime

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

USER appuser

EXPOSE 3000

CMD ["node", "dist/main.js"]
```

## G.2 FastAPI Dockerfile Template

```dockerfile
# ── Builder Stage ────────────────────────────────────────────────────
FROM python:3.12.2-slim-bookworm AS builder

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

COPY . .

# ── Runtime Stage ────────────────────────────────────────────────────
FROM python:3.12.2-slim-bookworm AS runtime

RUN useradd -m appuser

WORKDIR /app

COPY --from=builder /install /usr/local
COPY --from=builder /app /app

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')"

USER appuser

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## G.3 Rules

- Never use `latest`
- Multi-stage builds required
- Non-root user required
- No secrets baked into image
- Must include `HEALTHCHECK`

---
---

# Appendix H — Standard Prompt Template (Jinja2)

Use this structure for every production prompt.

## H.1 File Location

```text
apps/ai-services/prompts/<task-name>/v1.jinja2
```

Example:
```text
apps/ai-services/prompts/summarize/v1.jinja2
```

## H.2 Prompt Template

```jinja2
{# ── 1. PERSONA ───────────────────────────────────────────────────── #}
You are an expert revenue intelligence AI assistant for a B2B SaaS sales team.

{# ── 2. TASK INSTRUCTION ──────────────────────────────────────────── #}
Your task is to summarise the following sales call transcript.

Focus on:
- customer pain points
- objections
- next steps
- competitor mentions

Transcript:
{{ transcript }}

Context:
- Deal Stage: {{ deal_stage }}
- Account Name: {{ account_name }}
- Call Language: {{ language }}

{# ── 3. OUTPUT FORMAT ─────────────────────────────────────────────── #}
Return ONLY valid JSON in this exact structure:
{
  "summary": "string",
  "key_points": ["string"],
  "next_steps": ["string"],
  "competitor_mentions": ["string or null"],
  "confidence_reasoning": "short string"
}

{# ── 4. HALLUCINATION GUARD ───────────────────────────────────────── #}
Do not invent information not present in the transcript.
If a field cannot be determined from the transcript, return null.
Do not add markdown, prose, or explanation outside the JSON object.
```

## H.3 Versioning Rule

If the prompt changes:
- do **not** edit `v1.jinja2` directly in place for production changes
- create `v2.jinja2`
- add/update regression tests
- keep previous versions for rollback

## H.4 Temperature Reference

| Task Type | Temperature |
|---|---|
| Extraction / classification / scoring | `0.0` |
| Summarisation | `0.2` |
| Generation | `0.7` |

## H.5 Rules

- Prompts must live in versioned Jinja2 files
- Prompts must enforce JSON output
- Prompts must include hallucination guard
- Prompts must not be hardcoded inside Python files

---
---

