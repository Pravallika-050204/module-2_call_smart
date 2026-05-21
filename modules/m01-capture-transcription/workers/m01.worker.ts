import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';

@Processor('m01-queue')
export class M01CaptureTranscriptionWorker extends WorkerHost {
  async process(job: Job) {
    console.log(`Processing job in module M-01`, job.id);
  }
}
