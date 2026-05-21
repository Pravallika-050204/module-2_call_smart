import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { TenantGuard } from '../../platform-core/guards/tenant.guard';
import { M04DealIntelligenceService } from '../services/m04.service';

@Controller('api/v1/deal-intelligence')
@UseGuards(TenantGuard)
export class M04DealIntelligenceController {
  constructor(private readonly service: M04DealIntelligenceService) {}

  @Get()
  findAll(@Req() req: any) {
    return this.service.findAll(req.tenantId);
  }

  @Post()
  create(@Body() dto: any, @Req() req: any) {
    return this.service.create(dto, req.tenantId);
  }
}
