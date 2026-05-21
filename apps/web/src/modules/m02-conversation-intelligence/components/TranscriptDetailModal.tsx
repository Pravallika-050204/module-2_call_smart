import React from 'react';
import { X, Calendar, User, Phone, Mail, Award, AlertCircle, Compass, Smile, Eye } from 'lucide-react';
import { SearchResult } from './types';

interface TranscriptDetailModalProps {
  conversation: any;
  onClose: () => void;
}

export const TranscriptDetailModal: React.FC<TranscriptDetailModalProps> = ({
  conversation,
  onClose,
}) => {
  if (!conversation) return null;

  const scorecard = conversation.scorecard || {};
  const diarized = conversation.diarizedTranscript || [];
  const competitors = conversation.competitorsDetected || [];

  const getScoreColor = (val: number) => {
    if (val >= 9.0) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25';
    if (val >= 7.5) return 'text-amber-400 bg-amber-500/10 border-amber-500/25';
    return 'text-rose-400 bg-rose-500/10 border-rose-500/25';
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 md:p-6 transition-all duration-300">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-5xl h-[88vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-250">
        
        {/* Header Section */}
        <div className="bg-slate-950/40 p-6 border-b border-slate-800/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
              {conversation.channel === 'call' ? (
                <Phone className="w-5 h-5 text-indigo-400" />
              ) : (
                <Mail className="w-5 h-5 text-teal-400" />
              )}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">{conversation.title}</h2>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 mt-1 font-medium">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  {new Date(conversation.date).toLocaleDateString()}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  Client: <strong className="text-slate-300 font-semibold">{conversation.customerName}</strong>
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-800 p-2.5 rounded-xl transition-all active:scale-95 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Layout */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-3">
          
          {/* Main Transcript / Details */}
          <div className="lg:col-span-2 p-6 border-r border-slate-800/60 flex flex-col gap-6">
            
            {/* AI Summary Block */}
            <div className="bg-indigo-600/5 border border-indigo-500/20 rounded-2xl p-5 shadow-inner">
              <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
                <Compass className="w-4 h-4" />
                AI Generated Conversation Summary
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                {conversation.summary}
              </p>
            </div>

            {/* Conversation Logs / Audio Diarization */}
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                Conversation Transcript Logs
              </h3>
              {diarized.length > 0 ? (
                <div className="space-y-4">
                  {diarized.map((turn: any, idx: number) => {
                    const isAgent = turn.speaker.toLowerCase().includes('agent') || turn.speaker.includes('1');
                    return (
                      <div
                        key={idx}
                        className={`flex gap-3.5 items-start ${
                          isAgent ? 'flex-row' : 'flex-row-reverse'
                        }`}
                      >
                        {/* Avatar */}
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 shadow-md ${
                            isAgent
                              ? 'bg-indigo-600/20 border border-indigo-500/35 text-indigo-300'
                              : 'bg-emerald-600/20 border border-emerald-500/35 text-emerald-300'
                          }`}
                        >
                          {isAgent ? 'A' : 'C'}
                        </div>
                        {/* Message Box */}
                        <div
                          className={`rounded-2xl p-4 max-w-[80%] border shadow-sm leading-relaxed text-xs ${
                            isAgent
                              ? 'bg-slate-900 border-slate-800 text-slate-200'
                              : 'bg-slate-950/60 border-slate-900/60 text-slate-300'
                          }`}
                        >
                          <div className="flex justify-between items-center gap-2 mb-1">
                            <span className="font-semibold text-[10px] text-slate-400 uppercase tracking-wider">
                              {turn.speaker}
                            </span>
                            {turn.start !== undefined && (
                              <span className="text-[9px] font-mono text-slate-500">
                                {turn.start}s - {turn.end}s
                              </span>
                            )}
                          </div>
                          <p>{turn.text}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-6 text-center shadow-inner">
                  <p className="text-xs text-slate-500 leading-relaxed font-mono">
                    {conversation.transcript || 'No transcript text logged for this interaction.'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Analytics Panel */}
          <div className="p-6 bg-slate-950/30 flex flex-col gap-6 overflow-y-auto">
            
            {/* Scorecard Metrics */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 shadow-lg">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-indigo-400" />
                QA Scorecard Breakdown
              </h3>
              <div className="space-y-3.5">
                {Object.entries(scorecard).map(([key, val]: [string, any]) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 capitalize">
                      {key.replace(/([A-Z])/g, ' $1')}
                    </span>
                    <span className={`text-xs font-mono font-bold px-2 py-0.5 border rounded-lg ${getScoreColor(val)}`}>
                      {val * 10}/100
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-200">Aggregate Rating</span>
                <span className="text-sm font-bold text-indigo-400 border border-indigo-500/20 bg-indigo-500/5 px-2.5 py-1 rounded-xl">
                  {conversation.overallScore}%
                </span>
              </div>
            </div>

            {/* Coaching Insights */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 shadow-lg">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <Smile className="w-4 h-4 text-indigo-400" />
                Coaching Suggestions
              </h3>
              <div className="bg-slate-950 border border-slate-900 rounded-xl p-4 text-xs text-indigo-300 leading-relaxed italic shadow-inner">
                "{conversation.coachingSuggestion || 'Outstanding call performance. Keep up this high standard.'}"
              </div>
            </div>

            {/* Competitors and Keywords */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 shadow-lg">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3.5">
                Competitors Mentioned
              </h3>
              {competitors.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {competitors.map((c: string) => (
                    <span
                      key={c}
                      className="text-xs bg-rose-500/10 border border-rose-500/20 text-rose-400 px-3 py-1 rounded-xl font-medium"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-slate-500 italic">None detected</span>
              )}

              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3.5 mt-5">
                Identified Search Keywords
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {(conversation.keywords || []).map((k: string) => (
                  <span
                    key={k}
                    className="text-[10px] bg-slate-950 border border-slate-800 text-slate-400 px-2 py-0.5 rounded-lg"
                  >
                    {k}
                  </span>
                ))}
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
};
