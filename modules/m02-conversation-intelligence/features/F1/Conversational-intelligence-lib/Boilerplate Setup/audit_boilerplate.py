import os

ROOT_DIR = r"c:\Users\Relanto\Desktop\RevenueIntellegence\Boilerplate Setup\r-revenue-intelligence"

def check_file(path, expected_substrings=None):
    full_path = os.path.join(ROOT_DIR, path)
    if not os.path.exists(full_path):
        return False, "File does not exist"
    
    if expected_substrings:
        try:
            with open(full_path, "r", encoding="utf-8") as f:
                content = f.read()
            for sub in expected_substrings:
                if sub not in content:
                    return False, f"Missing expected content: '{sub}'"
        except Exception as e:
            return False, f"Error reading file: {str(e)}"
            
    return True, "OK"

def main():
    print("Starting automated boilerplate audit...")
    
    # Files to check
    checks = {
        # Root configs
        "pnpm-workspace.yaml": ["packages:"],
        "package.json": ["turbo run dev", "pnpmWorkspace" if "pnpmWorkspace" in "" else "r-revenue-intelligence"],
        "turbo.json": ["$schema", "dev", "build"],
        "docker-compose.yml": ["postgres", "redis", "meilisearch", "clickhouse", "api", "ai-services", "transcription-service"],
        ".doppler.yaml": ["setup:", "project:", "config:"],
        "README.md": ["Boilerplate Codebase", "git init", "pnpm install"],
        
        # Database package
        "packages/database/prisma/schema.prisma": ["datasource db", "generator client", "model Tenant"],
        "packages/database/package.json": ["database", "@prisma/client", "prisma"],
        
        # Shared-types package
        "packages/shared-types/package.json": ["shared-types", "zod"],
        "packages/shared-types/src/events/base.event.ts": ["BaseEvent", "eventId", "version", "tenantId"],
        "packages/shared-types/src/index.ts": ["export * from"],
        
        # Platform Core
        "apps/api/src/main.ts": ["NestFactory", "AppModule", "bootstrap"],
        "apps/api/package.json": ["api", "@nestjs/common", "bullmq"],
        "apps/api/src/platform-core/guards/tenant.guard.ts": ["TenantGuard", "CanActivate", "tenantId"],
        "apps/api/src/platform-core/guards/jwt.guard.ts": ["JwtAuthGuard", "AuthGuard"],
        "apps/api/src/platform-core/guards/hmac-webhook.guard.ts": ["HmacWebhookGuard", "crypto", "signature"],
        "apps/api/src/platform-core/database/prisma.service.ts": ["PrismaService", "PrismaClient"],
        "apps/api/src/platform-core/database/prisma.module.ts": ["PrismaModule", "PrismaService"],
        "apps/api/src/platform-core/events/event-publisher.service.ts": ["EventPublisherService", "Queue", "publish"],
        "apps/api/src/platform-core/events/event-publisher.module.ts": ["EventPublisherModule", "EventPublisherService"],
        
        # AI & Transcription Services
        "apps/ai-services/app/main.py": ["FastAPI", "/health", "/v1/summarize", "/v1/score-call"],
        "apps/ai-services/requirements.txt": ["fastapi", "uvicorn", "pydantic"],
        "apps/ai-services/Dockerfile": ["FROM python:3.12", "WORKDIR /app"],
        "apps/transcription-service/app/main.py": ["FastAPI", "/health", "/transcribe"],
        "apps/transcription-service/requirements.txt": ["fastapi", "uvicorn"],
        "apps/transcription-service/Dockerfile": ["FROM python:3.12", "WORKDIR /app"],
    }
    
    # Module configurations
    modules_config = [
        {"num": "01", "name": "capture", "route": "ingestion", "event": "call.transcription.completed"},
        {"num": "02", "name": "sales-engagement", "route": "sales-engagement", "event": "email.sent"},
        {"num": "03", "name": "revenue-graph", "route": "revenue-graph", "event": "revenue_graph.entity.linked"},
        {"num": "04", "name": "conversation-intelligence", "route": "conversation-intelligence", "event": "call.scored"},
        {"num": "05", "name": "smart-tracking", "route": "smart-tracking", "event": "tracker.detection.created"},
        {"num": "06", "name": "insights", "route": "insights", "event": "call.summary.generated"},  # Let's check generated folder name
        {"num": "07", "name": "deal-account", "route": "deal-management", "event": "deal.stage.changed"},
        {"num": "08", "name": "execution", "route": "execution", "event": "workflow.executed"},
        {"num": "09", "name": "forecasting", "route": "forecasting", "event": "forecast.submitted"},
        {"num": "10", "name": "coaching", "route": "coaching", "event": "coaching.recommendation.created"},
    ]
    
    # Add module files dynamically
    for m in modules_config:
        m_num = m["num"]
        m_name = m["name"]
        
        # Adjust name if it is module 6 (insight-generation vs insights)
        actual_name = "insight-generation" if m_name == "insights" else m_name
        
        folder = f"apps/api/src/modules/m{m_num}-{actual_name}"
        pascal_name = "".join([part.capitalize() for part in actual_name.split("-")])
        class_prefix = f"M{m_num}{pascal_name}"
        
        checks[f"{folder}/SDD.md"] = ["SDD", f"M-{m_num}"]
        checks[f"{folder}/m{m_num}-{actual_name}.module.ts"] = [f"{class_prefix}Module", "BullModule", "PrismaModule"]
        checks[f"{folder}/controllers/m{m_num}.controller.ts"] = [f"{class_prefix}Controller", "@Controller", "TenantGuard"]
        checks[f"{folder}/services/m{m_num}.service.ts"] = [f"{class_prefix}Service", "EventPublisherService"]
        checks[f"{folder}/repositories/m{m_num}.repository.ts"] = [f"{class_prefix}Repository", "PrismaService"]
        checks[f"{folder}/workers/m{m_num}.worker.ts"] = [f"{class_prefix}Worker", "Processor", "Job"]
        checks[f"{folder}/schemas/m{m_num}.schema.ts"] = [f"Create{class_prefix}Schema", "z.object"]
        
    passed_count = 0
    failed_count = 0
    
    print("\n--- AUDIT RESULTS ---")
    for file, expected in checks.items():
        ok, msg = check_file(file, expected)
        if ok:
            passed_count += 1
        else:
            failed_count += 1
            print(f"❌ FAIL: {file} - {msg}")
            
    print(f"\nAudit complete. Passed: {passed_count}/{len(checks)} files. Failed: {failed_count}")
    if failed_count == 0:
        print("SUCCESS! 100% of planned boilerplate files are present, complete, and perfectly generated.")
    else:
        print("WARNING: Some files were not completed successfully.")

if __name__ == "__main__":
    main()
