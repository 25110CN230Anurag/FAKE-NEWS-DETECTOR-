import React, { useState } from 'react';
import { ShieldCheck, Eye, Newspaper, History, Info, Settings, Menu, X, Sun, Moon } from 'lucide-react';
import { NavigationTab, ApiStatus } from '../types';

interface NavbarProps {
  activeTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  apiStatus: ApiStatus | null;
  onOpenSettings: () => void;
  historyCount: number;
  isDark: boolean;
  onToggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  apiStatus,
  onOpenSettings,
  historyCount,
  isDark,
  onToggleTheme
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: { id: NavigationTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'home', label: 'Home', icon: <Eye className="w-4 h-4" /> },
    { id: 'check', label: 'Check News', icon: <ShieldCheck className="w-4 h-4" /> },
    { id: 'live', label: 'Live News', icon: <Newspaper className="w-4 h-4" /> },
    { id: 'history', label: 'History', icon: <History className="w-4 h-4" />, badge: historyCount },
    { id: 'about', label: 'About', icon: <Info className="w-4 h-4" /> }
  ];

  const handleNavClick = (tab: NavigationTab) => {
    onSelectTab(tab);
    setMobileMenuOpen(false);
  };

  const hasApiKey = apiStatus?.capabilities.geminiAi || apiStatus?.capabilities.googleFactCheckApi;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-white/10 bg-white/70 dark:bg-[#090d16]/80 backdrop-blur-2xl transition-colors duration-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo — Clean, Confident, Human-Crafted */}
          <div
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-2.5 cursor-pointer group select-none"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm transition-transform duration-150 group-hover:scale-105">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div className="flex items-baseline">
              <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                TruthLens<span className="text-blue-600 dark:text-blue-400 font-mono text-sm font-bold">.ai</span>
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 dark:text-slate-300 dark:hover:text-white dark:hover:bg-white/5'
                  }`}
                >
                  {item.icon}
                  {item.label}
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className={`ml-1 text-[11px] px-1.5 py-0.2 rounded-full font-mono ${
                      isActive ? 'bg-blue-800 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Controls: Theme Toggle & Settings */}
          <div className="flex items-center gap-2.5">
            {/* Light / Dark Mode Toggle Button */}
            <button
              onClick={onToggleTheme}
              className="p-2 rounded-xl glass-card text-slate-700 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-slate-800/80 transition-all border border-slate-300 dark:border-white/10 shadow-sm"
              title={isDark ? "Switch to Frosted Light Mode" : "Switch to Obsidian Dark Mode"}
              aria-label="Toggle theme"
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700" />
              )}
            </button>

            {/* API Settings */}
            <button
              onClick={onOpenSettings}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl glass-card border border-slate-300 dark:border-white/10 hover:bg-white/80 dark:hover:bg-slate-800/80 text-xs text-slate-700 dark:text-slate-300 transition-colors shadow-sm"
              title="Configure API Keys"
            >
              <span className={`h-2 w-2 rounded-full ${hasApiKey ? 'bg-emerald-500' : 'bg-blue-500'}`}></span>
              <span className="font-mono text-[11px] font-medium">
                {hasApiKey ? 'APIs Active' : 'Consensus Active'}
              </span>
              <Settings className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Mobile menu toggle */}
            <div className="flex md:hidden items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 dark:border-white/10 bg-white/95 dark:bg-[#090d16]/95 px-4 pt-2 pb-4 space-y-1 backdrop-blur-2xl">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium ${
                  isActive
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  {item.label}
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
