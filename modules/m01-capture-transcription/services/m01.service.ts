import { Injectable } from '@nestjs/common';
import { M01CaptureTranscriptionRepository } from '../repositories/m01.repository';
import { EventPublisherService } from '../../platform-core/events/event-publisher.service';

@Injectable()
export class M01CaptureTranscriptionService {
  constructor(
    private readonly repo: M01CaptureTranscriptionRepository,
    private readonly events: EventPublisherService,
  ) {}

  async findAll(tenantId: string) {
    return this.repo.findAll(tenantId);
  }

  async create(dto: any, tenantId: string) {
    const record = await this.repo.create({ ...dto, tenantId });
    await this.events.publish('call.transcription.completed', { tenantId, recordId: record.id });
    return record;
  }
}
