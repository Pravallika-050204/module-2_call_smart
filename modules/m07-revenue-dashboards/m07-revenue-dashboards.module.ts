import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { M07RevenueDashboardsController } from './controllers/m07.controller';
import { M07RevenueDashboardsService } from './services/m07.service';
import { M07RevenueDashboardsWorker } from './workers/m07.worker';
import { M07RevenueDashboardsRepository } from './repositories/m07.repository';
import { PrismaModule } from './database/prisma.module';
import { EventPublisherModule } from '../platform-core/events/event-publisher.module';

@Module({
  imports: [
    PrismaModule,
    EventPublisherModule,
    BullModule.registerQueue({ name: 'm07-queue' }),
  ],
  controllers: [M07RevenueDashboardsController],
  providers: [M07RevenueDashboardsService, M07RevenueDashboardsWorker, M07RevenueDashboardsRepository],
  exports: [M07RevenueDashboardsService],
})
export class M07RevenueDashboardsModule {}
