import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { M04DealIntelligenceController } from './controllers/m04.controller';
import { M04DealIntelligenceService } from './services/m04.service';
import { M04DealIntelligenceWorker } from './workers/m04.worker';
import { M04DealIntelligenceRepository } from './repositories/m04.repository';
import { PrismaModule } from './database/prisma.module';
import { EventPublisherModule } from '../platform-core/events/event-publisher.module';

@Module({
  imports: [
    PrismaModule,
    EventPublisherModule,
    BullModule.registerQueue({ name: 'm04-queue' }),
  ],
  controllers: [M04DealIntelligenceController],
  providers: [M04DealIntelligenceService, M04DealIntelligenceWorker, M04DealIntelligenceRepository],
  exports: [M04DealIntelligenceService],
})
export class M04DealIntelligenceModule {}
