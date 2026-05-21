import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';

@Processor('m06-queue')
export class M06ForecastingPredictionWorker extends WorkerHost {
  async process(job: Job) {
    console.log(`Processing job in module M-06`, job.id);
  }
}
