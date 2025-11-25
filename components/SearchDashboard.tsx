import React, { useState, useEffect } from 'react';
import { Search, AlertTriangle, ScanEye, ScanSearch } from 'lucide-react';
import { analyzeEntityRisk } from '../services/geminiService';
import { RiskAnalysisResult } from '../types';
import { RiskReportView } from './RiskReportView';

const LOADING_MESSAGES = [
  "Analysing all relevant resources...",
  "Generating content from verified sources...",
  "Cross-referencing global sanctions lists...",
  "Synthesizing risk intelligence report...",
  "Checking litigation and court records..."
];

interface SearchDashboardProps {
  onAnalysisComplete?: (result: RiskAnalysisResult) => void;
}

export const SearchDashboard: React.FC<SearchDashboardProps> = ({ onAnalysisComplete }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
  const [result, setResult] = useState<RiskAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let interval: any;
    if (loading) {
      setLoadingMsgIndex(0);
      interval = setInterval(() => {
        setLoadingMsgIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const searchTerm = query; // Capture the query before clearing
    setQuery(''); // Clear the input box immediately
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await analyzeEntityRisk(searchTerm);
      const resultObj = {
        report: data.report,
        sources: data.sources,
        analyzedAt: new Date().toLocaleDateString(),
        entityName: searchTerm
      };
      setResult(resultObj);
      
      // Pass data up to App for Live Dashboard
      if (onAnalysisComplete) {
        onAnalysisComplete(resultObj);
      }

    } catch (err) {
      setError("Unable to complete investigation. Please check your API key or try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-full flex flex-col transition-colors duration-300">
      {/* CSS to remove white box on autofill */}
      <style>{`
        input:-webkit-autofill,
        input:-webkit-autofill:hover, 
        input:-webkit-autofill:focus, 
        input:-webkit-autofill:active {
            -webkit-box-shadow: 0 0 0 30px #0f172a inset !important;
            -webkit-text-fill-color: white !important;
            transition: background-color 5000s ease-in-out 0s;
        }
        .dark input:-webkit-autofill {
             -webkit-box-shadow: 0 0 0 30px #0f172a inset !important;
             -webkit-text-fill-color: white !important;
        }
        /* Light mode autofill fix - using a light bg */
        html:not(.dark) input:-webkit-autofill {
             -webkit-box-shadow: 0 0 0 30px #f1f5f9 inset !important;
             -webkit-text-fill-color: #0f172a !important;
        }
      `}</style>

      {/* Search Input Section */}
      <div className="mb-8 no-print">
        <form onSubmit={handleSearch} className="relative max-w-3xl mx-auto">
          {/* Flex container: Left side (Input + Text) vs Right side (Button) */}
          <div className="flex items-start gap-4">
            
            {/* Left Column: Search Box and Centered Text */}
            <div className="flex-1 flex flex-col gap-3">
              {/* Input Wrapper */}
              <div className="relative group w-full">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-500 to-indigo-600 rounded-xl blur opacity-30 group-hover:opacity-50 transition duration-200"></div>
                <div className="relative flex items-center bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden transition-colors">
                  <Search className="ml-4 w-6 h-6 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Enter individual or company name for deep scan..."
                    className="w-full bg-slate-100 dark:bg-slate-900 border-none focus:ring-0 focus:outline-none text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 py-4 px-4 text-lg font-light rounded-xl appearance-none transition-colors"
                    autoComplete="off"
                    style={{ caretColor: '#3b82f6' }} 
                  />
                </div>
              </div>

              {/* Helper Text - Explicitly centered with w-full */}
              <div className="w-full text-center">
                <p className="text-sm text-slate-500 dark:text-slate-500">
                  Scans global watchlists, litigation records, and adverse media in real-time.
                </p>
              </div>
            </div>

            {/* Standalone Scan Button */}
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="py-4 px-8 bg-brand-600 hover:bg-brand-500 active:bg-brand-700 text-white rounded-xl font-medium text-lg transition-all shadow-lg shadow-brand-500/20 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 whitespace-nowrap"
            >
              Scan
            </button>
          </div>
        </form>
      </div>

      {/* Error State */}
      {error && (
        <div className="max-w-2xl mx-auto w-full p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl flex items-center gap-3 text-red-600 dark:text-red-200 mb-6">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          {error}
        </div>
      )}

      {/* Empty State */}
      {!result && !loading && !error && (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-600 dark:text-slate-600 no-print">
          <div className="relative group mb-6 cursor-pointer" onClick={() => document.querySelector('input')?.focus()}>
            {/* Animated Rings */}
            <div className="absolute inset-0 bg-brand-500/10 rounded-full blur-xl scale-75 opacity-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700 ease-out"></div>
            
            {/* Main Icon Container */}
            <div className="w-24 h-24 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl flex items-center justify-center relative z-10 group-hover:border-brand-500/50 transition-colors duration-300">
              <ScanSearch className="w-10 h-10 text-slate-400 dark:text-slate-500 group-hover:text-brand-500 dark:group-hover:text-brand-400 transition-all duration-300 group-hover:scale-110" />
              
              {/* Interactive Corner Accents */}
              <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-slate-300 dark:border-slate-600 rounded-tl-lg group-hover:border-brand-500 transition-colors duration-300"></div>
              <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-slate-300 dark:border-slate-600 rounded-tr-lg group-hover:border-brand-500 transition-colors duration-300"></div>
              <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-slate-300 dark:border-slate-600 rounded-bl-lg group-hover:border-brand-500 transition-colors duration-300"></div>
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-slate-300 dark:border-slate-600 rounded-br-lg group-hover:border-brand-500 transition-colors duration-300"></div>
            </div>
          </div>

          <h3 className="text-xl font-medium text-slate-700 dark:text-slate-300">Ready to Investigate</h3>
          <p className="max-w-md text-center mt-2 text-sm text-slate-500">
            Enter an entity name above to generate a comprehensive risk profile report.
          </p>
        </div>
      )}

      {/* Loading State with Engaging Visuals */}
      {loading && (
        <div className="flex-1 flex flex-col items-center justify-center text-brand-500 py-20">
          <div className="relative flex items-center justify-center">
             {/* Glowing Backdrops */}
             <div className="absolute inset-0 bg-brand-500/20 blur-2xl rounded-full animate-pulse"></div>
             
             {/* Spinning Outer Ring */}
             <div className="w-24 h-24 border-2 border-brand-500/30 border-t-brand-400 rounded-full animate-spin absolute"></div>
             
             {/* Inner Pulse Ring */}
             <div className="w-16 h-16 border border-brand-400/50 rounded-full animate-ping absolute opacity-20"></div>
             
             {/* Center Icon */}
             <div className="relative z-10 bg-white dark:bg-slate-900 p-4 rounded-full border border-slate-200 dark:border-slate-800 shadow-2xl">
                <ScanEye className="w-8 h-8 text-brand-600 dark:text-brand-400 animate-pulse" />
             </div>
          </div>
          
          <div className="mt-10 flex flex-col items-center gap-3">
             <p className="font-mono text-lg text-slate-700 dark:text-slate-300 animate-pulse transition-all duration-500 text-center min-w-[300px]">
               {LOADING_MESSAGES[loadingMsgIndex]}
             </p>
             <p className="text-xs text-slate-400 font-light tracking-wide uppercase">
               This will take a few seconds...
             </p>
          </div>
        </div>
      )}

      {/* Results View */}
      {result && !loading && (
        <div className="animate-fade-in">
          <RiskReportView result={result} />
        </div>
      )}
    </div>
  );
};