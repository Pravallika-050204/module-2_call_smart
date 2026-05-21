import { Injectable } from '@nestjs/common';
import { M06ForecastingPredictionRepository } from '../repositories/m06.repository';
import { EventPublisherService } from '../../platform-core/events/event-publisher.service';

@Injectable()
export class M06ForecastingPredictionService {
  constructor(
    private readonly repo: M06ForecastingPredictionRepository,
    private readonly events: EventPublisherService,
  ) {}

  async findAll(tenantId: string) {
    return this.repo.findAll(tenantId);
  }

  async create(dto: any, tenantId: string) {
    const record = await this.repo.create({ ...dto, tenantId });
    await this.events.publish('forecast.submitted', { tenantId, recordId: record.id });
    return record;
  }
}
