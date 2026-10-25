import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { NewsInputCard } from './components/NewsInputCard';
import { VerdictCard } from './components/VerdictCard';
import { EvidenceSection } from './components/EvidenceSection';
import { FactCheckReviews } from './components/FactCheckReviews';
import { RelatedArticles } from './components/RelatedArticles';
import { LiveNewsView } from './components/LiveNewsView';
import { HistoryView } from './components/HistoryView';
import { AboutSection } from './components/AboutSection';
import { ApiSettingsModal } from './components/ApiSettingsModal';
import {
  NavigationTab,
  VerificationDossier,
  ApiStatus
} from './types';
import { getHistory, fetchSystemStatus } from './services/api';
import { ShieldCheck } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavigationTab>('home');
  const [activeDossier, setActiveDossier] = useState<VerificationDossier | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [history, setHistory] = useState<VerificationDossier[]>([]);
  const [apiStatus, setApiStatus] = useState<ApiStatus | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const resultRef = useRef<HTMLDivElement>(null);

  // Theme Management (Light / Dark)
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem('truthlens_theme');
    if (saved !== null) return saved === 'dark';
    return true; // Default dark
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('truthlens_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('truthlens_theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(prev => !prev);

  // Live news prefill data state
  const [prefillData, setPrefillData] = useState<{
    headline?: string;
    url?: string;
    content?: string;
    publisher?: string;
  } | null>(null);

  useEffect(() => {
    refreshHistory();
    fetchSystemStatus()
      .then(status => setApiStatus(status))
      .catch(() => console.warn('Backend server not connected or initializing.'));
  }, []);

  const refreshHistory = () => {
    setHistory(getHistory());
  };

  const handleVerificationComplete = (dossier: VerificationDossier) => {
    setActiveDossier(dossier);
    refreshHistory();
    setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
  };

  const handleVerifyLiveArticle = (article: { headline: string; url?: string; publisher?: string }) => {
    setPrefillData({
      headline: article.headline,
      url: article.url,
      publisher: article.publisher
    });
    setActiveDossier(null);
    setActiveTab('check');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectHistoryDossier = (dossier: VerificationDossier) => {
    setActiveDossier(dossier);
    setActiveTab('check');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col font-sans relative selection:bg-blue-500 selection:text-white">
      {/* Ambient background glow mesh */}
      <div className="glass-glow-bg">
        <div className="orb-1"></div>
        <div className="orb-2"></div>
      </div>

      {/* Top Navigation with Light/Dark Mode toggle */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        apiStatus={apiStatus}
        onOpenSettings={() => setIsSettingsOpen(true)}
        historyCount={history.length}
        isDark={isDark}
        onToggleTheme={toggleTheme}
      />

      {/* Main Content Areas based on activeTab */}
      <main className="flex-1 relative z-10">
        {activeTab === 'home' && (
          <div>
            <Hero
              onNavigateToCheck={() => {
                setActiveTab('check');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onNavigateToLive={() => {
                setActiveTab('live');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />

            {/* Quick Try on Home */}
            <div className="max-w-4xl mx-auto px-4 py-12 sm:py-16">
              <NewsInputCard
                onVerificationComplete={handleVerificationComplete}
                isLoading={isLoading}
                setIsLoading={setIsLoading}
                prefillData={prefillData}
              />

              {activeDossier && (
                <div ref={resultRef} className="mt-12 space-y-8 animate-fadeIn pt-4">
                  <VerdictCard
                    dossier={activeDossier}
                    onReset={() => setActiveDossier(null)}
                  />
                  <EvidenceSection
                    supporting={activeDossier.evidence.supporting}
                    contradicting={activeDossier.evidence.contradicting}
                  />
                  <FactCheckReviews factChecks={activeDossier.factChecks} />
                  <RelatedArticles
                    relatedCoverage={activeDossier.relatedCoverage}
                    sourceComparison={activeDossier.sourceComparison}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'check' && (
          <div className="max-w-4xl mx-auto px-4 py-10 sm:py-14">
            <div className="text-center mb-8">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mb-2 tracking-tight">
                Analyze & Verify News
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 max-w-lg mx-auto">
                Check factual claims against Google Fact Check records, wire coverage, and AI synthesis.
              </p>
            </div>

            <NewsInputCard
              onVerificationComplete={handleVerificationComplete}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
              prefillData={prefillData}
            />

            {activeDossier && (
              <div ref={resultRef} className="mt-12 space-y-8 animate-fadeIn pt-4">
                <VerdictCard
                  dossier={activeDossier}
                  onReset={() => setActiveDossier(null)}
                />
                <EvidenceSection
                  supporting={activeDossier.evidence.supporting}
                  contradicting={activeDossier.evidence.contradicting}
                />
                <FactCheckReviews factChecks={activeDossier.factChecks} />
                <RelatedArticles
                  relatedCoverage={activeDossier.relatedCoverage}
                  sourceComparison={activeDossier.sourceComparison}
                />
              </div>
            )}
          </div>
        )}

        {activeTab === 'live' && (
          <LiveNewsView onVerifyArticle={handleVerifyLiveArticle} />
        )}

        {activeTab === 'history' && (
          <HistoryView
            history={history}
            onSelectDossier={handleSelectHistoryDossier}
            onRefreshHistory={refreshHistory}
          />
        )}

        {activeTab === 'about' && (
          <AboutSection />
        )}
      </main>

      {/* Clean Minimal Footer */}
      <footer className="w-full border-t border-slate-200/80 dark:border-slate-800/80 py-8 px-4 sm:px-8 text-xs text-slate-500 relative z-10 bg-white/40 dark:bg-black/20 backdrop-blur-md">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-500" />
            <span className="font-bold text-slate-800 dark:text-slate-200">TruthLens AI</span>
            <span>&bull; Fact Checking Platform</span>
          </div>

          <div className="text-[11px] text-slate-400">
            College Capstone Project &bull; Evidence-grounded verification
          </div>
        </div>
      </footer>

      {/* API Key and Integration Settings Modal */}
      <ApiSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        apiStatus={apiStatus}
        onStatusUpdated={setApiStatus}
      />
    </div>
  );
};

export default App;
