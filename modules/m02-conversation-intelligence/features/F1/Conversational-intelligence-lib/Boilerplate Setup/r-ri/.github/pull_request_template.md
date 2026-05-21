## 🚀 [M-XX] Feature/Bugfix Title

### 1. Linear Ticket & SDD Reference
- **Linear Ticket Link:** `RRI-XXX`
- **Link to Module SDD.md:** [Path/to/SDD.md]
- **Link to Spec Kit Spec/Plan:** [Path/to/spec.md]

---

### 2. Implementation Summary
*Describe the high-level changes implemented in this PR. List impacted modules and database models.*

---

### 3. SDD & Architectural Quality Checklist
*Please verify compliance with the project's non-negotiable principles before submitting.*

- [ ] **Spec-Driven First:** This implementation exactly matches the approved technical plan.
- [ ] **Tenant Isolation:** Every new/modified database table contains `tenantId` (UUID).
- [ ] **Row-Level Security:** RLS policies are enabled on all new tables in the SQL migration file.
- [ ] **Language Boundaries:** No direct LLM/AI model packages are imported inside TypeScript (`apps/api`); all inference uses python AI endpoints.
- [ ] **Secrets Security:** No secrets are hardcoded or tracked in `.env` files; all properties are loaded via Doppler.
- [ ] **BullMQ Idempotency:** The background consumer worker performs a pre-check using the `eventId` to handle duplicate queue deliveries safely.

---

### 4. Verification & Testing Completed

#### A. Unit Tests
*Provide output or details showing Jest / Pytest unit tests pass.*
- [ ] Jest unit tests pass (`pnpm test`)
- [ ] Coverage meets or exceeds the required threshold ($\ge 80\%$)

#### B. Local Integration Tests
*Explain how you verified this locally with running database/queue containers.*
- [ ] Integration tests pass locally with Postgres and Redis running (`pnpm test:integration`)
- [ ] Verified that tenant isolation blocks cross-tenant reads/writes programmatically.

---

### 5. Database Schema & Event Changes
- **New SQL Tables:** `mXX_table_name`
- **Events Emitted:** `event.name`
- **Events Consumed:** `event.name`
