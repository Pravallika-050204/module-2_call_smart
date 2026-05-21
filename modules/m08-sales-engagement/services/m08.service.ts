import { Injectable } from '@nestjs/common';
import { M08SalesEngagementRepository } from '../repositories/m08.repository';
import { EventPublisherService } from '../../platform-core/events/event-publisher.service';

@Injectable()
export class M08SalesEngagementService {
  constructor(
    private readonly repo: M08SalesEngagementRepository,
    private readonly events: EventPublisherService,
  ) {}

  async findAll(tenantId: string) {
    return this.repo.findAll(tenantId);
  }

  async create(dto: any, tenantId: string) {
    const record = await this.repo.create({ ...dto, tenantId });
    await this.events.publish('email.sent', { tenantId, recordId: record.id });
    return record;
  }
}
