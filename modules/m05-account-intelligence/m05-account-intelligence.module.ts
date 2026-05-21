import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { M05AccountIntelligenceController } from './controllers/m05.controller';
import { M05AccountIntelligenceService } from './services/m05.service';
import { M05AccountIntelligenceWorker } from './workers/m05.worker';
import { M05AccountIntelligenceRepository } from './repositories/m05.repository';
import { PrismaModule } from './database/prisma.module';
import { EventPublisherModule } from '../platform-core/events/event-publisher.module';

@Module({
  imports: [
    PrismaModule,
    EventPublisherModule,
    BullModule.registerQueue({ name: 'm05-queue' }),
  ],
  controllers: [M05AccountIntelligenceController],
  providers: [M05AccountIntelligenceService, M05AccountIntelligenceWorker, M05AccountIntelligenceRepository],
  exports: [M05AccountIntelligenceService],
})
export class M05AccountIntelligenceModule {}
