import { v4 as uuidv4 } from 'uuid'
import type { DiscoveryRecord } from '@shared/types/discovery'
import type { ComplianceSnapshot, SnapshotTrigger } from '@shared/types/compliance'
import { STORAGE_KEYS } from '@shared/types/storage'
import { mapCompliance } from './compliance-mapper'

export const MAX_SNAPSHOTS = 50

export async function takeSnapshot(
  discoveries: DiscoveryRecord[],
  trigger: SnapshotTrigger,
): Promise<ComplianceSnapshot> {
  const result = mapCompliance(discoveries)

  const snapshot: ComplianceSnapshot = {
    id: uuidv4(),
    date: new Date().toISOString(),
    trigger,
    overallScore: result.overallPercentComplete,
    totalTools: discoveries.length,
    totalGaps: result.totalGaps,
    regulationBreakdown: Object.fromEntries(
      result.summaries.map((s) => [
        s.regulationId,
        {
          complete: s.complete,
          pending: s.pending,
          overdue: s.overdue,
          notApplicable: s.notApplicable,
          total: s.complete + s.pending + s.overdue + s.notApplicable,
        },
      ]),
    ) as ComplianceSnapshot['regulationBreakdown'],
  }

  const snapshots = await getSnapshots()
  snapshots.push(snapshot)

  if (snapshots.length > MAX_SNAPSHOTS) {
    snapshots.splice(0, snapshots.length - MAX_SNAPSHOTS)
  }

  await chrome.storage.local.set({
    [STORAGE_KEYS.COMPLIANCE_SNAPSHOTS]: snapshots,
  })

  return snapshot
}

export async function getSnapshots(): Promise<ComplianceSnapshot[]> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.COMPLIANCE_SNAPSHOTS)
  return (result[STORAGE_KEYS.COMPLIANCE_SNAPSHOTS] as ComplianceSnapshot[]) ?? []
}

export async function deleteSnapshot(id: string): Promise<boolean> {
  const snapshots = await getSnapshots()
  const filtered = snapshots.filter((s) => s.id !== id)
  if (filtered.length === snapshots.length) return false
  await chrome.storage.local.set({
    [STORAGE_KEYS.COMPLIANCE_SNAPSHOTS]: filtered,
  })
  return true
}

export async function checkAndTakeScheduledSnapshot(
  frequencyDays: number,
): Promise<ComplianceSnapshot | null> {
  if (frequencyDays <= 0) return null

  const snapshots = await getSnapshots()
  if (snapshots.length === 0) return null

  const lastSnapshot = snapshots[snapshots.length - 1]
  const lastDate = new Date(lastSnapshot.date)
  const now = new Date()
  const diffMs = now.getTime() - lastDate.getTime()
  const diffDays = diffMs / (1000 * 60 * 60 * 24)

  if (diffDays < frequencyDays) return null

  const discoveriesResult = await chrome.storage.local.get(STORAGE_KEYS.AI_DISCOVERIES)
  const discoveries = (discoveriesResult[STORAGE_KEYS.AI_DISCOVERIES] as DiscoveryRecord[]) ?? []

  return takeSnapshot(discoveries, 'scheduled')
}
