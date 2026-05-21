import { Injectable } from '@nestjs/common';
import { M04DealIntelligenceRepository } from '../repositories/m04.repository';
import { EventPublisherService } from '../../platform-core/events/event-publisher.service';

@Injectable()
export class M04DealIntelligenceService {
  constructor(
    private readonly repo: M04DealIntelligenceRepository,
    private readonly events: EventPublisherService,
  ) {}

  async findAll(tenantId: string) {
    return this.repo.findAll(tenantId);
  }

  async create(dto: any, tenantId: string) {
    const record = await this.repo.create({ ...dto, tenantId });
    await this.events.publish('deal.stage.changed', { tenantId, recordId: record.id });
    return record;
  }
}
