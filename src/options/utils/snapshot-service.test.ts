import { describe, it, expect, beforeEach } from 'vitest'
import { takeSnapshot, getSnapshots, deleteSnapshot, checkAndTakeScheduledSnapshot, MAX_SNAPSHOTS } from '@options/utils/snapshot-service'
import type { DiscoveryRecord } from '@shared/types/discovery'
import { createMockComplianceStatus } from '@test-utils/mock-helpers'

function makeDiscovery(overrides: Partial<DiscoveryRecord> = {}): DiscoveryRecord {
  return {
    id: 'test-1',
    domain: 'chatgpt.com',
    toolName: 'ChatGPT',
    category: 'chatbot',
    defaultRiskLevel: 'limited',
    userRiskLevel: null,
    status: 'detected',
    department: null,
    firstSeen: '2026-03-15T09:00:00.000Z',
    lastSeen: '2026-03-15T09:00:00.000Z',
    visitCount: 5,
    complianceStatus: createMockComplianceStatus(),
    notes: '',
    tags: [],
    auditTrail: [],
    ...overrides,
  }
}

function clearSnapshots(): Promise<void> {
  return chrome.storage.local.remove('compliance_snapshots')
}

describe('snapshot-service', () => {
  beforeEach(async () => {
    await clearSnapshots()
  })

  describe('takeSnapshot', () => {
    it('should create a snapshot with correct structure', async () => {
      const snapshot = await takeSnapshot([makeDiscovery()], 'manual')

      expect(snapshot.id).toBeTruthy()
      expect(snapshot.trigger).toBe('manual')
      expect(snapshot.overallScore).toBeGreaterThanOrEqual(0)
      expect(snapshot.overallScore).toBeLessThanOrEqual(100)
      expect(snapshot.totalTools).toBe(1)
      expect(snapshot.totalGaps).toBeGreaterThan(0)
      expect(snapshot.date).toBeTruthy()
      expect(new Date(snapshot.date).toISOString()).toBe(snapshot.date)
    })

    it('should include regulation breakdown', async () => {
      const snapshot = await takeSnapshot([makeDiscovery()], 'manual')

      expect(snapshot.regulationBreakdown).toHaveProperty('euAiAct')
      expect(snapshot.regulationBreakdown).toHaveProperty('iso42001')
      expect(snapshot.regulationBreakdown).toHaveProperty('coSb205')

      const eu = snapshot.regulationBreakdown.euAiAct
      expect(eu.total).toBe(eu.complete + eu.pending + eu.overdue + eu.notApplicable)
    })

    it('should persist snapshot to storage', async () => {
      await takeSnapshot([makeDiscovery()], 'report')

      const snapshots = await getSnapshots()
      expect(snapshots).toHaveLength(1)
      expect(snapshots[0].trigger).toBe('report')
    })

    it('should support all trigger types', async () => {
      const triggers = ['manual', 'report', 'scheduled'] as const
      for (const trigger of triggers) {
        await takeSnapshot([makeDiscovery()], trigger)
      }

      const snapshots = await getSnapshots()
      expect(snapshots).toHaveLength(3)
      expect(snapshots.map((s) => s.trigger)).toEqual(['manual', 'report', 'scheduled'])
    })

    it('should handle empty discoveries', async () => {
      const snapshot = await takeSnapshot([], 'manual')

      expect(snapshot.totalTools).toBe(0)
      expect(snapshot.totalGaps).toBe(0)
      expect(snapshot.overallScore).toBe(100)
    })

    it('should cap at MAX_SNAPSHOTS', async () => {
      const count = MAX_SNAPSHOTS + 5
      for (let i = 0; i < count; i++) {
        await takeSnapshot([makeDiscovery({ id: String(i) })], 'manual')
      }

      const snapshots = await getSnapshots()
      expect(snapshots.length).toBe(MAX_SNAPSHOTS)
      expect(snapshots[0].id).toBeTruthy()
    })
  })

  describe('getSnapshots', () => {
    it('should return empty array when no snapshots', async () => {
      const snapshots = await getSnapshots()
      expect(snapshots).toEqual([])
    })

    it('should return snapshots in creation order', async () => {
      await takeSnapshot([makeDiscovery()], 'manual')
      await takeSnapshot([makeDiscovery()], 'report')

      const snapshots = await getSnapshots()
      expect(snapshots).toHaveLength(2)
      expect(snapshots[0].trigger).toBe('manual')
      expect(snapshots[1].trigger).toBe('report')
    })
  })

  describe('deleteSnapshot', () => {
    it('should delete a snapshot by id', async () => {
      const created = await takeSnapshot([makeDiscovery()], 'manual')
      await deleteSnapshot(created.id)

      const snapshots = await getSnapshots()
      expect(snapshots).toHaveLength(0)
    })

    it('should return false when id not found', async () => {
      const result = await deleteSnapshot('non-existent-id')
      expect(result).toBe(false)
    })

    it('should not affect other snapshots', async () => {
      const s1 = await takeSnapshot([makeDiscovery({ id: '1' })], 'manual')
      const s2 = await takeSnapshot([makeDiscovery({ id: '2' })], 'report')
      await deleteSnapshot(s1.id)

      const snapshots = await getSnapshots()
      expect(snapshots).toHaveLength(1)
      expect(snapshots[0].id).toBe(s2.id)
    })
  })

  describe('checkAndTakeScheduledSnapshot', () => {
    it('should return null when frequency is 0', async () => {
      const result = await checkAndTakeScheduledSnapshot(0)
      expect(result).toBeNull()
    })

    it('should return null when frequency is negative', async () => {
      const result = await checkAndTakeScheduledSnapshot(-5)
      expect(result).toBeNull()
    })

    it('should return null when no snapshots exist', async () => {
      const result = await checkAndTakeScheduledSnapshot(7)
      expect(result).toBeNull()
    })

    it('should not take snapshot if not enough time has passed', async () => {
      await takeSnapshot([makeDiscovery()], 'manual')

      const result = await checkAndTakeScheduledSnapshot(30)
      expect(result).toBeNull()

      const snapshots = await getSnapshots()
      expect(snapshots).toHaveLength(1)
    })

    it('should take snapshot when enough time has passed', async () => {
      const oldDate = new Date()
      oldDate.setDate(oldDate.getDate() - 31)
      const oldIso = oldDate.toISOString()

      await takeSnapshot([makeDiscovery()], 'manual')

      const snapshots = await getSnapshots()
      snapshots[0].date = oldIso
      await chrome.storage.local.set({ compliance_snapshots: snapshots })

      await chrome.storage.local.set({
        ai_discoveries: [makeDiscovery()],
      })

      const result = await checkAndTakeScheduledSnapshot(30)
      expect(result).not.toBeNull()
      expect(result?.trigger).toBe('scheduled')

      const updated = await getSnapshots()
      expect(updated).toHaveLength(2)
    })
  })
})
