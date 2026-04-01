import type { RiskLevel } from '@shared/types/domain'
import type { DiscoveryStatus, DiscoveryRecord } from '@shared/types/discovery'
import type { AppSettings } from '@shared/types/storage'
import type { RegulationType, ComplianceChecklist } from '@shared/types/compliance'
import { RISK_WEIGHTS, STATUS_WEIGHTS, RISK_THRESHOLDS } from '@shared/constants/risk-levels'
import { REGULATIONS } from '@shared/constants/regulations'

export type DeadlineUrgency = 'overdue' | 'this_week' | 'this_month' | 'upcoming'

export interface UpcomingDeadline {
  toolName: string
  toolId: string
  regulationKey: RegulationType
  regulationLabel: string
  articleId: string
  articleTitle: string
  dueDate: string
  daysRemaining: number
  riskLevel: RiskLevel
  urgency: DeadlineUrgency
}

const DEFAULT_DAYS_AHEAD = 90

function classifyUrgency(daysRemaining: number): DeadlineUrgency {
  if (daysRemaining < 0) return 'overdue'
  if (daysRemaining <= 7) return 'this_week'
  if (daysRemaining <= 30) return 'this_month'
  return 'upcoming'
}

export function getUpcomingDeadlines(
  discoveries: DiscoveryRecord[],
  settings: AppSettings,
  daysAhead: number = DEFAULT_DAYS_AHEAD,
): UpcomingDeadline[] {
  const now = new Date()
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() + daysAhead)

  const deadlines: UpcomingDeadline[] = []

  for (const discovery of discoveries) {
    if (discovery.status === 'dismissed') continue

    const effectiveRisk: RiskLevel = discovery.userRiskLevel ?? discovery.defaultRiskLevel

    for (const regKey of Object.keys(discovery.complianceStatus) as RegulationType[]) {
      const config = settings.regulationConfig?.[regKey]
      if (!config?.enabled) continue

      const articleMap = discovery.complianceStatus[regKey]
      const regulationInfo = REGULATIONS[regKey]

      for (const articleId of Object.keys(articleMap)) {
        const checklist = articleMap[articleId]

        if (
          checklist.assessment === 'complete' ||
          checklist.assessment === 'not_applicable' ||
          !checklist.dueDate
        ) {
          continue
        }

        const dueDate = new Date(checklist.dueDate)
        if (dueDate > cutoff) continue

        const daysRemaining = Math.ceil(
          (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
        )

        const articleInfo = regulationInfo.articles.find((a) => a.id === articleId)

        deadlines.push({
          toolName: discovery.toolName,
          toolId: discovery.id,
          regulationKey: regKey,
          regulationLabel: regulationInfo.shortName,
          articleId,
          articleTitle: articleInfo?.title ?? articleId,
          dueDate: checklist.dueDate,
          daysRemaining,
          riskLevel: effectiveRisk,
          urgency: classifyUrgency(daysRemaining),
        })
      }
    }
  }

  return deadlines.sort((a, b) => a.daysRemaining - b.daysRemaining)
}

export interface RiskScoreResult {
  score: number
  label: string
  color: string
}

export function calculateRiskScore(discoveries: DiscoveryRecord[]): RiskScoreResult {
  if (discoveries.length === 0) {
    return { score: 0, label: 'Bajo', color: '#22c55e' }
  }

  const rawScore = discoveries.reduce((sum, d) => {
    const effectiveRisk: RiskLevel = d.userRiskLevel ?? d.defaultRiskLevel
    const riskWeight = RISK_WEIGHTS[effectiveRisk]
    const statusWeight = STATUS_WEIGHTS[d.status]
    return sum + riskWeight * statusWeight
  }, 0)

  const maxScore = discoveries.reduce((sum, d) => {
    const effectiveRisk: RiskLevel = d.userRiskLevel ?? d.defaultRiskLevel
    return sum + RISK_WEIGHTS[effectiveRisk] * 1.5
  }, 0)

  const normalized = maxScore > 0 ? Math.round((rawScore / maxScore) * 100) : 0
  const clamped = Math.min(100, Math.max(0, normalized))

  const threshold = RISK_THRESHOLDS.find(
    (t) => clamped >= t.min && clamped <= t.max,
  ) ?? RISK_THRESHOLDS[0]

  return {
    score: clamped,
    label: threshold.label,
    color: threshold.color,
  }
}

export function getRiskLevelColor(level: RiskLevel): string {
  const colors: Record<RiskLevel, string> = {
    prohibited: '#ef4444',
    high: '#f97316',
    limited: '#eab308',
    minimal: '#22c55e',
  }
  return colors[level]
}

export function getStatusLabel(status: DiscoveryStatus): string {
  const labels: Record<DiscoveryStatus, string> = {
    detected: 'Detectado',
    confirmed: 'Confirmado',
    dismissed: 'Descartado',
    authorized: 'Autorizado',
  }
  return labels[status]
}

export function countByRiskLevel(
  discoveries: DiscoveryRecord[],
): Record<RiskLevel, number> {
  return {
    prohibited: discoveries.filter((d) => (d.userRiskLevel ?? d.defaultRiskLevel) === 'prohibited').length,
    high: discoveries.filter((d) => (d.userRiskLevel ?? d.defaultRiskLevel) === 'high').length,
    limited: discoveries.filter((d) => (d.userRiskLevel ?? d.defaultRiskLevel) === 'limited').length,
    minimal: discoveries.filter((d) => (d.userRiskLevel ?? d.defaultRiskLevel) === 'minimal').length,
  }
}

export function countByStatus(
  discoveries: DiscoveryRecord[],
): Record<DiscoveryStatus, number> {
  return {
    detected: discoveries.filter((d) => d.status === 'detected').length,
    confirmed: discoveries.filter((d) => d.status === 'confirmed').length,
    dismissed: discoveries.filter((d) => d.status === 'dismissed').length,
    authorized: discoveries.filter((d) => d.status === 'authorized').length,
  }
}

export function calculateDueDate(
  regulationKey: RegulationType,
  settings: AppSettings,
): string | null {
  const config = settings.regulationConfig?.[regulationKey]
  if (!config?.enabled) {
    return null
  }

  const offsetDays = config.customDueDateOffsetDays ?? 90
  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + offsetDays)
  return dueDate.toISOString()
}

export function isChecklistOverdue(checklist: ComplianceChecklist): boolean {
  if (checklist.assessment === 'overdue') {
    return true
  }

  if (!checklist.dueDate) {
    return false
  }

  if (checklist.assessment === 'complete' || checklist.assessment === 'not_applicable') {
    return false
  }

  return new Date(checklist.dueDate) < new Date()
}

export function hasOverdueArticle(articleMap: Record<string, ComplianceChecklist>): boolean {
  return Object.values(articleMap).some(isChecklistOverdue)
}

export function getOverdueDiscoveries(
  discoveries: DiscoveryRecord[],
  settings: AppSettings,
): DiscoveryRecord[] {
  return discoveries.filter((discovery) => {
    return Object.entries(discovery.complianceStatus).some(([regKey, articleMap]) => {
      const config = settings.regulationConfig?.[regKey as RegulationType]
      if (!config?.enabled) {
        return false
      }
      return hasOverdueArticle(articleMap)
    })
  })
}

export function markOverdueAssessments(
  discoveries: DiscoveryRecord[],
  settings: AppSettings,
): DiscoveryRecord[] {
  return discoveries.map((discovery) => {
    const updatedCompliance = { ...discovery.complianceStatus }

    for (const regKey of Object.keys(updatedCompliance) as RegulationType[]) {
      const config = settings.regulationConfig?.[regKey]
      if (!config?.enabled) {
        continue
      }

      const articleMap = updatedCompliance[regKey]
      const updatedMap = { ...articleMap }

      for (const articleId of Object.keys(updatedMap)) {
        const checklist = updatedMap[articleId]
        if (isChecklistOverdue(checklist)) {
          updatedMap[articleId] = {
            ...checklist,
            assessment: 'overdue',
          }
        }
      }

      updatedCompliance[regKey] = updatedMap
    }

    return {
      ...discovery,
      complianceStatus: updatedCompliance,
    }
  })
}
