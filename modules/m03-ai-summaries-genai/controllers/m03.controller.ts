import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { TenantGuard } from '../../platform-core/guards/tenant.guard';
import { M03AiSummariesGenaiService } from '../services/m03.service';

@Controller('api/v1/ai-summaries-genai')
@UseGuards(TenantGuard)
export class M03AiSummariesGenaiController {
  constructor(private readonly service: M03AiSummariesGenaiService) {}

  @Get()
  findAll(@Req() req: any) {
    return this.service.findAll(req.tenantId);
  }

  @Post()
  create(@Body() dto: any, @Req() req: any) {
    return this.service.create(dto, req.tenantId);
  }
}
