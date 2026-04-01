import { useMemo } from 'react'
import type { DiscoveryRecord } from '@shared/types/discovery'
import type { ActivityLogEntry } from '@shared/types/storage'
import type { RiskLevel } from '@shared/types/domain'
import type { RegulationType } from '@shared/types/compliance'
import { calculateRiskScore, countByRiskLevel, countByStatus } from '@shared/utils/risk-calculator'

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
        let complete = 0
        let pending = 0
        let overdue = 0
        let total = 0

        for (const d of discoveries) {
          const articleMap = d.complianceStatus[key]
          for (const checklist of Object.values(articleMap)) {
            total++
            if (checklist.assessment === 'complete') complete++
            else if (checklist.assessment === 'pending') pending++
            else if (checklist.assessment === 'overdue') overdue++
          }
        }

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
