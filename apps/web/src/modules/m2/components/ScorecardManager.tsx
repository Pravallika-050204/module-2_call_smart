import React, { useState, useEffect } from 'react';
import { Plus, Check, Play, Eye, FileText, Activity } from 'lucide-react';

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

interface ScorecardManagerProps {
  apiBaseUrl: string;
  onScorecardCreated?: () => void;
}

export default function ScorecardManager({ apiBaseUrl, onScorecardCreated }: ScorecardManagerProps) {
  const [scorecards, setScorecards] = useState<Scorecard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [version, setVersion] = useState('v1');
  const [lifecycleState, setLifecycleState] = useState('ACTIVE');
  const [questions, setQuestions] = useState<Question[]>([
    { id: 'q1', text: 'Did the representative introduce themselves politely?', scoringCondition: 'Intro validation' }
  ]);

  const fetchScorecards = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${apiBaseUrl}/api/v1/m02-conversation-intelligence/scorecards`, {
        headers: { 'x-tenant-id': 'tenant-123' } // Simulation header
      });
      if (res.ok) {
        const data = await res.json();
        setScorecards(data);
      }
    } catch (err: any) {
      console.error('Failed to fetch scorecards:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScorecards();
  }, [apiBaseUrl]);

  const addQuestion = () => {
    const nextId = `q${questions.length + 1}`;
    setQuestions([...questions, { id: nextId, text: '', scoringCondition: '' }]);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, idx) => idx !== index));
  };

  const handleQuestionChange = (index: number, field: keyof Question, value: string) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Scorecard name is required');
      return;
    }
    if (questions.some(q => !q.text.trim())) {
      setError('All question texts must be filled out');
      return;
    }

    try {
      setError(null);
      const res = await fetch(`${apiBaseUrl}/api/v1/m02-conversation-intelligence/scorecards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': 'tenant-123'
        },
        body: JSON.stringify({
          name,
          isActive,
          version,
          lifecycleState,
          questions: questions.map(q => ({
            id: q.id,
            text: q.text,
            scoringCondition: q.scoringCondition
          }))
        })
      });

      if (res.ok) {
        setName('');
        setQuestions([{ id: 'q1', text: 'Did the representative introduce themselves politely?', scoringCondition: 'Intro validation' }]);
        setIsActive(true);
        setVersion('v1');
        setLifecycleState('ACTIVE');
        fetchScorecards();
        if (onScorecardCreated) {
          onScorecardCreated();
        }
      } else {
        const errData = await res.json();
        setError(errData.message || 'Failed to create scorecard');
      }
    } catch (err: any) {
      setError('Failed to reach server');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* List Panel */}
      <div className="glass-panel p-6 flex flex-col gap-4 bg-slate-950/40">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-purple-400" />
            <h3 className="text-sm font-bold text-slate-200">Active Scorecards</h3>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Count: {scorecards.length}</span>
        </div>

        {loading ? (
          <div className="text-xs text-slate-500 py-10 text-center font-mono">Loading scorecards...</div>
        ) : scorecards.length === 0 ? (
          <div className="text-xs text-slate-500 py-10 text-center font-mono">No scorecards found for this tenant.</div>
        ) : (
          <div className="flex flex-col gap-3 overflow-y-auto max-h-[450px] pr-2">
            {scorecards.map((sc) => (
              <div
                key={sc.id}
                className="p-4 rounded-lg bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-all flex justify-between items-start"
              >
                <div className="flex flex-col gap-1 overflow-hidden">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-200 truncate">{sc.name}</span>
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-400">
                      {sc.version}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Questions: {sc.questions?.length || 0}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`badge ${sc.isActive ? 'badge-emerald' : 'badge-crimson'} text-[9px]`}>
                    {sc.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <span className="badge badge-purple text-[9px]">
                    {sc.lifecycleState}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Creation Panel */}
      <div className="glass-panel p-6 flex flex-col gap-6 bg-gradient-to-br from-slate-950/80 to-slate-900/30">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Plus size={16} className="text-cyan-400" />
            <h3 className="text-sm font-bold text-slate-200">Create New Scorecard</h3>
          </div>
          <span className="badge badge-cyan text-[9px]">Admin Management</span>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-mono uppercase text-slate-400">Scorecard Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sales Qualification Call, Customer Discovery"
              className="cyber-input"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-mono uppercase text-slate-400">Version</label>
              <input
                type="text"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="v1"
                className="cyber-input"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-mono uppercase text-slate-400">Lifecycle State</label>
              <select
                value={lifecycleState}
                onChange={(e) => setLifecycleState(e.target.value)}
                className="cyber-input"
                style={{ background: 'rgba(4, 8, 20, 0.9)' }}
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="DRAFT">DRAFT</option>
                <option value="ARCHIVED">ARCHIVED</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950/60 border border-slate-900">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-200">Active Evaluation</span>
              <span className="text-[10px] text-slate-500">Deploy this scorecard to process new incoming call transcripts immediately.</span>
            </div>
            <label className="cyber-switch">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              <span className="cyber-slider" />
            </label>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center border-t border-slate-800 pt-3">
              <label className="text-[10px] font-mono uppercase text-slate-400">Scorecard Questions</label>
              <button
                type="button"
                onClick={addQuestion}
                className="btn-cyber btn-cyber-cyan text-[10px] py-1 px-2 flex items-center gap-1"
              >
                <Plus size={12} />
                Add Question
              </button>
            </div>

            <div className="flex flex-col gap-3 max-h-[220px] overflow-y-auto pr-1">
              {questions.map((q, idx) => (
                <div key={idx} className="p-3 rounded bg-slate-950/60 border border-slate-900 flex flex-col gap-2 relative">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-mono text-cyan-400">Question #{idx + 1}</span>
                    {questions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeQuestion(idx)}
                        className="text-[9px] text-red-400 hover:text-red-300 font-mono"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={q.text}
                    onChange={(e) => handleQuestionChange(idx, 'text', e.target.value)}
                    placeholder="Describe the criteria, e.g. Did the agent discuss pricing discounts?"
                    className="cyber-input"
                  />
                  <input
                    type="text"
                    value={q.scoringCondition}
                    onChange={(e) => handleQuestionChange(idx, 'scoringCondition', e.target.value)}
                    placeholder="Optional scoring condition keyword"
                    className="cyber-input text-[11px]"
                    style={{ opacity: 0.8 }}
                  />
                </div>
              ))}
            </div>
          </div>

          {error && <div className="text-xs text-red-400 font-mono">{error}</div>}

          <button type="submit" className="btn-cyber btn-cyber-cyan py-2.5 mt-2">
            Create Scorecard
          </button>
        </form>
      </div>
    </div>
  );
}
