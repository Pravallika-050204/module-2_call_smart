# R-Revenue Intelligence — Project Constitution

This document contains the non-negotiable architectural principles, security policies, coding standards, and safety boundaries for the R-Revenue Intelligence platform. Every AI coding agent and developer must read, memorize, and strictly enforce these rules.

---

## 1. CORE PRINCIPLES

- **Spec-Driven Development (SDD):** Do not write code without a validated specification, technical plan, and phased task list.
- **Tenant Isolation First:** The platform is a multi-tenant application. Every table must support strict data isolation using Row-Level Security (RLS) on PostgreSQL. Direct table access bypassing the tenant context is forbidden.
- **Event-Driven Communication:** Async communication via BullMQ on Redis using the `noun.verb` schema convention. Cross-module data operations require async events or public APIs. Direct cross-module DB reads/writes are strictly prohibited.
- **Language Boundaries (ADR-003):** 
  - **TypeScript (NestJS):** Exclusively for business orchestration, API routing, database transactions, and coordination. No AI inference libraries or direct LLM calls are allowed.
  - **Python (FastAPI):** Exclusively for ASR (transcription) and AI inference (summarization, scoring, classification). No NestJS business logic.

---

## 2. CODING STANDARDS & VALIDATION

- **TypeScript Strict Mode:** Enforced at all times. Avoid the use of `any` types.
- **Zod Schema Validation:** Every API endpoint request, configuration load, and external webhook payload must be validated via Zod schemas at runtime.
- **Snake_Case for Database:** All PostgreSQL database tables and columns must use `snake_case`.
- **CamelCase for TS/JS:** All TypeScript code, variables, and DTO parameters must use `camelCase`.
- **BullMQ Idempotency:** Because queues can experience duplicate deliveries, every BullMQ consumer must perform a pre-check (using a unique identifier or transaction key) to ensure processing is strictly idempotent.

---

## 3. SECURITY & SECRETS

- **No Local `.env` Secrets:** Secrets must never be hardcoded, saved in `.env` files, or committed to Git. Doppler is the exclusive tool for secure secrets management.
- **Secure Webhooks:** Every inbound webhook (e.g. from Zoom, Teams) must pass secure HMAC-SHA256 signature verification.
- **GDPR & Compliance:** Support automated user deletion cascading and consent/opt-out screening at the exact outreach time.

---

## 4. AI AGENT SYSTEM RULES

- Before implementing any task, you must search the workspace to see if helper libraries, platform services, or existing schemas already exist. Do not reinvent core platform utilities.
- When creating database migrations, always generate a corresponding raw SQL migration to apply Row-Level Security (RLS) policies to the newly created tables.
- All mock tests must reside inside `tests/` directories using Jest for TypeScript and Pytest for Python.
