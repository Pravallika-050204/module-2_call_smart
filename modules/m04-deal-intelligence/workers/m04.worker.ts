import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';

@Processor('m04-queue')
export class M04DealIntelligenceWorker extends WorkerHost {
  async process(job: Job) {
    console.log(`Processing job in module M-04`, job.id);
  }
}
