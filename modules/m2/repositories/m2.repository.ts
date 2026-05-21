import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Scorecard, CallScore } from '../interfaces/m2.interface';
import { Pool, Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class M2Repository implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(M2Repository.name);
  private pool: Pool;
  private initializedPromise: Promise<void> | null = null;

  constructor() {
    const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:test@localhost:5432/revenue_intel';
    this.logger.log(`Initializing PostgreSQL connection pool with URL: ${connectionString.replace(/:[^:@]+@/, ':***@')}`);
    this.pool = new Pool({
      connectionString,
      ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
    });
  }

  async onModuleInit() {
    await this.ensureInitialized();
  }

  async onModuleDestroy() {
    await this.pool.end();
    this.logger.log('PostgreSQL connection pool closed.');
  }

  async ensureInitialized(): Promise<void> {
    if (!this.initializedPromise) {
      this.initializedPromise = (async () => {
        await this.bootstrapDatabase();
        await this.initializeDatabase();
      })();
    }
    return this.initializedPromise;
  }

  async bootstrapDatabase(): Promise<void> {
    const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:test@localhost:5432/revenue_intel';
    
    let dbName = 'revenue_intel';
    let bootstrapUrl = connectionString;
    try {
      const url = new URL(connectionString);
      dbName = url.pathname.replace('/', '') || 'revenue_intel';
      url.pathname = '/postgres';
      bootstrapUrl = url.toString();
    } catch (e) {
      bootstrapUrl = connectionString.replace(/\/revenue_intel$/, '/postgres');
    }

    if (dbName === 'postgres') {
      return;
    }

    const client = new Client({
      connectionString: bootstrapUrl,
      ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
    });

    try {
      await client.connect();
      const checkRes = await client.query(`SELECT 1 FROM pg_database WHERE datname = $1`, [dbName]);
      if (checkRes.rows.length === 0) {
        this.logger.log(`Database '${dbName}' does not exist. Creating database...`);
        await client.query(`CREATE DATABASE "${dbName}"`);
        this.logger.log(`Database '${dbName}' created successfully.`);
      }
    } catch (err: any) {
      this.logger.error(`Database bootstrapping failed: ${err.message}`, err.stack);
    } finally {
      try {
        await client.end();
      } catch (e) {}
    }
  }

  async initializeDatabase(): Promise<void> {
    try {
      const sqlFilePath = path.resolve(__dirname, '../database/migrations/01_init_m2_tables.sql');
      let sql: string;
      if (fs.existsSync(sqlFilePath)) {
        sql = fs.readFileSync(sqlFilePath, 'utf8');
      } else {
        this.logger.warn(`Migration file not found at ${sqlFilePath}. Using fallback inline schema definition.`);
        sql = this.getFallbackSchemaSql();
      }
      await this.pool.query(sql);
      this.logger.log('PostgreSQL tables initialized successfully.');
    } catch (err: any) {
      this.logger.error(`Database initialization query failed: ${err.message}`, err.stack);
    }
  }

  private getFallbackSchemaSql(): string {
    return `
      CREATE TABLE IF NOT EXISTS scorecards (
          id VARCHAR(255) PRIMARY KEY,
          tenant_id VARCHAR(255) NOT NULL,
          name VARCHAR(255) NOT NULL,
          questions JSONB NOT NULL DEFAULT '[]'::jsonb,
          scoring_conditions JSONB NOT NULL DEFAULT '{}'::jsonb,
          is_active BOOLEAN NOT NULL DEFAULT TRUE,
          version VARCHAR(50) NOT NULL DEFAULT 'v1',
          lifecycle_state VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
      );

      CREATE TABLE IF NOT EXISTS call_scores (
          id VARCHAR(255) PRIMARY KEY,
          call_id VARCHAR(255) NOT NULL,
          tenant_id VARCHAR(255) NOT NULL,
          scorecard_id VARCHAR(255) NOT NULL,
          scorecard_version VARCHAR(50) NOT NULL,
          ai_answers JSONB NOT NULL DEFAULT '[]'::jsonb,
          total_score INTEGER NOT NULL,
          confidence_score NUMERIC(4,3) NOT NULL,
          flagged_review BOOLEAN NOT NULL DEFAULT FALSE,
          talk_ratio JSONB NOT NULL DEFAULT '{}'::jsonb,
          question_rate NUMERIC(6,2) NOT NULL DEFAULT 0.00,
          longest_monologue INTEGER NOT NULL DEFAULT 0,
          scoring_source VARCHAR(50) NOT NULL DEFAULT 'AI_MODEL',
          scored_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
          CONSTRAINT unique_call_scorecard_version UNIQUE (call_id, scorecard_id, scorecard_version)
      );

      -- Ensure tags and summary columns exist
      ALTER TABLE call_scores ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb;
      ALTER TABLE call_scores ADD COLUMN IF NOT EXISTS summary TEXT DEFAULT '';
      ALTER TABLE call_scores ADD COLUMN IF NOT EXISTS is_reviewed BOOLEAN NOT NULL DEFAULT FALSE;
      ALTER TABLE call_scores ADD COLUMN IF NOT EXISTS reviewer_notes TEXT DEFAULT '';
      ALTER TABLE call_scores ADD COLUMN IF NOT EXISTS original_score INTEGER DEFAULT NULL;

      CREATE TABLE IF NOT EXISTS trackers (
          id VARCHAR(255) PRIMARY KEY,
          tenant_id VARCHAR(255) NOT NULL,
          name VARCHAR(255) NOT NULL,
          business_question TEXT NOT NULL,
          description TEXT,
          type VARCHAR(100) NOT NULL,
          scope VARCHAR(100) NOT NULL,
          speaker_side VARCHAR(100) NOT NULL,
          is_published BOOLEAN NOT NULL DEFAULT FALSE,
          status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
      );

      CREATE TABLE IF NOT EXISTS tracker_detections (
          id VARCHAR(255) PRIMARY KEY,
          tracker_id VARCHAR(255) NOT NULL,
          call_id VARCHAR(255),
          email_id VARCHAR(255),
          tenant_id VARCHAR(255) NOT NULL,
          deal_id VARCHAR(255),
          contact_id VARCHAR(255),
          snippet TEXT NOT NULL,
          timestamp_ms BIGINT,
          confidence_score NUMERIC(4,3) NOT NULL,
          detection_source VARCHAR(100) NOT NULL,
          detected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
          CONSTRAINT fk_tracker FOREIGN KEY(tracker_id) REFERENCES trackers(id) ON DELETE CASCADE,
          CONSTRAINT unique_tracker_detection UNIQUE (tracker_id, call_id, email_id)
      );

      CREATE INDEX IF NOT EXISTS idx_scorecards_tenant ON scorecards(tenant_id);
      CREATE INDEX IF NOT EXISTS idx_call_scores_tenant_call ON call_scores(tenant_id, call_id);
      CREATE INDEX IF NOT EXISTS idx_call_scores_scorecard ON call_scores(scorecard_id);
      CREATE INDEX IF NOT EXISTS idx_trackers_tenant ON trackers(tenant_id);
      CREATE INDEX IF NOT EXISTS idx_tracker_detections_tenant ON tracker_detections(tenant_id);
      CREATE INDEX IF NOT EXISTS idx_tracker_detections_tracker ON tracker_detections(tracker_id);
    `;
  }

  async createScorecard(scorecard: Scorecard): Promise<Scorecard> {
    await this.ensureInitialized();
    try {
      const query = `
        INSERT INTO scorecards (
          id, tenant_id, name, questions, scoring_conditions, is_active, version, lifecycle_state, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (id) DO UPDATE SET
          tenant_id = EXCLUDED.tenant_id,
          name = EXCLUDED.name,
          questions = EXCLUDED.questions,
          scoring_conditions = EXCLUDED.scoring_conditions,
          is_active = EXCLUDED.is_active,
          version = EXCLUDED.version,
          lifecycle_state = EXCLUDED.lifecycle_state,
          updated_at = EXCLUDED.updated_at
        RETURNING *
      `;
      const values = [
        scorecard.id,
        scorecard.tenantId,
        scorecard.name,
        JSON.stringify(scorecard.questions),
        JSON.stringify(scorecard.scoringConditions || {}),
        scorecard.isActive,
        scorecard.version,
        scorecard.lifecycleState,
        scorecard.createdAt,
        scorecard.updatedAt,
      ];
      const res = await this.pool.query(query, values);
      return this.mapRowToScorecard(res.rows[0]);
    } catch (err: any) {
      this.logger.error(`Failed to create scorecard in PostgreSQL: ${err.message}`, err.stack);
      throw err;
    }
  }

  async findScorecardsByTenant(tenantId: string): Promise<Scorecard[]> {
    await this.ensureInitialized();
    try {
      const query = `SELECT * FROM scorecards WHERE tenant_id = $1 ORDER BY created_at DESC`;
      const res = await this.pool.query(query, [tenantId]);
      return res.rows.map((row: any) => this.mapRowToScorecard(row));
    } catch (err: any) {
      this.logger.error(`Failed to find scorecards for tenant ${tenantId}: ${err.message}`, err.stack);
      return [];
    }
  }

  async findActiveScorecardsByTenant(tenantId: string): Promise<Scorecard[]> {
    await this.ensureInitialized();
    try {
      const query = `SELECT * FROM scorecards WHERE tenant_id = $1 AND is_active = true ORDER BY created_at DESC`;
      const res = await this.pool.query(query, [tenantId]);
      return res.rows.map((row: any) => this.mapRowToScorecard(row));
    } catch (err: any) {
      this.logger.error(`Failed to find active scorecards for tenant ${tenantId}: ${err.message}`, err.stack);
      return [];
    }
  }

  async findScorecardById(id: string): Promise<Scorecard | undefined> {
    await this.ensureInitialized();
    try {
      const query = `SELECT * FROM scorecards WHERE id = $1`;
      const res = await this.pool.query(query, [id]);
      if (res.rows.length === 0) return undefined;
      return this.mapRowToScorecard(res.rows[0]);
    } catch (err: any) {
      this.logger.error(`Failed to find scorecard ${id}: ${err.message}`, err.stack);
      return undefined;
    }
  }

  async saveCallScore(callScore: CallScore & { scoringSource?: string; tags?: string[]; summary?: string }): Promise<CallScore> {
    await this.ensureInitialized();
    try {
      const query = `
        INSERT INTO call_scores (
          id, call_id, tenant_id, scorecard_id, scorecard_version, ai_answers, total_score, confidence_score, flagged_review, talk_ratio, question_rate, longest_monologue, scoring_source, scored_at, created_at, updated_at, tags, summary, is_reviewed, reviewer_notes, original_score
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
        ON CONFLICT (call_id, scorecard_id, scorecard_version) DO UPDATE SET
          ai_answers = EXCLUDED.ai_answers,
          total_score = EXCLUDED.total_score,
          confidence_score = EXCLUDED.confidence_score,
          flagged_review = EXCLUDED.flagged_review,
          talk_ratio = EXCLUDED.talk_ratio,
          question_rate = EXCLUDED.question_rate,
          longest_monologue = EXCLUDED.longest_monologue,
          scoring_source = EXCLUDED.scoring_source,
          scored_at = EXCLUDED.scored_at,
          updated_at = EXCLUDED.updated_at,
          tags = EXCLUDED.tags,
          summary = EXCLUDED.summary,
          is_reviewed = EXCLUDED.is_reviewed,
          reviewer_notes = EXCLUDED.reviewer_notes,
          original_score = EXCLUDED.original_score
        RETURNING *
      `;
      const values = [
        callScore.id,
        callScore.callId,
        callScore.tenantId,
        callScore.scorecardId,
        callScore.scorecardVersion,
        JSON.stringify(callScore.aiAnswers),
        callScore.totalScore,
        callScore.confidenceScore,
        callScore.flaggedReview,
        JSON.stringify(callScore.derivedMetrics.talkRatio),
        callScore.derivedMetrics.questionRate,
        callScore.derivedMetrics.longestMonologue,
        callScore.scoringSource || 'AI_MODEL',
        callScore.scoredAt,
        callScore.scoredAt, // created_at fallback
        new Date(), // updated_at
        JSON.stringify(callScore.tags || []),
        callScore.summary || '',
        callScore.isReviewed || false,
        callScore.reviewerNotes || '',
        callScore.originalScore !== undefined ? callScore.originalScore : null
      ];
      const res = await this.pool.query(query, values);
      return this.mapRowToCallScore(res.rows[0]);
    } catch (err: any) {
      this.logger.error(`Failed to save call score in PostgreSQL: ${err.message}`, err.stack);
      throw err;
    }
  }

  async findCallScoresByCallId(callId: string, tenantId: string): Promise<CallScore[]> {
    await this.ensureInitialized();
    try {
      const query = `SELECT * FROM call_scores WHERE call_id = $1 AND tenant_id = $2 ORDER BY scored_at DESC`;
      const res = await this.pool.query(query, [callId, tenantId]);
      return res.rows.map((row: any) => this.mapRowToCallScore(row));
    } catch (err: any) {
      this.logger.error(`Failed to find call scores for call ${callId}: ${err.message}`, err.stack);
      return [];
    }
  }

  async clear(): Promise<void> {
    await this.ensureInitialized();
    try {
      await this.pool.query('DELETE FROM tracker_detections');
      await this.pool.query('DELETE FROM trackers');
      await this.pool.query('DELETE FROM call_scores');
      await this.pool.query('DELETE FROM scorecards');
      this.logger.log('Database tables cleared successfully.');
    } catch (err: any) {
      this.logger.error(`Failed to clear database tables: ${err.message}`, err.stack);
    }
  }

  private mapRowToScorecard(row: any): Scorecard {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      name: row.name,
      questions: typeof row.questions === 'string' ? JSON.parse(row.questions) : row.questions,
      scoringConditions: typeof row.scoring_conditions === 'string' ? JSON.parse(row.scoring_conditions) : row.scoring_conditions,
      isActive: row.is_active,
      version: row.version,
      lifecycleState: row.lifecycle_state,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  async findCallScoreById(id: string, tenantId: string): Promise<CallScore | undefined> {
    await this.ensureInitialized();
    try {
      const query = `SELECT * FROM call_scores WHERE id = $1 AND tenant_id = $2`;
      const res = await this.pool.query(query, [id, tenantId]);
      if (res.rows.length === 0) return undefined;
      return this.mapRowToCallScore(res.rows[0]);
    } catch (err: any) {
      this.logger.error(`Failed to find call score ${id}: ${err.message}`, err.stack);
      return undefined;
    }
  }

  private mapRowToCallScore(row: any): CallScore & { scoringSource?: string; tags?: string[]; summary?: string } {
    return {
      id: row.id,
      callId: row.call_id,
      tenantId: row.tenant_id,
      scorecardId: row.scorecard_id,
      scorecardVersion: row.scorecard_version,
      aiAnswers: typeof row.ai_answers === 'string' ? JSON.parse(row.ai_answers) : row.ai_answers,
      totalScore: row.total_score,
      confidenceScore: parseFloat(row.confidence_score),
      flaggedReview: row.flagged_review,
      scoredAt: new Date(row.scored_at),
      derivedMetrics: {
        talkRatio: typeof row.talk_ratio === 'string' ? JSON.parse(row.talk_ratio) : row.talk_ratio,
        questionRate: parseFloat(row.question_rate),
        longestMonologue: parseInt(row.longest_monologue, 10),
      },
      scoringSource: row.scoring_source,
      tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags || [],
      summary: row.summary || '',
      isReviewed: row.is_reviewed || false,
      reviewerNotes: row.reviewer_notes || '',
      originalScore: row.original_score !== null ? row.original_score : undefined
    };
  }

  // AI Smart Tracker Repository Methods

  async createTracker(tracker: SmartTracker): Promise<SmartTracker> {
    await this.ensureInitialized();
    try {
      const query = `
        INSERT INTO trackers (
          id, tenant_id, name, business_question, description, type, scope, speaker_side, is_published, status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          business_question = EXCLUDED.business_question,
          description = EXCLUDED.description,
          type = EXCLUDED.type,
          scope = EXCLUDED.scope,
          speaker_side = EXCLUDED.speaker_side,
          is_published = EXCLUDED.is_published,
          status = EXCLUDED.status,
          updated_at = EXCLUDED.updated_at
        RETURNING *
      `;
      const values = [
        tracker.id,
        tracker.tenantId,
        tracker.name,
        tracker.businessQuestion,
        tracker.description || null,
        tracker.type,
        tracker.scope,
        tracker.speakerSide,
        tracker.isPublished,
        tracker.status,
        tracker.createdAt,
        tracker.updatedAt
      ];
      const res = await this.pool.query(query, values);
      return this.mapRowToSmartTracker(res.rows[0]);
    } catch (err: any) {
      this.logger.error(`Failed to create tracker in PostgreSQL: ${err.message}`, err.stack);
      throw err;
    }
  }

  async updateTracker(tracker: SmartTracker): Promise<SmartTracker> {
    return this.createTracker(tracker); // Postgres ON CONFLICT handles updates
  }

  async findTrackersByTenant(tenantId: string, name?: string, status?: string): Promise<SmartTracker[]> {
    await this.ensureInitialized();
    try {
      let query = `SELECT * FROM trackers WHERE tenant_id = $1`;
      const values: any[] = [tenantId];
      let paramCount = 1;

      if (name) {
        paramCount++;
        query += ` AND name ILIKE $${paramCount}`;
        values.push(`%${name}%`);
      }

      if (status) {
        paramCount++;
        query += ` AND status = $${paramCount}`;
        values.push(status);
      }

      query += ` ORDER BY created_at DESC`;
      const res = await this.pool.query(query, values);
      return res.rows.map((row: any) => this.mapRowToSmartTracker(row));
    } catch (err: any) {
      this.logger.error(`Failed to find trackers for tenant ${tenantId}: ${err.message}`, err.stack);
      return [];
    }
  }

  async findTrackerById(id: string, tenantId: string): Promise<SmartTracker | undefined> {
    await this.ensureInitialized();
    try {
      const query = `SELECT * FROM trackers WHERE id = $1 AND tenant_id = $2`;
      const res = await this.pool.query(query, [id, tenantId]);
      if (res.rows.length === 0) return undefined;
      return this.mapRowToSmartTracker(res.rows[0]);
    } catch (err: any) {
      this.logger.error(`Failed to find tracker ${id}: ${err.message}`, err.stack);
      return undefined;
    }
  }

  async deleteTracker(id: string, tenantId: string): Promise<boolean> {
    await this.ensureInitialized();
    try {
      const query = `DELETE FROM trackers WHERE id = $1 AND tenant_id = $2`;
      const res = await this.pool.query(query, [id, tenantId]);
      return (res.rowCount ?? 0) > 0;
    } catch (err: any) {
      this.logger.error(`Failed to delete tracker ${id}: ${err.message}`, err.stack);
      throw err;
    }
  }

  async saveTrackerDetection(det: TrackerDetection): Promise<TrackerDetection> {
    await this.ensureInitialized();
    try {
      const query = `
        INSERT INTO tracker_detections (
          id, tracker_id, call_id, email_id, tenant_id, deal_id, contact_id, snippet, timestamp_ms, confidence_score, detection_source, detected_at, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        ON CONFLICT (id) DO NOTHING
        RETURNING *
      `;
      const values = [
        det.id,
        det.trackerId,
        det.callId || null,
        det.emailId || null,
        det.tenantId,
        det.dealId || null,
        det.contactId || null,
        det.snippet,
        det.timestampMs !== undefined ? det.timestampMs : null,
        det.confidenceScore,
        det.detectionSource,
        det.detectedAt,
        det.createdAt
      ];
      const res = await this.pool.query(query, values);
      if (res.rows.length === 0) {
        // Did nothing due to conflict - let's query the existing record using IS NOT DISTINCT FROM to match NULLs correctly
        const selectQuery = `
          SELECT * FROM tracker_detections 
          WHERE tracker_id = $1 AND call_id IS NOT DISTINCT FROM $2 AND email_id IS NOT DISTINCT FROM $3
        `;
        const selectRes = await this.pool.query(selectQuery, [det.trackerId, det.callId || null, det.emailId || null]);
        return this.mapRowToTrackerDetection(selectRes.rows[0]);
      }
      return this.mapRowToTrackerDetection(res.rows[0]);
    } catch (err: any) {
      this.logger.error(`Failed to save tracker detection: ${err.message}`, err.stack);
      throw err;
    }
  }

  async hasTrackerDetection(trackerId: string, callId?: string, emailId?: string): Promise<boolean> {
    await this.ensureInitialized();
    try {
      const query = `
        SELECT 1 FROM tracker_detections 
        WHERE tracker_id = $1 AND call_id IS NOT DISTINCT FROM $2 AND email_id IS NOT DISTINCT FROM $3
      `;
      const res = await this.pool.query(query, [trackerId, callId || null, emailId || null]);
      return res.rows.length > 0;
    } catch (err: any) {
      this.logger.error(`Failed to check tracker detection existence: ${err.message}`, err.stack);
      return false;
    }
  }

  async findTrackerDetectionsByTenant(tenantId: string): Promise<any[]> {
    await this.ensureInitialized();
    try {
      const query = `
        SELECT td.*, t.name as tracker_name, t.type as tracker_type
        FROM tracker_detections td
        JOIN trackers t ON td.tracker_id = t.id
        WHERE td.tenant_id = $1
        ORDER BY td.detected_at DESC
      `;
      const res = await this.pool.query(query, [tenantId]);
      return res.rows.map((row: any) => ({
        ...this.mapRowToTrackerDetection(row),
        trackerName: row.tracker_name,
        trackerType: row.tracker_type
      }));
    } catch (err: any) {
      this.logger.error(`Failed to find tracker detections: ${err.message}`, err.stack);
      return [];
    }
  }

  private mapRowToSmartTracker(row: any): SmartTracker {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      name: row.name,
      businessQuestion: row.business_question,
      description: row.description || undefined,
      type: row.type,
      scope: row.scope,
      speakerSide: row.speaker_side,
      isPublished: row.is_published,
      status: row.status,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  private mapRowToTrackerDetection(row: any): TrackerDetection {
    return {
      id: row.id,
      trackerId: row.tracker_id,
      callId: row.call_id || undefined,
      emailId: row.email_id || undefined,
      tenantId: row.tenant_id,
      dealId: row.deal_id || undefined,
      contactId: row.contact_id || undefined,
      snippet: row.snippet,
      timestampMs: row.timestamp_ms !== null ? parseInt(row.timestamp_ms, 10) : undefined,
      confidenceScore: parseFloat(row.confidence_score),
      detectionSource: row.detection_source,
      detectedAt: new Date(row.detected_at),
      createdAt: new Date(row.created_at)
    };
  }
}

