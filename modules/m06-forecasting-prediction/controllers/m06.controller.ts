import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { TenantGuard } from '../../platform-core/guards/tenant.guard';
import { M06ForecastingPredictionService } from '../services/m06.service';

@Controller('api/v1/forecasting-prediction')
@UseGuards(TenantGuard)
export class M06ForecastingPredictionController {
  constructor(private readonly service: M06ForecastingPredictionService) {}

  @Get()
  findAll(@Req() req: any) {
    return this.service.findAll(req.tenantId);
  }

  @Post()
  create(@Body() dto: any, @Req() req: any) {
    return this.service.create(dto, req.tenantId);
  }
}
