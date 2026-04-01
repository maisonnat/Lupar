import type { AICategory, RiskLevel } from '@shared/types/domain';
import type { ComplianceChecklist } from '@shared/types/compliance';

export type DiscoveryStatus = 'detected' | 'confirmed' | 'dismissed' | 'authorized';

export type ArticleChecklistMap = Record<string, ComplianceChecklist>;

export interface ComplianceStatusMap {
  euAiAct: ArticleChecklistMap;
  iso42001: ArticleChecklistMap;
  coSb205: ArticleChecklistMap;
}

export type AuditField = 'status' | 'riskLevel' | 'department' | 'notes' | 'compliance';

export interface AuditEntry {
  id: string;
  timestamp: string;
  field: AuditField;
  oldValue: string;
  newValue: string;
  changedBy: string | null;
}

export type DetectionEventType = 'first_seen' | 'visit' | 'status_change' | 'risk_change';

export interface DetectionEvent {
  id: string;
  timestamp: string;
  type: DetectionEventType;
  visitCount: number;
  details: string;
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
  auditTrail: AuditEntry[];
  detectionEvents: DetectionEvent[];
}
