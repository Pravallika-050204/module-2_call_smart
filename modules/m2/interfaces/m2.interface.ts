export interface ScorecardQuestion {
  id: string;
  text: string;
  scoringCondition?: string;
}

export interface Scorecard {
  id: string;
  tenantId: string;
  name: string;
  questions: ScorecardQuestion[];
  scoringConditions?: Record<string, any>;
  isActive: boolean;
  version: string;
  lifecycleState: string; // e.g. "DRAFT", "ACTIVE", "ARCHIVED"
  createdAt: Date;
  updatedAt: Date;
}

export interface AIAnswer {
  questionId: string;
  questionText?: string;
  answer: string;
  score: number;
  confidence: number;
  evidence: string;
}

export interface DerivedCallMetrics {
  talkRatio: { agent: number; customer: number };
  questionRate: number;
  longestMonologue: number;
}

export interface CallScore {
  id: string;
  callId: string;
  tenantId: string;
  scorecardId: string;
  scorecardVersion: string;
  aiAnswers: AIAnswer[];
  totalScore: number;
  confidenceScore: number;
  flaggedReview: boolean;
  scoredAt: Date;
  derivedMetrics: DerivedCallMetrics;
  scoringSource?: 'AI_MODEL' | 'RULE_BASED_FALLBACK';
  tags?: string[];
  summary?: string;
  isReviewed?: boolean;
  reviewerNotes?: string;
  originalScore?: number;
}

export interface DelayedScoringJob {
  key: string; // score:tenantId:callId:scorecardId:scorecardVersion
  tenantId: string;
  callId: string;
  scorecardId: string;
  scorecardVersion: string;
  status: 'PENDING' | 'SCORING' | 'COMPLETED' | 'FAILED';
  createdAt: Date;
  timer?: any; // setTimeout handle
  linkedEventReceived: boolean;
  transcript?: string;
  speakerSegments?: any[];
}
export interface SmartTracker {
  id: string;
  tenantId: string;
  name: string;
  businessQuestion: string;
  description?: string;
  type: 'pricing' | 'competitor' | 'objection' | 'risk' | 'custom';
  scope: 'calls' | 'emails' | 'both';
  speakerSide: 'customer' | 'rep' | 'any';
  isPublished: boolean;
  status: 'DRAFT' | 'PUBLISHED' | 'UNPUBLISHED';
  createdAt: Date;
  updatedAt: Date;
}

export interface TrackerDetection {
  id: string;
  trackerId: string;
  callId?: string;
  emailId?: string;
  tenantId: string;
  dealId?: string;
  contactId?: string;
  snippet: string;
  timestampMs?: number;
  confidenceScore: number;
  detectionSource: 'AI Model' | 'Rule-Based Fallback';
  detectedAt: Date;
  createdAt: Date;
}
