import React from 'react';
import { ShieldCheck, ExternalLink, Calendar, User, AlertCircle } from 'lucide-react';
import { FactCheckItem } from '../types';

interface FactCheckReviewsProps {
  factChecks: {
    totalFound: number;
    claims: FactCheckItem[];
    warning?: string | null;
  };
}

export const FactCheckReviews: React.FC<FactCheckReviewsProps> = ({ factChecks }) => {
  const getBadgeStyle = (badgeColor: string) => {
    switch (badgeColor) {
      case 'red':
        return 'bg-rose-500/15 border-rose-500/40 text-rose-600 dark:text-rose-300';
      case 'emerald':
        return 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-300';
      case 'amber':
        return 'bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-amber-300';
      default:
        return 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300';
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto mb-8 glass-panel p-6 sm:p-8 rounded-3xl">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-4 mb-5 border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Accredited Fact Check Database ({factChecks.totalFound})
          </h3>
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
          Google Fact Check Tools API
        </span>
      </div>

      {factChecks.warning && (
        <div className="p-3.5 mb-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300 flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" />
          <span>{factChecks.warning}</span>
        </div>
      )}

      {factChecks.claims.length === 0 ? (
        <div className="py-8 text-center text-slate-500 dark:text-slate-400">
          <p className="text-sm">No prior fact-checks were indexed for this specific query.</p>
          <p className="text-xs text-slate-400 mt-1">
            Evaluated via multi-source journalistic cross-referencing.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {factChecks.claims.map((item) => (
            <div
              key={item.id}
              className="p-5 rounded-2xl glass-card border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3 mb-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold font-mono px-2.5 py-0.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                    {item.publisher}
                  </span>
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${getBadgeStyle(item.badgeColor)}`}>
                    Verdict: {item.textualRating}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
                  {item.claimant && (
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      {item.claimant}
                    </span>
                  )}
                  {item.reviewDate && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {item.reviewDate}
                    </span>
                  )}
                </div>
              </div>

              <div className="mb-3">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 font-mono mb-1">Claim Checked:</p>
                <p className="text-sm text-slate-800 dark:text-slate-200 font-medium bg-slate-50 dark:bg-slate-950/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800/80">
                  "{item.claimText}"
                </p>
              </div>

              <div className="flex items-center justify-between text-xs pt-2.5 border-t border-slate-200 dark:border-slate-800/60">
                <span className="text-slate-600 dark:text-slate-400 truncate max-w-md font-medium">
                  {item.reviewTitle}
                </span>
                <a
                  href={item.reviewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline font-semibold whitespace-nowrap ml-2"
                >
                  <span>Read on {item.publisher}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
