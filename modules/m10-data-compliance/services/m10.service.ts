import { Injectable } from '@nestjs/common';
import { M10DataComplianceRepository } from '../repositories/m10.repository';
import { EventPublisherService } from '../../platform-core/events/event-publisher.service';

@Injectable()
export class M10DataComplianceService {
  constructor(
    private readonly repo: M10DataComplianceRepository,
    private readonly events: EventPublisherService,
  ) {}

  async findAll(tenantId: string) {
    return this.repo.findAll(tenantId);
  }

  async create(dto: any, tenantId: string) {
    const record = await this.repo.create({ ...dto, tenantId });
    await this.events.publish('compliance.policy.updated', { tenantId, recordId: record.id });
    return record;
  }
}
