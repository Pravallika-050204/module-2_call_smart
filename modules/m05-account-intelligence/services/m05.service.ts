import { Injectable } from '@nestjs/common';
import { M05AccountIntelligenceRepository } from '../repositories/m05.repository';
import { EventPublisherService } from '../../platform-core/events/event-publisher.service';

@Injectable()
export class M05AccountIntelligenceService {
  constructor(
    private readonly repo: M05AccountIntelligenceRepository,
    private readonly events: EventPublisherService,
  ) {}

  async findAll(tenantId: string) {
    return this.repo.findAll(tenantId);
  }

  async create(dto: any, tenantId: string) {
    const record = await this.repo.create({ ...dto, tenantId });
    await this.events.publish('account.updated', { tenantId, recordId: record.id });
    return record;
  }
}
