import React, { useMemo, useState, useRef } from 'react';
import { 
  Activity, Scale, AlertOctagon, AlertTriangle, 
  Briefcase, ShieldCheck, Zap, 
  SearchX, ShieldAlert, BarChart3, Lock
} from 'lucide-react';
import { RiskAnalysisResult } from '../types';

interface Props {
  riskData: RiskAnalysisResult | null;
}

export const LiveRiskDashboard: React.FC<Props> = ({ riskData }) => {
  const [hoverData, setHoverData] = useState<{ x: number; y: number; value: number; day: number } | null>(null);
  const [timeRange, setTimeRange] = useState<'30' | '60' | '90'>('30');
  const chartRef = useRef<HTMLDivElement>(null);

  // ---------------------------------------------------------------------------
  // RISK CALCULATION ENGINE
  // ---------------------------------------------------------------------------
  const analytics = useMemo(() => {
    if (!riskData) return null;

    const { report } = riskData;
    const baseRiskScore = report.riskScore; // 0-100 from Gemini

    // Helper: Parse text intensity to determine sub-scores (0-10)
    const analyzeCategory = (text: string): number => {
        if (!text) return 0;
        const lower = text.toLowerCase();
        
        // Safe patterns
        if (lower.includes('no significant') || lower.includes('no adverse') || lower.includes('none found')) {
            return 1; 
        }

        // Danger patterns
        let score = 3; // Base score if text exists
        if (text.length > 100) score += 2; // Length implies detail
        if (text.length > 300) score += 2;
        
        const keywords = ['convicted', 'sanctioned', 'guilty', 'fraud', 'money laundering', 'arrested', 'fine', 'penalty', 'ban'];
        const hitCount = keywords.filter(k => lower.includes(k)).length;
        score += hitCount * 1.5;

        return Math.min(10, score);
    };

    // 1. Calculate Sub-scores for specific categories
    const litScore = analyzeCategory(report.litigation);
    const sancScore = analyzeCategory(report.sanctions);
    const repScore = analyzeCategory(report.reputation);
    const pepScore = analyzeCategory(report.pepExposure);
    const compScore = analyzeCategory(report.complianceGaps);

    // 2. Derive SEVERITY (Impact if risk materializes)
    const severityRaw = (sancScore * 2.5) + (pepScore * 2) + (litScore * 1.5) + compScore;
    const severityNormalized = Math.min(100, Math.max(10, (severityRaw / 40) * 100));

    // 3. Derive LIKELIHOOD (Probability of occurrence/recurrence)
    const likelihoodRaw = (repScore * 2.5) + (compScore * 2) + (litScore * 1);
    const likelihoodNormalized = Math.min(100, Math.max(10, (likelihoodRaw / 35) * 100));

    // 4. Calculate RESIDUAL RISK (Net risk remaining)
    const calculatedRisk = (severityNormalized * likelihoodNormalized) / 100;
    const residualRisk = Math.round((calculatedRisk + baseRiskScore) / 2);

    // 5. Trend Simulation (Dynamic based on Time Range)
    const days = parseInt(timeRange);
    const trendPoints = Array.from({ length: days }, (_, i) => {
        const volatility = residualRisk > 50 ? 12 : 5;
        const noise = (Math.random() - 0.5) * volatility;
        // Simulate a trend: if high risk, it might be volatile or trending up slightly
        // We scale the bias start point based on total days to keep the curve looking similar
        const biasStart = Math.floor(days * 0.6); 
        const bias = i > biasStart && residualRisk > 60 ? (i - biasStart) * (0.5 * (30/days)) : 0;
        return Math.max(5, Math.min(98, residualRisk + noise + bias));
    });

    const points = trendPoints.map((val, i) => {
        const x = (i / (days - 1)) * 100;
        const y = 100 - val; 
        return `${x},${y}`;
    }).join(' ');
    const pathD = `M0,${100-trendPoints[0]} L${points}`;

    return {
        severity: Math.round(severityNormalized),
        likelihood: Math.round(likelihoodNormalized),
        residualRisk,
        pathD,
        trendPoints,
        days,
        categories: [
            { id: 'litigation', label: 'Litigation History', score: litScore, text: report.litigation, icon: Scale },
            { id: 'sanctions', label: 'Sanctions Exposure', score: sancScore, text: report.sanctions, icon: AlertOctagon },
            { id: 'reputation', label: 'Reputational Issues', score: repScore, text: report.reputation, icon: AlertTriangle },
            { id: 'pep', label: 'PEP Exposure', score: pepScore, text: report.pepExposure, icon: Briefcase },
            { id: 'compliance', label: 'Compliance Gaps', score: compScore, text: report.complianceGaps, icon: ShieldAlert },
        ]
    };
  }, [riskData, timeRange]);


  // ---------------------------------------------------------------------------
  // INTERACTION HANDLERS
  // ---------------------------------------------------------------------------
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!analytics || !chartRef.current) return;
    const rect = chartRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const totalPoints = analytics.days;
    // Map mouse X to the nearest data point index
    const index = Math.min(totalPoints - 1, Math.max(0, Math.round((x / rect.width) * (totalPoints - 1))));
    const value = analytics.trendPoints[index];
    setHoverData({
        x: (index / (totalPoints - 1)) * 100,
        y: 100 - value,
        value: Math.round(value),
        day: index + 1
    });
  };

  // ---------------------------------------------------------------------------
  // RENDER HELPERS
  // ---------------------------------------------------------------------------
  const getStatusColor = (val: number) => {
      if (val >= 70) return 'text-red-600 dark:text-red-500 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      if (val >= 40) return 'text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800';
      return 'text-emerald-600 dark:text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800';
  };

  const getLabel = (val: number) => {
      if (val >= 70) return 'CRITICAL';
      if (val >= 40) return 'MODERATE';
      return 'LOW';
  };

  // ---------------------------------------------------------------------------
  // EMPTY STATE
  // ---------------------------------------------------------------------------
  if (!riskData || !analytics) {
    return (
        <div className="flex flex-col items-center justify-center h-full p-8 animate-fade-in">
            <div className="relative group cursor-default">
                <div className="absolute inset-0 bg-brand-500/20 blur-2xl rounded-full animate-pulse"></div>
                <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 relative z-10">
                    <SearchX className="w-16 h-16 text-slate-300 dark:text-slate-600" />
                </div>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-8 mb-2">Waiting for Investigation Data</h2>
            <p className="text-slate-500 dark:text-slate-400 text-center max-w-md">
                This dashboard will automatically populate with Severity, Likelihood, and Residual Risk metrics once you run a search in the Investigation Console.
            </p>
        </div>
    );
  }

  // ---------------------------------------------------------------------------
  // MAIN DASHBOARD
  // ---------------------------------------------------------------------------
  return (
    <div className="p-8 min-h-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
            <div className="flex items-center gap-3">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Live Risk Analytics</h2>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px] font-bold uppercase tracking-wider border border-green-200 dark:border-green-800">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                    </span>
                    Active Monitoring
                </div>
            </div>
            <p className="text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2 text-sm">
                Target Entity: <span className="font-mono font-semibold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">{riskData.entityName}</span>
            </p>
        </div>
        <div className="text-right text-xs text-slate-400 dark:text-slate-600 font-mono">
            Last Update: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* TOP ROW: KEY RISK METRICS (Severity, Likelihood, Residual) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          
          {/* 1. SEVERITY */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-lg relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Zap className="w-20 h-20 text-slate-900 dark:text-white" />
              </div>
              <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Severity Impact</h3>
              <div className="flex items-end gap-3">
                  <span className={`text-4xl font-bold ${analytics.severity > 60 ? 'text-red-600 dark:text-red-500' : 'text-slate-900 dark:text-white'}`}>
                      {analytics.severity}
                  </span>
                  <span className="text-sm text-slate-400 mb-1">/ 100</span>
              </div>
              <div className="mt-4">
                  <div className="flex justify-between text-xs mb-1 font-medium">
                      <span className={analytics.severity > 60 ? 'text-red-600' : 'text-slate-500'}>{getLabel(analytics.severity)}</span>
                      <span className="text-slate-400">Potential Damage</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-1000 ${analytics.severity > 60 ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${analytics.severity}%` }}></div>
                  </div>
              </div>
          </div>

          {/* 2. LIKELIHOOD */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-lg relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                  <BarChart3 className="w-20 h-20 text-slate-900 dark:text-white" />
              </div>
              <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Occurrence Likelihood</h3>
              <div className="flex items-end gap-3">
                  <span className={`text-4xl font-bold ${analytics.likelihood > 60 ? 'text-orange-600 dark:text-orange-500' : 'text-slate-900 dark:text-white'}`}>
                      {analytics.likelihood}
                  </span>
                  <span className="text-sm text-slate-400 mb-1">/ 100</span>
              </div>
              <div className="mt-4">
                   <div className="flex justify-between text-xs mb-1 font-medium">
                      <span className={analytics.likelihood > 60 ? 'text-orange-600' : 'text-slate-500'}>{getLabel(analytics.likelihood)}</span>
                      <span className="text-slate-400">Probability</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-1000 ${analytics.likelihood > 60 ? 'bg-orange-500' : 'bg-indigo-500'}`} style={{ width: `${analytics.likelihood}%` }}></div>
                  </div>
              </div>
          </div>

          {/* 3. RESIDUAL RISK (The Big One) */}
          <div className={`rounded-xl p-6 border shadow-lg relative overflow-hidden ${analytics.residualRisk > 70 ? 'bg-red-600 text-white border-red-500' : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-800 dark:border-slate-200'}`}>
              <div className="absolute top-0 right-0 p-3 opacity-10">
                  <Lock className="w-20 h-20" />
              </div>
              <h3 className={`text-sm font-bold uppercase tracking-wider mb-2 ${analytics.residualRisk > 70 ? 'text-red-100' : 'text-slate-400 dark:text-slate-500'}`}>Overall Residual Risk</h3>
              <div className="flex items-end gap-3">
                  <span className="text-5xl font-bold">
                      {analytics.residualRisk}%
                  </span>
              </div>
              <p className={`mt-2 text-sm ${analytics.residualRisk > 70 ? 'text-red-100' : 'text-slate-400 dark:text-slate-600'}`}>
                  Net risk exposure after calculated controls.
              </p>
              <div className="mt-4 px-3 py-1 rounded bg-black/20 dark:bg-black/5 w-fit text-xs font-bold uppercase tracking-wide">
                  {getLabel(analytics.residualRisk)} Priority
              </div>
          </div>
      </div>

      {/* MIDDLE ROW: CATEGORY BREAKDOWN & TREND CHART */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Category List */}
          <div className="lg:col-span-1 space-y-4">
              <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Risk Factors Breakdown</h3>
              {analytics.categories.map((cat) => (
                  <div key={cat.id} className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
                      <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${getStatusColor(cat.score * 10)} bg-opacity-10 border-opacity-20`}>
                                  <cat.icon className="w-4 h-4" />
                              </div>
                              <span className="font-bold text-sm text-slate-700 dark:text-slate-200">{cat.label}</span>
                          </div>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded border ${getStatusColor(cat.score * 10)}`}>
                              {cat.score >= 7 ? 'HIGH' : cat.score >= 4 ? 'MED' : 'LOW'}
                          </span>
                      </div>
                      {/* Mini Progress Bar */}
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${cat.score >= 7 ? 'bg-red-500' : cat.score >= 4 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${cat.score * 10}%` }}></div>
                      </div>
                  </div>
              ))}
          </div>

          {/* Residual Risk Trend Chart */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xl flex flex-col">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                  <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <Activity className="w-5 h-5 text-brand-500" /> 
                          Residual Risk Trend
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Projected volatility based on current exposure.</p>
                  </div>
                  {/* Time Range Selectors */}
                  <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                      {(['30', '60', '90'] as const).map((range) => (
                          <button
                              key={range}
                              onClick={() => setTimeRange(range)}
                              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                                  timeRange === range 
                                  ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm' 
                                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                              }`}
                          >
                              {range} Days
                          </button>
                      ))}
                  </div>
              </div>
              
              <div 
                  ref={chartRef}
                  className="flex-1 relative w-full bg-slate-50 dark:bg-slate-950/30 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden p-4 cursor-crosshair min-h-[300px]"
                  onMouseMove={handleMouseMove}
                  onMouseLeave={() => setHoverData(null)}
              >
                  {/* Grid & Guides */}
                  <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none opacity-10">
                      <div className="border-b border-slate-900 dark:border-white w-full"></div>
                      <div className="border-b border-slate-900 dark:border-white w-full"></div>
                      <div className="border-b border-slate-900 dark:border-white w-full"></div>
                  </div>

                  <svg className="w-full h-full overflow-visible pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 100">
                      {/* Gradient Definition */}
                      <defs>
                        <linearGradient id="riskGradient" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0%" stopColor={analytics.residualRisk > 60 ? '#ef4444' : '#3b82f6'} stopOpacity="0.2" />
                          <stop offset="100%" stopColor={analytics.residualRisk > 60 ? '#ef4444' : '#3b82f6'} stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      
                      <path 
                          d={analytics.pathD} 
                          fill="none" 
                          stroke={analytics.residualRisk > 60 ? '#ef4444' : '#3b82f6'} 
                          strokeWidth="3" 
                          vectorEffect="non-scaling-stroke"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                      />
                      <path 
                          d={`${analytics.pathD} L100,100 L0,100 Z`} 
                          fill="url(#riskGradient)"
                          stroke="none"
                      />
                      
                      {hoverData && (
                          <g>
                              <line x1={hoverData.x} y1="0" x2={hoverData.x} y2="100" stroke="currentColor" strokeDasharray="2,2" className="text-slate-400" strokeWidth="0.5" vectorEffect="non-scaling-stroke" />
                              <circle 
                                  cx={hoverData.x} 
                                  cy={hoverData.y} 
                                  r="4" 
                                  className={`fill-white dark:fill-slate-900 ${analytics.residualRisk > 60 ? 'stroke-red-500' : 'stroke-brand-500'}`}
                                  strokeWidth="2"
                                  vectorEffect="non-scaling-stroke"
                              />
                          </g>
                      )}
                  </svg>

                  {hoverData && (
                      <div 
                          className="absolute bg-slate-900 text-white text-xs rounded-lg px-3 py-2 pointer-events-none shadow-xl border border-slate-700 z-20 whitespace-nowrap"
                          style={{ 
                              left: `${hoverData.x}%`, 
                              top: `${hoverData.y}%`, 
                              transform: 'translate(-50%, -150%)' 
                          }}
                      >
                          <div className="font-bold text-sm mb-1">Risk Level: {hoverData.value}%</div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-1">
                              <Activity className="w-3 h-3" /> Day {hoverData.day} Projection
                          </div>
                      </div>
                  )}
              </div>
              
              <div className="flex justify-between items-center mt-4 text-xs text-slate-400 font-mono">
                  <span>T-Minus {analytics.days} Days</span>
                  <span>Current State</span>
              </div>
          </div>
      </div>
    </div>
  );
};