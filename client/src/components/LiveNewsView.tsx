import React, { useState, useEffect } from 'react';
import { Newspaper, Search, RotateCcw, ShieldCheck, ExternalLink, Calendar, Loader2 } from 'lucide-react';
import { fetchLiveNewsHeadlines } from '../services/api';
import { RelatedArticleItem } from '../types';

interface LiveNewsViewProps {
  onVerifyArticle: (article: { headline: string; url?: string; publisher?: string }) => void;
}

export const LiveNewsView: React.FC<LiveNewsViewProps> = ({ onVerifyArticle }) => {
  const [category, setCategory] = useState<string>('general');
  const [articles, setArticles] = useState<RelatedArticleItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categories = [
    { id: 'general', label: 'Top News' },
    { id: 'technology', label: 'Technology' },
    { id: 'politics', label: 'Politics' },
    { id: 'science', label: 'Science' },
    { id: 'health', label: 'Health' },
    { id: 'world', label: 'World' }
  ];

  const loadHeadlines = async (cat: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const items = await fetchLiveNewsHeadlines(cat);
      setArticles(items);
    } catch (err: any) {
      setError(err.message || 'Could not retrieve live headlines.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHeadlines(category);
  }, [category]);

  const filteredArticles = articles.filter(art => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      art.title?.toLowerCase().includes(q) ||
      art.description?.toLowerCase().includes(q) ||
      art.source?.name?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Newspaper className="w-7 h-7 text-blue-500" />
            <span>Live News Stream</span>
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time verified global headlines. Click "Verify with TruthLens" on any story.
          </p>
        </div>

        {/* Search bar & Refresh */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter headlines..."
              className="pl-10 pr-4 py-2 rounded-2xl glass-input text-xs focus:outline-none w-56 sm:w-64"
            />
          </div>

          <button
            onClick={() => loadHeadlines(category)}
            disabled={isLoading}
            className="p-2.5 rounded-2xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
            title="Refresh Headlines"
          >
            <RotateCcw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-500' : ''}`} />
          </button>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-7 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            className={`px-4 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all shadow-sm ${
              category === cat.id
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'glass-card text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Content State */}
      {isLoading ? (
        <div className="py-24 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-3" />
          <p className="text-sm text-slate-500 dark:text-slate-400 font-mono">Fetching latest verified dispatches...</p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-3xl bg-red-500/10 border border-red-500/20 text-center text-red-600 dark:text-red-400">
          <p className="text-sm font-semibold mb-1">Error loading headlines</p>
          <p className="text-xs">{error}</p>
          <button
            onClick={() => loadHeadlines(category)}
            className="mt-4 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-medium text-white transition-colors"
          >
            Try Again
          </button>
        </div>
      ) : filteredArticles.length === 0 ? (
        <div className="py-16 text-center text-slate-400">
          <p className="text-sm">No stories match your filter query "{searchTerm}".</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArticles.map((art, idx) => (
            <div
              key={idx}
              className="glass-card rounded-3xl p-6 flex flex-col justify-between transition-all hover:-translate-y-1 hover:shadow-xl"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[11px] font-mono font-bold text-blue-600 dark:text-blue-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-lg">
                    {art.source.name || 'Verified Outlet'}
                  </span>
                  {art.publishedAt && (
                    <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {art.publishedAt.split('T')[0]}
                    </span>
                  )}
                </div>

                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2 leading-snug line-clamp-3">
                  {art.title}
                </h3>

                {art.description && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed mb-4">
                    {art.description}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2">
                {art.url && (
                  <a
                    href={art.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-slate-500 dark:text-slate-400 hover:underline flex items-center gap-1 transition-colors"
                  >
                    <span>Source</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}

                <button
                  onClick={() => onVerifyArticle({
                    headline: art.title,
                    url: art.url,
                    publisher: art.source?.name
                  })}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 text-blue-600 dark:text-blue-300 text-xs font-bold transition-all hover:scale-[1.02]"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                  <span>Verify with TruthLens</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
