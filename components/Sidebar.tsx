import React from 'react';
import { ViewState } from '../App';
import { LayoutDashboard, Globe, Shield, Activity, Sun, Moon } from 'lucide-react';

interface SidebarProps {
  currentView: ViewState;
  onViewChange: (view: ViewState) => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange, theme, toggleTheme }) => {
  return (
    <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col z-20 no-print transition-colors duration-300">
      <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 text-brand-600 dark:text-brand-500">
          <Shield className="w-8 h-8" />
          <span className="text-lg font-bold text-slate-900 dark:text-white tracking-wider">RISKLENS</span>
        </div>
      </div>

      <nav className="flex-1 py-6 px-3 space-y-1">
        <button
          onClick={() => onViewChange(ViewState.DASHBOARD)}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
            currentView === ViewState.DASHBOARD
              ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20'
              : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-sm font-medium">Investigations</span>
        </button>

        <button
          onClick={() => onViewChange(ViewState.AGENT)}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
            currentView === ViewState.AGENT
              ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20'
              : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Globe className="w-5 h-5" />
          <span className="text-sm font-medium">Global Agent</span>
        </button>
        
        <div className="pt-4 pb-2">
          <p className="px-3 text-xs font-semibold text-slate-400 dark:text-slate-600 uppercase tracking-wider">Monitoring</p>
        </div>

        <button
          onClick={() => onViewChange(ViewState.LIVE)}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
            currentView === ViewState.LIVE
              ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20'
              : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Activity className="w-5 h-5" />
          <span className="text-sm font-medium">Live Dashboard</span>
        </button>
      </nav>

      <div className="p-4 border-t border-slate-200 dark:border-slate-800">
        <button 
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          <span className="text-sm font-medium">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
        <div className="mt-4 px-3 py-2 bg-slate-100 dark:bg-slate-950 rounded border border-slate-200 dark:border-slate-800">
          <p className="text-xs text-slate-500">Status: <span className="text-emerald-500 font-medium">Operational</span></p>
          <p className="text-[10px] text-slate-400 font-mono mt-1">v2.1.5 build</p>
        </div>
      </div>
    </aside>
  );
};