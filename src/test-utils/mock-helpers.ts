import type { ComplianceStatusMap } from '@shared/types/discovery'
import type { AssessmentStatus } from '@shared/types/compliance'

type ChecklistOverride = { assessment: AssessmentStatus; lastAssessedDate: string | null; dueDate: string | null; notes: string }

function setAllArticles(
  assessment: AssessmentStatus,
  lastAssessedDate: string | null = null,
  dueDate: string | null = null,
): Record<string, ChecklistOverride> {
  return {
    'art-4': { assessment, lastAssessedDate, dueDate, notes: '' },
    'art-6': { assessment, lastAssessedDate, dueDate, notes: '' },
    'art-9': { assessment, lastAssessedDate, dueDate, notes: '' },
    'art-11': { assessment, lastAssessedDate, dueDate, notes: '' },
    'art-12': { assessment, lastAssessedDate, dueDate, notes: '' },
    'art-26': { assessment, lastAssessedDate, dueDate, notes: '' },
    'art-27': { assessment, lastAssessedDate, dueDate, notes: '' },
    'art-50': { assessment, lastAssessedDate, dueDate, notes: '' },
  }
}

function setAllIsoArticles(
  assessment: AssessmentStatus,
  lastAssessedDate: string | null = null,
  dueDate: string | null = null,
): Record<string, ChecklistOverride> {
  return {
    'iso-aims-inventory': { assessment, lastAssessedDate, dueDate, notes: '' },
    'iso-risk-assessment': { assessment, lastAssessedDate, dueDate, notes: '' },
    'iso-documentation': { assessment, lastAssessedDate, dueDate, notes: '' },
    'iso-monitoring': { assessment, lastAssessedDate, dueDate, notes: '' },
    'iso-governance': { assessment, lastAssessedDate, dueDate, notes: '' },
  }
}

function setAllCoArticles(
  assessment: AssessmentStatus = 'not_applicable',
  lastAssessedDate: string | null = null,
  dueDate: string | null = null,
): Record<string, ChecklistOverride> {
  return {
    'co-risk-policy': { assessment, lastAssessedDate, dueDate, notes: '' },
    'co-impact-assessment': { assessment, lastAssessedDate, dueDate, notes: '' },
    'co-disclosure': { assessment, lastAssessedDate, dueDate, notes: '' },
    'co-public-statement': { assessment, lastAssessedDate, dueDate, notes: '' },
    'co-affirmative-defense': { assessment, lastAssessedDate, dueDate, notes: '' },
  }
}

export function createMockComplianceStatus(overrides: {
  euAiAct?: Record<string, ChecklistOverride>
  iso42001?: Record<string, ChecklistOverride>
  coSb205?: Record<string, ChecklistOverride>
} = {}): ComplianceStatusMap {
  return {
    euAiAct: overrides.euAiAct ?? setAllArticles('pending'),
    iso42001: overrides.iso42001 ?? setAllIsoArticles('pending'),
    coSb205: overrides.coSb205 ?? setAllCoArticles('not_applicable'),
  }
}

export function setAllArticlesComplete(lastAssessedDate: string): Record<string, ChecklistOverride> {
  return setAllArticles('complete', lastAssessedDate, null)
}

export function setAllArticlesNotApplicable(): Record<string, ChecklistOverride> {
  return setAllArticles('not_applicable')
}
