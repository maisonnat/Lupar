import { useMemo } from 'react'
import type { DiscoveryRecord } from '@shared/types/discovery'
import type { ComplianceSnapshot } from '@shared/types/compliance'
import { calculateMaturityMetrics, type MaturityMetrics } from '@shared/utils/risk-calculator'

export function useMaturityMetrics(
  discoveries: DiscoveryRecord[],
  snapshots: ComplianceSnapshot[],
): MaturityMetrics {
  return useMemo(() => {
    const snapshotData = snapshots.map((s) => ({
      date: s.date,
      score: s.overallScore,
    }))

    return calculateMaturityMetrics(discoveries, snapshotData)
  }, [discoveries, snapshots])
}