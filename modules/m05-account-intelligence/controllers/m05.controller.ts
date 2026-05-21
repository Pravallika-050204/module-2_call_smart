import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { TenantGuard } from '../../platform-core/guards/tenant.guard';
import { M05AccountIntelligenceService } from '../services/m05.service';

@Controller('api/v1/account-intelligence')
@UseGuards(TenantGuard)
export class M05AccountIntelligenceController {
  constructor(private readonly service: M05AccountIntelligenceService) {}

  @Get()
  findAll(@Req() req: any) {
    return this.service.findAll(req.tenantId);
  }

  @Post()
  create(@Body() dto: any, @Req() req: any) {
    return this.service.create(dto, req.tenantId);
  }
}
