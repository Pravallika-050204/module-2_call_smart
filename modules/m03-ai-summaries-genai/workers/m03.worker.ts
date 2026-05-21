import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';

@Processor('m03-queue')
export class M03AiSummariesGenaiWorker extends WorkerHost {
  async process(job: Job) {
    console.log(`Processing job in module M-03`, job.id);
  }
}
