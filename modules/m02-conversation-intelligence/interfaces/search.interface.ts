import { z } from 'zod';

export interface SearchResult {
  entityId: string;
  entityType: 'call' | 'email';
  score: number;
  snippet?: string;
  title?: string;
  customerName?: string;
  agentName?: string;
  date?: string;
  duration?: string;
  sentiment?: 'Positive' | 'Neutral' | 'Negative';
  topics?: string[];
  overallScore?: number;
  channel?: 'call' | 'email';
}

export class SearchQueryDto {
  query?: string;
  agent?: string;
  sentiment?: 'Positive' | 'Neutral' | 'Negative';
  topic?: string;
  channel?: 'call' | 'email';
  page?: number;
  limit?: number;
}

export class SavedSearchDto {
  name!: string;
  queryString?: string;
  filters?: Record<string, any>;
}

// Custom domain types to eliminate loose "any" declarations
export interface DiarizedTurn {
  speaker: string;
  text: string;
  start: number;
  end: number;
}

export interface Scorecard {
  greeting: number;
  problemUnderstanding: number;
  productExplanation: number;
  objectionHandling: number;
  nextStep: number;
  closingQuality: number;
}

export interface ConversationRecord {
  id: string;
  tenantId: string;
  title: string;
  channel: 'call' | 'email';
  customerName: string;
  agentName: string;
  date: string;
  duration: string;
  sentiment: 'Positive' | 'Neutral' | 'Negative';
  sentimentScore: number;
  overallScore: number;
  topics: string[];
  summary: string;
  transcript: string;
  diarizedTranscript: DiarizedTurn[];
  scorecard: Scorecard;
  competitorsDetected: string[];
  coachingSuggestion: string;
  keywords: string[];
}

export interface SavedSearchRecord {
  id: string;
  tenantId: string;
  userId: string;
  name: string;
  queryString: string;
  filters: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface SearchSyncLog {
  id: string;
  tenantId: string;
  entityType: 'transcript' | 'email';
  lastSyncedAt?: string; // Compatibility with legacy
  recordsSynced?: number; // Compatibility with legacy
  syncStatus?: 'COMPLETED' | 'FAILED' | 'PENDING';
  entityId?: string;
  idempotencyKey: string;
  indexedAt?: string;
}

// Zod schemas using installed package dependency
export const SearchQuerySchema = z.object({
  query: z.string().optional().default(''),
  agent: z.string().optional().default(''),
  sentiment: z.enum(['Positive', 'Neutral', 'Negative', '']).optional(),
  topic: z.string().optional().default(''),
  channel: z.enum(['call', 'email', '']).optional(),
  page: z.preprocess((val) => Number(val) || 1, z.number().min(1)).optional().default(1),
  limit: z.preprocess((val) => Number(val) || 10, z.number().min(1)).optional().default(10),
});

export const SavedSearchSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  queryString: z.string().optional().default(''),
  filters: z.record(z.any()).optional().default({}),
});
