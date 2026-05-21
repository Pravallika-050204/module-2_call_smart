import React from 'react';
import { Bookmark, Star, ArrowRight } from 'lucide-react';
import { Route } from 'react-router-dom';
import AISmartTrackerPage from './AISmartTrackerPage';

interface SavedSearchesSidebarProps {
  savedSearches: Array<{ id: string; name: string; queryString?: string; filters?: Record<string, string> }>; // Replaced 'any' with specific types
  onSelect: (search: { id: string; name: string; queryString?: string; filters?: Record<string, string> }) => void; // Replaced 'any' with specific types
}

export const SavedSearchesSidebar: React.FC<SavedSearchesSidebarProps> = ({
  savedSearches,
  onSelect,
}) => {
  return (
    <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 shadow-2xl h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-800/80">
        <Bookmark className="w-5 h-5 text-indigo-400" />
        <h3 className="text-sm font-semibold text-slate-200">Saved Queries</h3>
      </div>

      {savedSearches.length > 0 ? (
        <div className="space-y-3 overflow-y-auto flex-1 pr-1">
          {savedSearches.map((search) => (
            <button
              key={search.id}
              onClick={() => onSelect(search)}
              className="w-full text-left bg-slate-950/45 hover:bg-slate-900 border border-slate-850 hover:border-slate-700/85 p-4 rounded-xl transition-all duration-200 group flex items-start justify-between cursor-pointer"
            >
              <div className="min-w-0 pr-2">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Star className="w-3.5 h-3.5 text-indigo-400 fill-indigo-400/10" />
                  <span className="text-xs font-semibold text-slate-200 truncate group-hover:text-indigo-400 transition-colors">
                    {search.name}
                  </span>
                </div>
                {search.queryString && (
                  <p className="text-[11px] font-mono text-indigo-300 italic mb-1.5 truncate">
                    Query: &quot;{search.queryString}&quot; {/* Escaped double quotes */}
                  </p>
                )}
                <div className="flex flex-wrap gap-1">
                  {Object.entries(search.filters || {}).map(([k, v]) => (
                    <span
                      key={k}
                      className="text-[9px] bg-slate-900 border border-slate-800/60 text-slate-400 px-2 py-0.5 rounded-md"
                    >
                      {k}: {v}
                    </span>
                  ))}
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5" />
            </button>
          ))}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-slate-950/20 border border-dashed border-slate-800/60 rounded-2xl shadow-inner">
          <Bookmark className="w-8 h-8 text-slate-700 mb-3" />
          <p className="text-xs text-slate-500 leading-relaxed font-medium">
            No saved searches yet. Save your queries using the save icon!
          </p>
        </div>
      )}
    </div>
  );
};

// Removed unused variable `sidebarItems` to fix ESLint warning.
<Route path="/ai-smart-tracker" element={<AISmartTrackerPage />} />;
