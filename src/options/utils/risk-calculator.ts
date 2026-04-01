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

export type SurgeLevel = 'none' | 'low' | 'medium' | 'high'

export interface SurgeAlert {
  isActive: boolean
  level: SurgeLevel
  recentCount: number
  averageCount: number
  threshold: number
  recentDays: number
  newTools: { domain: string; toolName: string; firstSeen: string }[]
}

const DEFAULT_DAYS_AHEAD = 90

export const RISK_LEVEL_ORDER: RiskLevel[] = ['prohibited', 'high', 'limited', 'minimal']

export const NO_DEPARTMENT_LABEL = 'Sin asignar'

export interface HeatmapData {
  departments: string[]
  cells: Record<string, Record<RiskLevel, number>>
  maxCount: number
  totalTools: number
}

export function buildHeatmapData(discoveries: DiscoveryRecord[]): HeatmapData {
  const active = discoveries.filter((d) => d.status !== 'dismissed')

  if (active.length === 0) {
    return { departments: [], cells: {}, maxCount: 0, totalTools: 0 }
  }

  const cells: Record<string, Record<RiskLevel, number>> = {}
  let maxCount = 0

  for (const d of active) {
    const dept = d.department ?? NO_DEPARTMENT_LABEL
    const risk: RiskLevel = d.userRiskLevel ?? d.defaultRiskLevel

    if (!cells[dept]) {
      cells[dept] = { prohibited: 0, high: 0, limited: 0, minimal: 0 }
    }

    cells[dept][risk]++
    if (cells[dept][risk] > maxCount) {
      maxCount = cells[dept][risk]
    }
  }

  const departments = Object.keys(cells).sort()

  return { departments, cells, maxCount, totalTools: active.length }
}

export type BadgePriority = 'overdue' | 'upcoming_due' | 'max_unassessed' | 'normal'

export interface BadgeState {
  text: string
  color: string
  priority: BadgePriority
  visible: boolean
}

const BADGE_COLORS: Record<BadgePriority, string> = {
  overdue: '#ef4444',
  upcoming_due: '#f97316',
  max_unassessed: '#eab308',
  normal: '#3b82f6',
}

export function evaluateBadgeState(
  discoveries: DiscoveryRecord[],
  settings: AppSettings,
): BadgeState {
  if (!settings.badgeNotifications) {
    return { text: '', color: BADGE_COLORS.normal, priority: 'normal', visible: false }
  }

  const riskFilter = settings.alertConfig?.newDetectionRiskLevels
  const detectedTools = discoveries.filter((d) => {
    if (d.status !== 'detected') return false
    if (!riskFilter || riskFilter.length === 0) return true
    const effectiveRisk: RiskLevel = d.userRiskLevel ?? d.defaultRiskLevel
    return riskFilter.includes(effectiveRisk)
  })

  if (detectedTools.length === 0) {
    return { text: '', color: BADGE_COLORS.normal, priority: 'normal', visible: false }
  }

  const activeDiscoveries = discoveries.filter((d) => d.status !== 'dismissed')
  const maxUnassessed = settings.alertConfig?.maxUnassessedCount ?? 10

  const hasOverdue = activeDiscoveries.some((d) =>
    (Object.keys(d.complianceStatus) as RegulationType[]).some((regKey) => {
      const config = settings.regulationConfig?.[regKey]
      if (!config?.enabled) return false
      return hasOverdueArticle(d.complianceStatus[regKey])
    }),
  )

  if (hasOverdue) {
    return { text: String(detectedTools.length), color: BADGE_COLORS.overdue, priority: 'overdue', visible: true }
  }

  const dueDays = settings.alertConfig?.assessmentDueDays ?? [30, 15, 7, 1]
  const now = new Date()
  const hasUpcoming = activeDiscoveries.some((d) =>
    (Object.keys(d.complianceStatus) as RegulationType[]).some((regKey) => {
      const config = settings.regulationConfig?.[regKey]
      if (!config?.enabled) return false
      const articleMap = d.complianceStatus[regKey]
      return Object.values(articleMap).some((checklist) => {
        if (!checklist.dueDate) return false
        if (checklist.assessment === 'complete' || checklist.assessment === 'not_applicable') return false
        const dueDate = new Date(checklist.dueDate)
        const daysRemaining = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        return dueDays.some((threshold) => daysRemaining >= 0 && daysRemaining <= threshold)
      })
    }),
  )

  if (hasUpcoming) {
    return { text: String(detectedTools.length), color: BADGE_COLORS.upcoming_due, priority: 'upcoming_due', visible: true }
  }

  const unassessedCount = detectedTools.length
  if (maxUnassessed > 0 && unassessedCount > maxUnassessed) {
    return { text: String(detectedTools.length), color: BADGE_COLORS.max_unassessed, priority: 'max_unassessed', visible: true }
  }

  return { text: String(detectedTools.length), color: BADGE_COLORS.normal, priority: 'normal', visible: true }
}

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

export function detectSurge(
  discoveries: DiscoveryRecord[],
  recentDays: number = 7,
  thresholdMultiplier: number = 2.5,
): SurgeAlert {
  if (discoveries.length === 0) {
    return {
      isActive: false,
      level: 'none',
      recentCount: 0,
      averageCount: 0,
      threshold: 0,
      recentDays,
      newTools: [],
    }
  }

  const now = new Date()
  const recentCutoff = new Date()
  recentCutoff.setDate(now.getDate() - recentDays)

  const olderCutoff = new Date()
  olderCutoff.setDate(now.getDate() - recentDays * 4)

  const recentDiscoveries = discoveries.filter(
    (d) => new Date(d.firstSeen) >= recentCutoff,
  )

  const olderDiscoveries = discoveries.filter(
    (d) => new Date(d.firstSeen) >= olderCutoff && new Date(d.firstSeen) < recentCutoff,
  )

  const recentCount = recentDiscoveries.length
  const averageCount = olderDiscoveries.length > 0
    ? Math.max(1, Math.round(olderDiscoveries.length / 3))
    : 1

  const threshold = Math.max(1, Math.round(averageCount * thresholdMultiplier))
  const isActive = recentCount >= threshold

  let level: SurgeLevel = 'none'
  if (isActive) {
    const ratio = recentCount / averageCount
    if (ratio >= 4) level = 'high'
    else if (ratio >= 3) level = 'medium'
    else level = 'low'
  }

  const newTools = recentDiscoveries
    .sort((a, b) => new Date(b.firstSeen).getTime() - new Date(a.firstSeen).getTime())
    .slice(0, 10)
    .map((d) => ({
      domain: d.domain,
      toolName: d.toolName,
      firstSeen: d.firstSeen,
    }))

  return {
    isActive,
    level,
    recentCount,
    averageCount,
    threshold,
    recentDays,
    newTools,
  }
}
