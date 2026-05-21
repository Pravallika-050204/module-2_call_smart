import React from 'react';
import { Filter, X, Smartphone, Mail, AlertTriangle, Smile } from 'lucide-react';

interface SearchFiltersProps {
  filters: {
    channel: 'call' | 'email' | '';
    sentiment: 'Positive' | 'Neutral' | 'Negative' | '';
    topic: string;
    agent: string;
  };
  onFilterChange: (key: string, value: any) => void;
  onClear: () => void;
}

export const SearchFilters: React.FC<SearchFiltersProps> = ({
  filters,
  onFilterChange,
  onClear,
}) => {
  const topics = [
    'Pricing Strategy',
    'Feature Discovery',
    'Salesforce Integration',
    'Onboarding & Training',
    'Technical Support',
    'Objection Handling'
  ];

  return (
    <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 mb-6 shadow-2xl transition-all duration-300">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-indigo-400" />
          <h3 className="text-sm font-semibold text-slate-200">Advanced Query Filters</h3>
        </div>
        <button
          onClick={onClear}
          className="text-xs flex items-center gap-1 text-slate-400 hover:text-indigo-400 hover:bg-slate-800/60 px-2.5 py-1.5 rounded-lg border border-slate-800/60 transition-all"
        >
          <X className="w-3.5 h-3.5" />
          Reset Filters
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Channel Selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Channel</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => onFilterChange('channel', '')}
              className={`py-2 text-xs font-medium rounded-xl border transition-all ${
                filters.channel === ''
                  ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow-lg shadow-indigo-600/10'
                  : 'bg-slate-950/40 border-slate-800/80 text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => onFilterChange('channel', 'call')}
              className={`py-2 text-xs font-medium rounded-xl border flex items-center justify-center gap-1 transition-all ${
                filters.channel === 'call'
                  ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow-lg shadow-indigo-600/10'
                  : 'bg-slate-950/40 border-slate-800/80 text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              Calls
            </button>
            <button
              onClick={() => onFilterChange('channel', 'email')}
              className={`py-2 text-xs font-medium rounded-xl border flex items-center justify-center gap-1 transition-all ${
                filters.channel === 'email'
                  ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow-lg shadow-indigo-600/10'
                  : 'bg-slate-950/40 border-slate-800/80 text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              Emails
            </button>
          </div>
        </div>

        {/* Sentiment Selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Sentiment</label>
          <select
            value={filters.sentiment}
            onChange={(e) => onFilterChange('sentiment', e.target.value)}
            className="w-full bg-slate-950/40 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500/80 focus:ring-2 focus:ring-indigo-500/10 transition-all"
          >
            <option value="">Any Sentiment</option>
            <option value="Positive">Positive Only</option>
            <option value="Neutral">Neutral Only</option>
            <option value="Negative">Negative Only</option>
          </select>
        </div>

        {/* Topic Filters */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Topics</label>
          <select
            value={filters.topic}
            onChange={(e) => onFilterChange('topic', e.target.value)}
            className="w-full bg-slate-950/40 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500/80 focus:ring-2 focus:ring-indigo-500/10 transition-all"
          >
            <option value="">All Topics</option>
            {topics.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {/* Agent Filter */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Agent Name</label>
          <input
            type="text"
            placeholder="Search by agent..."
            value={filters.agent}
            onChange={(e) => onFilterChange('agent', e.target.value)}
            className="w-full bg-slate-950/40 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-300 placeholder-slate-500 focus:outline-none focus:border-indigo-500/80 focus:ring-2 focus:ring-indigo-500/10 transition-all"
          />
        </div>
      </div>
    </div>
  );
};
