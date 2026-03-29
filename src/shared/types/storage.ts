import type { AICategory, RiskLevel } from '@shared/types/domain';
import type { DiscoveryRecord } from '@shared/types/discovery';

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

export interface AppSettings {
  version: string;
  companyName: string;
  responsiblePerson: string;
  installationDate: string;
  badgeNotifications: boolean;
  customDomains: CustomDomainEntry[];
  excludedDomains: string[];
}

export interface StorageSchema {
  ai_discoveries: DiscoveryRecord[];
  app_settings: AppSettings;
  activity_log: ActivityLogEntry[];
}

export const STORAGE_KEYS = {
  AI_DISCOVERIES: 'ai_discoveries',
  APP_SETTINGS: 'app_settings',
  ACTIVITY_LOG: 'activity_log',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

export const ACTIVITY_LOG_MAX_ENTRIES = 1000;
