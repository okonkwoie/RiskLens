import React, { useState } from 'react';
import { RiskAnalysisResult } from '../types';
import { 
  AlertOctagon, Gavel, Building, Scale, UserX, Search, 
  FileCheck, ChevronDown, ChevronUp, Download, AlertTriangle, 
  Loader2, Maximize2, X, ShieldCheck, Copy
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface Props {
  result: RiskAnalysisResult;
}

export const RiskReportView: React.FC<Props> = ({ result }) => {
  const { report, sources, analyzedAt, entityName } = result;
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [activeSection, setActiveSection] = useState<{title: string, content: string, icon: React.ElementType, color: string} | null>(null);

  // Helper to check for adverse content to show danger sign
  const hasAdverseFindings = (text: string): boolean => {
    if (!text) return false;
    const lower = text.toLowerCase();
    const safePhrases = [
      "no significant adverse", 
      "no adverse", 
      "no records found", 
      "no significant litigation",
      "not listed",
      "no sanctions",
      "no data available",
      "content generated but structured parsing failed",
      "none."
    ];
    if (safePhrases.some(phrase => lower.includes(phrase))) return false;
    return text.length > 30; // Assume adverse if meaningful text exists and isn't "safe"
  };

  const handleGeneratePdf = async () => {
    const element = document.getElementById('risk-report-content');
    if (!element) return;

    setIsGeneratingPdf(true);

    try {
      const originalShadows = element.style.boxShadow;
      element.style.boxShadow = 'none';
      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff', // Force white background for PDF
        windowWidth: 1200,
        ignoreElements: (element) => element.hasAttribute('data-html2canvas-ignore'),
        onclone: (clonedDoc) => {
           // CRITICAL: Expand all truncated text for the PDF capture
           const cards = clonedDoc.querySelectorAll('.report-card-content');
           cards.forEach((card: any) => {
              card.style.display = 'block';
              card.style.overflow = 'visible';
              card.style.webkitLineClamp = 'unset';
              card.style.maxHeight = 'none';
           });
           
           // Hide the "Show full analysis" buttons and gradients in PDF
           const interactiveElements = clonedDoc.querySelectorAll('.report-interactive');
           interactiveElements.forEach((el: any) => el.style.display = 'none');
           
           // Ensure the background is white for the print
           const wrapper = clonedDoc.getElementById('risk-report-content');
           if (wrapper) {
             wrapper.style.backgroundColor = '#ffffff';
             wrapper.style.color = '#0f172a';
           }
        }
      });

      element.style.boxShadow = originalShadows;

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`${entityName.replace(/\s+/g, '_')}_RiskLens_Report.pdf`);
    } catch (error) {
      console.error("PDF Generation Error:", error);
      alert("Failed to generate PDF.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const getRiskLabel = (score: number) => {
    if (score >= 75) return { label: 'HIGH', color: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800' };
    if (score >= 30) return { label: 'MEDIUM', color: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800' };
    return { label: 'LOW', color: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800' };
  };

  const riskStatus = getRiskLabel(report.riskScore);

  const ReportCard = ({ title, icon: Icon, content, color, isFullWidth }: any) => {
    const isAdverse = hasAdverseFindings(content);
    
    return (
      <div 
        onClick={() => setActiveSection({ title, content, icon: Icon, color })}
        className={`group relative bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer hover:border-brand-500/50 ${isFullWidth ? 'col-span-1 md:col-span-2' : ''}`}
      >
        <div className="flex justify-between items-start mb-3">
             <h3 className={`text-sm font-bold uppercase tracking-wide flex items-center gap-2 ${color || 'text-slate-900 dark:text-white'}`}>
               <Icon className="w-4 h-4" /> {title}
             </h3>
             <Maximize2 className="w-4 h-4 text-slate-300 group-hover:text-brand-500 transition-colors opacity-50 group-hover:opacity-100" />
        </div>
        
        <div className="relative">
            {/* Content with truncation */}
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed line-clamp-3 report-card-content">
                {content}
            </p>
            
            {/* Gradient Overlay */}
            <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-white dark:from-slate-900 to-transparent report-interactive"></div>
        </div>
        
        <div className="mt-4 flex items-center text-xs font-medium text-brand-600 dark:text-brand-400 opacity-60 group-hover:opacity-100 transition-opacity report-interactive">
            Show full analysis &rarr;
        </div>
        
        {/* Warning Badge */}
        {isAdverse && (
            <div className="absolute top-4 right-12 animate-pulse" title="Potential Risk Identified">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
            </div>
        )}
      </div>
    );
  };

  return (
    <div className="pb-20">
      {/* Printable Report Container */}
      <div id="risk-report-content" className="bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 md:p-10 rounded-xl shadow-2xl max-w-5xl mx-auto border border-slate-100 dark:border-slate-800 relative transition-colors duration-300">
        
        {/* Report Header */}
        <div className="flex flex-col md:flex-row justify-between items-start border-b-2 border-slate-100 dark:border-slate-800 pb-8 mb-8 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
               <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">{entityName}</h2>
            </div>
            <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1 font-medium font-mono">
                <FileCheck className="w-4 h-4 text-brand-600" /> REF: {Math.floor(Math.random() * 1000000)}
              </span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span>{analyzedAt}</span>
            </div>
          </div>
          
          <div className="flex flex-col items-end">
             <div className="text-right mb-2">
               <span className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Composite Risk Score</span>
             </div>
             <div className={`px-5 py-2 rounded-lg border ${riskStatus.color} font-bold text-sm tracking-wide shadow-sm flex items-center gap-2`}>
                {riskStatus.label === 'LOW' ? <ShieldCheck className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                {riskStatus.label} RISK
             </div>
          </div>
        </div>

        {/* Executive Summary Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-8">
          
          <ReportCard 
            title="Entity Background" 
            icon={Building} 
            content={report.entityInfo} 
            isFullWidth={true}
          />
          
          <ReportCard 
            title="Sanctions & Watchlists" 
            icon={AlertOctagon} 
            content={report.sanctions} 
            color="text-red-700 dark:text-red-400"
          />

          <ReportCard 
            title="Litigation History" 
            icon={Gavel} 
            content={report.litigation} 
            color="text-indigo-600 dark:text-indigo-400"
          />

          <ReportCard 
            title="PEP Exposure" 
            icon={UserX} 
            content={report.pepExposure} 
            color="text-orange-600 dark:text-orange-400"
          />

          <ReportCard 
            title="Compliance & Regulatory" 
            icon={Scale} 
            content={report.complianceGaps} 
            color="text-emerald-600 dark:text-emerald-400"
          />

          <ReportCard 
            title="Reputational Profile" 
            icon={AlertTriangle} 
            content={report.reputation} 
            isFullWidth={true}
          />
        </div>

        {/* Collapsible Sources Footer */}
        <div className="mt-8 border-t border-slate-200 dark:border-slate-800 break-inside-avoid pt-6">
          <button 
            onClick={() => setSourcesOpen(!sourcesOpen)}
            className="w-full flex items-center justify-between text-left px-4 py-3 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800/50 rounded-lg transition-colors group border border-slate-200 dark:border-slate-800"
          >
            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2 group-hover:text-slate-700 dark:group-hover:text-slate-200">
              <Search className="w-3 h-3" /> Verified Sources / Citations ({sources.length})
            </h4>
            {sourcesOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${sourcesOpen ? 'max-h-[500px] opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
            <ul className="grid grid-cols-1 gap-2 pl-4">
              {sources.length > 0 ? sources.map((source, idx) => (
                <li key={idx} className="text-xs text-blue-600 dark:text-blue-400 truncate hover:underline">
                  <a href={source.uri} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                    <span className="text-slate-400 font-mono">[{idx + 1}]</span> {source.title} <span className="text-slate-300 dark:text-slate-600">- {new URL(source.uri).hostname}</span>
                  </a>
                </li>
              )) : (
                <li className="text-xs text-slate-400 italic">No direct web sources linked in metadata.</li>
              )}
            </ul>
          </div>
        </div>

        {/* PDF Download Button */}
        <div className="mt-8 border-t border-slate-100 dark:border-slate-800 pt-6 flex justify-center" data-html2canvas-ignore="true">
            <button 
            onClick={handleGeneratePdf}
            disabled={isGeneratingPdf}
            className="flex items-center gap-2 px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 rounded-lg text-sm font-bold transition-all hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
            >
            {isGeneratingPdf ? (
                <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Compiling Report...</span>
                </>
            ) : (
                <>
                <Download className="w-4 h-4" />
                <span>Export Full Report (PDF)</span>
                </>
            )}
            </button>
        </div>
        
        <div className="mt-12 text-center">
          <p className="text-[10px] text-slate-400 dark:text-slate-600 uppercase tracking-widest">
            RiskLens Intelligence • Confidential
          </p>
        </div>
      </div>

      {/* FULL DETAILS OVERLAY (MODAL) */}
      {activeSection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
            <div 
                className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-scale-up border border-slate-200 dark:border-slate-800"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900">
                    <h3 className={`text-lg font-bold uppercase tracking-wide flex items-center gap-3 ${activeSection.color || 'text-slate-900 dark:text-white'}`}>
                        <activeSection.icon className="w-5 h-5" />
                        {activeSection.title}
                    </h3>
                    <button 
                        onClick={() => setActiveSection(null)}
                        className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Modal Content */}
                <div className="p-8 overflow-y-auto custom-scrollbar bg-white dark:bg-slate-900">
                    <div className="prose dark:prose-invert max-w-none">
                        <p className="text-slate-700 dark:text-slate-300 leading-loose whitespace-pre-line text-sm md:text-base font-light">
                            {activeSection.content}
                        </p>
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex justify-end">
                    <button 
                        onClick={() => {
                            navigator.clipboard.writeText(activeSection.content);
                            // Optional: Add toast notification here
                        }}
                        className="text-xs flex items-center gap-2 text-slate-500 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400 transition-colors px-3 py-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800"
                    >
                        <Copy className="w-3 h-3" /> Copy to clipboard
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};