import type { AICategory, RiskLevel } from '@shared/types/domain';
import type { DiscoveryRecord } from '@shared/types/discovery';
import type { RegulationType, ComplianceSnapshot } from '@shared/types/compliance';

export type ActivityEventType =
  | 'new_detection'
  | 'risk_classified'
  | 'status_changed'
  | 'assessment_completed'
  | 'report_generated'
  | 'settings_updated';

export interface ActivityLogEntry {
  id: string;
  timestamp: string;
  eventType: ActivityEventType;
  domain: string;
  details: string;
}

export interface CustomDomainEntry {
  domain: string;
  toolName: string;
  category: AICategory;
  defaultRiskLevel: RiskLevel;
}

export interface RegulationConfig {
  enabled: boolean;
  customDueDateOffsetDays: number;
}

export type AdminRole = 'compliance_officer' | 'it_admin' | 'auditor' | 'executive';

export interface AdminProfile {
  adminName: string;
  adminEmail: string;
  adminRole: AdminRole;
  department: string;
}

export interface AuditModeConfig {
  auditMode: boolean;
  auditModeActivatedAt: string | null;
  auditModeActivatedBy: string | null;
}

export type DateFormat = 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD'

export interface AppSettings {
  version: string;
  companyName: string;
  responsiblePerson: string;
  installationDate: string;
  badgeNotifications: boolean;
  requireDepartment: boolean;
  snapshotFrequencyDays: number;
  timezone: string;
  dateFormat: DateFormat;
  customDomains: CustomDomainEntry[];
  excludedDomains: string[];
  regulationConfig: Record<RegulationType, RegulationConfig>;
  auditModeConfig: AuditModeConfig;
  adminProfile: AdminProfile;
}

export interface StorageSchema {
  ai_discoveries: DiscoveryRecord[];
  app_settings: AppSettings;
  activity_log: ActivityLogEntry[];
  compliance_snapshots: ComplianceSnapshot[];
}

export const STORAGE_KEYS = {
  AI_DISCOVERIES: 'ai_discoveries',
  APP_SETTINGS: 'app_settings',
  ACTIVITY_LOG: 'activity_log',
  COMPLIANCE_SNAPSHOTS: 'compliance_snapshots',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

export const ACTIVITY_LOG_MAX_ENTRIES = 1000;
