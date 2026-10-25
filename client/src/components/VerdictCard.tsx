import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  HelpCircle,
  Scale,
  Printer,
  Copy,
  Check,
  RotateCcw,
  Clock,
  ShieldCheck
} from 'lucide-react';
import { VerificationDossier, VerdictType } from '../types';

interface VerdictCardProps {
  dossier: VerificationDossier;
  onReset: () => void;
}

export const VerdictCard: React.FC<VerdictCardProps> = ({ dossier, onReset }) => {
  const [copiedJson, setCopiedJson] = useState(false);

  const getVerdictConfig = (verdict: VerdictType) => {
    switch (verdict) {
      case 'Likely True':
        return {
          icon: <CheckCircle2 className="w-9 h-9 text-emerald-600 dark:text-emerald-400 shrink-0" />,
          title: 'LIKELY TRUE',
          bannerBg: 'bg-emerald-500/10 dark:bg-emerald-950/30 border border-emerald-500/40 text-emerald-950 dark:text-emerald-100',
          badgeColor: 'bg-emerald-600 text-white',
          barColor: 'bg-emerald-500',
          description: 'Strong supporting evidence from accredited fact-checkers or credible primary reporting.'
        };
      case 'Likely False':
        return {
          icon: <XCircle className="w-9 h-9 text-rose-600 dark:text-rose-400 shrink-0" />,
          title: 'LIKELY FALSE',
          bannerBg: 'bg-rose-500/10 dark:bg-rose-950/30 border border-rose-500/40 text-rose-950 dark:text-rose-100',
          badgeColor: 'bg-rose-600 text-white',
          barColor: 'bg-rose-500',
          description: 'Explicitly contradicted or debunked by accredited fact-checking records or official sources.'
        };
      case 'Misleading / Partly True':
        return {
          icon: <AlertTriangle className="w-9 h-9 text-amber-600 dark:text-amber-400 shrink-0" />,
          title: 'MISLEADING / PARTLY TRUE',
          bannerBg: 'bg-amber-500/10 dark:bg-amber-950/30 border border-amber-500/40 text-amber-950 dark:text-amber-100',
          badgeColor: 'bg-amber-600 text-white',
          barColor: 'bg-amber-500',
          description: 'Contains factual elements mixed with exaggerated, outdated, or out-of-context details.'
        };
      case 'Conflicting Evidence':
        return {
          icon: <Scale className="w-9 h-9 text-violet-600 dark:text-violet-400 shrink-0" />,
          title: 'CONFLICTING EVIDENCE',
          bannerBg: 'bg-violet-500/10 dark:bg-violet-950/30 border border-violet-500/40 text-violet-950 dark:text-violet-100',
          badgeColor: 'bg-violet-600 text-white',
          barColor: 'bg-violet-500',
          description: 'Reputable sources present direct opposing accounts or disputed eyewitness interpretations.'
        };
      case 'Unverified':
      default:
        return {
          icon: <HelpCircle className="w-9 h-9 text-slate-500 dark:text-slate-400 shrink-0" />,
          title: 'UNVERIFIED / INSUFFICIENT EVIDENCE',
          bannerBg: 'bg-slate-500/10 dark:bg-slate-800/40 border border-slate-300 dark:border-white/10 text-slate-800 dark:text-slate-100',
          badgeColor: 'bg-slate-600 text-white',
          barColor: 'bg-slate-400',
          description: 'No verified corroboration or accredited debunk was located in accessible public records.'
        };
    }
  };

  const config = getVerdictConfig(dossier.verdict);

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(dossier, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="w-full max-w-4xl mx-auto glass-panel rounded-3xl p-6 sm:p-9 mb-8 transition-all">
      {/* Top Meta Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-5 mb-6 border-b border-slate-200/80 dark:border-white/10">
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-mono font-medium text-slate-600 dark:text-slate-400">
            Dossier #{dossier.id}
          </span>
          <span className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-mono">
            <Clock className="w-3.5 h-3.5" />
            {new Date(dossier.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({dossier.processingTimeMs}ms)
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 no-print">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass-card text-xs font-medium text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10 hover:bg-white/90 dark:hover:bg-slate-800/90 transition-colors shadow-sm"
            title="Export PDF Dossier"
          >
            <Printer className="w-3.5 h-3.5 text-slate-400" />
            <span>Export PDF</span>
          </button>

          <button
            onClick={handleCopyJson}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass-card text-xs font-medium text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10 hover:bg-white/90 dark:hover:bg-slate-800/90 transition-colors shadow-sm"
            title="Copy Raw JSON"
          >
            {copiedJson ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-emerald-700 dark:text-emerald-400 font-bold">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>JSON</span>
              </>
            )}
          </button>

          <button
            onClick={onReset}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 text-white hover:bg-blue-500 text-xs font-semibold shadow-sm transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>New Check</span>
          </button>
        </div>
      </div>

      {/* 🌟 HIGH-VISIBILITY VERDICT BANNER */}
      <div className={`p-6 sm:p-7 rounded-2xl mb-7 ${config.bannerBg} flex flex-col md:flex-row items-start md:items-center justify-between gap-6 transition-all`}>
        <div className="flex items-center gap-4">
          <div className="p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-black/5 dark:border-white/10 shadow-sm">
            {config.icon}
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 block mb-0.5">
              TruthLens Verdict
            </span>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              {config.title}
            </h2>
            <p className="text-xs sm:text-sm mt-1 opacity-90 font-medium max-w-lg">
              {config.description}
            </p>
          </div>
        </div>

        {/* Confidence Gauge */}
        <div className="w-full md:w-56 p-4 rounded-xl glass-card border border-slate-200 dark:border-white/10 shrink-0 shadow-sm">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Confidence
            </span>
            <span className="text-xl font-extrabold font-mono text-slate-900 dark:text-white">
              {dossier.confidenceScore}%
            </span>
          </div>
          <div className="w-full bg-slate-200/80 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
            <div
              className={`h-full ${config.barColor} transition-all duration-700 ease-out`}
              style={{ width: `${dossier.confidenceScore}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Executive Summary Narrative */}
      <div className="p-5 sm:p-6 rounded-2xl glass-card border border-slate-200/80 dark:border-white/10 mb-5">
        <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span>Evidence-Based Analysis</span>
        </h4>
        <p className="text-base sm:text-lg text-slate-900 dark:text-slate-100 leading-relaxed font-sans font-normal">
          {dossier.summaryVerdict}
        </p>
      </div>

      {/* Input Story Context Banner */}
      <div className="text-xs text-slate-500 dark:text-slate-400 pt-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-slate-400">Claim:</span>
          <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-xl">
            "{dossier.input.headline || dossier.input.contentSnippet}"
          </span>
        </div>
        {dossier.input.publisher && (
          <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300">
            Source: {dossier.input.publisher}
          </span>
        )}
      </div>
    </div>
  );
};
