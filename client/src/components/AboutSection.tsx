import React from 'react';
import { Cpu, Database, Lock, AlertTriangle, BookOpen, Code } from 'lucide-react';

export const AboutSection: React.FC = () => {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-mono mb-3">
          Architecture & Methodology
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">
          About TruthLens AI
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto mt-2 leading-relaxed">
          AI-powered fake news detection grounded in verified facts rather than writing tone.
        </p>
      </div>

      {/* College Project Disclaimer */}
      <div className="mb-8 p-5 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-200">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed">
            <h4 className="font-bold text-amber-900 dark:text-amber-300 text-sm mb-1 uppercase tracking-wide">
              Academic & College Engineering Project Notice
            </h4>
            <p>
              <strong>TruthLens AI</strong> is designed as a college capstone project demonstrating multi-source evidence synthesis, SSRF-safe article extraction, and fact-checking API integration. While it interfaces with accredited databases like the Google Fact Check Tools API, it is not an official legal or governmental authority.
            </p>
          </div>
        </div>
      </div>

      {/* 4 Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="glass-panel p-6 rounded-3xl">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-3">
            <Database className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">1. Google Fact Check Tools API</h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Directly queries verified ClaimReview entries from accredited IFCN signatories (Snopes, PolitiFact, Reuters, AFP). Debunks take precedence over model guesses.
          </p>
        </div>

        <div className="glass-panel p-6 rounded-3xl">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-600 dark:text-violet-400 mb-3">
            <Cpu className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">2. Grounded Gemini AI Synthesis</h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Structured reasoning bound by strict evidence constraints. If no evidence confirms or refutes a story, the engine returns "Unverified" instead of hallucinating.
          </p>
        </div>

        <div className="glass-panel p-6 rounded-3xl">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-3">
            <Lock className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">3. Hardened SSRF-Safe Extraction</h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Pre-resolves DNS records and blocks private IPs (127.0.0.1, 10.0.0.0/8, 192.168.0.0/16, AWS metadata 169.254.x.x) to protect against server-side request forgery.
          </p>
        </div>

        <div className="glass-panel p-6 rounded-3xl">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-3">
            <BookOpen className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">4. Standardized 5-Tier Verdicts</h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Every query receives a clear classification: <em>Likely True</em>, <em>Likely False</em>, <em>Misleading / Partly True</em>, <em>Conflicting Evidence</em>, or <em>Unverified</em>.
          </p>
        </div>
      </div>

      {/* Integrations */}
      <div className="glass-panel p-6 rounded-3xl">
        <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Code className="w-4 h-4 text-blue-500" />
          <span>Core Technologies</span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
          <div className="p-2.5 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-center">
            Google Fact Check API
          </div>
          <div className="p-2.5 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-center">
            Google Gemini 1.5/2.0
          </div>
          <div className="p-2.5 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-center">
            Mozilla Readability
          </div>
          <div className="p-2.5 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-center">
            Realtime News Wire RSS
          </div>
        </div>
      </div>
    </div>
  );
};
