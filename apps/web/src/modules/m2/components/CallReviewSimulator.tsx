import React, { useState, useEffect } from 'react';
import { Play, Link2, Clock, AlertTriangle, CheckCircle, Database } from 'lucide-react';

interface Scorecard {
  id: string;
  name: string;
  version: string;
  isActive: boolean;
}

interface CallReviewSimulatorProps {
  apiBaseUrl: string;
  onScoringComplete: (callId: string) => void;
}

const PRESET_CALLS = [
  {
    id: 'sim_call_001',
    title: 'ACME Corp Opportunity discovery',
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
    transcript: 'Customer: Hello? Anyone there? Agent: Yes, hi, sorry about that. Customer: We need absolute confirmation on isolated data schemas. I am skeptical about the confidence in your system.',
    segments: [
      { speaker: 'Customer', text: 'Hello? Anyone there?', start: 0, end: 20 },
      { speaker: 'Agent', text: 'Yes, hi, sorry about that.', start: 20, end: 45 },
      { speaker: 'Customer', text: 'We need absolute confirmation on isolated data schemas. I am skeptical about the confidence in your system.', start: 45, end: 110 }
    ]
  }
];

export default function CallReviewSimulator({ apiBaseUrl, onScoringComplete }: CallReviewSimulatorProps) {
  const [scorecards, setScorecards] = useState<Scorecard[]>([]);
  const [selectedCallIdx, setSelectedCallIdx] = useState(0);
  const [selectedScorecardId, setSelectedScorecardId] = useState('');
  
  // Job state emulation
  const [jobStatus, setJobStatus] = useState<'idle' | 'pending' | 'scoring' | 'completed' | 'failed'>('idle');
  const [logs, setLogs] = useState<string[]>([]);
  const [jobKey, setJobKey] = useState('');

  const fetchScorecards = async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/api/v1/m02-conversation-intelligence/scorecards`, {
        headers: { 'x-tenant-id': 'tenant-123' }
      });
      if (res.ok) {
        const data = await res.json();
        const active = data.filter((s: any) => s.isActive);
        setScorecards(active);
        if (active.length > 0) {
          setSelectedScorecardId(active[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchScorecards();
  }, [apiBaseUrl]);

  const addLog = (msg: string) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const handleStartTranscription = async () => {
    if (!selectedScorecardId) {
      alert('Please create and select an active scorecard first!');
      return;
    }
    const call = PRESET_CALLS[selectedCallIdx];
    const scorecard = scorecards.find((s) => s.id === selectedScorecardId);
    if (!scorecard) return;

    setJobStatus('pending');
    setLogs([]);
    addLog(`Event: call.transcription.completed received for call ID: ${call.id}`);
    addLog(`Creating delayed scoring job with 5-minute fallback timer...`);

    const deterministicKey = `score:tenant-123:${call.id}:${scorecard.id}:${scorecard.version}`;
    setJobKey(deterministicKey);

    try {
      // Trigger transcription completed on backend
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
        addLog(`Job successfully registered in queue: ${deterministicKey}`);
        addLog(`Status: PENDING. Waiting for CRM entity linking (revenue_graph.entity.linked) or fallback window...`);
      } else {
        setJobStatus('failed');
        addLog(`Failed to register job on backend`);
      }
    } catch (err: any) {
      setJobStatus('failed');
      addLog(`Error: ${err.message}`);
    }
  };

  const handleLinkCRM = async () => {
    if (jobStatus !== 'pending') return;
    const call = PRESET_CALLS[selectedCallIdx];

    setJobStatus('scoring');
    addLog(`Event: revenue_graph.entity.linked received. Promoting job immediately.`);
    addLog(`Triggering immediate scoring run against scorecard: ${selectedScorecardId}...`);

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
          linkedContext: {
            opportunityId: 'opp_acme_q2',
            amount: '$120,000',
            stage: 'Discovery'
          }
        })
      });

      if (res.ok) {
        // Wait a brief moment to allow backend process completion
        setTimeout(async () => {
          setJobStatus('completed');
          addLog(`AI scoring completed successfully.`);
          addLog(`Event: call.scored emitted to platform.`);
          onScoringComplete(call.id);
        }, 1200);
      } else {
        setJobStatus('failed');
        addLog(`Failed to score call on backend`);
      }
    } catch (err: any) {
      setJobStatus('failed');
      addLog(`Error: ${err.message}`);
    }
  };

  const handleFallbackScoring = async () => {
    if (jobStatus !== 'pending') return;
    const call = PRESET_CALLS[selectedCallIdx];

    setJobStatus('scoring');
    addLog(`Simulating fallback window expiry (5 minutes passed without CRM link).`);
    addLog(`Executing evaluation with empty fallback parameters...`);

    try {
      // Simulate promotion without CRM link by hitting the linked trigger with empty context
      const res = await fetch(`${apiBaseUrl}/api/v1/m02-conversation-intelligence/trigger/linked`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': 'tenant-123'
        },
        body: JSON.stringify({
          tenantId: 'tenant-123',
          callId: call.id,
          linkedContext: {} // Empty fallback parameters
        })
      });

      if (res.ok) {
        setTimeout(async () => {
          setJobStatus('completed');
          addLog(`Fallback AI evaluation finished successfully.`);
          addLog(`Event: call.scored emitted.`);
          onScoringComplete(call.id);
        }, 1200);
      } else {
        setJobStatus('failed');
        addLog(`Failed to execute fallback scoring`);
      }
    } catch (err: any) {
      setJobStatus('failed');
      addLog(`Error: ${err.message}`);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      {/* Selector and Config Panel */}
      <div className="lg:col-span-1 glass-panel p-6 flex flex-col gap-5 bg-slate-950/40">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Play size={16} className="text-cyan-400" />
            <h3 className="text-sm font-bold text-slate-200">Review Simulator</h3>
          </div>
          <span className="badge badge-cyan text-[9px]">Simulation Control</span>
        </div>

        <div className="flex flex-col gap-4">
          {/* Select Sample Call */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-mono uppercase text-slate-400">1. Select Sample Call</label>
            <select
              value={selectedCallIdx}
              onChange={(e) => setSelectedCallIdx(Number(e.target.value))}
              className="cyber-input"
              style={{ background: 'rgba(4, 8, 20, 0.9)' }}
              disabled={jobStatus === 'pending' || jobStatus === 'scoring'}
            >
              {PRESET_CALLS.map((call, idx) => (
                <option key={call.id} value={idx}>
                  {call.title}
                </option>
              ))}
            </select>
          </div>

          {/* Select Active Scorecard */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-mono uppercase text-slate-400">2. Select Active Scorecard</label>
            {scorecards.length === 0 ? (
              <div className="text-[10px] text-amber-400 font-mono p-2 rounded bg-amber-950/10 border border-amber-500/10">
                ⚠ No active scorecards available. Create one in Scorecards first!
              </div>
            ) : (
              <select
                value={selectedScorecardId}
                onChange={(e) => setSelectedScorecardId(e.target.value)}
                className="cyber-input"
                style={{ background: 'rgba(4, 8, 20, 0.9)' }}
                disabled={jobStatus === 'pending' || jobStatus === 'scoring'}
              >
                {scorecards.map((sc) => (
                  <option key={sc.id} value={sc.id}>
                    {sc.name} ({sc.version})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex flex-col gap-2 border-t border-slate-900 pt-4">
            <button
              onClick={handleStartTranscription}
              disabled={jobStatus === 'pending' || jobStatus === 'scoring' || scorecards.length === 0}
              className="btn-cyber btn-cyber-cyan w-full py-2.5 flex items-center justify-center gap-2"
            >
              <Clock size={14} />
              Start Call Ingestion
            </button>
          </div>
        </div>
      </div>

      {/* Real-time Queue and Flow Visualization Panel */}
      <div className="lg:col-span-2 glass-panel p-6 flex flex-col gap-6 bg-gradient-to-br from-slate-950/80 to-slate-900/30">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Database size={16} className="text-purple-400 animate-beacon" />
            <h3 className="text-sm font-bold text-slate-200">Execution Flow & Queue Logs</h3>
          </div>
          <span className={`badge ${
            jobStatus === 'pending' ? 'badge-amber' : 
            jobStatus === 'scoring' ? 'badge-purple' : 
            jobStatus === 'completed' ? 'badge-emerald' : 
            jobStatus === 'failed' ? 'badge-crimson' : 'badge-cyan'
          } text-[9px]`}>
            {jobStatus.toUpperCase()}
          </span>
        </div>

        {/* Timeline Visualization */}
        <div className="grid grid-cols-3 gap-4 border-b border-slate-900 pb-4">
          <div className={`p-3 rounded-lg border text-center flex flex-col items-center gap-1 ${
            jobStatus !== 'idle' ? 'bg-cyan-950/15 border-cyan-500/25 text-cyan-400' : 'bg-slate-900/40 border-slate-800 text-slate-500'
          }`}>
            <Clock size={16} />
            <span className="text-[10px] font-bold">1. Enqueue Job</span>
            <span className="text-[8px] font-mono">Transcript Ingested</span>
          </div>

          <div className={`p-3 rounded-lg border text-center flex flex-col items-center gap-1 ${
            jobStatus === 'scoring' || jobStatus === 'completed' 
              ? 'bg-purple-950/15 border-purple-500/25 text-purple-400' 
              : jobStatus === 'pending'
              ? 'bg-amber-950/15 border-amber-500/25 text-amber-400 animate-pulse'
              : 'bg-slate-900/40 border-slate-800 text-slate-500'
          }`}>
            <Link2 size={16} />
            <span className="text-[10px] font-bold">2. Promote / Link</span>
            <span className="text-[8px] font-mono">Link Opportunity</span>
          </div>

          <div className={`p-3 rounded-lg border text-center flex flex-col items-center gap-1 ${
            jobStatus === 'completed' ? 'bg-emerald-950/15 border-emerald-500/25 text-emerald-400' : 'bg-slate-900/40 border-slate-800 text-slate-500'
          }`}>
            <CheckCircle size={16} />
            <span className="text-[10px] font-bold">3. Scored</span>
            <span className="text-[8px] font-mono">Results Saved</span>
          </div>
        </div>

        {/* Control options during PENDING status */}
        {jobStatus === 'pending' && (
          <div className="flex gap-4 p-4 rounded-lg bg-amber-950/10 border border-amber-500/10">
            <div className="flex-1 flex flex-col gap-1">
              <span className="text-xs font-bold text-amber-200">Resolve Scoring Pipeline</span>
              <span className="text-[10px] text-amber-400">Choose whether to simulate receiving the CRM opportunity linked event (Promote) or letting the 5m fallback window expire.</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleLinkCRM}
                className="btn-cyber btn-cyber-emerald text-[10px] py-1.5 px-3 flex items-center gap-1"
              >
                Link CRM (Promote)
              </button>
              <button
                onClick={handleFallbackScoring}
                className="btn-cyber text-[10px] py-1.5 px-3 flex items-center gap-1"
                style={{ borderColor: 'rgba(255, 179, 0, 0.3)', color: 'var(--accent-amber)' }}
              >
                Fallback Scoring
              </button>
            </div>
          </div>
        )}

        {/* Interactive Logger Terminal */}
        <div className="flex-grow flex flex-col bg-slate-950 border border-slate-900 rounded-lg p-4 font-mono text-[10px] leading-relaxed h-[200px] overflow-y-auto">
          {logs.length === 0 ? (
            <div className="text-slate-600 flex items-center justify-center h-full text-center">
              <span>Run Call Ingestion to begin scoring simulator.</span>
            </div>
          ) : (
            logs.map((log, i) => (
              <div key={i} className="text-slate-300">
                {log}
              </div>
            ))
          )}
        </div>
      </div>
      
    </div>
  );
}
