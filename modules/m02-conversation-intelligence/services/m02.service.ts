import { Injectable, Inject } from '@nestjs/common';
import { M02ConversationIntelligenceRepository } from '../repositories/m02.repository';
import { HybridSearchService } from './hybrid-search.service';
import { EventPublisherService } from '../../platform-core/events/event-publisher.service';
import {
  SearchQueryDto,
  SavedSearchDto,
  SearchResult,
  SearchQuerySchema,
  SavedSearchSchema,
  ConversationRecord,
  SavedSearchRecord,
} from '../interfaces/search.interface';

@Injectable()
export class M02ConversationIntelligenceService {
  constructor(
    @Inject(M02ConversationIntelligenceRepository) private readonly repo: M02ConversationIntelligenceRepository,
    @Inject(HybridSearchService) private readonly searchService: HybridSearchService,
    @Inject(EventPublisherService) private readonly events: EventPublisherService,
  ) {}

  /**
   * Performs dual hybrid (text + semantic) search across calls and emails, blending and ranking results.
   */
  async searchConversations(dto: SearchQueryDto, tenantId: string): Promise<SearchResult[]> {
    // Validate inputs using our installed Zod package dependency
    const parsedDto = SearchQuerySchema.parse(dto);
    const rawConversations = await this.repo.findAllConversations(tenantId);
    
    // 1. Enforce specific structural filters (Sentiment, Topic, Agent, Channel) before search
    let filteredCorpus = rawConversations;

    if (parsedDto.sentiment) {
      filteredCorpus = filteredCorpus.filter(c => c.sentiment === parsedDto.sentiment);
    }
    if (parsedDto.topic) {
      filteredCorpus = filteredCorpus.filter(c => c.topics?.includes(parsedDto.topic));
    }
    if (parsedDto.agent) {
      filteredCorpus = filteredCorpus.filter(c => c.agentName?.toLowerCase().includes(parsedDto.agent.toLowerCase()));
    }
    if (parsedDto.channel) {
      filteredCorpus = filteredCorpus.filter(c => c.channel === parsedDto.channel);
    }

    const queryText = parsedDto.query || '';

    // 2. Execute parallel text search (representing Meilisearch)
    const textResults = await this.searchService.executeTextSearch(filteredCorpus, queryText, tenantId);

    // 3. Execute parallel semantic search (representing pgvector)
    const semanticResults = await this.searchService.executeSemanticSearch(filteredCorpus, queryText, tenantId);

    // 4. Blend results using exact TDD parameters (weights: 0.5 text, 0.5 semantic)
    const blendedResults = this.searchService.blendHybridResults(textResults, semanticResults, 0.5, 0.5);

    // 5. Paginate results
    const page = parsedDto.page || 1;
    const limit = parsedDto.limit || 10;
    const startIndex = (page - 1) * limit;
    
    return blendedResults.slice(startIndex, startIndex + limit);
  }

  /**
   * Fetches paginated conversations archive
   */
  async getConversations(filters: SearchQueryDto, tenantId: string): Promise<{
    conversations: ConversationRecord[];
    totalCount: number;
    page: number;
    limit: number;
  }> {
    const parsedFilters = SearchQuerySchema.parse(filters);
    let corpus = await this.repo.findAllConversations(tenantId);
    
    if (parsedFilters.sentiment) {
      corpus = corpus.filter(c => c.sentiment === parsedFilters.sentiment);
    }
    if (parsedFilters.topic) {
      corpus = corpus.filter(c => c.topics?.includes(parsedFilters.topic));
    }
    if (parsedFilters.agent) {
      corpus = corpus.filter(c => c.agentName?.toLowerCase().includes(parsedFilters.agent.toLowerCase()));
    }
    if (parsedFilters.channel) {
      corpus = corpus.filter(c => c.channel === parsedFilters.channel);
    }

    const page = parsedFilters.page || 1;
    const limit = parsedFilters.limit || 10;
    const totalCount = corpus.length;
    const paginated = corpus.slice((page - 1) * limit, page * limit);

    return {
      conversations: paginated,
      totalCount,
      page,
      limit
    };
  }

  /**
   * Fetches specific conversation transcript or email by ID
   */
  async getConversationById(id: string, tenantId: string): Promise<ConversationRecord | undefined> {
    return this.repo.findConversationById(id, tenantId);
  }

  /**
   * Saved searches management
   */
  async createSavedSearch(dto: SavedSearchDto, tenantId: string, userId: string): Promise<SavedSearchRecord> {
    const parsedDto = SavedSearchSchema.parse(dto);
    return this.repo.createSavedSearch(parsedDto, tenantId, userId);
  }

  async getSavedSearches(tenantId: string, userId: string): Promise<SavedSearchRecord[]> {
    return this.repo.findSavedSearches(tenantId, userId);
  }

  /**
   * Base compatibility functions required by boilerplate tests
   */
  async findAll(tenantId: string): Promise<ConversationRecord[]> {
    return this.repo.findAllConversations(tenantId);
  }

  async create(dto: Record<string, unknown>, tenantId: string) {
    const record = await this.repo.createSyncLog({ ...dto, entityType: 'transcript' }, tenantId);
    await this.events.publish('call.scored', { tenantId, recordId: record.id });
    return record;
  }
}
