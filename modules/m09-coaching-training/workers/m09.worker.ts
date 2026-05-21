import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';

@Processor('m09-queue')
export class M09CoachingTrainingWorker extends WorkerHost {
  async process(job: Job) {
    console.log(`Processing job in module M-09`, job.id);
  }
}
