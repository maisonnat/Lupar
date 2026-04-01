export type RegulationType = 'euAiAct' | 'iso42001' | 'coSb205';

export type AssessmentStatus = 'complete' | 'pending' | 'not_applicable' | 'overdue';

export type SnapshotTrigger = 'manual' | 'report' | 'scheduled';

export interface ComplianceChecklist {
  assessment: AssessmentStatus;
  lastAssessedDate: string | null;
  dueDate: string | null;
  notes: string;
}

export interface ComplianceSnapshot {
  id: string;
  date: string;
  trigger: SnapshotTrigger;
  overallScore: number;
  totalTools: number;
  totalGaps: number;
  regulationBreakdown: Record<RegulationType, {
    complete: number;
    pending: number;
    overdue: number;
    notApplicable: number;
    total: number;
  }>;
}
