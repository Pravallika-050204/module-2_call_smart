import { Module } from '@nestjs/common';
import { M02ConversationIntelligenceController } from './controllers/m02.controller';
import { M02ConversationIntelligenceService } from './services/m02.service';
import { HybridSearchService } from './services/hybrid-search.service';
import { M02ConversationIntelligenceRepository } from './repositories/m02.repository';
import { PrismaModule } from './database/prisma.module';
import { EventPublisherModule } from '../platform-core/events/event-publisher.module';

@Module({
  imports: [
    PrismaModule,
    EventPublisherModule,
  ],
  controllers: [M02ConversationIntelligenceController],
  providers: [
    M02ConversationIntelligenceService,
    HybridSearchService,
    M02ConversationIntelligenceRepository
  ],
  exports: [M02ConversationIntelligenceService],
})
export class M02ConversationIntelligenceModule {}
