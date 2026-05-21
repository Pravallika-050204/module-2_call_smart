import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';

@Processor('m02-queue')
export class M02ConversationIntelligenceWorker extends WorkerHost {
  async process(job: Job) {
    console.log(`Processing job in module M-02`, job.id);
  }
}
