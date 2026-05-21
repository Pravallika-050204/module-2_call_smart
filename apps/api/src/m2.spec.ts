import { Test, TestingModule } from '@nestjs/testing';
import { M2Module } from '../../../modules/m2/m2.module';
import { M2Service } from '../../../modules/m2/services/m2.service';
import { M2Repository } from '../../../modules/m2/repositories/m2.repository';
import { M2Controller } from '../../../modules/m2/controllers/m2.controller';
import { EventPublisherService } from '../../../modules/platform-core/events/event-publisher.service';

describe('M2 Conversation Intelligence: AI Call Reviewer Tests', () => {
  let service: M2Service;
  let repository: M2Repository;
  let controller: M2Controller;
  let eventPublisher: EventPublisherService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [M2Module],
    }).compile();

    service = module.get<M2Service>(M2Service);
    repository = module.get<M2Repository>(M2Repository);
    controller = module.get<M2Controller>(M2Controller);
    eventPublisher = module.get<EventPublisherService>(EventPublisherService);

    // Speed up tests by bypassing delayed execution timer
    process.env.CALL_SCORE_DELAY_MS = '0';
  });

  beforeEach(async () => {
    await repository.clear();
    M2Service.clearJobs();
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    M2Service.clearJobs();
    await repository.onModuleDestroy();
  });

  it('1. Creating scorecard with valid data should succeed.', async () => {
    const scorecardData = {
      name: 'Sales Discovery Scorecard',
      questions: [
        { id: 'q1', text: 'Did the rep introduce themselves?', scoringCondition: 'Check greeting' },
      ],
      isActive: true,
      version: 'v1',
      lifecycleState: 'ACTIVE',
    };
    const created = await controller.createScorecard(scorecardData, { tenantId: 'tenant-1' });
    expect(created).toBeDefined();
    expect(created.name).toBe('Sales Discovery Scorecard');
    expect(created.questions.length).toBe(1);
    expect(created.isActive).toBe(true);
  });

  it('2. Fetching scorecards should return scorecards for tenant.', async () => {
    const scorecardData = {
      name: 'Customer Support Quality',
      questions: [{ id: 'q1', text: 'Was the customer greeted politely?' }],
      isActive: true,
    };
    await controller.createScorecard(scorecardData, { tenantId: 'tenant-2' });
    
    const list = await controller.getScorecards({ tenantId: 'tenant-2' });
    expect(list.length).toBe(1);
    expect(list[0].name).toBe('Customer Support Quality');

    const emptyList = await controller.getScorecards({ tenantId: 'other-tenant' });
    expect(emptyList.length).toBe(0);
  });

  it('3. Transcript completion should create scoring job.', async () => {
    const scorecardData = {
      name: 'Standard Evaluation',
      questions: [{ id: 'q1', text: 'Did the rep ask about budget?' }],
      isActive: true,
    };
    await controller.createScorecard(scorecardData, { tenantId: 'tenant-3' });

    await service.handleTranscriptionCompleted({
      tenantId: 'tenant-3',
      callId: 'call-3',
      transcript: 'Hello, what is your budget?',
      speakerSegments: [{ speaker: 'Agent', text: 'Hello, what is your budget?', start: 0, end: 5 }],
    });

    const jobs = M2Service.getJobs();
    expect(jobs.length).toBe(1);
    expect(jobs[0].callId).toBe('call-3');
    expect(jobs[0].scorecardId).toBeDefined();
  });

  it('4. Duplicate transcript event should not create duplicate scoring job.', async () => {
    const scorecardData = {
      name: 'Duplicate Check',
      questions: [{ id: 'q1', text: 'Check greeting' }],
      isActive: true,
    };
    const sc = await controller.createScorecard(scorecardData, { tenantId: 'tenant-4' });

    const payload = {
      tenantId: 'tenant-4',
      callId: 'call-4',
      transcript: 'Hi there',
      speakerSegments: [{ speaker: 'Agent', text: 'Hi there', start: 0, end: 3 }],
    };

    await service.handleTranscriptionCompleted(payload);
    await service.handleTranscriptionCompleted(payload); // Duplicate event

    const jobs = M2Service.getJobs();
    expect(jobs.length).toBe(1); // Only 1 job created
  });

  it('5. If active scorecard exists, call should be scored.', async () => {
    const scorecardData = {
      name: 'Active Scorecard Test',
      questions: [{ id: 'q1', text: 'Check greeting' }],
      isActive: true,
    };
    await controller.createScorecard(scorecardData, { tenantId: 'tenant-5' });

    // Mock internal HTTP call to succeed
    const mockResponse = {
      totalScore: 95,
      confidenceScore: 0.90,
      answers: [
        { questionId: 'q1', answer: 'Yes', score: 95, confidence: 0.90, evidence: 'Spoke hello' }
      ]
    };
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    await service.handleTranscriptionCompleted({
      tenantId: 'tenant-5',
      callId: 'call-5',
      transcript: 'Hello client',
      speakerSegments: [{ speaker: 'Agent', text: 'Hello client', start: 0, end: 4 }],
    });

    // Since delay is 0, execution is scheduled via setTimeout. Let's wait a brief moment.
    await new Promise(resolve => setTimeout(resolve, 100));

    const scores = await service.getCallScores('call-5', 'tenant-5');
    expect(scores.length).toBe(1);
    expect(scores[0].totalScore).toBe(95);
    expect(scores[0].confidenceScore).toBe(0.90);
  });

  it('6. If no active scorecard exists, scoring should complete silently.', async () => {
    await service.handleTranscriptionCompleted({
      tenantId: 'tenant-6',
      callId: 'call-6',
      transcript: 'No scorecards',
      speakerSegments: [],
    });

    const jobs = M2Service.getJobs();
    expect(jobs.length).toBe(0); // Completed silently with no job created
  });

  it('7. Multiple active scorecards should create multiple score results.', async () => {
    await controller.createScorecard({
      name: 'Scorecard A',
      questions: [{ id: 'q1', text: 'Question A' }],
      isActive: true,
    }, { tenantId: 'tenant-7' });

    await controller.createScorecard({
      name: 'Scorecard B',
      questions: [{ id: 'q2', text: 'Question B' }],
      isActive: true,
    }, { tenantId: 'tenant-7' });

    // Make sure we have mock fetch for internal AI service
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        totalScore: 88,
        confidenceScore: 0.85,
        answers: [{ questionId: 'q1', answer: 'Yes', score: 88, confidence: 0.85, evidence: 'Snippet' }]
      }),
    } as Response);

    await service.handleTranscriptionCompleted({
      tenantId: 'tenant-7',
      callId: 'call-7',
      transcript: 'Multiple scorecards text',
      speakerSegments: [{ speaker: 'Agent', text: 'Hello', start: 0, end: 4 }],
    });

    await new Promise(resolve => setTimeout(resolve, 100));

    const scores = await service.getCallScores('call-7', 'tenant-7');
    expect(scores.length).toBe(2);
  });

  it('8. Confidence score above 0.70 should not flag review.', async () => {
    const scorecardData = {
      name: 'High Confidence',
      questions: [{ id: 'q1', text: 'Greeting check' }],
      isActive: true,
    };
    await controller.createScorecard(scorecardData, { tenantId: 'tenant-8' });

    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        totalScore: 90,
        confidenceScore: 0.75, // Above 0.70
        answers: [
          { questionId: 'q1', answer: 'Yes', score: 90, confidence: 0.65, evidence: 'Hello' } // Above 0.60
        ]
      }),
    } as Response);

    await service.handleTranscriptionCompleted({
      tenantId: 'tenant-8',
      callId: 'call-8',
      transcript: 'Hello client',
      speakerSegments: [{ speaker: 'Agent', text: 'Hello client', start: 0, end: 4 }],
    });

    await new Promise(resolve => setTimeout(resolve, 100));

    const scores = await service.getCallScores('call-8', 'tenant-8');
    expect(scores[0].flaggedReview).toBe(false);
  });

  it('9. Confidence score below 0.70 with total score <= 80 should flag review.', async () => {
    const scorecardData = {
      name: 'Low Confidence',
      questions: [{ id: 'q1', text: 'Greeting check' }],
      isActive: true,
    };
    await controller.createScorecard(scorecardData, { tenantId: 'tenant-9' });

    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        totalScore: 75, // <= 80
        confidenceScore: 0.68, // Below 0.70
        answers: [
          { questionId: 'q1', answer: 'Yes', score: 75, confidence: 0.70, evidence: 'Hello' }
        ]
      }),
    } as Response);

    await service.handleTranscriptionCompleted({
      tenantId: 'tenant-9',
      callId: 'call-9',
      transcript: 'Hello client',
      speakerSegments: [{ speaker: 'Agent', text: 'Hello client', start: 0, end: 4 }],
    });

    await new Promise(resolve => setTimeout(resolve, 100));

    const scores = await service.getCallScores('call-9', 'tenant-9');
    expect(scores[0].flaggedReview).toBe(true);
  });

  it('10. Total score below 70 should flag review.', async () => {
    const scorecardData = {
      name: 'Low Score Check',
      questions: [{ id: 'q1', text: 'Greeting check' }],
      isActive: true,
    };
    await controller.createScorecard(scorecardData, { tenantId: 'tenant-10' });

    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        totalScore: 65, // Below 70
        confidenceScore: 0.85, // Above 0.70
        answers: [
          { questionId: 'q1', answer: 'Yes', score: 65, confidence: 0.85, evidence: 'Hello' }
        ]
      }),
    } as Response);

    await service.handleTranscriptionCompleted({
      tenantId: 'tenant-10',
      callId: 'call-10',
      transcript: 'Hello client',
      speakerSegments: [{ speaker: 'Agent', text: 'Hello client', start: 0, end: 4 }],
    });

    await new Promise(resolve => setTimeout(resolve, 100));

    const scores = await service.getCallScores('call-10', 'tenant-10');
    expect(scores[0].flaggedReview).toBe(true);
  });


  it('11. Stored score result should contain score, answers, confidence, and scoredAt.', async () => {
    const scorecardData = {
      name: 'Stored Fields Check',
      questions: [{ id: 'q1', text: 'Greeting check' }],
      isActive: true,
    };
    await controller.createScorecard(scorecardData, { tenantId: 'tenant-11' });

    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        totalScore: 84,
        confidenceScore: 0.82,
        answers: [
          { questionId: 'q1', answer: 'Yes', score: 84, confidence: 0.82, evidence: 'Greeting is present.' }
        ]
      }),
    } as Response);

    await service.handleTranscriptionCompleted({
      tenantId: 'tenant-11',
      callId: 'call-11',
      transcript: 'Hello client',
      speakerSegments: [{ speaker: 'Agent', text: 'Hello client', start: 0, end: 4 }],
    });

    await new Promise(resolve => setTimeout(resolve, 100));

    const scores = await service.getCallScores('call-11', 'tenant-11');
    const res = scores[0];
    expect(res.totalScore).toBe(84);
    expect(res.confidenceScore).toBe(0.82);
    expect(res.aiAnswers.length).toBe(1);
    expect(res.aiAnswers[0].evidence).toBe('Greeting is present.');
    expect(res.scoredAt).toBeInstanceOf(Date);
  });

  it('12. Fetch call score API should return stored result.', async () => {
    const scorecardData = {
      name: 'API Fetch Check',
      questions: [{ id: 'q1', text: 'Greeting check' }],
      isActive: true,
    };
    await controller.createScorecard(scorecardData, { tenantId: 'tenant-12' });

    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        totalScore: 88,
        confidenceScore: 0.88,
        answers: [{ questionId: 'q1', answer: 'Greeting present', score: 88, confidence: 0.88, evidence: 'Hello' }]
      }),
    } as Response);

    await service.handleTranscriptionCompleted({
      tenantId: 'tenant-12',
      callId: 'call-12',
      transcript: 'Hello client',
      speakerSegments: [{ speaker: 'Agent', text: 'Hello client', start: 0, end: 4 }],
    });

    await new Promise(resolve => setTimeout(resolve, 100));

    const scoreResult = await controller.getCallScore('call-12', { tenantId: 'tenant-12' });
    expect(scoreResult).toBeDefined();
    expect(scoreResult.callId).toBe('call-12');
    expect(scoreResult.totalScore).toBe(88);
    expect(scoreResult.scorecard.name).toBe('API Fetch Check');
  });

  it('13. Speaker segments should produce talk ratio, question rate, and longest monologue.', async () => {
    const scorecardData = {
      name: 'Metrics Check',
      questions: [{ id: 'q1', text: 'Metric check' }],
      isActive: true,
    };
    await controller.createScorecard(scorecardData, { tenantId: 'tenant-13' });

    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        totalScore: 90,
        confidenceScore: 0.90,
        answers: [{ questionId: 'q1', answer: 'Yes', score: 90, confidence: 0.90, evidence: 'None' }]
      }),
    } as Response);

    // Diarized segments:
    // Agent speaks 40s (start 0, end 40). Text contains 2 questions ('?').
    // Customer speaks 60s (start 40, end 100). Text contains 1 question.
    // Total call duration: 100 seconds = 1.666 minutes
    // Total questions: 3. Question rate = 3 / 1.666 = 1.8 questions/min
    // Talk ratio: Agent 40s / Total 100s = 0.40, Customer 60s / Total 100s = 0.60
    // Longest monologue: Customer segment is 60s
    await service.handleTranscriptionCompleted({
      tenantId: 'tenant-13',
      callId: 'call-13',
      transcript: 'Agent: How are you? What is your budget? Customer: Fine, what is your pricing?',
      speakerSegments: [
        { speaker: 'Agent', text: 'How are you? What is your budget?', start: 0, end: 40 },
        { speaker: 'Customer', text: 'Fine, what is your pricing?', start: 40, end: 100 },
      ],
    });

    await new Promise(resolve => setTimeout(resolve, 100));

    const scores = await service.getCallScores('call-13', 'tenant-13');
    const metrics = scores[0].derivedMetrics;
    expect(metrics.talkRatio.agent).toBe(0.40);
    expect(metrics.talkRatio.customer).toBe(0.60);
    expect(metrics.questionRate).toBeCloseTo(1.8, 1);
    expect(metrics.longestMonologue).toBe(60);
  });

  it('14. Successful scoring should emit call.scored event.', async () => {
    const scorecardData = {
      name: 'Event Check',
      questions: [{ id: 'q1', text: 'Event check' }],
      isActive: true,
    };
    await controller.createScorecard(scorecardData, { tenantId: 'tenant-14' });

    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        totalScore: 92,
        confidenceScore: 0.92,
        answers: [{ questionId: 'q1', answer: 'Yes', score: 92, confidence: 0.92, evidence: 'None' }]
      }),
    } as Response);

    const publishSpy = jest.spyOn(eventPublisher, 'publish');

    await service.handleTranscriptionCompleted({
      tenantId: 'tenant-14',
      callId: 'call-14',
      transcript: 'Success call',
      speakerSegments: [{ speaker: 'Agent', text: 'Hi', start: 0, end: 5 }],
    });

    await new Promise(resolve => setTimeout(resolve, 100));

    expect(publishSpy).toHaveBeenCalledWith('call.scored', expect.objectContaining({
      callId: 'call-14',
      totalScore: 92,
      confidenceScore: 0.92,
      flaggedReview: false,
    }));
  });

  it('15. AI service failure should be handled gracefully without crashing the app.', async () => {
    const scorecardData = {
      name: 'AI Failure Check',
      questions: [{ id: 'q1', text: 'Service check' }],
      isActive: true,
    };
    await controller.createScorecard(scorecardData, { tenantId: 'tenant-15' });

    // Mock fetch to simulate failure (rejection or status code 500)
    jest.spyOn(global, 'fetch').mockRejectedValue(new Error('Connection Refused'));

    // Should run successfully using internal fallback generation
    await service.handleTranscriptionCompleted({
      tenantId: 'tenant-15',
      callId: 'call-15',
      transcript: 'Fail AI call',
      speakerSegments: [{ speaker: 'Agent', text: 'Hello client', start: 0, end: 5 }],
    });

    await new Promise(resolve => setTimeout(resolve, 100));

    const scores = await service.getCallScores('call-15', 'tenant-15');
    expect(scores.length).toBe(1);
    expect(scores[0].totalScore).toBeDefined(); // Generated successfully via fallback
  });
});
