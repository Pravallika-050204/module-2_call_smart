import { Injectable } from '@nestjs/common';
import { M07RevenueDashboardsRepository } from '../repositories/m07.repository';
import { EventPublisherService } from '../../platform-core/events/event-publisher.service';

@Injectable()
export class M07RevenueDashboardsService {
  constructor(
    private readonly repo: M07RevenueDashboardsRepository,
    private readonly events: EventPublisherService,
  ) {}

  async findAll(tenantId: string) {
    return this.repo.findAll(tenantId);
  }

  async create(dto: any, tenantId: string) {
    const record = await this.repo.create({ ...dto, tenantId });
    await this.events.publish('dashboard.viewed', { tenantId, recordId: record.id });
    return record;
  }
}
