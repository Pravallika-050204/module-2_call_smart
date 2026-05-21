import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';

@Processor('m10-queue')
export class M10DataComplianceWorker extends WorkerHost {
  async process(job: Job) {
    console.log(`Processing job in module M-10`, job.id);
  }
}
