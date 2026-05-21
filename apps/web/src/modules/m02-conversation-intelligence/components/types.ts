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
  sentimentScore?: number;
  summary?: string;
  diarizedTranscript?: any[];
  scorecard?: any;
  competitorsDetected?: string[];
  coachingSuggestion?: string;
  keywords?: string[];
  [key: string]: any; // Catch-all index signature to ensure seamless custom props compatibility
}
