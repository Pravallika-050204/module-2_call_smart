import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { TenantGuard } from '../../platform-core/guards/tenant.guard';
import { M07RevenueDashboardsService } from '../services/m07.service';

@Controller('api/v1/revenue-dashboards')
@UseGuards(TenantGuard)
export class M07RevenueDashboardsController {
  constructor(private readonly service: M07RevenueDashboardsService) {}

  @Get()
  findAll(@Req() req: any) {
    return this.service.findAll(req.tenantId);
  }

  @Post()
  create(@Body() dto: any, @Req() req: any) {
    return this.service.create(dto, req.tenantId);
  }
}
