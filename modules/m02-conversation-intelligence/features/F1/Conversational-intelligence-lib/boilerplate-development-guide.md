# R-Revenue Intelligence — Boilerplate & Testing Development Guide

This document explains the architecture of the scaffolded monorepo boilerplate codebase and provides step-by-step instructions on how each developer must write unit tests, execute integration tests locally, verify their features, and submit PRs to GitHub safely.

---

## 1. UNDERSTANDING THE BOILERPLATE STRUCTURE

The boilerplate uses a modern **Turborepo monorepo** managed by **pnpm workspaces**:

```
r-revenue-intelligence/
├── apps/
│   ├── api/                        # NestJS Modular Monolith API
│   ├── ai-services/                # Python FastAPI (AI models / scoring)
│   └── transcription-service/      # Python FastAPI (ASR audio processing)
├── packages/
│   ├── database/                   # Prisma Schema, Migrations, and seeds
│   └── shared-types/               # Global TypeScript types and Zod schemas
```

### 1.1 Platform Core (The Shared Guardrails)
Before developers write module features, they must understand the core platform rules built into `apps/api/src/platform-core/`:
- **`TenantGuard`:** Intercepts incoming HTTP requests and assigns the authenticated `tenantId` to the request payload.
- **`PrismaService`:** PostgreSQL client that intercepts all queries and injects Row-Level Security (RLS) policies based on the active `tenantId`.
- **`EventPublisherService`:** Standard service used to push messages to the Redis event bus using standard event schemas.

---

## 2. HOW TO WRITE UNIT TESTS

Every developer must write unit tests for their module controllers and services inside `tests/` directories. Unit tests must use **Jest** and mock all external dependencies (database, Redis, and event publishers).

### 2.1 Service Unit Test Template (`mXX.service.spec.ts`)
Save this template under your module's `tests/` folder:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { MxxService } from '../services/mXX.service';
import { MxxRepository } from '../repositories/mXX.repository';
import { EventPublisherService } from '../../../platform-core/events/event-publisher.service';

describe('MxxService', () => {
  let service: MxxService;
  let repo: MxxRepository;
  let events: EventPublisherService;

  const mockRepository = {
    findAll: jest.fn().mockImplementation((tenantId) => 
      Promise.resolve([{ id: '123', name: 'Test Record', tenantId }])
    ),
    create: jest.fn().mockImplementation((dto) => 
      Promise.resolve({ id: '123', ...dto })
    ),
  };

  const mockEventPublisher = {
    publish: jest.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MxxService,
        { provide: MxxRepository, useValue: mockRepository },
        { provide: EventPublisherService, useValue: mockEventPublisher },
      ],
    }).compile();

    service = module.get<MxxService>(MxxService);
    repo = module.get<MxxRepository>(MxxRepository);
    events = module.get<EventPublisherService>(EventPublisherService);
  });

  it('should return records matching the tenantId', async () => {
    const tenantId = 'test-tenant-uuid';
    const result = await service.findAll(tenantId);
    expect(result).toBeDefined();
    expect(result[0].tenantId).toBe(tenantId);
    expect(repo.findAll).toHaveBeenCalledWith(tenantId);
  });

  it('should publish an event upon successful creation', async () => {
    const tenantId = 'test-tenant-uuid';
    const dto = { name: 'New Record' };
    const result = await service.create(dto, tenantId);
    
    expect(result.id).toBe('123');
    expect(events.publish).toHaveBeenCalledWith(
      'MODULE_EVENT_NAME',
      expect.objectContaining({ tenantId })
    );
  });
});
```

---

## 3. HOW TO RUN INTEGRATION TESTS LOCALLY

Integration tests verify that your code successfully interacts with real databases (PostgreSQL/ClickHouse) and queue components (Redis/BullMQ).

### 3.1 Prerequisite: Start Local Docker Infrastructure
Before running integration tests, developers must start the local services container via Docker:

```bash
# Start Postgres, Redis, Meilisearch, ClickHouse in the background
docker compose up -d postgres redis meilisearch clickhouse
```

### 3.2 Integration Test Template (`mXX.integration.spec.ts`)
This test performs real queries and event emissions:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { MxxModule } from '../mXX-module-name.module';
import { PrismaService } from '../../../platform-core/database/prisma.service';
import { MxxService } from '../services/mXX.service';

describe('Mxx Integration Test', () => {
  let service: MxxService;
  let prisma: PrismaService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [MxxModule],
    }).compile();

    service = module.get<MxxService>(MxxService);
    prisma = module.get<PrismaService>(PrismaService);

    // Apply database migrations before integration run
    await prisma.$connect();
  });

  afterAll(async () => {
    // Clear test tables and disconnect database
    await prisma.$executeRawUnsafe('TRUNCATE TABLE mxx_table_name CASCADE;');
    await prisma.$disconnect();
  });

  it('should strictly isolate data and respect RLS policies', async () => {
    const tenantA = 'tenant-a-uuid';
    const tenantB = 'tenant-b-uuid';

    // 1. Write record for Tenant A
    await service.create({ name: 'Data A' }, tenantA);

    // 2. Query as Tenant B (Should return empty or exclude Tenant A's data)
    const resultB = await service.findAll(tenantB);
    expect(resultB.length).toBe(0);

    // 3. Query as Tenant A
    const resultA = await service.findAll(tenantA);
    expect(resultA.length).toBe(1);
  });
});
```

---

## 4. WORKFLOW FOR PUSHING TO GITHUB (PR GATES)

Every engineer must follow this development cycle before committing code:

### Step 1 — Local Verification
Run syntax validation and unit tests:
```bash
# Syntactical check on root files and packages
pnpm build

# Run Jest unit and integration tests
pnpm test
```

### Step 2 — Create Feature Branch
Create a descriptive branch under your module's namespace:
```bash
git checkout -b feature/mXX-[module-name]-[feature-name]
```

### Step 3 — Git Commit & Push
Ensure commit messages are descriptive and reference the module ID:
```bash
git add .
git commit -m "feat(mXX): implement secure data extraction and emit completion event"
git push origin feature/mXX-[module-name]-[feature-name]
```

### Step 4 — Open Pull Request (PR) Checklist
When opening a PR into the `develop` branch, engineers must fill out the following template:

```markdown
## [M-XX] Feature: [Short Description]

### 1. Checklist
- [ ] SDD.md has been updated and reviewed.
- [ ] Zod request/event schemas are validated.
- [ ] Unit tests pass locally (Jest / Pytest).
- [ ] Integration tests pass locally with Postgres/Redis.
- [ ] Row-Level Security (RLS) is applied to all new tables.
- [ ] Secrets are fetched exclusively from Doppler (no local .env).

### 2. Events & Database Mutations
- **Events Emitted:** `event.name`
- **Events Consumed:** `event.name`
- **New Tables Added:** `mXX_table_name`
```

---

*For spec-driven templates and configurations, read [github-spec-kit-guide.md](github-spec-kit-guide.md).*
*Last compiled: 2026-05-17*
