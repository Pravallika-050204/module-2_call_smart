import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class M06ForecastingPredictionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return [{"message": "Mock list for tenant " + tenantId}];
  }

  async create(data: any) {
    return { id: "mock-id-123", ...data };
  }
}
