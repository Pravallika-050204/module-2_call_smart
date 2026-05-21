import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';

@Processor('m05-queue')
export class M05AccountIntelligenceWorker extends WorkerHost {
  async process(job: Job) {
    console.log(`Processing job in module M-05`, job.id);
  }
}
