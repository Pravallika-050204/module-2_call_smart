import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';

@Processor('m08-queue')
export class M08SalesEngagementWorker extends WorkerHost {
  async process(job: Job) {
    console.log(`Processing job in module M-08`, job.id);
  }
}
