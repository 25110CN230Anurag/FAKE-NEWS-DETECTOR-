import React, { useState } from 'react';
import {
  FileText,
  Link2,
  HelpCircle,
  Search,
  RotateCcw,
  Sparkles,
  Loader2,
  AlertCircle,
  Edit3,
  Calendar,
  Building
} from 'lucide-react';
import { extractArticleFromUrl, verifyNewsItem } from '../services/api';
import { ArticleExtractData, VerificationDossier, InputMode } from '../types';

interface NewsInputCardProps {
  onVerificationComplete: (dossier: VerificationDossier) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  prefillData?: {
    headline?: string;
    url?: string;
    content?: string;
    publisher?: string;
  } | null;
}

export const NewsInputCard: React.FC<NewsInputCardProps> = ({
  onVerificationComplete,
  isLoading,
  setIsLoading,
  prefillData
}) => {
  const [activeTab, setActiveTab] = useState<'headline' | 'url' | 'claim'>('headline');

  // Tab A state
  const [manualHeadline, setManualHeadline] = useState(prefillData?.headline || '');
  const [manualContent, setManualContent] = useState(prefillData?.content || '');
  const [manualPublisher, setManualPublisher] = useState(prefillData?.publisher || '');
  const [manualDate, setManualDate] = useState('');

  // Tab B state
  const [urlInput, setUrlInput] = useState(prefillData?.url || '');
  const [urlContext, setUrlContext] = useState('');
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);
  const [extractedData, setExtractedData] = useState<ArticleExtractData | null>(null);
  const [isEditingExtracted, setIsEditingExtracted] = useState(false);

  // Tab C state
  const [claimText, setClaimText] = useState('');

  // UI Error feedback
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState<string>('');

  React.useEffect(() => {
    if (prefillData) {
      if (prefillData.url) {
        setActiveTab('url');
        setUrlInput(prefillData.url);
      } else if (prefillData.headline) {
        setActiveTab('headline');
        setManualHeadline(prefillData.headline);
        if (prefillData.content) setManualContent(prefillData.content);
        if (prefillData.publisher) setManualPublisher(prefillData.publisher);
      }
    }
  }, [prefillData]);

  const claimExamples = [
    'Did the government announce a new national education policy today?',
    'Drinking hot lemon water cures cancer.',
    'NASA confirmed an asteroid is scheduled to collide with Earth next week.',
    'Electric cars catch fire more frequently than gasoline vehicles.'
  ];

  const handleClear = () => {
    setManualHeadline('');
    setManualContent('');
    setManualPublisher('');
    setManualDate('');
    setUrlInput('');
    setUrlContext('');
    setExtractedData(null);
    setClaimText('');
    setErrorMessage(null);
  };

  const handleFetchUrl = async () => {
    setErrorMessage(null);
    if (!urlInput.trim()) {
      setErrorMessage('Please enter an article URL.');
      return;
    }

    if (!urlInput.startsWith('http://') && !urlInput.startsWith('https://')) {
      setErrorMessage('Please enter a full URL starting with http:// or https://');
      return;
    }

    setIsFetchingUrl(true);
    try {
      const data = await extractArticleFromUrl(urlInput.trim());
      setExtractedData(data);
      setIsEditingExtracted(false);
    } catch (err: any) {
      const msg = err.message || 'Failed to fetch article.';
      if (err.manualFallbackRequired) {
        setErrorMessage(
          `${msg} Tip: You can switch to the "Headline + Summary" tab and paste the text directly.`
        );
      } else {
        setErrorMessage(msg);
      }
    } finally {
      setIsFetchingUrl(false);
    }
  };

  const handleAnalyze = async (mode: InputMode) => {
    setErrorMessage(null);
    let payload: {
      headline: string;
      content: string;
      publisher?: string;
      publicationDate?: string;
      url?: string;
      inputMode: InputMode;
    };

    if (mode === 'manual') {
      if (!manualHeadline.trim() && !manualContent.trim()) {
        setErrorMessage('Please enter a headline or article text to analyze.');
        return;
      }
      payload = {
        headline: manualHeadline.trim(),
        content: manualContent.trim(),
        publisher: manualPublisher.trim() || undefined,
        publicationDate: manualDate.trim() || undefined,
        inputMode: 'manual'
      };
    } else if (mode === 'url') {
      if (!extractedData) {
        setErrorMessage('Please fetch the article first.');
        return;
      }
      payload = {
        headline: extractedData.title,
        content: (extractedData.text + (urlContext ? `\n\nExtra Context: ${urlContext}` : '')).trim(),
        publisher: extractedData.publisher || undefined,
        publicationDate: extractedData.publishedDate || undefined,
        url: extractedData.url,
        inputMode: 'url'
      };
    } else {
      if (!claimText.trim()) {
        setErrorMessage('Please enter a claim or question to verify.');
        return;
      }
      payload = {
        headline: claimText.trim(),
        content: claimText.trim(),
        inputMode: 'claim'
      };
    }

    setIsLoading(true);
    setLoadingStep('Searching Google Fact Check database for accredited reviews...');

    const timer1 = setTimeout(() => {
      setLoadingStep('Cross-referencing global wire services & journalistic archives...');
    }, 1200);

    const timer2 = setTimeout(() => {
      setLoadingStep('Synthesizing evidence & determining consensus verdict...');
    }, 2800);

    try {
      const dossier = await verifyNewsItem(payload);
      onVerificationComplete(dossier);
    } catch (err: any) {
      setErrorMessage(err.message || 'Verification pipeline encountered an issue.');
    } finally {
      clearTimeout(timer1);
      clearTimeout(timer2);
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto glass-panel rounded-3xl p-6 sm:p-9 shadow-2xl transition-all">
      {/* 3 Tabs Header - Clean and un-congested */}
      <div className="flex border-b border-slate-200/80 dark:border-slate-800/80 mb-7 overflow-x-auto scrollbar-none gap-2">
        <button
          onClick={() => { setActiveTab('headline'); setErrorMessage(null); }}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-medium text-sm transition-all whitespace-nowrap ${
            activeTab === 'headline'
              ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 bg-blue-500/10 rounded-t-xl font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Headline + Summary</span>
        </button>

        <button
          onClick={() => { setActiveTab('url'); setErrorMessage(null); }}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-medium text-sm transition-all whitespace-nowrap ${
            activeTab === 'url'
              ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 bg-blue-500/10 rounded-t-xl font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <Link2 className="w-4 h-4" />
          <span>Article Link</span>
        </button>

        <button
          onClick={() => { setActiveTab('claim'); setErrorMessage(null); }}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-medium text-sm transition-all whitespace-nowrap ${
            activeTab === 'claim'
              ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 bg-blue-500/10 rounded-t-xl font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>Quick Claim Check</span>
        </button>
      </div>

      {/* Error alert */}
      {errorMessage && (
        <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-300 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1">{errorMessage}</div>
        </div>
      )}

      {/* Tab A: Headline + Summary */}
      {activeTab === 'headline' && (
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              News Headline <span className="text-blue-500">*</span>
            </label>
            <input
              type="text"
              value={manualHeadline}
              onChange={(e) => setManualHeadline(e.target.value)}
              placeholder="e.g. Government Announces Major New National Renewable Energy Subsidy"
              className="w-full px-4 py-3 rounded-2xl glass-input text-sm focus:outline-none transition-all"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              News Summary or Article Text <span className="text-blue-500">*</span>
            </label>
            <textarea
              rows={4}
              value={manualContent}
              onChange={(e) => setManualContent(e.target.value)}
              placeholder="Paste article paragraphs, social media post text, or key claims..."
              className="w-full px-4 py-3 rounded-2xl glass-input text-sm focus:outline-none transition-all leading-relaxed"
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Publisher (Optional)
              </label>
              <div className="relative">
                <Building className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={manualPublisher}
                  onChange={(e) => setManualPublisher(e.target.value)}
                  placeholder="e.g. Reuters, Viral Post"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-sm focus:outline-none transition-all"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Publication Date (Optional)
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="date"
                  value={manualDate}
                  onChange={(e) => setManualDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-sm focus:outline-none transition-all"
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-5 border-t border-slate-200/80 dark:border-slate-800/80">
            <button
              type="button"
              onClick={handleClear}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-4 py-2 text-sm text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>

            <button
              type="button"
              onClick={() => handleAnalyze('manual')}
              disabled={isLoading || (!manualHeadline.trim() && !manualContent.trim())}
              className="flex items-center gap-2 px-7 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Analyze News</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Tab B: Article Link */}
      {activeTab === 'url' && (
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              News Article URL <span className="text-blue-500">*</span>
            </label>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://www.reuters.com/article/..."
                className="flex-1 px-4 py-3 rounded-2xl glass-input text-sm focus:outline-none transition-all"
                disabled={isLoading || isFetchingUrl}
              />
              <button
                type="button"
                onClick={handleFetchUrl}
                disabled={isFetchingUrl || isLoading || !urlInput.trim()}
                className="px-6 py-3 rounded-2xl bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 font-semibold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm"
              >
                {isFetchingUrl ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                    <span>Extracting...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Fetch Article</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Optional Extra Context
            </label>
            <input
              type="text"
              value={urlContext}
              onChange={(e) => setUrlContext(e.target.value)}
              placeholder="e.g. Shared online claiming it happened yesterday"
              className="w-full px-4 py-2.5 rounded-xl glass-input text-sm focus:outline-none transition-all"
              disabled={isLoading}
            />
          </div>

          {/* Extracted Article Preview Card */}
          {extractedData && (
            <div className="p-6 rounded-2xl glass-card space-y-4 transition-all">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                    Article Extracted
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditingExtracted(!isEditingExtracted)}
                  className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{isEditingExtracted ? 'Done Editing' : 'Edit Extracted Text'}</span>
                </button>
              </div>

              {isEditingExtracted ? (
                <div className="space-y-3 pt-1">
                  <div>
                    <label className="text-[11px] font-mono text-slate-500 dark:text-slate-400 uppercase">Title</label>
                    <input
                      type="text"
                      value={extractedData.title}
                      onChange={(e) => setExtractedData({ ...extractedData, title: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl glass-input text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-mono text-slate-500 dark:text-slate-400 uppercase">Publisher</label>
                    <input
                      type="text"
                      value={extractedData.publisher}
                      onChange={(e) => setExtractedData({ ...extractedData, publisher: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl glass-input text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-mono text-slate-500 dark:text-slate-400 uppercase">Readable Text</label>
                    <textarea
                      rows={5}
                      value={extractedData.text}
                      onChange={(e) => setExtractedData({ ...extractedData, text: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl glass-input text-sm font-sans leading-relaxed"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <h4 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                    {extractedData.title}
                  </h4>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                    <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono">
                      {extractedData.publisher}
                    </span>
                    {extractedData.publishedDate && (
                      <span>{extractedData.publishedDate}</span>
                    )}
                    <span>~{extractedData.wordCount} words ({extractedData.estimatedReadTimeMinutes} min read)</span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-3 p-3 rounded-xl bg-slate-100/60 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 leading-relaxed font-sans">
                    {extractedData.text.slice(0, 320)}...
                  </p>
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => handleAnalyze('url')}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-7 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-blue-500/25 transition-all"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verifying Article...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Confirm & Analyze Article</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab C: Quick Claim Check */}
      {activeTab === 'claim' && (
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Statement, Claim, or Question <span className="text-blue-500">*</span>
            </label>
            <textarea
              rows={4}
              value={claimText}
              onChange={(e) => setClaimText(e.target.value)}
              placeholder="e.g. Did the government announce a new national education policy today?"
              className="w-full px-4 py-3 rounded-2xl glass-input text-sm focus:outline-none transition-all leading-relaxed"
              disabled={isLoading}
            />
          </div>

          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 block mb-2 font-medium">Try an example:</span>
            <div className="flex flex-wrap gap-2">
              {claimExamples.map((example, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setClaimText(example)}
                  className="text-xs text-left px-3 py-1.5 rounded-xl bg-white/80 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors shadow-sm"
                >
                  "{example}"
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-5 border-t border-slate-200/80 dark:border-slate-800/80">
            <button
              type="button"
              onClick={handleClear}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-4 py-2 text-sm text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>

            <button
              type="button"
              onClick={() => handleAnalyze('claim')}
              disabled={isLoading || !claimText.trim()}
              className="flex items-center gap-2 px-7 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Checking Claims...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Verify Claim</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Progress Step Indicator during active analysis */}
      {isLoading && (
        <div className="mt-7 pt-5 border-t border-slate-200 dark:border-slate-800/80">
          <div className="flex items-center gap-3 text-sm text-blue-600 dark:text-blue-300">
            <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
            <span className="font-mono text-xs animate-pulse font-medium">{loadingStep}</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 h-full w-2/3 animate-pulse"></div>
          </div>
        </div>
      )}
    </div>
  );
};
