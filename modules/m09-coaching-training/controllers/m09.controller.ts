import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { TenantGuard } from '../../platform-core/guards/tenant.guard';
import { M09CoachingTrainingService } from '../services/m09.service';

@Controller('api/v1/coaching-training')
@UseGuards(TenantGuard)
export class M09CoachingTrainingController {
  constructor(private readonly service: M09CoachingTrainingService) {}

  @Get()
  findAll(@Req() req: any) {
    return this.service.findAll(req.tenantId);
  }

  @Post()
  create(@Body() dto: any, @Req() req: any) {
    return this.service.create(dto, req.tenantId);
  }
}
