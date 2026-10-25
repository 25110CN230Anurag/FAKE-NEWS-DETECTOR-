import React, { useState, useEffect } from 'react';
import { X, Key, CheckCircle, ExternalLink, Shield, Save, Info, RefreshCw } from 'lucide-react';
import { ApiStatus } from '../types';
import { getStoredApiKeys, saveStoredApiKeys, fetchSystemStatus } from '../services/api';

interface ApiSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiStatus: ApiStatus | null;
  onStatusUpdated: (status: ApiStatus) => void;
}

export const ApiSettingsModal: React.FC<ApiSettingsModalProps> = ({
  isOpen,
  onClose,
  apiStatus,
  onStatusUpdated
}) => {
  const [geminiKey, setGeminiKey] = useState('');
  const [factCheckKey, setFactCheckKey] = useState('');
  const [newsApiKey, setNewsApiKey] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const keys = getStoredApiKeys();
      setGeminiKey(keys.geminiKey || '');
      setFactCheckKey(keys.factCheckKey || '');
      setNewsApiKey(keys.newsApiKey || '');
      setSavedSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    saveStoredApiKeys({
      geminiKey: geminiKey.trim(),
      factCheckKey: factCheckKey.trim(),
      newsApiKey: newsApiKey.trim()
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  const handleRefreshStatus = async () => {
    setIsRefreshing(true);
    try {
      const status = await fetchSystemStatus();
      onStatusUpdated(status);
    } catch {
      // keep existing
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/70 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-lg glass-panel rounded-3xl border border-slate-200 dark:border-slate-700/80 shadow-2xl p-6 sm:p-8 relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">API & Engine Settings</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Optional key configurations</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Server Status Indicators */}
        <div className="mb-6 p-4 rounded-2xl bg-slate-100/70 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-blue-500" />
              <span>Engine Status</span>
            </span>
            <button
              onClick={handleRefreshStatus}
              className="text-[11px] text-slate-500 dark:text-slate-400 hover:text-blue-500 flex items-center gap-1"
            >
              <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="flex items-center justify-between p-2 rounded-xl bg-white/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">SSRF Defense</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">ACTIVE</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-xl bg-white/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">Article Parser</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">READY</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-xl bg-white/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">Fact Check API</span>
              <span className={apiStatus?.capabilities.googleFactCheckApi ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-blue-500 font-bold'}>
                {apiStatus?.capabilities.googleFactCheckApi ? 'CONNECTED' : 'CONSENSUS'}
              </span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-xl bg-white/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">Gemini AI</span>
              <span className={apiStatus?.capabilities.geminiAi ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-blue-500 font-bold'}>
                {apiStatus?.capabilities.geminiAi ? 'CONNECTED' : 'CONSENSUS'}
              </span>
            </div>
          </div>
        </div>

        {/* API Key Inputs */}
        <div className="space-y-4 mb-6">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Google Gemini API Key</label>
              <a
                href="https://aistudio.google.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold"
              >
                <span>Get Free Key</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <input
              type="password"
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              placeholder="AIzaSy... (Saved locally in browser)"
              className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs font-mono focus:outline-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Google Fact Check API Key</label>
              <span className="text-[11px] text-slate-400 font-mono">Uses Gemini key if omitted</span>
            </div>
            <input
              type="password"
              value={factCheckKey}
              onChange={(e) => setFactCheckKey(e.target.value)}
              placeholder="AIzaSy... (Same as Google Cloud key)"
              className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs font-mono focus:outline-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">NewsAPI Key (Optional)</label>
              <a
                href="https://newsapi.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold"
              >
                <span>Get NewsAPI Key</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <input
              type="password"
              value={newsApiKey}
              onChange={(e) => setNewsApiKey(e.target.value)}
              placeholder="Free live wire RSS feeds active by default"
              className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs font-mono focus:outline-none"
            />
          </div>
        </div>

        {/* Tip banner */}
        <div className="p-3.5 mb-6 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-[11px] text-blue-700 dark:text-blue-300 flex items-start gap-2">
          <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
          <span>Keys are stored strictly in your local browser and sent over localhost headers. You can also configure them in <code>server/.env</code>.</span>
        </div>

        {/* Save button */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md shadow-blue-500/20 transition-all"
          >
            {savedSuccess ? (
              <>
                <CheckCircle className="w-3.5 h-3.5 text-white" />
                <span>Saved!</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Save Keys</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
