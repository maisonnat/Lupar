export type AICategory =
  | 'chatbot'
  | 'code_generation'
  | 'image_generation'
  | 'video_audio_generation'
  | 'analysis_bi'
  | 'hr_employment'
  | 'finance_credit'
  | 'healthcare'
  | 'education'
  | 'biometric_surveillance';

export type RiskLevel = 'prohibited' | 'high' | 'limited' | 'minimal';

export interface DomainEntry {
  domain: string;
  toolName: string;
  category: AICategory;
  defaultRiskLevel: RiskLevel;
}
