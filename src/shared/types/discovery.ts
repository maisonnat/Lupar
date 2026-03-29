import type { AICategory, RiskLevel } from '@shared/types/domain';
import type { ComplianceChecklist } from '@shared/types/compliance';

export type DiscoveryStatus = 'detected' | 'confirmed' | 'dismissed' | 'authorized';

export interface ComplianceStatusMap {
  euAiAct: ComplianceChecklist;
  iso42001: ComplianceChecklist;
  coSb205: ComplianceChecklist;
}

export interface DiscoveryRecord {
  id: string;
  domain: string;
  toolName: string;
  category: AICategory;
  defaultRiskLevel: RiskLevel;
  userRiskLevel: RiskLevel | null;
  status: DiscoveryStatus;
  department: string | null;
  firstSeen: string;
  lastSeen: string;
  visitCount: number;
  complianceStatus: ComplianceStatusMap;
  notes: string;
  tags: string[];
}
