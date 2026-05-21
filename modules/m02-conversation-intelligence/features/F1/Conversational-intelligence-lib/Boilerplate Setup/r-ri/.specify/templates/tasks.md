# TASKS-XXXX: [Implementation Task List]

## Phase 1 — Database & Shared Types
- [ ] Implement Prisma schema model modifications
- [ ] Generate migration and apply raw PostgreSQL RLS policy
- [ ] Add Zod schemas to `packages/shared-types`

## Phase 2 — Business Logic & Repository
- [ ] Create repository queries under `mXX/repositories/`
- [ ] Write logic inside `mXX/services/`
- [ ] Implement event handler consumer logic

## Phase 3 — Endpoints & Queue Workers
- [ ] Expose Controller endpoints and attach Guards
- [ ] Create background BullMQ worker
- [ ] Emit output event with standard base envelope

## Phase 4 — Testing & Validation
- [ ] Implement Jest unit tests
- [ ] Validate tenant isolation rules under mock conditions
- [ ] Verify BullMQ retry and idempotency behaviors
