import React, { useState } from 'react';
import { ShieldAlert, CheckCircle, RefreshCw, BarChart2, MessageSquare, AlertCircle } from 'lucide-react';

interface AIAnswer {
  questionId: string;
  answer: string;
  score: number;
  confidence: number;
  evidence: string;
  text?: string;
}

interface Scorecard {
  id: string;
  name: string;
  version: string;
  questions: any[];
}

interface CallScore {
  id: string;
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
}

interface CallScoreDetailProps {
  scores: CallScore[];
}

export default function CallScoreDetail({ scores }: CallScoreDetailProps) {
  const [selectedIdx, setSelectedIdx] = useState(0);

  if (!scores || scores.length === 0) {
    return (
      <div className="glass-panel p-8 text-center text-slate-500 font-mono text-xs bg-slate-950/40">
        No evaluation results available for this call. Please trigger scoring in the Simulator.
      </div>
    );
  }

  const currentScore = scores[selectedIdx] || scores[0];

  // Map questions text into the answers list for direct readability
  const enrichedAnswers = currentScore.aiAnswers.map((ans) => {
    const questionMatch = currentScore.scorecard?.questions?.find((q) => q.id === ans.questionId);
    return {
      ...ans,
      text: questionMatch ? questionMatch.text : `Criteria check (${ans.questionId})`
    };
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Selector Tabs if multiple scorecards applied */}
      {scores.length > 1 && (
        <div className="flex items-center gap-2 border-b border-slate-900 pb-2">
          <span className="text-[10px] font-mono text-slate-500 uppercase mr-2">Evaluation Results:</span>
          {scores.map((score, idx) => (
            <button
              key={score.id}
              onClick={() => setSelectedIdx(idx)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                selectedIdx === idx
                  ? 'bg-purple-950/40 border-purple-500/30 text-purple-400'
                  : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {score.scorecard?.name || `Scorecard ${idx + 1}`}
            </button>
          ))}
        </div>
      )}

      {/* Main Review Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Column 1: Overall Summary */}
        <div className="xl:col-span-1 flex flex-col gap-6">
          <div className="glass-panel p-6 bg-gradient-to-br from-slate-950/90 to-slate-900/40 flex flex-col items-center gap-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 via-purple-500 to-emerald-400" />
            <div className="w-full flex justify-between items-start border-b border-slate-800 pb-3">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-200">{currentScore.scorecard?.name}</span>
                <span className="text-[9px] font-mono text-slate-500">Version: {currentScore.scorecardVersion}</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                {new Date(currentScore.scoredAt).toLocaleDateString()}
              </span>
            </div>

            {/* Neon radial progress circle */}
            <div className="relative w-36 h-36 flex items-center justify-center mt-2">
              <svg className="w-full h-full transform -rotate-95" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="rgba(255, 255, 255, 0.03)"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="url(#purpleEmerald)"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray="251.2"
                  strokeDashoffset={251.2 - (251.2 * currentScore.totalScore) / 100}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
                <defs>
                  <linearGradient id="purpleEmerald" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#00f0ff" />
                    <stop offset="50%" stopColor="#9d4edd" />
                    <stop offset="100%" stopColor="#00f5d4" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-slate-100 tracking-tighter">
                  {currentScore.totalScore}
                </span>
                <span className="text-[10px] font-mono uppercase text-slate-500">Total Score</span>
              </div>
            </div>

            {/* Confidence metric indicator */}
            <div className="flex items-center gap-2 px-3 py-1 rounded bg-slate-900 border border-slate-800 w-full justify-between">
              <span className="text-[10px] font-mono text-slate-400">Confidence Match:</span>
              <span className="text-xs font-bold text-cyan-400">
                {Math.round(currentScore.confidenceScore * 100)}%
              </span>
            </div>
          </div>

          {/* Flags Banner */}
          {currentScore.flaggedReview ? (
            <div className="p-4 rounded-lg bg-red-950/20 border border-red-500/20 flex gap-3 items-start animate-pulse-cyan">
              <ShieldAlert className="text-red-400 mt-0.5 flex-shrink-0" size={16} />
              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold text-red-200">Flagged for Manual Review</span>
                <span className="text-[10px] text-red-400 leading-normal">
                  {currentScore.confidenceScore < 0.70
                    ? `Overall confidence score (${Math.round(currentScore.confidenceScore * 100)}%) falls below the 70% automated validation threshold.`
                    : `One or more individual question evaluations fall below the 60% confidence threshold. Review required.`}
                </span>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-lg bg-emerald-950/20 border border-emerald-500/20 flex gap-3 items-start">
              <CheckCircle className="text-emerald-400 mt-0.5 flex-shrink-0" size={16} />
              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold text-emerald-200">Confidence Clearance Met</span>
                <span className="text-[10px] text-emerald-400 leading-normal">
                  Evaluation meets all automated safety guidelines (confidence &gt; 70%, questions &gt; 60%). No manual review flag.
                </span>
              </div>
            </div>
          )}

          {/* Derived Call Metrics */}
          <div className="glass-panel p-6 bg-slate-950/40 flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
              <BarChart2 size={14} className="text-cyan-400" />
              <h4 className="text-[10px] font-mono uppercase tracking-wider text-slate-300">Speech Call Metrics</h4>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-[10px] font-mono">
                  <span className="text-slate-400">Talk Ratio (Agent / Cust)</span>
                  <span className="text-slate-200">
                    {Math.round(currentScore.derivedMetrics.talkRatio.agent * 100)}% /{' '}
                    {Math.round(currentScore.derivedMetrics.talkRatio.customer * 100)}%
                  </span>
                </div>
                {/* Visual Ratio bar */}
                <div className="w-full h-2 rounded bg-slate-900 border border-slate-800 flex overflow-hidden">
                  <div
                    style={{ width: `${currentScore.derivedMetrics.talkRatio.agent * 100}%` }}
                    className="h-full bg-cyan-500"
                  />
                  <div
                    style={{ width: `${currentScore.derivedMetrics.talkRatio.customer * 100}%` }}
                    className="h-full bg-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-1">
                <div className="p-3 rounded bg-slate-900 border border-slate-800 flex flex-col gap-0.5">
                  <span className="text-[9px] font-mono text-slate-500 uppercase">Question Rate</span>
                  <span className="text-sm font-black text-slate-200">
                    {currentScore.derivedMetrics.questionRate} <span className="text-[10px] font-normal text-slate-400">/ min</span>
                  </span>
                </div>
                <div className="p-3 rounded bg-slate-900 border border-slate-800 flex flex-col gap-0.5">
                  <span className="text-[9px] font-mono text-slate-500 uppercase">Longest Monologue</span>
                  <span className="text-sm font-black text-slate-200">
                    {currentScore.derivedMetrics.longestMonologue} <span className="text-[10px] font-normal text-slate-400">sec</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Column 2: Per-Question Answers & Evidence snippets */}
        <div className="xl:col-span-2 glass-panel p-6 bg-slate-950/40 flex flex-col gap-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <MessageSquare size={16} className="text-purple-400" />
              <h3 className="text-sm font-bold text-slate-200">Automated Scoring Breakdown</h3>
            </div>
            <span className="badge badge-purple text-[9px]">AI Insights</span>
          </div>

          <div className="flex flex-col gap-4 overflow-y-auto max-h-[480px] pr-2">
            {enrichedAnswers.map((ans) => {
              const isLowConfidence = ans.confidence < 0.60;
              return (
                <div
                  key={ans.questionId}
                  className="p-4 rounded-lg bg-slate-900/60 border border-slate-800/80 hover:border-slate-800 transition-all flex flex-col gap-3"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col gap-0.5 max-w-[80%]">
                      <span className="text-[9px] font-mono text-purple-400 uppercase">
                        Question ID: {ans.questionId}
                      </span>
                      <span className="text-xs font-bold text-slate-200">{ans.text}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-sm font-black text-slate-100">{ans.score}/100</span>
                      <span className={`text-[9px] font-mono ${isLowConfidence ? 'text-red-400 font-bold' : 'text-slate-400'}`}>
                        {Math.round(ans.confidence * 100)}% conf {isLowConfidence && '⚠'}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 p-3 rounded bg-slate-950/80 border border-slate-900">
                    <span className="text-[9px] font-mono text-slate-500 uppercase">Evaluated Answer:</span>
                    <span className="text-xs text-slate-300 font-medium leading-relaxed">{ans.answer}</span>
                  </div>

                  {ans.evidence && (
                    <div className="flex flex-col gap-1.5 p-3 rounded bg-purple-950/5 border border-purple-500/10 border-l-2 border-l-purple-500">
                      <span className="text-[9px] font-mono text-purple-400 uppercase">Evidence Snippet:</span>
                      <span className="text-xs text-slate-400 italic leading-relaxed">
                        &ldquo;{ans.evidence}&rdquo;
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
