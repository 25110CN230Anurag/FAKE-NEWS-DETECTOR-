import React from 'react';
import { Newspaper, ExternalLink, Calendar, GitCompare } from 'lucide-react';
import { RelatedArticleItem } from '../types';

interface RelatedArticlesProps {
  relatedCoverage: {
    provider: string;
    totalFound: number;
    articles: RelatedArticleItem[];
  };
  sourceComparison?: {
    consensusDescription: string;
    wireServicesAgreement: string;
  };
}

export const RelatedArticles: React.FC<RelatedArticlesProps> = ({
  relatedCoverage,
  sourceComparison
}) => {
  return (
    <div className="w-full max-w-4xl mx-auto mb-8 glass-panel p-6 sm:p-8 rounded-3xl">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-4 mb-5 border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <Newspaper className="w-5 h-5 text-indigo-500" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Cross-Source News Coverage ({relatedCoverage.totalFound})
          </h3>
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
          {relatedCoverage.provider}
        </span>
      </div>

      {sourceComparison && (
        <div className="mb-5 p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-start gap-3">
          <GitCompare className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-bold text-indigo-600 dark:text-indigo-400">Wire Agreement: </span>
            <span className="text-slate-700 dark:text-slate-300 font-medium">{sourceComparison.wireServicesAgreement}</span>
            <p className="text-slate-500 dark:text-slate-400 mt-1">{sourceComparison.consensusDescription}</p>
          </div>
        </div>
      )}

      {relatedCoverage.articles.length === 0 ? (
        <div className="py-6 text-center text-slate-500 dark:text-slate-400 text-sm">
          No related news articles could be indexed for this specific query.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {relatedCoverage.articles.map((art, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl glass-card border border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between shadow-sm"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800">
                    {art.source.name || 'News Outlet'}
                  </span>
                  {art.publishedAt && (
                    <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {art.publishedAt.split('T')[0]}
                    </span>
                  )}
                </div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 mb-2 line-clamp-2 leading-snug">
                  {art.title}
                </h4>
                {art.description && (
                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {art.description}
                  </p>
                )}
              </div>

              {art.url && art.url !== '#' && (
                <div className="mt-4 pt-3 border-t border-slate-200/80 dark:border-slate-800/60 text-right">
                  <a
                    href={art.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
                  >
                    <span>Read Full Coverage</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
