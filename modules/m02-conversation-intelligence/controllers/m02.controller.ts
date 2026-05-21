import { Controller, Get, Post, Body, Query, Param, UseGuards, Req, Inject } from '@nestjs/common';
import { TenantGuard } from '../../platform-core/guards/tenant.guard';
import { M02ConversationIntelligenceService } from '../services/m02.service';
import { SearchQueryDto, SavedSearchDto } from '../interfaces/search.interface';

@Controller('api/v1/conversation-intelligence')
@UseGuards(TenantGuard)
export class M02ConversationIntelligenceController {
  constructor(
    @Inject(M02ConversationIntelligenceService) private readonly service: M02ConversationIntelligenceService
  ) {}

  /**
   * Run parallel full-text + semantic hybrid searches.
   */
  @Get('conversations/search')
  async search(@Query() queryDto: SearchQueryDto, @Req() req: Record<string, any>) {
    const tenantId = req.tenantId || 'tenant-123';
    return this.service.searchConversations(queryDto, tenantId);
  }

  /**
   * Get basic paginated archive list of conversations.
   */
  @Get('conversations')
  async list(@Query() queryDto: SearchQueryDto, @Req() req: Record<string, any>) {
    const tenantId = req.tenantId || 'tenant-123';
    return this.service.getConversations(queryDto, tenantId);
  }

  /**
   * Get detailed conversation transcript & metrics by ID.
   */
  @Get('conversations/:id')
  async findById(@Param('id') id: string, @Req() req: Record<string, any>) {
    const tenantId = req.tenantId || 'tenant-123';
    return this.service.getConversationById(id, tenantId);
  }

  /**
   * Saved searches management.
   */
  @Post('saved-searches')
  async saveSearch(@Body() body: SavedSearchDto, @Req() req: Record<string, any>) {
    const tenantId = req.tenantId || 'tenant-123';
    const userId = req.userId || 'user-456';
    return this.service.createSavedSearch(body, tenantId, userId);
  }

  @Get('saved-searches')
  async getSavedSearches(@Req() req: Record<string, any>) {
    const tenantId = req.tenantId || 'tenant-123';
    const userId = req.userId || 'user-456';
    return this.service.getSavedSearches(tenantId, userId);
  }

  /**
   * Boilerplate compliance fallbacks.
   */
  @Get('findAll')
  findAllLegacy(@Req() req: Record<string, any>) {
    const tenantId = req.tenantId || 'tenant-123';
    return this.service.findAll(tenantId);
  }
}
