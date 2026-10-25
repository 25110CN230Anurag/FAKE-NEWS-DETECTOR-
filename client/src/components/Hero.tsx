import React from 'react';
import { ArrowRight, Newspaper, Shield } from 'lucide-react';

interface HeroProps {
  onNavigateToCheck: () => void;
  onNavigateToLive: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onNavigateToCheck, onNavigateToLive }) => {
  return (
    <div className="relative py-14 sm:py-20 border-b border-slate-200/60 dark:border-slate-800/60">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        {/* Subtle pill tag */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full glass-card text-xs text-slate-600 dark:text-slate-300 mb-6 font-medium border border-slate-200/80 dark:border-white/10 shadow-sm">
          <Shield className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span>Independent Fact-Checking & Source Intelligence</span>
        </div>

        {/* Hero Title — Crisp, Authoritative, Non-AI Typography */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-4 leading-tight">
          Don't Believe Every Headline.{' '}
          <span className="text-blue-600 dark:text-blue-400 font-black">
            Verify It.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="max-w-xl mx-auto text-base sm:text-lg text-slate-600 dark:text-slate-300 font-normal mb-8 leading-relaxed">
          Cross-reference viral claims, detect manipulated news, and discover what accredited reporting actually confirms.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5">
          <button
            onClick={onNavigateToCheck}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-md shadow-blue-600/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <span>Check a News Story</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={onNavigateToLive}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl glass-card text-slate-800 dark:text-slate-200 hover:bg-white/90 dark:hover:bg-slate-800/90 font-semibold text-sm border border-slate-300 dark:border-white/10 transition-all shadow-sm"
          >
            <Newspaper className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span>Explore Live News Feed</span>
          </button>
        </div>
      </div>
    </div>
  );
};
