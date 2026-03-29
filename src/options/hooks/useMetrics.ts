import { useMemo } from 'react'
import type { DiscoveryRecord } from '@shared/types/discovery'
import type { ActivityLogEntry } from '@shared/types/storage'
import type { RiskLevel } from '@shared/types/domain'
import type { RegulationType } from '@shared/types/compliance'
import { calculateRiskScore, countByRiskLevel, countByStatus } from '@options/utils/risk-calculator'

export interface DashboardMetrics {
  totalDetected: number
  highRiskCount: number
  pendingCount: number
  riskScore: ReturnType<typeof calculateRiskScore>
  byCategory: Record<string, number>
  byRiskLevel: Record<RiskLevel, number>
  byStatus: ReturnType<typeof countByStatus>
  complianceSummary: Record<RegulationType, { complete: number; pending: number; overdue: number; total: number }>
  recentActivity: ActivityLogEntry[]
}

export function useMetrics(
  discoveries: DiscoveryRecord[],
  activityLog: ActivityLogEntry[],
): DashboardMetrics {
  return useMemo(() => {
    const totalDetected = discoveries.length

    const highRiskCount = discoveries.filter(
      (d) => {
        const risk = d.userRiskLevel ?? d.defaultRiskLevel
        return risk === 'high' || risk === 'prohibited'
      },
    ).length

    const pendingCount = discoveries.filter((d) => d.status === 'detected').length

    const riskScore = calculateRiskScore(discoveries)

    const byCategory: Record<string, number> = {}
    for (const d of discoveries) {
      byCategory[d.category] = (byCategory[d.category] ?? 0) + 1
    }

    const byRiskLevel = countByRiskLevel(discoveries)
    const byStatus = countByStatus(discoveries)

    const regulationKeys: RegulationType[] = ['euAiAct', 'iso42001', 'coSb205']
    const complianceSummary = Object.fromEntries(
      regulationKeys.map((key) => {
        const entries = discoveries.map((d) => d.complianceStatus[key])
        const total = entries.length
        const complete = entries.filter((e) => e.assessment === 'complete').length
        const pending = entries.filter((e) => e.assessment === 'pending').length
        const overdue = entries.filter((e) => e.assessment === 'overdue').length
        return [key, { complete, pending, overdue, total }]
      }),
    ) as Record<RegulationType, { complete: number; pending: number; overdue: number; total: number }>

    const recentActivity = [...activityLog]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10)

    return {
      totalDetected,
      highRiskCount,
      pendingCount,
      riskScore,
      byCategory,
      byRiskLevel,
      byStatus,
      complianceSummary,
      recentActivity,
    }
  }, [discoveries, activityLog])
}
