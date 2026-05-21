import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { TenantGuard } from '../../platform-core/guards/tenant.guard';
import { M10DataComplianceService } from '../services/m10.service';

@Controller('api/v1/data-compliance')
@UseGuards(TenantGuard)
export class M10DataComplianceController {
  constructor(private readonly service: M10DataComplianceService) {}

  @Get()
  findAll(@Req() req: any) {
    return this.service.findAll(req.tenantId);
  }

  @Post()
  create(@Body() dto: any, @Req() req: any) {
    return this.service.create(dto, req.tenantId);
  }
}
