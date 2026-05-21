import React, { useState, useEffect } from 'react';
import { 
  Filter, Play, X,
  FileText, ShieldAlert, CheckCircle
} from 'lucide-react';

interface Question {
  id: string;
  text: string;
  scoringCondition: string;
}

interface Scorecard {
  id: string;
  name: string;
  questions: Question[];
  isActive: boolean;
  version: string;
  lifecycleState: string;
}

interface AIAnswer {
  questionId: string;
  answer: string;
  score: number;
  confidence: number;
  evidence: string;
  text?: string;
}

interface CallScore {
  id: string;
  scoreId?: string;
  callId: string;
  tenantId: string;
  scorecardId: string;
  scorecardVersion: string;
  totalScore: number;
  confidenceScore: number;
  flaggedReview: boolean;
  scoredAt: string;
  derivedMetrics: {
    talkRatio: { agent: number; customer: number };
    questionRate: number;
    longestMonologue: number;
  };
  aiAnswers: AIAnswer[];
  scorecard: Scorecard;
  scoringSource?: 'AI_MODEL' | 'RULE_BASED_FALLBACK';
  tags?: string[];
  summary?: string;
  // UI / call-record enriched fields
  title?: string;
  client?: string;
  agent?: string;
  date?: string;
  duration?: string;
  snippet?: string;
  channel?: string;
  sentiment?: string;
  isReviewed?: boolean;
  reviewerNotes?: string;
  originalScore?: number;
  transcript?: string;
}

interface CallRecord {
  id: string;
  title: string;
  client: string;
  agent: string;
  date: string;
  duration: string;
  snippet: string;
  tags: string[];
  transcript: string;
  segments: any[];
}

const SAMPLE_CALLS: CallRecord[] = [
  {
    id: 'sim_call_001',
    title: 'ACME Corp Opportunity discovery',
    client: 'Sarah (ACME VP)',
    agent: 'John (R-Revenue Rep)',
    date: '2026-05-18',
    duration: '45m 12s',
    snippet: 'Welcome to R-Revenue! My name is John. Can you tell me your budget? Yes, our budget is $100,000 for this seat expansion. GDPR compliance is key.',
    tags: ['Positive', 'Objection Handling', 'Pricing Strategy'],
    transcript: 'Agent: Welcome to R-Revenue! My name is John. Can you tell me your budget? Customer: Yes, our budget is $100,000 for this seat expansion. GDPR compliance is key.',
    segments: [
      { speaker: 'Agent', text: 'Welcome to R-Revenue! My name is John.', start: 0, end: 15 },
      { speaker: 'Agent', text: 'Can you tell me your budget?', start: 15, end: 35 },
      { speaker: 'Customer', text: 'Yes, our budget is $100,000 for this seat expansion. GDPR compliance is key.', start: 35, end: 75 }
    ]
  },
  {
    id: 'sim_call_002',
    title: 'Coca-Cola IT Security review',
    client: 'Michael (Coca-Cola Dir)',
    agent: 'John (R-Revenue Rep)',
    date: '2026-05-17',
    duration: '30m 05s',
    snippet: 'Hello? Anyone there? Yes, hi, sorry about that. We need absolute confirmation on isolated data schemas. I am skeptical about the confidence in your system.',
    tags: ['Security Review', 'Compliance Check', 'Objection Handling'],
    transcript: 'Customer: Hello? Anyone there? Agent: Yes, hi, sorry about that. Customer: We need absolute confirmation on isolated data schemas. I am skeptical about the confidence in your system.',
    segments: [
      { speaker: 'Customer', text: 'Hello? Anyone there?', start: 0, end: 20 },
      { speaker: 'Agent', text: 'Yes, hi, sorry about that.', start: 20, end: 45 },
      { speaker: 'Customer', text: 'We need absolute confirmation on isolated data schemas. I am skeptical about the confidence in your system.', start: 45, end: 110 }
    ]
  }
];

export default function CallReviewerDashboard({ apiBaseUrl = 'http://localhost:3001' }: { apiBaseUrl?: string }) {
  const [scorecards, setScorecards] = useState<Scorecard[]>([]);
  const [callScores, setCallScores] = useState<CallScore[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters State
  const [selectedScorecardId, setSelectedScorecardId] = useState('');
  const [participant, setParticipant] = useState('');
  const [callTitle, setCallTitle] = useState('');
  const [sentiment, setSentiment] = useState<'Positive' | 'Neutral' | 'Negative' | ''>('');
  const [qaRange, setQaRange] = useState('');
  const [dateRange, setDateRange] = useState('');

  // Main UI States
  const [activeTab, setActiveTab] = useState<'All' | 'Calls' | 'Flagged review' | 'High score' | 'Low score'>('All');
  const [sortOption, setSortOption] = useState<'Date' | 'Duration' | 'Score'>('Score');

  // Modals & Slideovers
  const [selectedScoreForDetails, setSelectedScoreForDetails] = useState<CallScore | null>(null);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [expandedScorecardId, setExpandedScorecardId] = useState<string | null>(null);
  const [editingScorecardId, setEditingScorecardId] = useState<string | null>(null);

  // Manual Review States
  const [showReviewedCalls, setShowReviewedCalls] = useState(true);
  const [reviewingCall, setReviewingCall] = useState<any | null>(null);
  const [overrideScoreInput, setOverrideScoreInput] = useState<string>('');
  const [reviewerNotesInput, setReviewerNotesInput] = useState<string>('');

  // Manage Scorecards Modal Sub-tabs
  const [manageTab, setManageTab] = useState<'list' | 'create' | 'simulator'>('list');

  // New Scorecard Form State
  const [newScName, setNewScName] = useState('');
  const [newScIsActive, setNewScIsActive] = useState(true);
  const [newScVersion, setNewScVersion] = useState('v1');
  const [newScLifecycle, setNewScLifecycle] = useState('ACTIVE');
  const [newScQuestions, setNewScQuestions] = useState<Question[]>([
    { id: 'q1', text: 'Did the representative introduce themselves politely?', scoringCondition: 'Intro validation' }
  ]);
  const [formError, setFormError] = useState<string | null>(null);

  // Simulator State
  const [simCallIdx, setSimCallIdx] = useState(0);
  const [simScorecardId, setSimScorecardId] = useState('');
  const [simStatus, setSimStatus] = useState<'idle' | 'pending' | 'scoring' | 'completed' | 'failed'>('idle');
  const [simLogs, setSimLogs] = useState<string[]>([]);

  const fetchScorecards = async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/api/v1/m02-conversation-intelligence/scorecards?t=${Date.now()}`, {
        headers: { 
          'x-tenant-id': 'tenant-123',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      if (res.ok) {
        const data = await res.json();
        setScorecards(data);
        if (data.length > 0 && !simScorecardId) {
          setSimScorecardId(data[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAllScores = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBaseUrl}/api/v1/m02-conversation-intelligence/scores?t=${Date.now()}`, {
        headers: { 
          'x-tenant-id': 'tenant-123',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      if (res.ok) {
        const data = await res.json();
        setCallScores(data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScorecards();
    fetchAllScores();
  }, [apiBaseUrl]);

  // Form helpers
  const addQuestion = () => {
    const nextId = `q${newScQuestions.length + 1}`;
    setNewScQuestions([...newScQuestions, { id: nextId, text: '', scoringCondition: '' }]);
  };
  const removeQuestion = (idx: number) => {
    setNewScQuestions(newScQuestions.filter((_, i) => i !== idx));
  };
  const handleQuestionChange = (idx: number, field: keyof Question, val: string) => {
    const updated = [...newScQuestions];
    updated[idx] = { ...updated[idx], [field]: val };
    setNewScQuestions(updated);
  };

  const resetForm = () => {
    setNewScName('');
    setNewScIsActive(true);
    setNewScVersion('v1');
    setNewScLifecycle('ACTIVE');
    setNewScQuestions([{ id: 'q1', text: 'Did the representative introduce themselves politely?', scoringCondition: 'Intro validation' }]);
    setEditingScorecardId(null);
    setFormError(null);
  };

  const handleCreateScorecard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newScName.trim()) {
      setFormError('Scorecard name is required');
      return;
    }
    if (newScQuestions.some(q => !q.text.trim())) {
      setFormError('All question texts must be filled out');
      return;
    }
    try {
      setFormError(null);
      const res = await fetch(`${apiBaseUrl}/api/v1/m02-conversation-intelligence/scorecards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': 'tenant-123'
        },
        body: JSON.stringify({
          id: editingScorecardId || undefined,
          name: newScName,
          isActive: newScIsActive,
          version: newScVersion,
          lifecycleState: newScLifecycle,
          questions: newScQuestions.map(q => ({
            id: q.id,
            text: q.text,
            scoringCondition: q.scoringCondition
          }))
        })
      });
      if (res.ok) {
        resetForm();
        setManageTab('list');
        fetchScorecards();
      } else {
        const err = await res.json();
        setFormError(err.message || 'Failed to create scorecard');
      }
    } catch (err) {
      setFormError('Failed to communicate with API');
    }
  };

  const handleSubmitReview = async (approveOnly: boolean) => {
    if (!reviewingCall) return;
    const payload = {
      overrideScore: approveOnly ? null : (overrideScoreInput ? Number(overrideScoreInput) : null),
      reviewerNotes: reviewerNotesInput
    };
    try {
      const res = await fetch(`${apiBaseUrl}/api/v1/m02-conversation-intelligence/scores/${reviewingCall.id}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': 'tenant-123'
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const updatedScore = await res.json();
        
        // Immediately update local state to ensure instant and reliable UI synchronization
        setCallScores(prevScores => 
          prevScores.map(score => {
            if (score.id === reviewingCall.id || score.scoreId === reviewingCall.id) {
              return {
                ...score,
                ...updatedScore,
                scoreId: updatedScore.id,
                // Preserve UI-only properties that might not be in the raw DB model
                scorecard: score.scorecard,
                title: score.title,
                client: score.client,
                agent: score.agent,
                date: score.date,
                duration: score.duration,
                snippet: updatedScore.summary || score.snippet,
                transcript: score.transcript,
                channel: score.channel,
                sentiment: score.sentiment,
                tags: updatedScore.tags && updatedScore.tags.length > 0 ? updatedScore.tags : score.tags
              };
            }
            return score;
          })
        );

        setReviewingCall(null);
        setOverrideScoreInput('');
        setReviewerNotesInput('');
        fetchAllScores();
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to submit review');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to communicate with API');
    }
  };

  // Simulator triggers
  const addSimLog = (msg: string) => {
    setSimLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const handleStartIngestion = async () => {
    const activeSc = scorecards.find(s => s.id === simScorecardId);
    if (!activeSc) {
      alert('Please create or select a scorecard first');
      return;
    }
    const call = SAMPLE_CALLS[simCallIdx];
    setSimStatus('pending');
    setSimLogs([]);
    addSimLog(`Trigger: call.transcription.completed received for callId: ${call.id}`);
    addSimLog(`Creating delayed scoring job with 5-minute fallback timer...`);

    try {
      const res = await fetch(`${apiBaseUrl}/api/v1/m02-conversation-intelligence/trigger/transcription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': 'tenant-123'
        },
        body: JSON.stringify({
          tenantId: 'tenant-123',
          callId: call.id,
          transcript: call.transcript,
          speakerSegments: call.segments
        })
      });
      if (res.ok) {
        addSimLog(`Job registered: score:tenant-123:${call.id}:${activeSc.id}:${activeSc.version}`);
        addSimLog(`Waiting for CRM opportunity linked context (revenue_graph.entity.linked)...`);
      } else {
        setSimStatus('failed');
      }
    } catch (err) {
      setSimStatus('failed');
    }
  };

  const handleLinkCRM = async () => {
    if (simStatus !== 'pending') return;
    const call = SAMPLE_CALLS[simCallIdx];
    setSimStatus('scoring');
    addSimLog(`Trigger: revenue_graph.entity.linked received. Promoting job immediately.`);
    addSimLog(`Evaluating call against scorecard...`);
    try {
      const res = await fetch(`${apiBaseUrl}/api/v1/m02-conversation-intelligence/trigger/linked`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': 'tenant-123'
        },
        body: JSON.stringify({
          tenantId: 'tenant-123',
          callId: call.id,
          linkedContext: { opportunityId: 'opp_123', amount: '$100k' }
        })
      });
      if (res.ok) {
        setTimeout(async () => {
          setSimStatus('completed');
          addSimLog(`AI scoring completed. Event call.scored published successfully.`);
          fetchAllScores();
        }, 1000);
      } else {
        setSimStatus('failed');
      }
    } catch (err) {
      setSimStatus('failed');
    }
  };

  const handleFallbackScoring = async () => {
    if (simStatus !== 'pending') return;
    const call = SAMPLE_CALLS[simCallIdx];
    setSimStatus('scoring');
    addSimLog(`Fallback timer expired. Running evaluation with default options...`);
    try {
      const res = await fetch(`${apiBaseUrl}/api/v1/m02-conversation-intelligence/trigger/linked`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': 'tenant-123'
        },
        body: JSON.stringify({
          tenantId: 'tenant-123',
          callId: call.id,
          linkedContext: {}
        })
      });
      if (res.ok) {
        setTimeout(async () => {
          setSimStatus('completed');
          addSimLog(`Fallback scoring completed. Event call.scored published.`);
          fetchAllScores();
        }, 1000);
      } else {
        setSimStatus('failed');
      }
    } catch (err) {
      setSimStatus('failed');
    }
  };

  // Filter application
  const filteredScores = callScores.filter(score => {
    // Search input checks
    if (selectedScorecardId && score.scorecardId !== selectedScorecardId) return false;
    if (participant) {
      const pLower = participant.toLowerCase();
      const agentMatch = score.agent && score.agent.toLowerCase().includes(pLower);
      const clientMatch = score.client && score.client.toLowerCase().includes(pLower);
      if (!agentMatch && !clientMatch) return false;
    }
    if (callTitle && !score.title?.toLowerCase().includes(callTitle.toLowerCase())) return false;
    if (sentiment && score.sentiment !== sentiment) return false;

    // QA score range check
    if (qaRange === 'high' && score.totalScore < 85) return false;
    if (qaRange === 'low' && score.totalScore >= 75) return false;

    // Date filter
    if (dateRange === 'may18') {
      const dStr = score.date ? new Date(score.date).toISOString().split('T')[0] : '';
      if (dStr !== '2026-05-18') return false;
    }

    // Main Tab filters
    if (activeTab === 'Flagged review') {
      if (!score.flaggedReview) return false;
      if (!showReviewedCalls && score.isReviewed) return false;
      if (score.totalScore >= 80) return false;
    }
    if (activeTab === 'Calls' && score.channel !== 'call') return false;
    if (activeTab === 'High score' && score.totalScore < 80) return false;
    if (activeTab === 'Low score' && score.totalScore >= 70) return false;

    return true;
  });

  // Sort application
  const sortedScores = [...filteredScores].sort((a, b) => {
    if (sortOption === 'Date') {
      const timeA = a.date ? new Date(a.date).getTime() : 0;
      const timeB = b.date ? new Date(b.date).getTime() : 0;
      return timeB - timeA;
    } else if (sortOption === 'Duration') {
      return (b.duration || '').localeCompare(a.duration || '');
    } else {
      return b.totalScore - a.totalScore;
    }
  });

  // Score distribution counts (simple mock for chart)
  const averageScore = callScores.length > 0 
    ? Math.round(callScores.reduce((acc, curr) => acc + curr.totalScore, 0) / callScores.length)
    : 0;

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%', background: '#f8fafc' }}>
      
      {/* 🔍 FILTER SIDEBAR */}
      <aside className="rev-filters-sidebar" style={{ background: '#ffffff', borderRight: '1px solid #e2e8f0', width: '280px', display: 'flex', flexDirection: 'column', padding: '20px', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingBottom: '12px', borderBottom: '1px solid #e2e8f0' }}>
          <Filter style={{ width: '14px', height: '14px', color: 'var(--accent-purple)' }} />
          <span style={{ fontSize: '13px', fontWeight: '800', color: '#1e293b' }}>Filters</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1, overflowY: 'auto' }}>
          
          {/* Scorecard Filter */}
          <div>
            <label className="rev-filter-label">Scorecard</label>
            <select 
              value={selectedScorecardId} 
              onChange={e => setSelectedScorecardId(e.target.value)}
              className="rev-select"
            >
              <option value="">All active scorecards</option>
              {scorecards.map(sc => (
                <option key={sc.id} value={sc.id}>{sc.name} ({sc.version})</option>
              ))}
            </select>
          </div>

          {/* Participants */}
          <div>
            <label className="rev-filter-label">Participants</label>
            <input 
              type="text" 
              placeholder="Search reps or clients..." 
              value={participant}
              onChange={e => setParticipant(e.target.value)}
              className="rev-input"
            />
          </div>

          {/* Call Title */}
          <div>
            <label className="rev-filter-label">Call Title</label>
            <input 
              type="text" 
              placeholder="e.g. Discovery, Security" 
              value={callTitle}
              onChange={e => setCallTitle(e.target.value)}
              className="rev-input"
            />
          </div>

          {/* Sentiment Tone */}
          <div>
            <label className="rev-filter-label">Sentiment Tone</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
              {(['Positive', 'Neutral', 'Negative'] as const).map(s => {
                const isSel = sentiment === s;
                return (
                  <button
                    key={s}
                    onClick={() => setSentiment(isSel ? '' : s)}
                    style={{
                      padding: '6px 0', fontSize: '10px', fontWeight: '700', borderRadius: '6px', border: '1px solid', cursor: 'pointer',
                      borderColor: isSel ? 'rgba(99, 102, 241, 0.4)' : '#cbd5e1',
                      background: isSel ? 'rgba(99, 102, 241, 0.08)' : '#ffffff',
                      color: isSel ? 'var(--accent-purple)' : '#64748b'
                    }}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          {/* QA Score Range */}
          <div>
            <label className="rev-filter-label">QA Score Range</label>
            <select 
              value={qaRange} 
              onChange={e => setQaRange(e.target.value)}
              className="rev-select"
            >
              <option value="">Any Score</option>
              <option value="high">High Score (&ge; 85%)</option>
              <option value="low">Low Score (&lt; 75%)</option>
            </select>
          </div>

          {/* Date range */}
          <div>
            <label className="rev-filter-label">Date range</label>
            <select 
              value={dateRange} 
              onChange={e => setDateRange(e.target.value)}
              className="rev-select"
            >
              <option value="">Any Date</option>
              <option value="may18">May 18, 2026</option>
            </select>
          </div>

        </div>

        <button 
          onClick={() => {
            setSelectedScorecardId('');
            setParticipant('');
            setCallTitle('');
            setSentiment('');
            setQaRange('');
            setDateRange('');
          }}
          style={{ width: '100%', padding: '10px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#64748b', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
        >
          Reset Filters
        </button>
      </aside>

      {/* 📊 MAIN RESULTS PANEL */}
      <main className="rev-results-panel" style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
        
        {/* Title Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid #e2e8f0' }}>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: '800', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Call reviews
              <span style={{ fontSize: '11px', background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#475569', padding: '2px 8px', borderRadius: '99px', fontWeight: '700' }}>
                {sortedScores.length} reviews
              </span>
            </h2>
            <p style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', marginTop: '2px' }}>
              Audit and evaluate call transcripts using scorecards and AI insights
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={() => {
                resetForm();
                setIsManageModalOpen(true);
                setManageTab('list');
              }}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', fontSize: '11px', background: 'var(--accent-purple)', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '700', cursor: 'pointer' }}
            >
              <FileText size={14} />
              Manage Scorecards
            </button>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="rev-tab-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', gap: '4px' }}>
            {(['All', 'Calls', 'Flagged review', 'High score', 'Low score'] as const).map(tab => {
              const isAct = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    background: 'none', border: 'none', padding: '8px 16px', fontSize: '12px', fontWeight: '700',
                    color: isAct ? 'var(--accent-purple)' : '#64748b',
                    borderBottom: isAct ? '2px solid var(--accent-purple)' : '2px solid transparent',
                    cursor: 'pointer'
                  }}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          {activeTab === 'Flagged review' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingRight: '16px' }}>
              <input 
                type="checkbox"
                id="showReviewedCallsCheckbox"
                checked={showReviewedCalls}
                onChange={(e) => setShowReviewedCalls(e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              <label 
                htmlFor="showReviewedCallsCheckbox"
                style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', cursor: 'pointer', userSelect: 'none' }}
              >
                Include Reviewed Calls
              </label>
            </div>
          )}
        </div>

        {/* trend and QA cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          
          {/* Trend chart */}
          <div className="rev-chart-box" style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '9px', color: '#94a3b8', fontWeight: '800', textTransform: 'uppercase' }}>Review Score Distribution</span>
            <span style={{ fontSize: '12px', fontWeight: '800', color: '#1e293b' }}>QA Performance Trend</span>
            <div style={{ height: '90px', width: '100%', marginTop: '4px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '0 8px' }}>
              {/* Simple graphic distribution bars */}
              {[45, 60, 75, 95, 85, 92, 78, 88, 90, 94].map((h, i) => (
                <div 
                  key={i} 
                  style={{
                    width: '8%', 
                    height: `${h}%`, 
                    background: h >= 85 ? 'var(--accent-purple)' : h < 75 ? 'rgba(239, 68, 68, 0.7)' : 'rgba(99, 102, 241, 0.4)', 
                    borderRadius: '3px 3px 0 0'
                  }} 
                />
              ))}
            </div>
          </div>

          {/* Density chart */}
          <div className="rev-chart-box" style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '9px', color: '#94a3b8', fontWeight: '800', textTransform: 'uppercase' }}>Overall Average Score</span>
              <span style={{ fontSize: '20px', fontWeight: '900', color: '#1e293b' }}>{averageScore || 85}%</span>
              <span style={{ fontSize: '10px', color: '#64748b' }}>Across all processed evaluations</span>
            </div>
            
            <div style={{ width: '70px', height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              <svg style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }} viewBox="0 0 36 36">
                <path
                  stroke="#f1f5f9"
                  strokeWidth="3.5"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  stroke="var(--accent-purple)"
                  strokeWidth="3.5"
                  strokeDasharray={`${averageScore || 85}, 100`}
                  strokeLinecap="round"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span style={{ position: 'absolute', fontSize: '11px', fontWeight: '800', color: '#1e293b' }}>{averageScore || 85}%</span>
            </div>
          </div>
        </div>

        {/* Sort and Count */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '10px' }}>
          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>Showing {sortedScores.length} evaluations</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', color: '#64748b' }}>Sort by:</span>
            <div style={{ display: 'flex', gap: '4px' }}>
              {(['Date', 'Duration', 'Score'] as const).map(opt => {
                const isSel = sortOption === opt;
                return (
                  <button
                    key={opt}
                    onClick={() => setSortOption(opt)}
                    style={{
                      background: 'none', border: 'none', fontSize: '11px', fontWeight: '700', cursor: 'pointer',
                      color: isSel ? 'var(--accent-purple)' : '#94a3b8'
                    }}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Results Cards List */}
        {loading ? (
          <div style={{ padding: '40px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', textAlign: 'center', color: '#94a3b8', fontSize: '12px', fontWeight: '600' }}>
            Retrieving call evaluations...
          </div>
        ) : sortedScores.length === 0 ? (
          <div style={{ padding: '40px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', textAlign: 'center', color: '#94a3b8', fontSize: '12px', fontWeight: '600' }}>
            No matching scorecards evaluations found. Click &quot;Manage Scorecards&quot; to configure checklists.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {sortedScores.map(score => {
              const title = score.title || 'Conversation Record';
              const client = score.client || 'Client Corp';
              const agent = score.agent || 'Representative';
              const snippet = score.snippet || '';
              const tags = score.tags || [score.sentiment || 'Neutral', score.channel || 'call'];
              return (
                <div 
                  key={score.id}
                  style={{
                    background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '16px',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.3)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = '#e2e8f0'}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '13px', fontWeight: '800', color: '#1e293b' }}>{title}</span>
                      <span style={{ fontSize: '9px', fontFamily: 'monospace', background: '#f1f5f9', color: '#64748b', padding: '2px 6px', borderRadius: '4px' }}>
                        {score.scorecard?.name || 'Scorecard'} v{score.scorecardVersion}
                      </span>
                      {score.scoringSource && (
                        <span style={{ 
                          fontSize: '9px', 
                          background: score.scoringSource === 'AI_MODEL' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(100, 116, 139, 0.08)', 
                          color: score.scoringSource === 'AI_MODEL' ? '#059669' : '#475569', 
                          padding: '2px 6px', 
                          borderRadius: '4px',
                          fontWeight: '800'
                        }}>
                          {score.scoringSource === 'AI_MODEL' ? '✨ AI Model' : '⚙ Fallback Evaluator'}
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: '11px', color: '#64748b' }}>
                      Client: <span style={{ fontWeight: '700', color: '#334155' }}>{client}</span> • Agent: <span style={{ fontWeight: '700', color: '#334155' }}>{agent}</span>
                    </div>

                    <p style={{ fontSize: '11px', color: '#64748b', fontStyle: 'italic', background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: '6px', padding: '10px 12px', marginTop: '4px' }}>
                      &ldquo;{snippet}&rdquo;
                    </p>

                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                      {tags.map(t => (
                        <span key={t} style={{ fontSize: '10px', background: 'rgba(99, 102, 241, 0.05)', color: 'var(--accent-purple)', padding: '2px 8px', borderRadius: '4px', fontWeight: '700' }}>
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'end', gap: '8px', flexShrink: 0 }}>
                    {/* QA score badge */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '4px 10px', borderRadius: '8px' }}>
                      <span style={{ fontSize: '10px', fontWeight: '700', color: '#059669' }}>QA score</span>
                      <span style={{ fontSize: '12px', fontWeight: '900', color: '#059669' }}>
                        {score.totalScore}%
                      </span>
                    </div>

                    {/* Flagged review badge / action button */}
                    {score.flaggedReview && (
                      score.isReviewed ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'end' }}>
                          <span style={{ fontSize: '9px', background: 'rgba(16, 185, 129, 0.1)', color: '#059669', padding: '2px 8px', borderRadius: '4px', fontWeight: '800' }}>
                            ✅ Reviewed
                          </span>
                          <button
                            onClick={() => {
                              setReviewingCall(score);
                              setOverrideScoreInput(score.originalScore !== undefined ? String(score.totalScore) : '');
                              setReviewerNotesInput(score.reviewerNotes || '');
                            }}
                            style={{ background: 'none', border: 'none', color: 'var(--accent-purple)', fontSize: '10px', fontWeight: '700', padding: 0, cursor: 'pointer', textDecoration: 'underline' }}
                          >
                            View Review
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setReviewingCall(score);
                            setOverrideScoreInput('');
                            setReviewerNotesInput('');
                          }}
                          style={{
                            background: 'var(--accent-purple)', color: '#fff', border: 'none', padding: '5px 12px', fontSize: '11px', borderRadius: '6px', fontWeight: '800', cursor: 'pointer'
                          }}
                        >
                          Review
                        </button>
                      )
                    )}

                    {!score.flaggedReview && (
                      <span style={{ fontSize: '9px', background: 'rgba(100, 116, 139, 0.08)', color: '#64748b', padding: '2px 8px', borderRadius: '4px', fontWeight: '700' }}>
                        Auto-Approved
                      </span>
                    )}

                    <button 
                      onClick={() => setSelectedScoreForDetails(score)}
                      style={{ marginTop: 'auto', background: 'none', border: '1px solid #cbd5e1', padding: '6px 12px', fontSize: '11px', borderRadius: '6px', fontWeight: '700', color: '#475569', cursor: 'pointer' }}
                    >
                      Details &gt;
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* 🔳 SCORECARD & SIMULATOR MANAGEMENT MODAL */}
      {isManageModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', width: '90%', maxWidth: '750px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid #e2e8f0' }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: '850', color: '#1e293b' }}>Manage Call Scorecards</h3>
                <p style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Configure audit parameters or simulate queue ingestion</p>
              </div>
              <button 
                onClick={() => {
                  resetForm();
                  setIsManageModalOpen(false);
                }}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Navigation */}
            <div style={{ display: 'flex', gap: '16px', padding: '0 24px', borderBottom: '1px solid #e2e8f0' }}>
              {[
                { id: 'list', label: 'Active Scorecards' },
                { id: 'create', label: editingScorecardId ? 'Edit Scorecard' : 'Create Scorecard' },
                { id: 'simulator', label: 'Queue Simulator' }
              ].map(tab => {
                const isAct = manageTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      if (tab.id !== 'create') {
                        resetForm();
                      }
                      setManageTab(tab.id as any);
                    }}
                    style={{
                      background: 'none', border: 'none', padding: '12px 4px', fontSize: '12px', fontWeight: '700',
                      color: isAct ? 'var(--accent-purple)' : '#64748b',
                      borderBottom: isAct ? '2px solid var(--accent-purple)' : '2px solid transparent',
                      cursor: 'pointer'
                    }}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Modal Body content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
              
              {/* Tab: LIST */}
              {manageTab === 'list' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {scorecards.length === 0 ? (
                    <div style={{ fontSize: '11px', color: '#94a3b8', textAlign: 'center', paddingTop: '20px', paddingBottom: '20px' }}>No scorecards found. Go to Create tab to build one!</div>
                  ) : (
                    scorecards.map(sc => {
                      const isExpanded = expandedScorecardId === sc.id;
                      return (
                        <div 
                          key={sc.id} 
                          style={{ 
                            background: '#f8fafc', 
                            border: '1px solid #e2e8f0', 
                            borderRadius: '8px', 
                            overflow: 'hidden', 
                            transition: 'all 0.2s ease',
                            ...(isExpanded && { borderLeft: '4px solid var(--accent-purple)' })
                          }}
                        >
                          <div 
                            onClick={() => {
                              setNewScName(sc.name);
                              setNewScIsActive(sc.isActive);
                              setNewScVersion(sc.version);
                              setNewScLifecycle(sc.lifecycleState);
                              setNewScQuestions(sc.questions || []);
                              setEditingScorecardId(sc.id);
                              setManageTab('create');
                            }}
                            style={{ 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              alignItems: 'center', 
                              padding: '12px 16px', 
                              cursor: 'pointer',
                              userSelect: 'none',
                              background: '#f8fafc',
                              transition: 'background 0.15s ease'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                            onMouseLeave={(e) => e.currentTarget.style.background = '#f8fafc'}
                          >
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '12px', fontWeight: '800', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                {sc.name}
                                <span style={{ fontSize: '9px', background: 'rgba(99, 102, 241, 0.08)', color: 'var(--accent-purple)', padding: '2px 8px', borderRadius: '4px', fontWeight: '700' }}>
                                  {sc.lifecycleState}
                                </span>
                              </div>
                              <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
                                Questions: {sc.questions?.length || 0} • Version: {sc.version} • Click to edit scorecard
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => {
                                  setNewScName(sc.name);
                                  setNewScIsActive(sc.isActive);
                                  setNewScVersion(sc.version);
                                  setNewScLifecycle(sc.lifecycleState);
                                  setNewScQuestions(sc.questions || []);
                                  setEditingScorecardId(sc.id);
                                  setManageTab('create');
                                }}
                                style={{
                                  fontSize: '9.5px',
                                  background: 'rgba(99, 102, 241, 0.12)',
                                  color: 'var(--accent-purple)',
                                  padding: '4px 10px',
                                  borderRadius: '6px',
                                  fontWeight: '800',
                                  border: 'none',
                                  cursor: 'pointer'
                                }}
                              >
                                Edit
                              </button>
                              
                              <button
                                onClick={() => setExpandedScorecardId(isExpanded ? null : sc.id)}
                                style={{
                                  fontSize: '9.5px',
                                  background: 'rgba(100, 116, 139, 0.1)',
                                  color: '#475569',
                                  padding: '4px 10px',
                                  borderRadius: '6px',
                                  fontWeight: '800',
                                  border: 'none',
                                  cursor: 'pointer'
                                }}
                              >
                                {isExpanded ? 'Hide' : 'Questions'}
                              </button>

                              <button
                                onClick={async () => {
                                  try {
                                    await fetch(`${apiBaseUrl}/api/v1/m02-conversation-intelligence/scorecards`, {
                                      method: 'POST',
                                      headers: {
                                        'Content-Type': 'application/json',
                                        'x-tenant-id': 'tenant-123'
                                      },
                                      body: JSON.stringify({
                                        id: sc.id,
                                        name: sc.name,
                                        isActive: !sc.isActive,
                                        version: sc.version,
                                        lifecycleState: sc.lifecycleState,
                                        questions: sc.questions
                                      })
                                    });
                                    fetchScorecards();
                                    fetchAllScores();
                                  } catch (err) {
                                    console.error(err);
                                  }
                                }}
                                style={{
                                  fontSize: '9.5px', 
                                  background: sc.isActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                  color: sc.isActive ? '#059669' : '#dc2626', 
                                  padding: '4px 12px', 
                                  borderRadius: '6px',
                                  fontWeight: '800', 
                                  border: 'none', 
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                {sc.isActive ? 'Deactivate' : 'Activate'}
                              </button>
                            </div>
                          </div>

                          {/* Expanded Details Pane */}
                          {isExpanded && (
                            <div style={{ padding: '16px', background: '#ffffff', borderTop: '1px solid #e2e8f0' }}>
                              <h4 style={{ fontSize: '10px', fontWeight: '850', color: '#64748b', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Scorecard Questions & Evaluation Criteria
                              </h4>
                              
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {(!sc.questions || sc.questions.length === 0) ? (
                                  <div style={{ fontSize: '10px', color: '#94a3b8', fontStyle: 'italic' }}>No questions configured for this scorecard.</div>
                                ) : (
                                  sc.questions.map((q, idx) => (
                                    <div 
                                      key={q.id || idx} 
                                      style={{ 
                                        padding: '10px 12px', 
                                        background: '#f8fafc', 
                                        border: '1px solid #e2e8f0', 
                                        borderRadius: '6px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '4px'
                                      }}
                                    >
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--accent-purple)' }}>Question #{idx + 1}</span>
                                        {q.scoringCondition && (
                                          <span style={{ fontSize: '9px', background: '#e0f2fe', color: '#0369a1', padding: '2px 6px', borderRadius: '4px', fontWeight: '700' }}>
                                            Topic: {q.scoringCondition}
                                          </span>
                                        )}
                                      </div>
                                      <p style={{ fontSize: '11px', color: '#334155', fontWeight: '600', margin: 0 }}>{q.text}</p>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* Tab: CREATE */}
              {manageTab === 'create' && (
                <form onSubmit={handleCreateScorecard} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label className="rev-filter-label">Scorecard Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Compliance Checklist, Support Evaluation"
                      value={newScName}
                      onChange={e => setNewScName(e.target.value)}
                      className="rev-input"
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label className="rev-filter-label">Version</label>
                      <input 
                        type="text" 
                        value={newScVersion}
                        onChange={e => setNewScVersion(e.target.value)}
                        className="rev-input"
                      />
                    </div>
                    <div>
                      <label className="rev-filter-label">Lifecycle State</label>
                      <select 
                        value={newScLifecycle} 
                        onChange={e => setNewScLifecycle(e.target.value)}
                        className="rev-select"
                      >
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="DRAFT">DRAFT</option>
                        <option value="ARCHIVED">ARCHIVED</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                    <div>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: '#1e293b', display: 'block' }}>Deploy immediately</span>
                      <span style={{ fontSize: '9px', color: '#64748b' }}>Make this scorecard active for new incoming call reviews</span>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={newScIsActive}
                      onChange={e => setNewScIsActive(e.target.checked)}
                      style={{ cursor: 'pointer' }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid #e2e8f0', paddingTop: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label className="rev-filter-label" style={{ marginBottom: 0 }}>Questions Checklist</label>
                      <button 
                        type="button" 
                        onClick={addQuestion}
                        style={{ background: 'none', border: '1px solid var(--accent-purple)', color: 'var(--accent-purple)', padding: '4px 10px', fontSize: '10px', borderRadius: '6px', fontWeight: '700', cursor: 'pointer' }}
                      >
                        + Add Question
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '180px', overflowY: 'auto', paddingRight: '4px' }}>
                      {newScQuestions.map((q, idx) => (
                        <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', position: 'relative' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '9px', color: 'var(--accent-purple)', fontWeight: '700' }}>Question #{idx+1}</span>
                            {newScQuestions.length > 1 && (
                              <button 
                                type="button" 
                                onClick={() => removeQuestion(idx)}
                                style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '9px', fontWeight: '700', cursor: 'pointer' }}
                              >
                                Remove
                              </button>
                            )}
                          </div>
                          <input 
                            type="text" 
                            placeholder="e.g. Did the representative introduce themselves politely?"
                            value={q.text}
                            onChange={e => handleQuestionChange(idx, 'text', e.target.value)}
                            className="rev-input"
                          />
                          <input 
                            type="text" 
                            placeholder="Optional scoring condition keyword (e.g. Intro)"
                            value={q.scoringCondition}
                            onChange={e => handleQuestionChange(idx, 'scoringCondition', e.target.value)}
                            className="rev-input"
                            style={{ fontSize: '11px', opacity: 0.8 }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {formError && <div style={{ fontSize: '11px', color: '#dc2626', fontWeight: '700' }}>{formError}</div>}

                  <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                    <button 
                      type="submit"
                      style={{ flex: 1, padding: '12px', background: 'var(--accent-purple)', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                    >
                      {editingScorecardId ? 'Save Changes' : 'Save Scorecard'}
                    </button>
                    {editingScorecardId && (
                      <button 
                        type="button"
                        onClick={() => {
                          resetForm();
                          setManageTab('list');
                        }}
                        style={{ padding: '12px 18px', background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              )}

              {/* Tab: SIMULATOR */}
              {manageTab === 'simulator' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label className="rev-filter-label">1. Choose Call Context</label>
                      <select 
                        value={simCallIdx} 
                        onChange={e => setSimCallIdx(Number(e.target.value))}
                        className="rev-select"
                        disabled={simStatus === 'pending' || simStatus === 'scoring'}
                      >
                        {SAMPLE_CALLS.map((call, idx) => (
                          <option key={call.id} value={idx}>{call.title}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="rev-filter-label">2. Choose Scorecard</label>
                      <select 
                        value={simScorecardId} 
                        onChange={e => setSimScorecardId(e.target.value)}
                        className="rev-select"
                        disabled={simStatus === 'pending' || simStatus === 'scoring'}
                      >
                        {scorecards.filter(s => s.isActive).map(sc => (
                          <option key={sc.id} value={sc.id}>{sc.name} ({sc.version})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={handleStartIngestion}
                    disabled={simStatus === 'pending' || simStatus === 'scoring' || scorecards.length === 0}
                    style={{ width: '100%', padding: '12px', background: '#0284c7', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  >
                    <Play size={14} />
                    Simulate Call Ingestion Event
                  </button>

                  {/* Simulator Timeline status & overrides */}
                  {simStatus !== 'idle' && (
                    <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', background: '#f8fafc' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '11px', fontWeight: '800', color: '#1e293b' }}>Queue Job Status:</span>
                        <span style={{ fontSize: '10px', background: simStatus === 'completed' ? '#d1fae5' : '#fef3c7', color: simStatus === 'completed' ? '#065f46' : '#92400e', padding: '2px 8px', borderRadius: '99px', fontWeight: '800' }}>
                          {simStatus.toUpperCase()}
                        </span>
                      </div>

                      {simStatus === 'pending' && (
                        <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid #e2e8f0', paddingTop: '10px' }}>
                          <button
                            onClick={handleLinkCRM}
                            style={{ flex: 1, padding: '8px 12px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                          >
                            Link Opportunity (Promote)
                          </button>
                          <button
                            onClick={handleFallbackScoring}
                            style={{ flex: 1, padding: '8px 12px', background: 'none', border: '1px solid #cbd5e1', color: '#475569', borderRadius: '6px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                          >
                            Run Fallback (Timeout)
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Simulator Logs Terminal */}
                  <div style={{ height: '140px', background: '#0f172a', borderRadius: '8px', padding: '12px', fontFamily: 'monospace', color: '#f1f5f9', fontSize: '10px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {simLogs.length === 0 ? (
                      <span style={{ color: '#64748b' }}>No logs yet. Trigger call ingestion above.</span>
                    ) : (
                      simLogs.map((l, i) => <div key={i}>{l}</div>)
                    )}
                  </div>

                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* 🔳 SLIDE-OVER DRAWER FOR DETAILED EVALUATION */}
      {selectedScoreForDetails && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', justifyContent: 'flex-end', background: 'rgba(15, 23, 42, 0.4)' }}>
          <div style={{ background: '#ffffff', width: '100%', maxWidth: '580px', height: '100%', display: 'flex', flexDirection: 'column', borderLeft: '1px solid #e2e8f0', boxShadow: '-10px 0 25px -5px rgba(0,0,0,0.1)' }}>
            
            {/* Drawer Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #e2e8f0', flexShrink: 0 }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: '850', color: '#1e293b' }}>Evaluation Details</h3>
                <span style={{ fontSize: '10px', color: '#64748b' }}>Scorecard: {selectedScoreForDetails.scorecard?.name || 'Call Scorecard'}</span>
              </div>
              <button 
                onClick={() => setSelectedScoreForDetails(null)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Drawer Body content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Radial score box */}
              <div style={{ display: 'flex', gap: '20px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', alignItems: 'center' }}>
                <div style={{ width: '80px', height: '80px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }} viewBox="0 0 36 36">
                    <path
                      stroke="#e2e8f0"
                      strokeWidth="4"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      stroke="var(--accent-purple)"
                      strokeWidth="4"
                      strokeDasharray={`${selectedScoreForDetails.totalScore}, 100`}
                      strokeLinecap="round"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <span style={{ position: 'absolute', fontSize: '13px', fontWeight: '950', color: '#1e293b' }}>{selectedScoreForDetails.totalScore}</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '800', color: '#1e293b' }}>QA Audit Grade</div>
                  <div style={{ fontSize: '10px', color: '#64748b' }}>Aggregate matching confidence: <span style={{ fontWeight: '700', color: '#334155' }}>{Math.round(selectedScoreForDetails.confidenceScore * 100)}%</span></div>
                  <div style={{ fontSize: '10px', color: '#64748b' }}>Scoring Source: <span style={{ fontWeight: '800', color: selectedScoreForDetails.scoringSource === 'AI_MODEL' ? '#059669' : '#475569' }}>{selectedScoreForDetails.scoringSource === 'AI_MODEL' ? '✨ AI Model' : '⚙ Fallback Evaluator'}</span></div>
                  <div style={{ fontSize: '10px', color: '#64748b' }}>Processed: <span style={{ fontWeight: '700', color: '#334155' }}>{new Date(selectedScoreForDetails.scoredAt).toLocaleDateString()}</span></div>
                </div>
              </div>

              {/* Warning/clear banner */}
              {selectedScoreForDetails.flaggedReview ? (
                <div style={{ display: 'flex', gap: '10px', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '12px', borderRadius: '8px' }}>
                  <ShieldAlert className="text-red-500 flex-shrink-0" size={16} style={{ marginTop: '2px' }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '800', color: '#dc2626' }}>Flagged for Manual Review</span>
                    <span style={{ fontSize: '10px', color: '#ef4444', lineHeight: '1.4' }}>
                      Confidence scores for either individual answers or the overall match fell below minimum automated thresholds (overall &lt; 70% or answer &lt; 60%).
                    </span>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '10px', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '12px', borderRadius: '8px' }}>
                  <CheckCircle className="text-emerald-500 flex-shrink-0" size={16} style={{ marginTop: '2px' }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '800', color: '#059669' }}>Clears Automated Gating</span>
                    <span style={{ fontSize: '10px', color: '#047857' }}>All evaluated answers meet the minimum confidence validation requirements. No manual audit necessary.</span>
                  </div>
                </div>
              )}

              {/* Speech call metrics */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px' }}>
                <span style={{ fontSize: '10px', fontWeight: '850', color: '#1e293b', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px', textTransform: 'uppercase' }}>Speech call metrics</span>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#64748b' }}>
                    <span>Talk Ratio (Agent / Client)</span>
                    <span style={{ fontWeight: '700', color: '#1e293b' }}>
                      {Math.round(selectedScoreForDetails.derivedMetrics?.talkRatio?.agent * 100)}% / {Math.round(selectedScoreForDetails.derivedMetrics?.talkRatio?.customer * 100)}%
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '6px', borderRadius: '3px', background: '#f1f5f9', display: 'flex', overflow: 'hidden' }}>
                    <div style={{ width: `${selectedScoreForDetails.derivedMetrics?.talkRatio?.agent * 100}%`, background: 'var(--accent-purple)' }} />
                    <div style={{ width: `${selectedScoreForDetails.derivedMetrics?.talkRatio?.customer * 100}%`, background: '#10b981' }} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '4px' }}>
                  <div style={{ padding: '10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                    <span style={{ fontSize: '9px', color: '#94a3b8', display: 'block', textTransform: 'uppercase' }}>Question Rate</span>
                    <span style={{ fontSize: '13px', fontWeight: '800', color: '#1e293b' }}>{selectedScoreForDetails.derivedMetrics?.questionRate} <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 'normal' }}>/ min</span></span>
                  </div>
                  <div style={{ padding: '10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                    <span style={{ fontSize: '9px', color: '#94a3b8', display: 'block', textTransform: 'uppercase' }}>Longest Monologue</span>
                    <span style={{ fontSize: '13px', fontWeight: '800', color: '#1e293b' }}>{selectedScoreForDetails.derivedMetrics?.longestMonologue} <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 'normal' }}>sec</span></span>
                  </div>
                </div>
              </div>

              {/* Answers breakdown list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <span style={{ fontSize: '10px', fontWeight: '850', color: '#1e293b', textTransform: 'uppercase' }}>Automated Scoring Breakdown</span>
                
                {selectedScoreForDetails.aiAnswers?.map(ans => {
                  const matchingQuestion = selectedScoreForDetails.scorecard?.questions?.find(q => q.id === ans.questionId);
                  const isLowConf = ans.confidence < 0.60;
                  return (
                    <div key={ans.questionId} style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '14px', border: '1px solid #e2e8f0', borderRadius: '10px', background: '#f8fafc' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <span style={{ fontSize: '11px', fontWeight: '800', color: '#1e293b', maxWidth: '75%' }}>
                          {matchingQuestion?.text || `Question ${ans.questionId}`}
                        </span>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'end', flexShrink: 0 }}>
                          <span style={{ fontSize: '12px', fontWeight: '900', color: 'var(--accent-purple)' }}>{ans.score}/100</span>
                          <span style={{ fontSize: '9px', color: isLowConf ? '#ef4444' : '#64748b', fontWeight: isLowConf ? '800' : 'normal' }}>
                            {Math.round(ans.confidence * 100)}% conf {isLowConf && '⚠'}
                          </span>
                        </div>
                      </div>

                      <div style={{ fontSize: '11px', color: '#475569', lineHeight: '1.4', background: '#ffffff', border: '1px solid #e2e8f0', padding: '8px 12px', borderRadius: '6px' }}>
                        <span style={{ fontSize: '9px', color: '#94a3b8', fontWeight: '800', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>Evaluated Answer:</span>
                        {ans.answer}
                      </div>

                      {ans.evidence && (
                        <div style={{ fontSize: '11px', color: '#64748b', lineHeight: '1.4', borderLeft: '2px solid var(--accent-purple)', paddingLeft: '10px', fontStyle: 'italic' }}>
                          <span style={{ fontSize: '9px', color: 'var(--accent-purple)', fontWeight: '800', textTransform: 'uppercase', display: 'block', fontStyle: 'normal', marginBottom: '2px' }}>Evidence snippet:</span>
                          &ldquo;{ans.evidence}&rdquo;
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* 🔳 SLIDE-OVER DRAWER FOR MANUAL CALL REVIEW */}
      {reviewingCall && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', justifyContent: 'flex-end', background: 'rgba(15, 23, 42, 0.4)' }}>
          <div style={{ background: '#ffffff', width: '100%', maxWidth: '580px', height: '100%', display: 'flex', flexDirection: 'column', borderLeft: '1px solid #e2e8f0', boxShadow: '-10px 0 25px -5px rgba(0,0,0,0.1)' }}>
            
            {/* Drawer Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #e2e8f0', flexShrink: 0 }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: '850', color: '#1e293b' }}>Manual Call Review</h3>
                <span style={{ fontSize: '10px', color: '#64748b' }}>Scorecard: {reviewingCall.scorecard?.name || 'Call Scorecard'}</span>
              </div>
              <button 
                onClick={() => {
                  setReviewingCall(null);
                  setOverrideScoreInput('');
                  setReviewerNotesInput('');
                }}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Drawer Body content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Radial score box */}
              <div style={{ display: 'flex', gap: '20px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', alignItems: 'center' }}>
                <div style={{ width: '80px', height: '80px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }} viewBox="0 0 36 36">
                    <path
                      stroke="#e2e8f0"
                      strokeWidth="4"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      stroke="var(--accent-purple)"
                      strokeWidth="4"
                      strokeDasharray={`${reviewingCall.totalScore}, 100`}
                      strokeLinecap="round"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <span style={{ position: 'absolute', fontSize: '13px', fontWeight: '950', color: '#1e293b' }}>{reviewingCall.totalScore}</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '800', color: '#1e293b' }}>AI Score & Confidence</div>
                  <div style={{ fontSize: '10px', color: '#64748b' }}>Aggregate confidence: <span style={{ fontWeight: '700', color: '#334155' }}>{Math.round(reviewingCall.confidenceScore * 100)}%</span></div>
                  <div style={{ fontSize: '10px', color: '#64748b' }}>Status: <span style={{ fontWeight: '800', color: reviewingCall.isReviewed ? '#059669' : '#dc2626' }}>{reviewingCall.isReviewed ? '✅ Reviewed' : '⚠ Pending Manual Review'}</span></div>
                  {reviewingCall.originalScore !== undefined && (
                    <div style={{ fontSize: '10px', color: '#64748b' }}>Original Score: <span style={{ fontWeight: '700', color: '#334155' }}>{reviewingCall.originalScore}%</span></div>
                  )}
                </div>
              </div>

              {/* Review Manager Actions Form */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', border: '1px solid var(--accent-purple)', borderRadius: '12px', padding: '16px', background: 'rgba(99, 102, 241, 0.02)' }}>
                <span style={{ fontSize: '11px', fontWeight: '850', color: 'var(--accent-purple)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Manager Review Action</span>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label htmlFor="overrideScoreInput" style={{ fontSize: '11px', fontWeight: '700', color: '#475569' }}>Override QA Score (Optional)</label>
                  <input
                    type="number"
                    id="overrideScoreInput"
                    placeholder={`Keep original (${reviewingCall.totalScore}) or enter new score 0-100`}
                    min="0"
                    max="100"
                    value={overrideScoreInput}
                    onChange={(e) => setOverrideScoreInput(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      fontSize: '12px',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      outline: 'none',
                      background: '#ffffff'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label htmlFor="reviewerNotesInput" style={{ fontSize: '11px', fontWeight: '700', color: '#475569' }}>Reviewer Notes</label>
                  <textarea
                    id="reviewerNotesInput"
                    placeholder="Enter manual review findings, coachable moments, or justification for overriding score..."
                    rows={4}
                    value={reviewerNotesInput}
                    onChange={(e) => setReviewerNotesInput(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      fontSize: '12px',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      outline: 'none',
                      fontFamily: 'inherit',
                      resize: 'vertical',
                      background: '#ffffff'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                  <button
                    onClick={() => handleSubmitReview(false)}
                    style={{
                      flex: 1,
                      padding: '12px',
                      background: 'var(--accent-purple)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: '800',
                      cursor: 'pointer',
                      transition: 'background 0.15s ease'
                    }}
                  >
                    {overrideScoreInput ? 'Submit Override & Complete' : 'Submit Review Notes'}
                  </button>

                  <button
                    onClick={() => handleSubmitReview(true)}
                    style={{
                      padding: '12px 16px',
                      background: '#10b981',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: '800',
                      cursor: 'pointer',
                      transition: 'background 0.15s ease'
                    }}
                  >
                    Approve AI Review
                  </button>
                </div>
              </div>

              {/* Speech call metrics */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px' }}>
                <span style={{ fontSize: '10px', fontWeight: '850', color: '#1e293b', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px', textTransform: 'uppercase' }}>Speech call metrics</span>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#64748b' }}>
                    <span>Talk Ratio (Agent / Client)</span>
                    <span style={{ fontWeight: '700', color: '#1e293b' }}>
                      {Math.round(reviewingCall.derivedMetrics?.talkRatio?.agent * 100)}% / {Math.round(reviewingCall.derivedMetrics?.talkRatio?.customer * 100)}%
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '6px', borderRadius: '3px', background: '#f1f5f9', display: 'flex', overflow: 'hidden' }}>
                    <div style={{ width: `${reviewingCall.derivedMetrics?.talkRatio?.agent * 100}%`, background: 'var(--accent-purple)' }} />
                    <div style={{ width: `${reviewingCall.derivedMetrics?.talkRatio?.customer * 100}%`, background: '#10b981' }} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '4px' }}>
                  <div style={{ padding: '10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                    <span style={{ fontSize: '9px', color: '#94a3b8', display: 'block', textTransform: 'uppercase' }}>Question Rate</span>
                    <span style={{ fontSize: '13px', fontWeight: '800', color: '#1e293b' }}>{reviewingCall.derivedMetrics?.questionRate} <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 'normal' }}>/ min</span></span>
                  </div>
                  <div style={{ padding: '10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                    <span style={{ fontSize: '9px', color: '#94a3b8', display: 'block', textTransform: 'uppercase' }}>Longest Monologue</span>
                    <span style={{ fontSize: '13px', fontWeight: '800', color: '#1e293b' }}>{reviewingCall.derivedMetrics?.longestMonologue} <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 'normal' }}>sec</span></span>
                  </div>
                </div>
              </div>

              {/* Answers breakdown list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <span style={{ fontSize: '10px', fontWeight: '850', color: '#1e293b', textTransform: 'uppercase' }}>Automated Scoring Breakdown</span>
                
                {reviewingCall.aiAnswers?.map((ans: any) => {
                  const matchingQuestion = reviewingCall.scorecard?.questions?.find((q: any) => q.id === ans.questionId);
                  const isLowConf = ans.confidence < 0.60;
                  return (
                    <div key={ans.questionId} style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '14px', border: '1px solid #e2e8f0', borderRadius: '10px', background: '#f8fafc' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <span style={{ fontSize: '11px', fontWeight: '800', color: '#1e293b', maxWidth: '75%' }}>
                          {matchingQuestion?.text || `Question ${ans.questionId}`}
                        </span>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'end', flexShrink: 0 }}>
                          <span style={{ fontSize: '12px', fontWeight: '900', color: 'var(--accent-purple)' }}>{ans.score}/100</span>
                          <span style={{ fontSize: '9px', color: isLowConf ? '#ef4444' : '#64748b', fontWeight: isLowConf ? '800' : 'normal' }}>
                            {Math.round(ans.confidence * 100)}% conf {isLowConf && '⚠'}
                          </span>
                        </div>
                      </div>

                      <div style={{ fontSize: '11px', color: '#475569', lineHeight: '1.4', background: '#ffffff', border: '1px solid #e2e8f0', padding: '8px 12px', borderRadius: '6px' }}>
                        <span style={{ fontSize: '9px', color: '#94a3b8', fontWeight: '800', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>Evaluated Answer:</span>
                        {ans.answer}
                      </div>

                      {ans.evidence && (
                        <div style={{ fontSize: '11px', color: '#64748b', lineHeight: '1.4', borderLeft: '2px solid var(--accent-purple)', paddingLeft: '10px', fontStyle: 'italic' }}>
                          <span style={{ fontSize: '9px', color: 'var(--accent-purple)', fontWeight: '800', textTransform: 'uppercase', display: 'block', fontStyle: 'normal', marginBottom: '2px' }}>Evidence snippet:</span>
                          &ldquo;{ans.evidence}&rdquo;
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
