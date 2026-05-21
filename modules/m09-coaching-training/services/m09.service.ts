import { Injectable } from '@nestjs/common';
import { M09CoachingTrainingRepository } from '../repositories/m09.repository';
import { EventPublisherService } from '../../platform-core/events/event-publisher.service';

@Injectable()
export class M09CoachingTrainingService {
  constructor(
    private readonly repo: M09CoachingTrainingRepository,
    private readonly events: EventPublisherService,
  ) {}

  async findAll(tenantId: string) {
    return this.repo.findAll(tenantId);
  }

  async create(dto: any, tenantId: string) {
    const record = await this.repo.create({ ...dto, tenantId });
    await this.events.publish('coaching.recommendation.created', { tenantId, recordId: record.id });
    return record;
  }
}
