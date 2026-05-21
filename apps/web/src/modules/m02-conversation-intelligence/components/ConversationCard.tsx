import React from 'react';
import { Phone, Mail, Clock, ShieldCheck, ChevronRight } from 'lucide-react';
import { SearchResult } from './types';

interface ConversationCardProps {
  result: SearchResult;
  onOpen: () => void;
}

export const ConversationCard: React.FC<ConversationCardProps> = ({ result, onOpen }) => {
  // Safe default arrays
  const topics = result.topics || [];
  const overallScore = result.overallScore || 0;

  // Visual Styling helpers
  const getSentimentStyles = (sentiment?: string) => {
    switch (sentiment) {
      case 'Positive':
        return { text: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' };
      case 'Negative':
        return { text: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/30' };
      default:
        return { text: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30' };
    }
  };

  const getScoreStyles = (score: number) => {
    if (score >= 85) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5';
    if (score >= 70) return 'text-amber-400 border-amber-500/30 bg-amber-500/5';
    return 'text-rose-400 border-rose-500/30 bg-rose-500/5';
  };

  const sentimentStyle = getSentimentStyles(result.sentiment);

  return (
    <div className="group bg-slate-900/40 hover:bg-slate-900/70 border border-slate-800/80 hover:border-slate-700/80 rounded-2xl p-5 shadow-lg transition-all duration-300 hover:-translate-y-0.5 flex flex-col md:flex-row gap-5 items-start md:items-center">
      {/* Dynamic Channels Indicator */}
      <div className="flex items-center justify-center p-3.5 rounded-xl bg-slate-950 border border-slate-800 group-hover:border-indigo-500/30 transition-colors shadow-inner shrink-0">
        {result.entityType === 'call' ? (
          <Phone className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform" />
        ) : (
          <Mail className="w-5 h-5 text-teal-400 group-hover:scale-110 transition-transform" />
        )}
      </div>

      {/* Main Metadata and Summaries */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2.5 mb-2.5">
          <h4 className="text-sm font-semibold text-slate-100 truncate max-w-sm group-hover:text-indigo-400 transition-colors">
            {result.title || 'Conversation Record'}
          </h4>
          <span className="text-[10px] bg-indigo-900/25 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider shadow-inner">
            Score Match: {Math.round((result.score || 0) * 100)}%
          </span>
          <span className={`text-[10px] border px-2 py-0.5 rounded-full font-semibold ${sentimentStyle.text} ${sentimentStyle.bg}`}>
            {result.sentiment || 'Neutral'}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-400 mb-3 font-medium">
          <span className="truncate">Client: <strong className="text-slate-300 font-semibold">{result.customerName}</strong></span>
          <span className="hidden md:inline text-slate-600">•</span>
          <span className="truncate">Agent: <strong className="text-slate-300 font-semibold">{result.agentName}</strong></span>
          {result.duration && result.duration !== 'N/A (Email)' && (
            <>
              <span className="hidden md:inline text-slate-600">•</span>
              <span className="flex items-center gap-1 shrink-0">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                {result.duration}
              </span>
            </>
          )}
        </div>

        {/* Text Match Highlight Snippet */}
        {result.snippet ? (
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 mb-3 text-xs text-indigo-300 italic font-mono leading-relaxed relative overflow-hidden shadow-inner">
            <div className="absolute top-0 left-0 bottom-0 w-1 bg-indigo-500" />
            "{result.snippet}"
          </div>
        ) : (
          <p className="text-xs text-slate-400 line-clamp-2 mb-3 leading-relaxed">
            {result.snippet || 'No search highlights. Show full transcript summary...'}
          </p>
        )}

        {/* Topics Pills */}
        <div className="flex flex-wrap gap-1.5">
          {topics.map((t) => (
            <span
              key={t}
              className="text-[10px] bg-slate-950/80 border border-slate-800 text-slate-400 px-2.5 py-1 rounded-lg font-medium hover:text-slate-200 hover:border-slate-600 transition-all cursor-pointer"
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* Action / Coaching Score */}
      <div className="flex md:flex-col items-center md:items-end gap-3 justify-between w-full md:w-auto border-t md:border-t-0 border-slate-800/80 pt-3.5 md:pt-0 shrink-0">
        <div className="flex flex-col items-start md:items-end">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">QA score</span>
          <span className={`text-lg font-bold border rounded-xl px-2.5 py-0.5 mt-0.5 flex items-center gap-1 ${getScoreStyles(overallScore)}`}>
            <ShieldCheck className="w-4.5 h-4.5" />
            {overallScore || 'N/A'}
          </span>
        </div>

        <button
          onClick={onOpen}
          className="bg-indigo-600 hover:bg-indigo-500 text-slate-100 text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center gap-1 shadow-lg shadow-indigo-600/20 active:scale-95 hover:shadow-indigo-500/30 transition-all cursor-pointer"
        >
          Details
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
