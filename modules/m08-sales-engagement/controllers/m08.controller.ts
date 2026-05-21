import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { TenantGuard } from '../../platform-core/guards/tenant.guard';
import { M08SalesEngagementService } from '../services/m08.service';

@Controller('api/v1/sales-engagement')
@UseGuards(TenantGuard)
export class M08SalesEngagementController {
  constructor(private readonly service: M08SalesEngagementService) {}

  @Get()
  findAll(@Req() req: any) {
    return this.service.findAll(req.tenantId);
  }

  @Post()
  create(@Body() dto: any, @Req() req: any) {
    return this.service.create(dto, req.tenantId);
  }
}
