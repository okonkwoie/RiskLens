import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { SearchDashboard } from './components/SearchDashboard';
import { GlobalAgent } from './components/GlobalAgent';
import { LiveRiskDashboard } from './components/LiveRiskDashboard';
import { Layout, ShieldAlert, Globe, Activity } from 'lucide-react';
import { RiskAnalysisResult } from './types';

export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  AGENT = 'AGENT',
  LIVE = 'LIVE',
}

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.DASHBOARD);
  const [recentRiskAnalysis, setRecentRiskAnalysis] = useState<RiskAnalysisResult | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Initialize theme
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const getHeaderTitle = () => {
    switch (currentView) {
      case ViewState.DASHBOARD: return 'Investigation Console';
      case ViewState.AGENT: return 'Global Risk Agent';
      case ViewState.LIVE: return 'Live Risk Analytics';
      default: return 'RiskLens';
    }
  };

  const getHeaderIcon = () => {
    switch (currentView) {
      case ViewState.DASHBOARD: return <ShieldAlert className="w-6 h-6 text-brand-500" />;
      case ViewState.AGENT: return <Globe className="w-6 h-6 text-emerald-500" />;
      case ViewState.LIVE: return <Activity className="w-6 h-6 text-rose-500" />;
      default: return null;
    }
  };

  return (
    <div className="flex h-full w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white overflow-hidden transition-colors duration-300">
      {/* Sidebar Navigation */}
      <Sidebar 
        currentView={currentView} 
        onViewChange={setCurrentView} 
        theme={theme}
        toggleTheme={toggleTheme}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full relative overflow-hidden">
        <header className="h-16 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md shrink-0 no-print transition-colors duration-300">
          <div className="flex items-center gap-3">
            {getHeaderIcon()}
            <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
              {getHeaderTitle()}
            </h1>
          </div>
          <div className="flex items-center gap-4">
             {/* Badge removed as requested */}
          </div>
        </header>

        <div className="flex-1 overflow-auto relative">
          {currentView === ViewState.DASHBOARD && (
            <SearchDashboard onAnalysisComplete={setRecentRiskAnalysis} />
          )}
          {currentView === ViewState.AGENT && <GlobalAgent />}
          {currentView === ViewState.LIVE && (
            <LiveRiskDashboard riskData={recentRiskAnalysis} />
          )}
        </div>
      </main>
    </div>
  );
};

export default App;