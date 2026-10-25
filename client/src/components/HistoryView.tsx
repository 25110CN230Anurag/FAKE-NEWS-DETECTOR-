import React, { useState } from 'react';
import {
  History,
  Trash2,
  Download,
  Search,
  Calendar,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { VerificationDossier, VerdictType } from '../types';
import { deleteHistoryItem, clearAllHistory } from '../services/api';

interface HistoryViewProps {
  history: VerificationDossier[];
  onSelectDossier: (dossier: VerificationDossier) => void;
  onRefreshHistory: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  history,
  onSelectDossier,
  onRefreshHistory
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [verdictFilter, setVerdictFilter] = useState<string>('all');

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteHistoryItem(id);
    onRefreshHistory();
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to delete all verification history?')) {
      clearAllHistory();
      onRefreshHistory();
    }
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(history, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `truthlens_history_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const getBadgeStyle = (verdict: VerdictType) => {
    switch (verdict) {
      case 'Likely True':
        return 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-300';
      case 'Likely False':
        return 'bg-rose-500/15 border-rose-500/40 text-rose-600 dark:text-rose-300';
      case 'Misleading / Partly True':
        return 'bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-amber-300';
      case 'Conflicting Evidence':
        return 'bg-violet-500/15 border-violet-500/40 text-violet-600 dark:text-violet-300';
      default:
        return 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300';
    }
  };

  const filteredHistory = history.filter((item) => {
    const matchesSearch =
      !searchTerm.trim() ||
      item.input.headline.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.summaryVerdict.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesVerdict = verdictFilter === 'all' || item.verdict === verdictFilter;

    return matchesSearch && matchesVerdict;
  });

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
            <History className="w-7 h-7 text-blue-500" />
            <span>Verification History</span>
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Browse and review past fact-checking dossiers stored locally in your browser.
          </p>
        </div>

        {/* Global actions */}
        {history.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportJson}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export All</span>
            </button>
            <button
              onClick={handleClearAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300 text-xs font-semibold border border-rose-200 dark:border-rose-800/50 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors shadow-sm"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      {history.length > 0 && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search past claims or verdicts..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl glass-input text-xs focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            {['all', 'Likely True', 'Likely False', 'Misleading / Partly True', 'Unverified'].map((v) => (
              <button
                key={v}
                onClick={() => setVerdictFilter(v)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors shadow-sm ${
                  verdictFilter === v
                    ? 'bg-blue-600 text-white'
                    : 'glass-card text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {v === 'all' ? 'All Verdicts' : v}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* History List */}
      {history.length === 0 ? (
        <div className="py-24 text-center glass-panel rounded-3xl p-8">
          <ShieldAlert className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-60" />
          <h3 className="text-base font-bold text-slate-800 dark:text-white mb-1">No Verification History Yet</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Stories analyzed via the "Check News" tab will appear here automatically.
          </p>
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="py-16 text-center text-slate-400">
          <p className="text-sm">No items match your filter criteria.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredHistory.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelectDossier(item)}
              className="glass-card rounded-2xl p-6 cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-xl group"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 mb-2.5">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getBadgeStyle(item.verdict)}`}>
                    {item.verdict}
                  </span>
                  <span className="text-xs font-mono text-slate-500 dark:text-slate-400 font-bold">
                    Confidence: {item.confidenceScore}%
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(item.timestamp).toLocaleDateString()}
                  </span>
                  <button
                    onClick={(e) => handleDelete(item.id, e)}
                    className="p-1 rounded text-slate-400 hover:text-rose-500 transition-colors"
                    title="Delete Record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                "{item.input.headline || item.input.contentSnippet}"
              </h3>

              <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed mb-3">
                {item.summaryVerdict}
              </p>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-200/80 dark:border-slate-800">
                <span className="font-mono text-[11px]">
                  Dossier #{item.id} &bull; Mode: {item.input.mode}
                </span>
                <span className="text-blue-600 dark:text-blue-400 flex items-center gap-1 font-bold group-hover:translate-x-0.5 transition-transform">
                  <span>View Dossier</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
