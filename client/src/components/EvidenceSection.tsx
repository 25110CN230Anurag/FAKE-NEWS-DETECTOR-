import React from 'react';
import { CheckCircle, XCircle, ExternalLink, Calendar, BookOpen, AlertCircle } from 'lucide-react';
import { EvidenceItem } from '../types';

interface EvidenceSectionProps {
  supporting: EvidenceItem[];
  contradicting: EvidenceItem[];
}

export const EvidenceSection: React.FC<EvidenceSectionProps> = ({ supporting, contradicting }) => {
  return (
    <div className="w-full max-w-4xl mx-auto mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Supporting Evidence Card */}
      <div className="glass-panel p-6 sm:p-7 rounded-3xl">
        <div className="flex items-center gap-2 pb-4 mb-4 border-b border-slate-200/80 dark:border-slate-800/80">
          <CheckCircle className="w-5 h-5 text-emerald-500" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Supporting Evidence ({supporting.length})
          </h3>
        </div>

        {supporting.length === 0 ? (
          <div className="py-8 text-center text-slate-500 dark:text-slate-400">
            <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
            <p className="text-xs">No direct corroborating reports found in indexed archives.</p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {supporting.map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-emerald-500/20 shadow-sm"
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                    {item.source}
                  </span>
                  {item.date && (
                    <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {item.date}
                    </span>
                  )}
                </div>

                <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-2 leading-snug">
                  {item.title}
                </h4>

                <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-950/60 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60 leading-relaxed font-sans italic">
                  "{item.quoteOrFinding}"
                </p>

                {item.url && item.url !== '#' && (
                  <div className="mt-2.5 text-right">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                    >
                      <span>Read Full Report</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Contradicting Evidence Card */}
      <div className="glass-panel p-6 sm:p-7 rounded-3xl">
        <div className="flex items-center gap-2 pb-4 mb-4 border-b border-slate-200/80 dark:border-slate-800/80">
          <XCircle className="w-5 h-5 text-rose-500" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Contradicting Evidence ({contradicting.length})
          </h3>
        </div>

        {contradicting.length === 0 ? (
          <div className="py-8 text-center text-slate-500 dark:text-slate-400">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
            <p className="text-xs">No explicit debunks detected in accredited databases.</p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {contradicting.map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-rose-500/20 shadow-sm"
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-xs font-bold text-rose-600 dark:text-rose-400 font-mono">
                    {item.source}
                  </span>
                  {item.date && (
                    <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {item.date}
                    </span>
                  )}
                </div>

                <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-2 leading-snug">
                  {item.title}
                </h4>

                <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-950/60 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60 leading-relaxed font-sans italic">
                  "{item.quoteOrFinding}"
                </p>

                {item.url && item.url !== '#' && (
                  <div className="mt-2.5 text-right">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-rose-600 dark:text-rose-400 hover:underline font-semibold"
                    >
                      <span>Read Debunk Article</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
