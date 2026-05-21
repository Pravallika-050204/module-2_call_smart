# R-Revenue Intelligence — Boilerplate Master Plan
# For AI Agents & 10 Teams of 2 Engineers Each

---

## PURPOSE

This document tells any AI agent or engineer exactly how to generate the full boilerplate codebase for R-Revenue Intelligence. Follow it top to bottom. Do not skip sections. Every section is a required step.

---

## OVERVIEW

- **Architecture:** Modular Monolith (NestJS) + 2 Python FastAPI services
- **Teams:** 10 teams × 2 engineers = 20 engineers total. Each team owns one module.
- **Approach:** SDD (System Design Document) first. Write the design, then write code.
- **Source of truth:** `docs/markdown documents/System_architecture.md`
- **Repo type:** Monorepo

---

## PART 1 — MONOREPO FOLDER STRUCTURE

An AI must create this exact folder tree:

```
r-revenue-intelligence/
├── apps/
│   ├── api/                        # NestJS Modular Monolith
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── app.module.ts
│   │   │   ├── platform-core/      # Shared platform code
│   │   │   │   ├── auth/
│   │   │   │   ├── tenant/
│   │   │   │   ├── guards/
│   │   │   │   ├── decorators/
│   │   │   │   ├── filters/
│   │   │   │   ├── interceptors/
│   │   │   │   └── events/
│   │   │   └── modules/
│   │   │       ├── m01-capture/
│   │   │       ├── m02-sales-engagement/
│   │   │       ├── m03-revenue-graph/
│   │   │       ├── m04-conversation-intelligence/
│   │   │       ├── m05-smart-tracking/
│   │   │       ├── m06-insight-generation/
│   │   │       ├── m07-deal-account/
│   │   │       ├── m08-execution/
│   │   │       ├── m09-forecasting/
│   │   │       └── m10-coaching/
│   │   ├── test/
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── ai-services/                # Python FastAPI — AI inference
│   │   ├── app/
│   │   │   ├── main.py
│   │   │   ├── routers/
│   │   │   │   ├── summarize.py
│   │   │   │   ├── extract.py
│   │   │   │   ├── score.py
│   │   │   │   ├── tag_topics.py
│   │   │   │   ├── detect_trackers.py
│   │   │   │   ├── embed.py
│   │   │   │   ├── answer_query.py
│   │   │   │   └── health.py
│   │   │   ├── services/
│   │   │   ├── models/
│   │   │   └── config.py
│   │   ├── requirements.txt
│   │   └── Dockerfile
│   │
│   └── transcription-service/      # Python FastAPI — ASR only
│       ├── app/
│       │   ├── main.py
│       │   ├── routers/
│       │   │   ├── transcribe.py
│       │   │   └── health.py
│       │   ├── providers/
│       │   │   ├── whisper.py
│       │   │   └── assemblyai.py
│       │   └── config.py
│       ├── requirements.txt
│       └── Dockerfile
│
├── packages/
│   ├── database/                   # Prisma schema + migrations
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── migrations/
│   │   └── package.json
│   │
│   └── shared-types/               # Shared TypeScript types + Zod schemas
│       ├── src/
│       │   ├── events/
│       │   ├── dtos/
│       │   └── index.ts
│       └── package.json
│
├── docker-compose.yml
├── docker-compose.override.yml
├── .doppler.yaml
├── package.json                    # pnpm workspace root
├── pnpm-workspace.yaml
└── turbo.json
```

---

## PART 2 — TECH STACK (MANDATORY — DO NOT CHANGE)

| Layer | Technology | Version |
|---|---|---|
| Frontend | Next.js | 14 |
| API | NestJS | 10 |
| Language (TS) | TypeScript | 5.x strict |
| Language (Python) | Python | 3.12 |
| AI Framework | FastAPI | 0.110+ |
| ORM | Prisma | 5.x |
| Database | PostgreSQL | 16 |
| Cache / Queue | Redis + BullMQ | 5.x |
| Search | Meilisearch | 1.x |
| Vector Search | pgvector | 0.7+ |
| Analytics DB | ClickHouse | 24.x |
| Secrets | Doppler | CLI latest |
| Package Manager | pnpm | 9.x |
| Monorepo | Turborepo | 2.x |
| Validation | Zod | 3.x |
| Testing | Jest + Supertest | latest |
| Containers | Docker + Compose | latest |

---

## PART 3 — PLATFORM CORE BOILERPLATE

**This is written FIRST before any module team starts. One dedicated setup is needed.**

### 3.1 Tenant Guard

```typescript
// apps/api/src/platform-core/guards/tenant.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const tenantId = request.headers['x-tenant-id'] || request.user?.tenantId;
    if (!tenantId) return false;
    request.tenantId = tenantId;
    return true;
  }
}
```

### 3.2 Prisma Tenant Middleware

```typescript
// packages/database/src/prisma.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
    this.$use(async (params, next) => {
      // Tenant context set before every query
      await this.$executeRawUnsafe(
        `SET app.current_tenant_id = '${params.args?.where?.tenantId}'`
      );
      return next(params);
    });
  }
}
```

### 3.3 BullMQ Event Publisher

```typescript
// apps/api/src/platform-core/events/event-publisher.service.ts
import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { randomUUID } from 'crypto';

@Injectable()
export class EventPublisherService {
  constructor(@InjectQueue('platform-events') private queue: Queue) {}

  async publish(eventName: string, payload: Record<string, unknown>) {
    await this.queue.add(eventName, {
      eventId: randomUUID(),
      version: '1.0',
      occurredAt: new Date().toISOString(),
      ...payload,
    });
  }
}
```

### 3.4 JWT Auth Guard

```typescript
// apps/api/src/platform-core/guards/jwt.guard.ts
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```

### 3.5 HMAC Webhook Guard

```typescript
// apps/api/src/platform-core/guards/hmac-webhook.guard.ts
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class HmacWebhookGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const signature = request.headers['x-webhook-signature'];
    const secret = process.env.WEBHOOK_SECRET!;
    const body = JSON.stringify(request.body);
    const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');
    if (signature !== `sha256=${expected}`) throw new UnauthorizedException('Invalid webhook signature');
    return true;
  }
}
```

---

## PART 4 — MODULE BOILERPLATE TEMPLATE

**Every team copies this template for their module and replaces `MODULE_NAME`, `ROUTE_PREFIX`, and table names.**

### 4.1 Module Folder Structure (per module)

```
src/modules/mXX-module-name/
├── controllers/
│   └── mXX.controller.ts
├── services/
│   └── mXX.service.ts
├── workers/
│   └── mXX.worker.ts
├── repositories/
│   └── mXX.repository.ts
├── schemas/
│   └── mXX.schema.ts
├── events/
│   ├── mXX.event-handlers.ts
│   └── mXX.events.ts
├── dto/
│   ├── create-mXX.dto.ts
│   └── response-mXX.dto.ts
└── mXX.module.ts
```

### 4.2 Module File — `mXX.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { MxxController } from './controllers/mXX.controller';
import { MxxService } from './services/mXX.service';
import { MxxWorker } from './workers/mXX.worker';
import { MxxRepository } from './repositories/mXX.repository';
import { PrismaModule } from '../../../platform-core/database/prisma.module';

@Module({
  imports: [
    PrismaModule,
    BullModule.registerQueue({ name: 'mXX-queue' }),
  ],
  controllers: [MxxController],
  providers: [MxxService, MxxWorker, MxxRepository],
  exports: [MxxService],
})
export class MxxModule {}
```

### 4.3 Controller Template

```typescript
import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../../../platform-core/guards/jwt.guard';
import { TenantGuard } from '../../../platform-core/guards/tenant.guard';
import { MxxService } from '../services/mXX.service';

@Controller('api/v1/ROUTE_PREFIX')
@UseGuards(JwtAuthGuard, TenantGuard)
export class MxxController {
  constructor(private readonly service: MxxService) {}

  @Get()
  findAll(@Req() req: any) {
    return this.service.findAll(req.tenantId);
  }

  @Post()
  create(@Body() dto: any, @Req() req: any) {
    return this.service.create(dto, req.tenantId, req.user.id);
  }
}
```

### 4.4 Service Template

```typescript
import { Injectable } from '@nestjs/common';
import { MxxRepository } from '../repositories/mXX.repository';
import { EventPublisherService } from '../../../platform-core/events/event-publisher.service';

@Injectable()
export class MxxService {
  constructor(
    private readonly repo: MxxRepository,
    private readonly events: EventPublisherService,
  ) {}

  async findAll(tenantId: string) {
    return this.repo.findAll(tenantId);
  }

  async create(dto: any, tenantId: string, userId: string) {
    const record = await this.repo.create({ ...dto, tenantId, createdBy: userId });
    await this.events.publish('MODULE_EVENT_NAME', { tenantId, recordId: record.id });
    return record;
  }
}
```

### 4.5 Repository Template

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../platform-core/database/prisma.service';

@Injectable()
export class MxxRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return this.prisma.mXxTable.findMany({ where: { tenantId } });
  }

  async create(data: any) {
    return this.prisma.mXxTable.create({ data });
  }
}
```

### 4.6 Worker Template (BullMQ)

```typescript
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';

@Processor('mXX-queue')
export class MxxWorker extends WorkerHost {
  async process(job: Job) {
    const { tenantId, payload } = job.data;
    // idempotency check first
    // process job
    // publish output event if needed
  }
}
```

### 4.7 Zod Schema Template

```typescript
import { z } from 'zod';

export const CreateMxxSchema = z.object({
  tenantId: z.string().uuid(),
  name: z.string().min(1),
  // add module-specific fields
});

export type CreateMxxDto = z.infer<typeof CreateMxxSchema>;
```

---

## PART 5 — DATABASE SCHEMA RULES (FOR ALL TEAMS)

Every Prisma model MUST follow this pattern:

```prisma
model MxxTableName {
  id         String   @id @default(uuid())
  tenantId   String                          // MANDATORY
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  // module-specific fields here

  @@index([tenantId])                        // MANDATORY index
}
```

RLS policy (run after migration):

```sql
ALTER TABLE mxx_table_name ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON mxx_table_name
  USING (tenant_id = current_setting('app.current_tenant_id'));
```

---

## PART 6 — PYTHON AI SERVICES TEMPLATE

### 6.1 FastAPI App Entry (`ai-services/app/main.py`)

```python
from fastapi import FastAPI
from app.routers import summarize, extract, score, embed, health

app = FastAPI(title="R-Revenue AI Services")

app.include_router(health.router)
app.include_router(summarize.router, prefix="/v1")
app.include_router(extract.router, prefix="/v1")
app.include_router(score.router, prefix="/v1")
app.include_router(embed.router, prefix="/v1")
```

### 6.2 Endpoint Template (each router file)

```python
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

class SummarizeRequest(BaseModel):
    transcript: str
    tenantId: str

class SummarizeResponse(BaseModel):
    summary: str
    confidence: float

@router.post("/summarize", response_model=SummarizeResponse)
async def summarize(req: SummarizeRequest):
    # call LLM via LiteLLM
    # return structured response
    return SummarizeResponse(summary="...", confidence=0.95)
```

### 6.3 Internal AI Endpoint List (NestJS calls these)

| NestJS Module | Calls AI Endpoint |
|---|---|
| M-01 | POST /v1/extract-crm-fields |
| M-04 | POST /v1/score-call |
| M-04 | POST /v1/tag-topics |
| M-04 | POST /v1/detect-themes |
| M-05 | POST /v1/detect-trackers |
| M-05 | POST /v1/embed |
| M-06 | POST /v1/summarize |
| M-06 | POST /v1/answer-query |
| M-10 | POST /v1/trainer-turn |

**Rule: NestJS NEVER imports Python libraries. It calls AI services over HTTP only.**

---

## PART 7 — EVENT CONTRACTS (ALL TEAMS MUST FOLLOW)

### 7.1 Standard Event Envelope

```typescript
// packages/shared-types/src/events/base.event.ts
export interface BaseEvent {
  eventId: string;         // UUID
  version: string;         // '1.0'
  tenantId: string;        // UUID
  occurredAt: string;      // ISO 8601
  correlationId?: string;
  traceId?: string;
}
```

### 7.2 Platform Events Registry

| Event Name | Producer | Consumers |
|---|---|---|
| `call.transcription.completed` | M-01 | M-02, M-03, M-04, M-05, M-06 |
| `crm.fields.extracted` | M-01 | M-03 |
| `email.sent` | M-02 | M-05, M-07 |
| `revenue_graph.entity.linked` | M-03 | M-04, M-05, M-07 |
| `call.scored` | M-04 | M-05, M-06, M-07, M-09, M-10 |
| `call.topics.tagged` | M-04 | M-05, M-06 |
| `tracker.detection.created` | M-05 | M-06, M-07, M-08 |
| `call.summary.generated` | M-06 | M-03, M-07, M-08, M-10 |
| `deal.stage.changed` | M-07 | M-08, M-09 |
| `forecast.submitted` | M-09 | M-10 |

### 7.3 Event Handler Template

```typescript
// In any module's event-handlers.ts
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';

@Processor('platform-events')
export class MxxEventHandlers extends WorkerHost {
  async process(job: Job) {
    if (job.name === 'call.transcription.completed') {
      await this.handleTranscriptionCompleted(job.data);
    }
  }

  private async handleTranscriptionCompleted(event: any) {
    // idempotency: check if already processed by eventId
    // process event
    // MUST be idempotent — BullMQ can redeliver
  }
}
```

---

## PART 8 — DOCKER COMPOSE BOILERPLATE

```yaml
# docker-compose.yml
version: '3.9'
services:
  postgres:
    image: pgvector/pgvector:pg16
    environment:
      POSTGRES_DB: revenue_intel
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    ports: ["5432:5432"]
    volumes: ["pgdata:/var/lib/postgresql/data"]

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

  meilisearch:
    image: getmeili/meilisearch:v1.7
    ports: ["7700:7700"]
    environment:
      MEILI_MASTER_KEY: ${MEILI_MASTER_KEY}

  clickhouse:
    image: clickhouse/clickhouse-server:24
    ports: ["8123:8123", "9000:9000"]

  api:
    build: ./apps/api
    ports: ["3001:3001"]
    depends_on: [postgres, redis]
    environment:
      DATABASE_URL: ${DATABASE_URL}
      REDIS_URL: ${REDIS_URL}

  ai-services:
    build: ./apps/ai-services
    ports: ["8000:8000"]
    environment:
      OPENAI_API_KEY: ${OPENAI_API_KEY}

  transcription-service:
    build: ./apps/transcription-service
    ports: ["8001:8001"]

volumes:
  pgdata:
```

---

## PART 9 — PACKAGE.JSON ROOTS

### `pnpm-workspace.yaml`
```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

### Root `package.json`
```json
{
  "name": "r-revenue-intelligence",
  "private": true,
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "test": "turbo run test",
    "db:migrate": "pnpm --filter database prisma migrate dev",
    "db:seed": "pnpm --filter database prisma db seed",
    "db:generate": "pnpm --filter database prisma generate"
  },
  "devDependencies": {
    "turbo": "^2.0.0",
    "typescript": "^5.0.0"
  }
}
```

### `turbo.json`
```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": { "dependsOn": ["^build"], "outputs": ["dist/**"] },
    "dev": { "cache": false, "persistent": true },
    "test": { "dependsOn": ["build"] }
  }
}
```

---

## PART 10 — TEAM ASSIGNMENTS & MODULE OWNERSHIP

| Team | Module | Arch Owner | Features to Build | API Prefix |
|---|---|---|---|---|
| Team 1 | M1 Capture & Transcription | M-01 | Call Transcription, Native Connectors, AI Data Extractor | /api/v1/ingestion |
| Team 2 | M2 Conversation Intelligence (scoring) | M-04 | AI Call Reviewer, Topic Tagger, Theme Spotter, Translator | /api/v1/conversation-intelligence |
| Team 3 | M2 Conversation Intelligence (search) | M-05 | AI Smart Tracker, Searchable Library | /api/v1/smart-tracking |
| Team 4 | M3 AI Summaries & GenAI | M-06 | AI Smart Summaries, Ask Anything, Deep Researcher | /api/v1/insights |
| Team 5 | M4 Deal Intelligence | M-07 + M-05 | Deals Boards, View Deal Drivers | /api/v1/deal-management |
| Team 6 | M5 Account Intelligence | M-07 | Account Boards | /api/v1/deal-management |
| Team 7 | M6 Forecasting & Prediction | M-09 | AI Revenue Predictor, Forecast Boards | /api/v1/forecasting |
| Team 8 | M7 Revenue Dashboards | M-10 | Revenue Dashboards | /api/v1/coaching/dashboards |
| Team 9 | M8 Sales Engagement | M-02 + M-08 | Email Composer, Engage To-Do, Orchestrate, Workflow Automation | /api/v1/sales-engagement |
| Team 10 | M9+M10 Coaching, Data & Compliance | M-10 + M-03 | Coaching, AI Trainer, Revenue Graph, Compliance, Data Cloud | /api/v1/coaching |

---

## PART 11 — SDD APPROACH (HOW EVERY TEAM MUST WORK)

SDD = System Design Document First. Before writing ANY code, write the design.

### Step 1 — Write Your Module SDD

Each team creates: `apps/api/src/modules/mXX-name/SDD.md`

It must contain:

```markdown
# SDD — Module MXX Name

## 1. What This Module Does (2 sentences max)
## 2. APIs (list all endpoints with method, path, auth, purpose)
## 3. Events Consumed (event name, from which module, what we do)
## 4. Events Emitted (event name, payload shape, who consumes)
## 5. Database Tables (table name, columns, indexes, RLS)
## 6. AI Service Calls (which Python endpoint, request/response shape)
## 7. Worker Jobs (queue name, job type, retry policy)
## 8. Edge Cases & Rules (business logic constraints)
## 9. Testing Plan (unit / integration / event-flow tests)
```

### Step 2 — Get SDD Reviewed

One engineer reviews the other's SDD before coding starts. Check:
- Does it match the System Architecture Document?
- Are all events correctly named (noun.verb)?
- Is every table tenant-scoped?
- No AI calls from TypeScript?

### Step 3 — Scaffold Boilerplate

Use Part 4 templates. Run:
```bash
# Create module folder structure
mkdir -p src/modules/mXX-name/{controllers,services,workers,repositories,schemas,events,dto}
```

### Step 4 — Write Database Schema First

- Add Prisma model to `packages/database/prisma/schema.prisma`
- Run `pnpm db:migrate`
- Add RLS SQL policy

### Step 5 — Write Tests Before Services

Write test files first (TDD inside SDD):
```bash
# Unit test skeleton
touch src/modules/mXX-name/tests/mXX.service.spec.ts
touch src/modules/mXX-name/tests/mXX.controller.spec.ts
touch src/modules/mXX-name/tests/mXX-events.spec.ts
```

### Step 6 — Implement in Order

1. Repository (database layer)
2. Service (business logic)
3. Controller (HTTP layer)
4. Worker (async jobs)
5. Event handlers (consume events)
6. Event publishers (emit events)

### Step 7 — Integration Test

Test the module with real database + Redis locally using Testcontainers or Docker Compose.

### Step 8 — PR + Review

- Branch: `feature/mXX-module-name-feature-name`
- PR title: `[M-XX] Feature: short description`
- PR must state: module owner, events touched, tables added

---

## PART 12 — GIT WORKFLOW FOR 10 TEAMS

```
main (production)
  └── develop (integration branch)
        ├── module/m01-capture
        ├── module/m02-sales-engagement
        ├── module/m03-revenue-graph
        ├── module/m04-conversation-intelligence
        ├── module/m05-smart-tracking
        ├── module/m06-insight-generation
        ├── module/m07-deal-account
        ├── module/m08-execution
        ├── module/m09-forecasting
        └── module/m10-coaching
```

**Rules:**
- Each team pushes to their `module/mXX-*` branch
- PR from `module/mXX-*` → `develop`
- PR from `develop` → `main` done by Tech Lead only
- No direct commits to `main` or `develop`
- Each PR must pass CI before merge

---

## PART 13 — ENVIRONMENT VARIABLES (.doppler.yaml)

```yaml
setup:
  project: r-revenue-intelligence
  config: dev
```

**Minimum required vars (all from Doppler, never in .env files):**

```
DATABASE_URL
REDIS_URL
JWT_SECRET
SUPABASE_URL
SUPABASE_KEY
OPENAI_API_KEY
ASSEMBLYAI_API_KEY
MEILI_MASTER_KEY
INTERNAL_SERVICE_SECRET
ZOOM_WEBHOOK_SECRET
TEAMS_WEBHOOK_SECRET
CLICKHOUSE_URL
```

---

## PART 14 — HOW AN AI AGENT USES THIS DOCUMENT

If you are an AI agent reading this, follow these steps in order:

1. **Read** `docs/markdown documents/System_architecture.md` for full module detail
2. **Create** the monorepo folder tree from Part 1
3. **Create** root config files: `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `docker-compose.yml`
4. **Create** Platform Core from Part 3 (auth, tenant, guards, events, prisma)
5. **Create** `packages/shared-types` with base event types and Zod schemas
6. **Create** `packages/database` with Prisma schema (one model per module table)
7. **For each module M-01 through M-10:**
   - Create folder structure from Part 4.1
   - Create `SDD.md` from Part 11 Step 1
   - Create module file, controller, service, repository, worker, event handlers using templates from Part 4
   - Add Prisma model + RLS SQL
8. **Create** Python `apps/ai-services` from Part 6
9. **Create** Python `apps/transcription-service` (Whisper + AssemblyAI routers)
10. **Validate:** Every table has `tenantId`. Every event has `eventId`, `version`, `tenantId`, `occurredAt`. No LLM imports in TypeScript.

---

## PART 15 — QUALITY CHECKLIST (BEFORE FIRST COMMIT)

Every team must verify before their first PR:

- [ ] Module folder structure matches Part 4.1
- [ ] SDD.md written and reviewed
- [ ] All Prisma models have `tenantId` and index
- [ ] RLS SQL written for every table
- [ ] Controller uses `JwtAuthGuard` + `TenantGuard`
- [ ] Service does NOT call OpenAI/Python libraries directly
- [ ] Workers are idempotent (check by eventId before processing)
- [ ] Events use standard envelope from Part 7.1
- [ ] No secrets in code — all from Doppler
- [ ] At least one unit test and one integration test written
- [ ] Branch name follows `feature/mXX-name-feature` pattern
- [ ] PR states module owner and lists events + tables affected

---

*This document was generated from the R-Revenue Intelligence System Architecture Document.*
*Any AI agent must treat `System_architecture.md` as the final authority on module boundaries and event contracts.*
*Last updated: 2026-05-17*
