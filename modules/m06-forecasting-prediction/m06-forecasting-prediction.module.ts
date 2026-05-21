import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { M06ForecastingPredictionController } from './controllers/m06.controller';
import { M06ForecastingPredictionService } from './services/m06.service';
import { M06ForecastingPredictionWorker } from './workers/m06.worker';
import { M06ForecastingPredictionRepository } from './repositories/m06.repository';
import { PrismaModule } from './database/prisma.module';
import { EventPublisherModule } from '../platform-core/events/event-publisher.module';

@Module({
  imports: [
    PrismaModule,
    EventPublisherModule,
    BullModule.registerQueue({ name: 'm06-queue' }),
  ],
  controllers: [M06ForecastingPredictionController],
  providers: [M06ForecastingPredictionService, M06ForecastingPredictionWorker, M06ForecastingPredictionRepository],
  exports: [M06ForecastingPredictionService],
})
export class M06ForecastingPredictionModule {}
