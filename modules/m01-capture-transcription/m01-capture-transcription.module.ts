import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { M01CaptureTranscriptionController } from './controllers/m01.controller';
import { M01CaptureTranscriptionService } from './services/m01.service';
import { M01CaptureTranscriptionWorker } from './workers/m01.worker';
import { M01CaptureTranscriptionRepository } from './repositories/m01.repository';
import { PrismaModule } from './database/prisma.module';
import { EventPublisherModule } from '../platform-core/events/event-publisher.module';

@Module({
  imports: [
    PrismaModule,
    EventPublisherModule,
    BullModule.registerQueue({ name: 'm01-queue' }),
  ],
  controllers: [M01CaptureTranscriptionController],
  providers: [M01CaptureTranscriptionService, M01CaptureTranscriptionWorker, M01CaptureTranscriptionRepository],
  exports: [M01CaptureTranscriptionService],
})
export class M01CaptureTranscriptionModule {}
