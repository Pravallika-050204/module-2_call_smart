import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { M10DataComplianceController } from './controllers/m10.controller';
import { M10DataComplianceService } from './services/m10.service';
import { M10DataComplianceWorker } from './workers/m10.worker';
import { M10DataComplianceRepository } from './repositories/m10.repository';
import { PrismaModule } from './database/prisma.module';
import { EventPublisherModule } from '../platform-core/events/event-publisher.module';

@Module({
  imports: [
    PrismaModule,
    EventPublisherModule,
    BullModule.registerQueue({ name: 'm10-queue' }),
  ],
  controllers: [M10DataComplianceController],
  providers: [M10DataComplianceService, M10DataComplianceWorker, M10DataComplianceRepository],
  exports: [M10DataComplianceService],
})
export class M10DataComplianceModule {}
