import os
import shutil

# Define the root of our boilerplate
ROOT_DIR = r"c:\Users\Relanto\Desktop\RevenueIntellegence\Boilerplate Setup\r-revenue-intelligence"

# Helper to write files
def write_file(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content.strip() + "\n")

def main():
    print(f"Scaffolding boilerplate in {ROOT_DIR}...")
    
    # 1. Clean previous runs
    if os.path.exists(ROOT_DIR):
        shutil.rmtree(ROOT_DIR)
    os.makedirs(ROOT_DIR, exist_ok=True)

    # 2. Create Root Files
    pnpm_workspace = """
packages:
  - 'apps/*'
  - 'packages/*'
"""
    write_file(os.path.join(ROOT_DIR, "pnpm-workspace.yaml"), pnpm_workspace)

    root_package_json = """
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
"""
    write_file(os.path.join(ROOT_DIR, "package.json"), root_package_json)

    turbo_json = """
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["build"]
    }
  }
}
"""
    write_file(os.path.join(ROOT_DIR, "turbo.json"), turbo_json)

    docker_compose = """
version: '3.9'
services:
  postgres:
    image: pgvector/pgvector:pg16
    environment:
      POSTGRES_DB: revenue_intel
      POSTGRES_USER: ${DB_USER:-postgres}
      POSTGRES_PASSWORD: ${DB_PASSWORD:-postgres}
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  meilisearch:
    image: getmeili/meilisearch:v1.7
    ports:
      - "7700:7700"
    environment:
      MEILI_MASTER_KEY: ${MEILI_MASTER_KEY:-masterkey}

  clickhouse:
    image: clickhouse/clickhouse-server:24
    ports:
      - "8123:8123"
      - "9000:9000"

  api:
    build: ./apps/api
    ports:
      - "3001:3001"
    depends_on:
      - postgres
      - redis
    environment:
      DATABASE_URL: ${DATABASE_URL}
      REDIS_URL: ${REDIS_URL}

  ai-services:
    build: ./apps/ai-services
    ports:
      - "8000:8000"
    environment:
      OPENAI_API_KEY: ${OPENAI_API_KEY}

  transcription-service:
    build: ./apps/transcription-service
    ports:
      - "8001:8001"

volumes:
  pgdata:
"""
    write_file(os.path.join(ROOT_DIR, "docker-compose.yml"), docker_compose)

    doppler_config = """
setup:
  project: r-revenue-intelligence
  config: dev
"""
    write_file(os.path.join(ROOT_DIR, ".doppler.yaml"), doppler_config)

    # 3. Create Packages/Database
    prisma_schema = """
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// Example global models
model Tenant {
  id        String   @id @default(uuid())
  name      String
  createdAt DateTime @default(now())
}
"""
    write_file(os.path.join(ROOT_DIR, "packages", "database", "prisma", "schema.prisma"), prisma_schema)

    db_package_json = """
{
  "name": "database",
  "version": "1.0.0",
  "dependencies": {
    "@prisma/client": "^5.0.0"
  },
  "devDependencies": {
    "prisma": "^5.0.0"
  }
}
"""
    write_file(os.path.join(ROOT_DIR, "packages", "database", "package.json"), db_package_json)

    # 4. Create Packages/Shared-Types
    shared_package_json = """
{
  "name": "shared-types",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "dependencies": {
    "zod": "^3.0.0"
  }
}
"""
    write_file(os.path.join(ROOT_DIR, "packages", "shared-types", "package.json"), shared_package_json)

    base_event = """
export interface BaseEvent {
  eventId: string;
  version: string;
  tenantId: string;
  occurredAt: string;
  correlationId?: string;
  traceId?: string;
}
"""
    write_file(os.path.join(ROOT_DIR, "packages", "shared-types", "src", "events", "base.event.ts"), base_event)
    write_file(os.path.join(ROOT_DIR, "packages", "shared-types", "src", "index.ts"), 'export * from "./events/base.event";')

    # 5. Create Apps/Api Platform Core
    # Guards
    tenant_guard = """
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
"""
    write_file(os.path.join(ROOT_DIR, "apps", "api", "src", "platform-core", "guards", "tenant.guard.ts"), tenant_guard)

    jwt_guard = """
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
"""
    write_file(os.path.join(ROOT_DIR, "apps", "api", "src", "platform-core", "guards", "jwt.guard.ts"), jwt_guard)

    hmac_guard = """
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
    if (signature !== `sha256=${expected}`) {
      throw new UnauthorizedException('Invalid webhook signature');
    }
    return true;
  }
}
"""
    write_file(os.path.join(ROOT_DIR, "apps", "api", "src", "platform-core", "guards", "hmac-webhook.guard.ts"), hmac_guard)

    # Database Prisma Service
    prisma_service = """
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
    // In production, configure row-level security middleware here
  }
}
"""
    write_file(os.path.join(ROOT_DIR, "apps", "api", "src", "platform-core", "database", "prisma.service.ts"), prisma_service)
    write_file(os.path.join(ROOT_DIR, "apps", "api", "src", "platform-core", "database", "prisma.module.ts"), """
import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
""")

    # Events Publisher
    event_publisher = """
import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { randomUUID } from 'crypto';

@Injectable()
export class EventPublisherService {
  constructor(@InjectQueue('platform-events') private queue: Queue) {}

  async publish(eventName: string, payload: Record<string, any>) {
    await this.queue.add(eventName, {
      eventId: randomUUID(),
      version: '1.0',
      occurredAt: new Date().toISOString(),
      ...payload,
    });
  }
}
"""
    write_file(os.path.join(ROOT_DIR, "apps", "api", "src", "platform-core", "events", "event-publisher.service.ts"), event_publisher)
    write_file(os.path.join(ROOT_DIR, "apps", "api", "src", "platform-core", "events", "event-publisher.module.ts"), """
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { EventPublisherService } from './event-publisher.service';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'platform-events' }),
  ],
  providers: [EventPublisherService],
  exports: [EventPublisherService],
})
export class EventPublisherModule {}
""")

    # Main apps/api configs
    write_file(os.path.join(ROOT_DIR, "apps", "api", "src", "main.ts"), """
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3001);
  console.log('API Modular Monolith running on port 3001');
}
bootstrap();
""")

    write_file(os.path.join(ROOT_DIR, "apps", "api", "package.json"), """
{
  "name": "api",
  "version": "1.0.0",
  "dependencies": {
    "@nestjs/common": "^10.0.0",
    "@nestjs/core": "^10.0.0",
    "@nestjs/bullmq": "^10.0.0",
    "bullmq": "^5.0.0",
    "zod": "^3.0.0"
  }
}
""")

    # 6. Create 10 Modules
    modules_config = [
        {"num": "01", "name": "capture", "route": "ingestion", "event": "call.transcription.completed"},
        {"num": "02", "name": "sales-engagement", "route": "sales-engagement", "event": "email.sent"},
        {"num": "03", "name": "revenue-graph", "route": "revenue-graph", "event": "revenue_graph.entity.linked"},
        {"num": "04", "name": "conversation-intelligence", "route": "conversation-intelligence", "event": "call.scored"},
        {"num": "05", "name": "smart-tracking", "route": "smart-tracking", "event": "tracker.detection.created"},
        {"num": "06", "name": "insight-generation", "route": "insights", "event": "call.summary.generated"},
        {"num": "07", "name": "deal-account", "route": "deal-management", "event": "deal.stage.changed"},
        {"num": "08", "name": "execution", "route": "execution", "event": "workflow.executed"},
        {"num": "09", "name": "forecasting", "route": "forecasting", "event": "forecast.submitted"},
        {"num": "10", "name": "coaching", "route": "coaching", "event": "coaching.recommendation.created"},
    ]

    all_imports = []
    all_modules = []

    for m in modules_config:
        m_num = m["num"]
        m_name = m["name"]
        m_route = m["route"]
        m_event = m["event"]

        folder_name = f"m{m_num}-{m_name}"
        mod_dir = os.path.join(ROOT_DIR, "apps", "api", "src", "modules", folder_name)
        
        pascal_name = "".join([part.capitalize() for part in m_name.split("-")])
        class_prefix = f"M{m_num}{pascal_name}"

        all_imports.append(f"import {{ {class_prefix}Module }} from './modules/{folder_name}/{folder_name}.module';")
        all_modules.append(f"{class_prefix}Module")

        # 6.1 SDD.md for the team
        sdd_content = f"""
# SDD — Module M-{m_num} {m_name.capitalize()}

## 1. What This Module Does
Strategic implementation for features inside lifecycle stage of the platform.

## 2. APIs
- `GET /api/v1/{m_route}`
- `POST /api/v1/{m_route}`

## 3. Events Consumed
- Upstream events triggered in platform.

## 4. Events Emitted
- `{m_event}`

## 5. Database Tables
- `m{m_num}_{m_name.replace('-', '_')}`

## 6. AI Service Calls
- Internal AI Python router integration if needed.
"""
        write_file(os.path.join(mod_dir, "SDD.md"), sdd_content)

        # 6.2 Module File
        module_file = f"""
import {{ Module }} from '@nestjs/common';
import {{ BullModule }} from '@nestjs/bullmq';
import {{ {class_prefix}Controller }} from './controllers/m{m_num}.controller';
import {{ {class_prefix}Service }} from './services/m{m_num}.service';
import {{ {class_prefix}Worker }} from './workers/m{m_num}.worker';
import {{ {class_prefix}Repository }} from './repositories/m{m_num}.repository';
import {{ PrismaModule }} from '../../../platform-core/database/prisma.module';
import {{ EventPublisherModule }} from '../../../platform-core/events/event-publisher.module';

@Module({{
  imports: [
    PrismaModule,
    EventPublisherModule,
    BullModule.registerQueue({{ name: 'm{m_num}-queue' }}),
  ],
  controllers: [{class_prefix}Controller],
  providers: [{class_prefix}Service, {class_prefix}Worker, {class_prefix}Repository],
  exports: [{class_prefix}Service],
}})
export class {class_prefix}Module {{}}
"""
        write_file(os.path.join(mod_dir, f"m{m_num}-{m_name}.module.ts"), module_file)

        # 6.3 Controller
        controller = f"""
import {{ Controller, Get, Post, Body, Param, UseGuards, Req }} from '@nestjs/common';
import {{ TenantGuard }} from '../../../platform-core/guards/tenant.guard';
import {{ {class_prefix}Service }} from '../services/m{m_num}.service';

@Controller('api/v1/{m_route}')
@UseGuards(TenantGuard)
export class {class_prefix}Controller {{
  constructor(private readonly service: {class_prefix}Service) {{}}

  @Get()
  findAll(@Req() req: any) {{
    return this.service.findAll(req.tenantId);
  }}

  @Post()
  create(@Body() dto: any, @Req() req: any) {{
    return this.service.create(dto, req.tenantId);
  }}
}}
"""
        write_file(os.path.join(mod_dir, "controllers", f"m{m_num}.controller.ts"), controller)

        # 6.4 Service
        service = f"""
import {{ Injectable }} from '@nestjs/common';
import {{ {class_prefix}Repository }} from '../repositories/m{m_num}.repository';
import {{ EventPublisherService }} from '../../../platform-core/events/event-publisher.service';

@Injectable()
export class {class_prefix}Service {{
  constructor(
    private readonly repo: {class_prefix}Repository,
    private readonly events: EventPublisherService,
  ) {{}}

  async findAll(tenantId: string) {{
    return this.repo.findAll(tenantId);
  }}

  async create(dto: any, tenantId: string) {{
    const record = await this.repo.create({{ ...dto, tenantId }});
    await this.events.publish('{m_event}', {{ tenantId, recordId: record.id }});
    return record;
  }}
}}
"""
        write_file(os.path.join(mod_dir, "services", f"m{m_num}.service.ts"), service)

        # 6.5 Repository
        repository = f"""
import {{ Injectable }} from '@nestjs/common';
import {{ PrismaService }} from '../../../platform-core/database/prisma.service';

@Injectable()
export class {class_prefix}Repository {{
  constructor(private readonly prisma: PrismaService) {{}}

  async findAll(tenantId: string) {{
    return [{{"message": "Mock list for tenant " + tenantId}}];
  }}

  async create(data: any) {{
    return {{ id: "mock-id-123", ...data }};
  }}
}}
"""
        write_file(os.path.join(mod_dir, "repositories", f"m{m_num}.repository.ts"), repository)

        # 6.6 Worker
        worker = f"""
import {{ Processor, WorkerHost }} from '@nestjs/bullmq';
import {{ Job }} from 'bullmq';

@Processor('m{m_num}-queue')
export class {class_prefix}Worker extends WorkerHost {{
  async process(job: Job) {{
    console.log(`Processing job in module M-{m_num}`, job.id);
  }}
}}
"""
        write_file(os.path.join(mod_dir, "workers", f"m{m_num}.worker.ts"), worker)

        # 6.7 Schema
        schema = f"""
import {{ z }} from 'zod';

export const Create{class_prefix}Schema = z.object({{
  tenantId: z.string().uuid(),
  name: z.string().min(1),
}});

export type Create{class_prefix}Dto = z.infer<typeof Create{class_prefix}Schema>;
"""
        write_file(os.path.join(mod_dir, "schemas", f"m{m_num}.schema.ts"), schema)

    # 7. Write App Module linking everything
    app_module = f"""
import {{ Module }} from '@nestjs/common';
import {{ BullModule }} from '@nestjs/bullmq';
{chr(10).join(all_imports)}

@Module({{
  imports: [
    BullModule.forRoot({{
      connection: {{
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      }},
    }}),
    {",".join(all_modules)}
  ],
}})
export class AppModule {{}}
"""
    write_file(os.path.join(ROOT_DIR, "apps", "api", "src", "app.module.ts"), app_module)

    # 8. Python AI Services
    fastapi_main = """
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="R-Revenue AI Services")

@app.get("/health")
def health():
    return {"status": "healthy"}

class ProcessRequest(BaseModel):
    text: str
    tenantId: str

@app.post("/v1/summarize")
def summarize(req: ProcessRequest):
    return {"summary": f"Mock summary of {len(req.text)} chars", "confidence": 0.98}

@app.post("/v1/score-call")
def score_call(req: ProcessRequest):
    return {"score": 85, "metrics": {"objections_handled": True}}
"""
    write_file(os.path.join(ROOT_DIR, "apps", "ai-services", "app", "main.py"), fastapi_main)
    write_file(os.path.join(ROOT_DIR, "apps", "ai-services", "requirements.txt"), "fastapi==0.110.0\nuvicorn==0.28.0\npydantic==2.6.4")
    write_file(os.path.join(ROOT_DIR, "apps", "ai-services", "Dockerfile"), "FROM python:3.12-slim\nWORKDIR /app\nCOPY requirements.txt .\nRUN pip install -r requirements.txt\nCOPY . .\nCMD [\"uvicorn\", \"app.main:app\", \"--host\", \"0.0.0.0\", \"--port\", \"8000\"]")

    # 9. Python Transcription Service
    transcription_main = """
from fastapi import FastAPI

app = FastAPI(title="R-Revenue Transcription Service")

@app.get("/health")
def health():
    return {"status": "healthy"}

@app.post("/transcribe")
def transcribe():
    return {"transcript": "Mock transcript", "words": [], "confidence": 0.99}
"""
    write_file(os.path.join(ROOT_DIR, "apps", "transcription-service", "app", "main.py"), transcription_main)
    write_file(os.path.join(ROOT_DIR, "apps", "transcription-service", "requirements.txt"), "fastapi==0.110.0\nuvicorn==0.28.0")
    write_file(os.path.join(ROOT_DIR, "apps", "transcription-service", "Dockerfile"), "FROM python:3.12-slim\nWORKDIR /app\nCOPY requirements.txt .\nRUN pip install -r requirements.txt\nCOPY . .\nCMD [\"uvicorn\", \"app.main:app\", \"--host\", \"0.0.0.0\", \"--port\", \"8001\"]")

    # 10. Write Scaffold README.md
    scaffold_readme = """
# R-Revenue Intelligence Boilerplate Codebase

This is the fully scaffolded boilerplate for R-Revenue Intelligence codebase.

## Repository Setup
1. Open this folder in terminal.
2. Run `git init`.
3. Create a GitHub repo and add it as a remote: `git remote add origin <url>`.
4. Create develop branch: `git checkout -b develop`.
5. Add all files, commit, and push:
   ```bash
   git add .
   git commit -m "chore: scaffold modular monolith boilerplate with platform core and 10 modules"
   git push -u origin develop
   ```

## Development
- Root run: `pnpm install` then `pnpm dev` (orchestrated by Turborepo).
- Every module contains its own **SDD.md** for its respective engineering team of 2.
"""
    write_file(os.path.join(ROOT_DIR, "README.md"), scaffold_readme)

    print("Success! Generated entire modular monolith boilerplate code.")

if __name__ == "__main__":
    main()
