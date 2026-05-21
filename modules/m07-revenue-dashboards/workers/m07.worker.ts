import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';

@Processor('m07-queue')
export class M07RevenueDashboardsWorker extends WorkerHost {
  async process(job: Job) {
    console.log(`Processing job in module M-07`, job.id);
  }
}
