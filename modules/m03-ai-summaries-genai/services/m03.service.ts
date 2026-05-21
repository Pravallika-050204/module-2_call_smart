import { Injectable } from '@nestjs/common';
import { M03AiSummariesGenaiRepository } from '../repositories/m03.repository';
import { EventPublisherService } from '../../platform-core/events/event-publisher.service';

@Injectable()
export class M03AiSummariesGenaiService {
  constructor(
    private readonly repo: M03AiSummariesGenaiRepository,
    private readonly events: EventPublisherService,
  ) {}

  async findAll(tenantId: string) {
    return this.repo.findAll(tenantId);
  }

  async create(dto: any, tenantId: string) {
    const record = await this.repo.create({ ...dto, tenantId });
    await this.events.publish('call.summary.generated', { tenantId, recordId: record.id });
    return record;
  }
}
