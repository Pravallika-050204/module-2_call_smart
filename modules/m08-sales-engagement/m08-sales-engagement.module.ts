import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { M08SalesEngagementController } from './controllers/m08.controller';
import { M08SalesEngagementService } from './services/m08.service';
import { M08SalesEngagementWorker } from './workers/m08.worker';
import { M08SalesEngagementRepository } from './repositories/m08.repository';
import { PrismaModule } from './database/prisma.module';
import { EventPublisherModule } from '../platform-core/events/event-publisher.module';

@Module({
  imports: [
    PrismaModule,
    EventPublisherModule,
    BullModule.registerQueue({ name: 'm08-queue' }),
  ],
  controllers: [M08SalesEngagementController],
  providers: [M08SalesEngagementService, M08SalesEngagementWorker, M08SalesEngagementRepository],
  exports: [M08SalesEngagementService],
})
export class M08SalesEngagementModule {}
