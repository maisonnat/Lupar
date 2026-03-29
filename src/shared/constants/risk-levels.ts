import type { RiskLevel } from '@shared/types/domain';
import type { DiscoveryStatus } from '@shared/types/discovery';
import type { AICategory } from '@shared/types/domain';

export const RISK_WEIGHTS: Record<RiskLevel, number> = {
  prohibited: 10,
  high: 7,
  limited: 4,
  minimal: 1,
};

export const STATUS_WEIGHTS: Record<DiscoveryStatus, number> = {
  detected: 1.5,
  confirmed: 1.2,
  authorized: 0.5,
  dismissed: 0.0,
};

export interface RiskThreshold {
  min: number;
  max: number;
  label: string;
  color: string;
}

export const RISK_THRESHOLDS: RiskThreshold[] = [
  { min: 0, max: 25, label: 'Bajo', color: '#22c55e' },
  { min: 26, max: 50, label: 'Moderado', color: '#eab308' },
  { min: 51, max: 75, label: 'Alto', color: '#f97316' },
  { min: 76, max: 100, label: 'Crítico', color: '#ef4444' },
];

export const DEFAULT_RISK_BY_CATEGORY: Record<AICategory, RiskLevel> = {
  chatbot: 'limited',
  code_generation: 'limited',
  image_generation: 'limited',
  video_audio_generation: 'limited',
  analysis_bi: 'limited',
  hr_employment: 'high',
  finance_credit: 'high',
  healthcare: 'high',
  education: 'limited',
  biometric_surveillance: 'prohibited',
};

export const RISK_LEVEL_LABELS: Record<RiskLevel, string> = {
  prohibited: 'Prohibido',
  high: 'Alto',
  limited: 'Limitado',
  minimal: 'Mínimo',
};

export const RISK_LEVEL_COLORS: Record<RiskLevel, string> = {
  prohibited: '#ef4444',
  high: '#f97316',
  limited: '#eab308',
  minimal: '#22c55e',
};

export const DISCOVERY_STATUS_LABELS: Record<DiscoveryStatus, string> = {
  detected: 'Detectado',
  confirmed: 'Confirmado',
  dismissed: 'Descartado',
  authorized: 'Autorizado',
};
