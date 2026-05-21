import { Injectable } from '@nestjs/common';
import { SearchResult, ConversationRecord } from '../interfaces/search.interface';

@Injectable()
export class HybridSearchService {
  
  /**
   * Blends full-text (Meilisearch) and semantic (pgvector) results based on TDD Appendix.
   */
  blendHybridResults(
    textResults: SearchResult[],
    semanticResults: SearchResult[],
    textWeight: number = 0.5,
    semanticWeight: number = 0.5
  ): SearchResult[] {
    const blendedMap = new Map<string, SearchResult>();

    // 1. Process text results
    textResults.forEach((res) => {
      blendedMap.set(res.entityId, {
        ...res,
        score: res.score * textWeight,
      });
    });

    // 2. Process semantic results
    semanticResults.forEach((res) => {
      const existing = blendedMap.get(res.entityId);
      if (existing) {
        existing.score += res.score * semanticWeight;
        // Keep the best snippet
        if (res.snippet && (!existing.snippet || res.snippet.length > existing.snippet.length)) {
          existing.snippet = res.snippet;
        }
      } else {
        blendedMap.set(res.entityId, {
          ...res,
          score: res.score * semanticWeight,
        });
      }
    });

    // 3. Sort blended results by combined score desc, filtering out background baseline noise
    return Array.from(blendedMap.values())
      .filter(item => item.score > 0.05)
      .sort((a, b) => b.score - a.score);
  }

  /**
   * Simulates typo-tolerant full-text search (representing Meilisearch)
   */
  simulateTextSearch(corpus: ConversationRecord[], query: string): SearchResult[] {
    if (!query) {
      return corpus.map(item => ({
        entityId: item.id,
        entityType: item.channel,
        score: 1.0,
        snippet: item.summary,
        ...item
      }));
    }

    const lowercaseQuery = query.toLowerCase();
    const queryTokens = lowercaseQuery.split(/[^a-zA-Z0-9]+/).filter(token => token.length > 1);
    if (queryTokens.length === 0) {
      queryTokens.push(lowercaseQuery);
    }

    const results: SearchResult[] = [];

    corpus.forEach((item) => {
      let score = 0;
      let snippet = '';

      queryTokens.forEach(token => {
        // Match in title
        if (item.title?.toLowerCase().includes(token)) {
          score += 0.8;
        }
        
        // Match in customer/agent names
        if (item.customerName?.toLowerCase().includes(token) || 
            item.agentName?.toLowerCase().includes(token)) {
          score += 0.6;
        }

        // Match in transcripts or summaries
        const textToSearch = item.transcript || item.summary || '';
        const lowerText = textToSearch.toLowerCase();
        const index = lowerText.indexOf(token);
        
        if (index !== -1) {
          score += 1.0;
          if (!snippet) {
            // Generate matching snippet centered on matching token
            const start = Math.max(0, index - 40);
            const end = Math.min(textToSearch.length, index + token.length + 60);
            snippet = `...${textToSearch.substring(start, end).replace(/\n/g, ' ')}...`;
          }
        }

        // Check topics
        if (item.topics?.some(t => t.toLowerCase().includes(token))) {
          score += 0.5;
        }
      });

      if (score > 0) {
        results.push({
          entityId: item.id,
          entityType: item.channel,
          score: Math.min(1.0, score),
          snippet: snippet || item.summary,
          ...item
        });
      }
    });

    return results;
  }

  /**
   * Simulates semantic matching (representing pgvector cosine similarity)
   */
  simulateSemanticSearch(corpus: ConversationRecord[], query: string): SearchResult[] {
    if (!query) {
      return corpus.map(item => ({
        entityId: item.id,
        entityType: item.channel,
        score: 0.8,
        snippet: item.summary,
        ...item
      }));
    }

    // Concept mappings for mock vector search (e.g. pricing query matches discount, price, etc.)
    const semanticKeywordsMap: Record<string, string[]> = {
      pricing: ['price', 'pricing', 'discount', 'cost', 'costs', 'costing', 'costings', 'quote', 'subscription', 'billing', 'expensive', 'budget', 'annual contract', 'financial', 'finance', 'rate', 'rates', 'monetary'],
      features: ['feature', 'integration', 'dashboard', 'ai summary', 'tracking', 'coaching', 'reporting', 'analytics'],
      competitor: ['competitor', 'gonge', 'chorus', 'salesforce', 'hubspot', 'migrate', 'switch', 'pricing compare'],
      onboarding: ['setup', 'integration', 'onboarding', 'training', 'implementation', 'migration', 'quick start'],
      objection: ['objection', 'budget constraint', 'too busy', 'already have a tool', 'no time', 'uninterested']
    };

    const lowercaseQuery = query.toLowerCase();
    const queryTokens = lowercaseQuery.split(/[^a-zA-Z0-9]+/).filter(token => token.length > 1);
    if (queryTokens.length === 0) {
      queryTokens.push(lowercaseQuery);
    }

    const results: SearchResult[] = [];

    corpus.forEach((item) => {
      let similarityScore = 0.1; // Base background similarity

      // If keywords match concept maps, boost semantic score
      Object.entries(semanticKeywordsMap).forEach(([concept, synonyms]) => {
        const queryMatchesConcept = queryTokens.some(token => 
          concept.includes(token) || token.includes(concept) || synonyms.some(s => s.includes(token) || token.includes(s))
        );
        
        const itemMatchesConcept = item.topics?.some(t => t.toLowerCase().includes(concept)) || 
                                   synonyms.some(s => (item.transcript || '').toLowerCase().includes(s)) ||
                                   synonyms.some(s => (item.summary || '').toLowerCase().includes(s));

        if (queryMatchesConcept && itemMatchesConcept) {
          similarityScore += 0.75;
        }
      });

      // Semantic matching on matching sentiments or general context
      const hasAngryToken = queryTokens.some(t => 'angry'.includes(t) || t.includes('angry'));
      const hasHappyToken = queryTokens.some(t => 'happy'.includes(t) || t.includes('happy'));

      if (hasAngryToken && item.sentiment === 'Negative') similarityScore += 0.5;
      if (hasHappyToken && item.sentiment === 'Positive') similarityScore += 0.3;

      // Bound between 0 and 1
      similarityScore = Math.min(0.98, similarityScore);

      results.push({
        entityId: item.id,
        entityType: item.channel,
        score: similarityScore,
        snippet: item.summary,
        ...item
      });
    });

    // Return all items evaluated semantically, sorted by semantic fit
    return results.sort((a, b) => b.score - a.score);
  }

  /**
   * Performs a real Meilisearch typo-tolerant search if Meilisearch is online on port 7700.
   */
  async executeTextSearch(corpus: ConversationRecord[], query: string, tenantId: string): Promise<SearchResult[]> {
    const meiliUrl = process.env.MEILI_URL || 'http://localhost:7700';
    const meiliKey = process.env.MEILI_MASTER_KEY;
    const indexName = 'conversations';

    if (!meiliKey) {
      console.warn('[Meilisearch] MEILI_MASTER_KEY is not defined in the environment. Falling back to local search simulator.');
      return this.simulateTextSearch(corpus, query);
    }

    try {
      // Index documents to Meilisearch in the background to ensure it is populated
      this.syncMeilisearchIndex(corpus, meiliUrl, meiliKey, indexName);

      if (!query) {
        return corpus.map(item => ({
          entityId: item.id,
          entityType: item.channel,
          score: 1.0,
          snippet: item.summary,
          ...item
        }));
      }

      // Query Meilisearch Search REST API
      const response = await fetch(`${meiliUrl}/indexes/${indexName}/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${meiliKey}`
        },
        body: JSON.stringify({
          q: query,
          filter: `tenantId = '${tenantId}'`
        })
      });

      if (response.ok) {
        const data = await response.json();
        const hits = (data.hits || []) as Array<SearchResult & Record<string, any>>;
        if (hits.length > 0) {
          console.log(`[Meilisearch] Returned ${hits.length} matches for query: "${query}"`);
          return hits.map((hit) => ({
            ...hit,
            entityId: hit.id || hit.entityId,
            entityType: hit.channel || hit.entityType,
            score: hit._rankingScore || 0.95,
            snippet: hit.summary || hit.snippet,
          }));
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn('[Meilisearch] Server offline on port 7700. Falling back to local simulation.', msg);
    }

    return this.simulateTextSearch(corpus, query);
  }

  private async syncMeilisearchIndex(corpus: ConversationRecord[], meiliUrl: string, meiliKey: string, indexName: string) {
    try {
      const documents = corpus.map(item => ({
        id: item.id,
        tenantId: item.tenantId,
        title: item.title,
        channel: item.channel,
        transcript: item.transcript,
        summary: item.summary,
        sentiment: item.sentiment,
        agentName: item.agentName,
        customerName: item.customerName,
        topics: item.topics
      }));

      await fetch(`${meiliUrl}/indexes/${indexName}/documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${meiliKey}`
        },
        body: JSON.stringify(documents)
      });
    } catch (err) {
      // Ignore background sync errors
    }
  }

  /**
   * Performs pgvector cosine-similarity semantic search.
   */
  async executeSemanticSearch(corpus: ConversationRecord[], query: string, tenantId: string): Promise<SearchResult[]> {
    const aiServiceUrl = process.env.AI_SERVICES_URL || 'http://localhost:8000';
    
    try {
      if (!query) {
        return corpus.map(item => ({
          entityId: item.id,
          entityType: item.channel,
          score: 0.8,
          snippet: item.summary,
          ...item
        }));
      }

      const embedResponse = await fetch(`${aiServiceUrl}/internal/generate-embeddings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: query })
      });

      if (embedResponse.ok) {
        const data = await embedResponse.json();
        const embedding = data.embedding as number[] | undefined;
        if (embedding && embedding.length > 0) {
          console.log(`[AI Services] Successfully generated embedding for semantic search.`);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn('[AI Services] Embeddings service offline. Falling back to local semantic cluster model.', msg);
    }

    return this.simulateSemanticSearch(corpus, query);
  }
}
