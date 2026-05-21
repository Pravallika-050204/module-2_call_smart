import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { M03AiSummariesGenaiController } from './controllers/m03.controller';
import { M03AiSummariesGenaiService } from './services/m03.service';
import { M03AiSummariesGenaiWorker } from './workers/m03.worker';
import { M03AiSummariesGenaiRepository } from './repositories/m03.repository';
import { PrismaModule } from './database/prisma.module';
import { EventPublisherModule } from '../platform-core/events/event-publisher.module';

@Module({
  imports: [
    PrismaModule,
    EventPublisherModule,
    BullModule.registerQueue({ name: 'm03-queue' }),
  ],
  controllers: [M03AiSummariesGenaiController],
  providers: [M03AiSummariesGenaiService, M03AiSummariesGenaiWorker, M03AiSummariesGenaiRepository],
  exports: [M03AiSummariesGenaiService],
})
export class M03AiSummariesGenaiModule {}
