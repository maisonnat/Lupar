export type RegulationType = 'euAiAct' | 'iso42001' | 'coSb205';

export type AssessmentStatus = 'complete' | 'pending' | 'not_applicable' | 'overdue';

export interface ComplianceChecklist {
  assessment: AssessmentStatus;
  lastAssessedDate: string | null;
  dueDate: string | null;
  notes: string;
}
