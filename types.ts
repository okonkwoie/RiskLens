
export interface EntityRiskReport {
  entityInfo: string;
  litigation: string;
  sanctions: string;
  reputation: string;
  pepExposure: string;
  complianceGaps: string;
  riskScore: number; // 0-100
}

export interface SearchSource {
  title: string;
  uri: string;
}

export interface RiskAnalysisResult {
  report: EntityRiskReport;
  sources: SearchSource[];
  analyzedAt: string;
  entityName: string;
}

export interface GlobalEvent {
  headline: string;
  summary: string;
  insights: string; // Deeper analysis for the overlay
  location: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  timestamp: string; // Actual article date
  category: 'LITIGATION' | 'SANCTIONS' | 'REPUTATION' | 'PEP' | 'COMPLIANCE';
  url: string; // Direct link to source
  source: string; // Name of the publisher (e.g. Punch, TechCabal)
}
