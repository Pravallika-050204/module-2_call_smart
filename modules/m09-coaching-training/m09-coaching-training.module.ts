import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { M09CoachingTrainingController } from './controllers/m09.controller';
import { M09CoachingTrainingService } from './services/m09.service';
import { M09CoachingTrainingWorker } from './workers/m09.worker';
import { M09CoachingTrainingRepository } from './repositories/m09.repository';
import { PrismaModule } from './database/prisma.module';
import { EventPublisherModule } from '../platform-core/events/event-publisher.module';

@Module({
  imports: [
    PrismaModule,
    EventPublisherModule,
    BullModule.registerQueue({ name: 'm09-queue' }),
  ],
  controllers: [M09CoachingTrainingController],
  providers: [M09CoachingTrainingService, M09CoachingTrainingWorker, M09CoachingTrainingRepository],
  exports: [M09CoachingTrainingService],
})
export class M09CoachingTrainingModule {}
