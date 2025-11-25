import React, { useEffect, useState } from 'react';
import { getGlobalRiskUpdates } from '../services/geminiService';
import { GlobalEvent } from '../types';
import { 
  Globe, Layers,
  AlertOctagon, Scale, AlertTriangle, ShieldAlert, 
  Link2, Gavel, UserX, X, Calendar, Newspaper, Radio, Heart,
  Wifi, Server, Database
} from 'lucide-react';

const CATEGORY_FILTERS = [
  { id: 'LITIGATION', label: 'Litigation' },
  { id: 'SANCTIONS', label: 'Sanctions' },
  { id: 'REPUTATION', label: 'Reputational Issues' },
  { id: 'PEP', label: 'PEP Exposure' },
  { id: 'COMPLIANCE', label: 'Compliance Gaps' },
];

const LOADING_TEXTS = [
  "Scanning global feeds & verified sources...",
  "Checking all areas in scope...",
  "Synthesizing regional risk data...",
  "Updating adverse media registry...",
  "Verifying source credibility..."
];

// Mock Sources for Audit Trail
const MOCK_AUDIT_SOURCES = [
  { source: 'Punch Nigeria', status: 'Active', latency: '24ms' },
  { source: 'EFCC Official', status: 'Active', latency: '45ms' },
  { source: 'Reuters Africa', status: 'Syncing', latency: '112ms' },
  { source: 'TechCabal', status: 'Active', latency: '30ms' },
  { source: 'ThisDay Live', status: 'Active', latency: '28ms' },
  { source: 'Vanguard', status: 'Active', latency: '35ms' },
  { source: 'Guardian NG', status: 'Idle', latency: '-' },
  { source: 'OFAC Sanctions', status: 'Active', latency: '88ms' },
];

export const GlobalAgent: React.FC = () => {
  const [events, setEvents] = useState<GlobalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingTextIdx, setLoadingTextIdx] = useState(0);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(CATEGORY_FILTERS.map(c => c.id));
  const [selectedEvent, setSelectedEvent] = useState<GlobalEvent | null>(null);

  const fetchUpdates = async () => {
    setLoading(true);
    try {
        const data = await getGlobalRiskUpdates();
        const sortedData = data.sort((a, b) => {
            return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        });
        setEvents(sortedData);
    } catch (e) {
        console.error("Failed to fetch updates", e);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchUpdates();
  }, []);

  useEffect(() => {
    let interval: any;
    if (loading) {
        interval = setInterval(() => {
            setLoadingTextIdx(prev => (prev + 1) % LOADING_TEXTS.length);
        }, 2000);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const filteredEvents = events.filter(e => selectedCategories.includes(e.category));
  const highRiskCount = events.filter(e => e.severity === 'HIGH').length;

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(c => c !== categoryId)
        : [...prev, categoryId]
    );
  };

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'HIGH': return 'bg-red-600 text-white border-red-700';
      case 'MEDIUM': return 'bg-amber-500 text-black border-amber-600';
      case 'LOW': return 'bg-emerald-600 text-white border-emerald-700';
      default: return 'bg-slate-600 text-white';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'SANCTIONS': return <AlertOctagon className="w-4 h-4" />;
      case 'LITIGATION': return <Gavel className="w-4 h-4" />;
      case 'PEP': return <UserX className="w-4 h-4" />;
      case 'COMPLIANCE': return <Scale className="w-4 h-4" />;
      case 'REPUTATION': return <AlertTriangle className="w-4 h-4" />;
      default: return <ShieldAlert className="w-4 h-4" />;
    }
  };

  return (
    <div className="p-8 min-h-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 relative transition-colors duration-300">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Global Risk Monitor</h1>
            <div className="relative flex items-center justify-center">
                <div className="absolute w-full h-full bg-yellow-500/30 rounded-full animate-ping"></div>
                <Heart className="w-5 h-5 text-yellow-500 fill-yellow-500 relative z-10" />
            </div>
          </div>
          <p className="text-slate-500 dark:text-slate-400">Real-time AI surveillance of global adverse media and sanctions.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Summary & Filters */}
        <div className="lg:col-span-3 space-y-6">
            {/* Summary Card */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xl transition-colors">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Summary</h3>
                <div className="flex gap-4">
                    <div className="bg-slate-100 dark:bg-slate-950/50 p-4 rounded-lg flex-1 border border-slate-200 dark:border-slate-800/50 text-center">
                        <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1">{events.length}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">Total Findings</div>
                    </div>
                    <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-lg flex-1 border border-red-100 dark:border-red-900/20 text-center">
                        <div className="text-3xl font-bold text-red-600 dark:text-red-500 mb-1">{highRiskCount}</div>
                        <div className="text-[10px] text-red-600/70 dark:text-red-400/70 uppercase font-bold tracking-wider">Critical Risks</div>
                    </div>
                </div>
            </div>

            {/* Filters Card */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xl h-fit transition-colors">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Filters</h3>
                
                <div className="space-y-6">
                    <div>
                        <div className="flex items-center justify-between mb-4 cursor-pointer group">
                            <span className="text-sm font-medium text-slate-500 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white">Risk Categories</span>
                            <Layers className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                        </div>
                        <div className="space-y-3">
                            {CATEGORY_FILTERS.map(item => (
                                <label key={item.id} className="flex items-center gap-3 cursor-pointer group select-none">
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${selectedCategories.includes(item.id) ? 'bg-brand-600 border-brand-600' : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-950 group-hover:border-slate-400 dark:group-hover:border-slate-500'}`}>
                                        {selectedCategories.includes(item.id) && <div className="w-2 h-2 bg-white rounded-sm" />}
                                    </div>
                                    <input 
                                        type="checkbox" 
                                        className="hidden" 
                                        checked={selectedCategories.includes(item.id)}
                                        onChange={() => toggleCategory(item.id)}
                                    />
                                    <span className="text-sm text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors font-medium">
                                        {item.label}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* CENTER COLUMN: Feed */}
        <div className="lg:col-span-6 space-y-4">
            {loading ? (
                 // INTERACTIVE LOADING STATE
                <div className="flex flex-col items-center justify-center h-96 bg-white/50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800/50 backdrop-blur-sm">
                    <div className="relative mb-8">
                        <div className="w-20 h-20 bg-brand-500/20 rounded-full animate-ping absolute inset-0"></div>
                        <div className="w-20 h-20 bg-brand-500/10 rounded-full animate-pulse absolute inset-0 delay-75"></div>
                        <div className="w-20 h-20 rounded-full flex items-center justify-center border border-brand-500/30 relative z-10 bg-white dark:bg-slate-900">
                             <Radio className="w-8 h-8 text-brand-500 animate-pulse" />
                        </div>
                    </div>
                    <h2 className="text-xl font-mono text-brand-600 dark:text-brand-400 animate-pulse font-medium tracking-tight transition-all duration-500 text-center min-w-[320px]">
                        {LOADING_TEXTS[loadingTextIdx]}
                    </h2>
                </div>
            ) : filteredEvents.length > 0 ? (
                filteredEvents.map((event, idx) => (
                    <div key={idx} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 hover:border-brand-500/30 transition-all duration-300 shadow-lg group relative overflow-hidden">
                        
                        {/* Card Header */}
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${getSeverityStyles(event.severity)}`}>
                                    {event.severity === 'HIGH' ? 'Critical' : event.severity}
                                </span>
                                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-bold">
                                    {getCategoryIcon(event.category)}
                                    <span className="text-sm capitalize">{CATEGORY_FILTERS.find(c => c.id === event.category)?.label || event.category}</span>
                                </div>
                            </div>
                            
                            {/* Live Blinking Icon */}
                            <div className="flex items-center gap-2 bg-red-50 dark:bg-red-950/30 px-2 py-1 rounded border border-red-100 dark:border-red-900/50">
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                </span>
                                <span className="text-[10px] font-bold text-red-600 dark:text-red-400 tracking-widest animate-pulse">LIVE</span>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="mb-5">
                            <h4 className="text-md font-semibold text-slate-900 dark:text-white mb-2">{event.headline}</h4>
                            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                                <span className="text-slate-400 dark:text-slate-500 mr-1 font-medium">News Findings:</span>
                                "{event.summary}..." 
                                <button 
                                    onClick={() => setSelectedEvent(event)}
                                    className="text-brand-600 dark:text-brand-500 hover:underline ml-2 font-medium focus:outline-none"
                                >
                                    show more
                                </button>
                            </p>
                        </div>

                        {/* Footer */}
                        <div className="pt-4 border-t border-slate-100 dark:border-slate-800/50 flex flex-wrap items-center gap-3 text-xs text-slate-500 font-mono">
                            <div className="flex items-center gap-2 text-slate-400">
                                <Globe className="w-3 h-3" />
                                <span>{event.location || "Global"}</span>
                            </div>

                            <span className="text-slate-300 dark:text-slate-700">|</span>

                            <div className="flex items-center gap-2 font-bold text-brand-600 dark:text-brand-400/90">
                                <Newspaper className="w-3 h-3" />
                                <span>{event.source || "Unknown Source"}</span>
                            </div>

                            <span className="text-slate-300 dark:text-slate-700">|</span>

                            <a 
                                href={event.url || "#"} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 hover:text-brand-500 cursor-pointer transition-colors"
                            >
                                <Link2 className="w-3 h-3" />
                                <span>View Source URL</span>
                            </a>
                             <span className="ml-auto text-slate-400 dark:text-slate-400 font-semibold">
                                {event.timestamp}
                            </span>
                        </div>
                    </div>
                ))
            ) : (
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center">
                    <ShieldAlert className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 dark:text-slate-300">No matching events found</h3>
                    <p className="text-sm text-slate-500 mt-2">Try selecting more risk categories to view updates.</p>
                    <button onClick={fetchUpdates} className="mt-6 text-brand-600 dark:text-brand-500 hover:text-brand-500 text-sm font-medium border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">Refresh Data</button>
                </div>
            )}
        </div>

        {/* RIGHT COLUMN: Widgets */}
        <div className="lg:col-span-3 space-y-6">
            {/* Source Data Audit Trail - Redesigned & Blinking */}
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-0 shadow-xl overflow-hidden flex flex-col h-[500px]">
                <div className="p-4 border-b border-slate-800 bg-slate-950 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Server className="w-4 h-4 text-emerald-500" />
                        <h3 className="text-sm font-bold text-white uppercase tracking-wide">Source Audit</h3>
                    </div>
                    <div className="flex gap-1">
                         <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                         <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse delay-75"></div>
                         <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse delay-150"></div>
                    </div>
                </div>
                
                <div className="flex-1 bg-black p-4 font-mono text-xs overflow-y-auto custom-scrollbar">
                     <div className="space-y-1">
                        {/* Simulated Terminal Output */}
                        <div className="text-slate-500 border-b border-slate-800 pb-2 mb-2">
                             > risklens-agent --audit-mode<br/>
                             > initializing connection pool...<br/>
                             > connected to 48 global nodes.
                        </div>

                        {MOCK_AUDIT_SOURCES.map((item, i) => (
                            <div key={i} className="flex items-center justify-between py-2 border-b border-slate-800/50 group hover:bg-slate-900/50 transition-colors px-1 rounded">
                                <div className="flex items-center gap-3">
                                    <div className={`w-1.5 h-1.5 rounded-full ${item.status === 'Active' ? 'bg-emerald-500 animate-pulse' : item.status === 'Syncing' ? 'bg-blue-500 animate-pulse' : 'bg-slate-600'}`}></div>
                                    <span className="text-slate-300 group-hover:text-white">{item.source}</span>
                                </div>
                                <div className="flex items-center gap-2 text-slate-600">
                                    <Wifi className="w-3 h-3" />
                                    <span className={`text-[10px] ${parseInt(item.latency) > 100 ? 'text-yellow-500' : 'text-emerald-500'}`}>{item.latency}</span>
                                </div>
                            </div>
                        ))}
                        
                        {/* Animated Fake Log */}
                        <div className="mt-4 text-slate-600 space-y-1 opacity-70">
                             <p>[14:02:41] Syncing packet #4992...</p>
                             <p>[14:02:42] Verifying PGP signature...</p>
                             <p className="text-emerald-500/80">[14:02:42] Data packet Verified.</p>
                             <p className="animate-pulse">[14:02:43] Awaiting new stream...</p>
                        </div>
                     </div>
                </div>
                
                <div className="p-3 bg-slate-950 border-t border-slate-800 flex justify-between items-center text-[10px] text-slate-500">
                     <div className="flex items-center gap-1">
                         <Database className="w-3 h-3" />
                         <span>Global Node: LOS-1</span>
                     </div>
                     <span>Uptime: 99.9%</span>
                </div>
            </div>
        </div>
      </div>

      {/* SHOW MORE OVERLAY / MODAL */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-start bg-white dark:bg-slate-900 sticky top-0">
               <div>
                 <div className="flex items-center gap-3 mb-2">
                     <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide border ${getSeverityStyles(selectedEvent.severity)}`}>
                         {selectedEvent.severity}
                     </span>
                     <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-xs font-mono uppercase">
                         <Calendar className="w-3 h-3" /> {selectedEvent.timestamp}
                     </span>
                 </div>
                 <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-snug">{selectedEvent.headline}</h2>
               </div>
               <button 
                 onClick={() => setSelectedEvent(null)}
                 className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
               >
                 <X className="w-5 h-5" />
               </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto bg-white dark:bg-slate-900">
               {/* Category Tag */}
               <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400 mb-6 bg-brand-50 dark:bg-brand-900/10 p-3 rounded-lg border border-brand-200 dark:border-brand-500/20 w-fit">
                   {getCategoryIcon(selectedEvent.category)}
                   <span className="text-xs font-bold uppercase tracking-wider">{CATEGORY_FILTERS.find(c => c.id === selectedEvent.category)?.label || selectedEvent.category}</span>
                   <span className="text-slate-300 dark:text-slate-600">|</span>
                   <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Source: {selectedEvent.source}</span>
               </div>

               {/* Main Insights */}
               <div className="space-y-6">
                  <div>
                     <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2 flex items-center gap-2">
                       <Newspaper className="w-4 h-4" /> Summary
                     </h3>
                     <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-sm">{selectedEvent.summary}</p>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/30 p-5 rounded-xl border border-slate-200 dark:border-slate-700/50">
                     <h3 className="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                       <ShieldAlert className="w-4 h-4" /> Risk Insights & Analysis
                     </h3>
                     <p className="text-slate-700 dark:text-slate-200 leading-relaxed text-sm">{selectedEvent.insights || "Detailed analysis not available for this event."}</p>
                  </div>
               </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Globe className="w-3 h-3" />
                    <span>{selectedEvent.location}</span>
                </div>
                <a 
                   href={selectedEvent.url} 
                   target="_blank" 
                   rel="noopener noreferrer"
                   className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                >
                   Read Full Article on {selectedEvent.source} <Link2 className="w-4 h-4" />
                </a>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};