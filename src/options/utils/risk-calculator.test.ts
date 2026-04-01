import { describe, it, expect } from 'vitest'
import {
  calculateRiskScore,
  getRiskLevelColor,
  countByRiskLevel,
  countByStatus,
  getUpcomingDeadlines,
  evaluateBadgeState,
} from '@options/utils/risk-calculator'
import type { DiscoveryRecord } from '@shared/types/discovery'
import type { AppSettings } from '@shared/types/storage'
import { createMockComplianceStatus } from '@test-utils/mock-helpers'

function makeDiscovery(
  overrides: Partial<Pick<DiscoveryRecord, 'defaultRiskLevel' | 'userRiskLevel' | 'status' | 'complianceStatus' | 'toolName' | 'id'>> = {},
): DiscoveryRecord {
  return {
    id: overrides.id ?? 'test-id',
    domain: 'test.com',
    toolName: overrides.toolName ?? 'Test Tool',
    category: 'chatbot',
    defaultRiskLevel: overrides.defaultRiskLevel ?? 'limited',
    userRiskLevel: overrides.userRiskLevel ?? null,
    status: overrides.status ?? 'detected',
    department: null,
    firstSeen: '2026-03-15T09:00:00.000Z',
    lastSeen: '2026-03-15T09:00:00.000Z',
    visitCount: 1,
    complianceStatus: overrides.complianceStatus ?? createMockComplianceStatus(),
    notes: '',
    tags: [],
    auditTrail: [],
  }
}

function makeDefaultSettings(): AppSettings {
  return {
    version: '1.0.0',
    companyName: '',
    responsiblePerson: '',
    installationDate: '',
    badgeNotifications: true,
    requireDepartment: false,
    snapshotFrequencyDays: 0,
    timezone: 'America/Argentina/Buenos_Aires',
    dateFormat: 'DD/MM/YYYY',
    customDomains: [],
    excludedDomains: [],
    regulationConfig: {
      euAiAct: { enabled: true, customDueDateOffsetDays: 90 },
      iso42001: { enabled: true, customDueDateOffsetDays: 90 },
      coSb205: { enabled: false, customDueDateOffsetDays: 90 },
    },
    auditModeConfig: {
      auditMode: false,
      auditModeActivatedAt: null,
      auditModeActivatedBy: null,
    },
    alertConfig: {
      assessmentDueDays: [30, 15, 7, 1],
      newDetectionRiskLevels: ['prohibited', 'high', 'limited', 'minimal'],
      maxUnassessedCount: 10,
    },
    adminProfile: {
      adminName: '',
      adminEmail: '',
      adminRole: 'compliance_officer',
      department: '',
    },
  }
}

function daysFromNow(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString()
}

describe('risk-calculator', () => {
  describe('calculateRiskScore', () => {
    it('should return 0 for empty discoveries', () => {
      const result = calculateRiskScore([])
      expect(result.score).toBe(0)
      expect(result.label).toBe('Bajo')
      expect(result.color).toBe('#22c55e')
    })

    it('should return 0 when all tools are dismissed', () => {
      const discoveries = [
        makeDiscovery({ defaultRiskLevel: 'high', status: 'dismissed' }),
      ]
      const result = calculateRiskScore(discoveries)
      expect(result.score).toBe(0)
    })

    it('should give 100 when all tools are highest risk and detected', () => {
      const discoveries = [
        makeDiscovery({ defaultRiskLevel: 'prohibited', status: 'detected' }),
      ]
      const result = calculateRiskScore(discoveries)
      expect(result.score).toBe(100)
    })

    it('should calculate lower score for authorized vs detected', () => {
      const detected = makeDiscovery({ defaultRiskLevel: 'high', status: 'detected' })
      const authorized = makeDiscovery({ defaultRiskLevel: 'high', status: 'authorized' })

      const detectedScore = calculateRiskScore([detected])
      const authorizedScore = calculateRiskScore([authorized])

      expect(authorizedScore.score).toBeLessThan(detectedScore.score)
    })

    it('should use userRiskLevel over defaultRiskLevel', () => {
      const normal = [
        makeDiscovery({ defaultRiskLevel: 'high', status: 'detected' }),
        makeDiscovery({ defaultRiskLevel: 'high', status: 'authorized' }),
      ]
      const withOverride = [
        makeDiscovery({ defaultRiskLevel: 'high', status: 'detected' }),
        makeDiscovery({ defaultRiskLevel: 'high', userRiskLevel: 'high', status: 'authorized' }),
      ]

      const normalScore = calculateRiskScore(normal)
      const overridenScore = calculateRiskScore(withOverride)

      expect(normalScore.score).toBe(overridenScore.score)
    })

    it('should give higher score for detected vs authorized tools', () => {
      const detected = [
        makeDiscovery({ defaultRiskLevel: 'high', status: 'detected' }),
        makeDiscovery({ defaultRiskLevel: 'high', status: 'detected' }),
        makeDiscovery({ defaultRiskLevel: 'high', status: 'detected' }),
      ]
      const authorized = [
        makeDiscovery({ defaultRiskLevel: 'high', status: 'authorized' }),
        makeDiscovery({ defaultRiskLevel: 'high', status: 'authorized' }),
        makeDiscovery({ defaultRiskLevel: 'high', status: 'authorized' }),
      ]

      const detectedScore = calculateRiskScore(detected)
      const authorizedScore = calculateRiskScore(authorized)

      expect(detectedScore.score).toBeGreaterThan(authorizedScore.score)
    })

    it('should clamp score to 0-100', () => {
      const discoveries = Array.from({ length: 50 }, () =>
        makeDiscovery({ defaultRiskLevel: 'prohibited', status: 'detected' }),
      )
      const result = calculateRiskScore(discoveries)
      expect(result.score).toBeLessThanOrEqual(100)
      expect(result.score).toBeGreaterThanOrEqual(0)
    })

    it('should return correct labels for score ranges', () => {
      const dismissed = makeDiscovery({ defaultRiskLevel: 'prohibited', status: 'dismissed' })
      const lowResult = calculateRiskScore([dismissed])
      expect(lowResult.label).toBe('Bajo')

      const high = makeDiscovery({ defaultRiskLevel: 'prohibited', status: 'detected' })
      const highResult = calculateRiskScore([high])
      expect(highResult.label).toBe('Crítico')
    })

    it('should handle mixed risk levels correctly', () => {
      const discoveries = [
        makeDiscovery({ defaultRiskLevel: 'prohibited', status: 'detected' }),
        makeDiscovery({ defaultRiskLevel: 'high', status: 'confirmed' }),
        makeDiscovery({ defaultRiskLevel: 'limited', status: 'authorized' }),
        makeDiscovery({ defaultRiskLevel: 'minimal', status: 'dismissed' }),
      ]
      const result = calculateRiskScore(discoveries)
      expect(result.score).toBeGreaterThan(0)
      expect(result.score).toBeLessThanOrEqual(100)
    })
  })

  describe('getRiskLevelColor', () => {
    it('should return correct colors for each level', () => {
      expect(getRiskLevelColor('prohibited')).toBe('#ef4444')
      expect(getRiskLevelColor('high')).toBe('#f97316')
      expect(getRiskLevelColor('limited')).toBe('#eab308')
      expect(getRiskLevelColor('minimal')).toBe('#22c55e')
    })
  })

  describe('countByRiskLevel', () => {
    it('should count tools by effective risk level', () => {
      const discoveries = [
        makeDiscovery({ defaultRiskLevel: 'high' }),
        makeDiscovery({ defaultRiskLevel: 'high' }),
        makeDiscovery({ defaultRiskLevel: 'limited' }),
        makeDiscovery({ defaultRiskLevel: 'minimal', userRiskLevel: 'high' }),
      ]
      const counts = countByRiskLevel(discoveries)
      expect(counts.high).toBe(3)
      expect(counts.limited).toBe(1)
      expect(counts.minimal).toBe(0)
    })

    it('should return zeros for empty array', () => {
      const counts = countByRiskLevel([])
      expect(counts.prohibited).toBe(0)
      expect(counts.high).toBe(0)
      expect(counts.limited).toBe(0)
      expect(counts.minimal).toBe(0)
    })
  })

  describe('countByStatus', () => {
    it('should count tools by status', () => {
      const discoveries = [
        makeDiscovery({ status: 'detected' }),
        makeDiscovery({ status: 'detected' }),
        makeDiscovery({ status: 'confirmed' }),
        makeDiscovery({ status: 'authorized' }),
      ]
      const counts = countByStatus(discoveries)
      expect(counts.detected).toBe(2)
      expect(counts.confirmed).toBe(1)
      expect(counts.authorized).toBe(1)
      expect(counts.dismissed).toBe(0)
    })
  })

  describe('getUpcomingDeadlines', () => {
    const settings = makeDefaultSettings()

    it('should return empty array for empty discoveries', () => {
      const result = getUpcomingDeadlines([], settings)
      expect(result).toEqual([])
    })

    it('should skip dismissed tools', () => {
      const discoveries = [
        makeDiscovery({
          status: 'dismissed',
          complianceStatus: createMockComplianceStatus({
            euAiAct: {
              'art-4': { assessment: 'pending', lastAssessedDate: null, dueDate: daysFromNow(5), notes: '' },
            },
          }),
        }),
      ]
      const result = getUpcomingDeadlines(discoveries, settings)
      expect(result).toEqual([])
    })

    it('should skip complete and not_applicable checklists', () => {
      const discoveries = [
        makeDiscovery({
          complianceStatus: createMockComplianceStatus({
            euAiAct: {
              'art-4': { assessment: 'complete', lastAssessedDate: '2026-03-01T00:00:00.000Z', dueDate: daysFromNow(5), notes: '' },
            },
          }),
        }),
        makeDiscovery({
          id: 'test-2',
          complianceStatus: createMockComplianceStatus({
            euAiAct: {
              'art-4': { assessment: 'not_applicable', lastAssessedDate: null, dueDate: daysFromNow(5), notes: '' },
            },
          }),
        }),
      ]
      const result = getUpcomingDeadlines(discoveries, settings)
      expect(result).toEqual([])
    })

    it('should skip disabled regulations', () => {
      const discoveries = [
        makeDiscovery({
          complianceStatus: createMockComplianceStatus({
            coSb205: {
              'co-risk-policy': { assessment: 'pending', lastAssessedDate: null, dueDate: daysFromNow(10), notes: '' },
            },
          }),
        }),
      ]
      const result = getUpcomingDeadlines(discoveries, settings)
      expect(result).toEqual([])
    })

    it('should skip checklists without dueDate', () => {
      const discoveries = [
        makeDiscovery({
          complianceStatus: createMockComplianceStatus({
            euAiAct: {
              'art-4': { assessment: 'pending', lastAssessedDate: null, dueDate: null, notes: '' },
            },
          }),
        }),
      ]
      const result = getUpcomingDeadlines(discoveries, settings)
      expect(result).toEqual([])
    })

    it('should return pending deadlines with correct fields', () => {
      const dueDate = daysFromNow(5)
      const discoveries = [
        makeDiscovery({
          id: 'chat-1',
          toolName: 'ChatGPT',
          defaultRiskLevel: 'limited',
          complianceStatus: createMockComplianceStatus({
            euAiAct: {
              'art-4': { assessment: 'pending', lastAssessedDate: null, dueDate, notes: '' },
            },
          }),
        }),
      ]
      const result = getUpcomingDeadlines(discoveries, settings)

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        toolName: 'ChatGPT',
        toolId: 'chat-1',
        regulationKey: 'euAiAct',
        regulationLabel: 'EU AI Act',
        articleId: 'art-4',
        articleTitle: 'Art. 4 — Alfabetización en IA',
        dueDate,
        daysRemaining: expect.closeTo(5, 0),
        riskLevel: 'limited',
        urgency: 'this_week',
      })
    })

    it('should classify overdue as negative daysRemaining', () => {
      const discoveries = [
        makeDiscovery({
          complianceStatus: createMockComplianceStatus({
            euAiAct: {
              'art-4': { assessment: 'pending', lastAssessedDate: null, dueDate: daysFromNow(-3), notes: '' },
            },
          }),
        }),
      ]
      const result = getUpcomingDeadlines(discoveries, settings)

      expect(result).toHaveLength(1)
      expect(result[0].urgency).toBe('overdue')
      expect(result[0].daysRemaining).toBeLessThan(0)
    })

    it('should classify urgency correctly: overdue, this_week, this_month, upcoming', () => {
      const discoveries = [
        makeDiscovery({
          id: 'd1',
          complianceStatus: createMockComplianceStatus({
            euAiAct: { 'art-4': { assessment: 'pending', lastAssessedDate: null, dueDate: daysFromNow(-2), notes: '' } },
          }),
        }),
        makeDiscovery({
          id: 'd2',
          complianceStatus: createMockComplianceStatus({
            euAiAct: { 'art-6': { assessment: 'pending', lastAssessedDate: null, dueDate: daysFromNow(3), notes: '' } },
          }),
        }),
        makeDiscovery({
          id: 'd3',
          complianceStatus: createMockComplianceStatus({
            euAiAct: { 'art-9': { assessment: 'pending', lastAssessedDate: null, dueDate: daysFromNow(15), notes: '' } },
          }),
        }),
        makeDiscovery({
          id: 'd4',
          complianceStatus: createMockComplianceStatus({
            euAiAct: { 'art-11': { assessment: 'pending', lastAssessedDate: null, dueDate: daysFromNow(60), notes: '' } },
          }),
        }),
      ]
      const result = getUpcomingDeadlines(discoveries, settings)

      expect(result).toHaveLength(4)
      expect(result[0].urgency).toBe('overdue')
      expect(result[1].urgency).toBe('this_week')
      expect(result[2].urgency).toBe('this_month')
      expect(result[3].urgency).toBe('upcoming')
    })

    it('should sort by daysRemaining ascending', () => {
      const discoveries = [
        makeDiscovery({
          id: 'd1',
          complianceStatus: createMockComplianceStatus({
            euAiAct: { 'art-4': { assessment: 'pending', lastAssessedDate: null, dueDate: daysFromNow(20), notes: '' } },
          }),
        }),
        makeDiscovery({
          id: 'd2',
          complianceStatus: createMockComplianceStatus({
            euAiAct: { 'art-6': { assessment: 'pending', lastAssessedDate: null, dueDate: daysFromNow(3), notes: '' } },
          }),
        }),
        makeDiscovery({
          id: 'd3',
          complianceStatus: createMockComplianceStatus({
            euAiAct: { 'art-9': { assessment: 'pending', lastAssessedDate: null, dueDate: daysFromNow(10), notes: '' } },
          }),
        }),
      ]
      const result = getUpcomingDeadlines(discoveries, settings)

      expect(result[0].daysRemaining).toBeLessThanOrEqual(result[1].daysRemaining)
      expect(result[1].daysRemaining).toBeLessThanOrEqual(result[2].daysRemaining)
    })

    it('should respect daysAhead parameter', () => {
      const discoveries = [
        makeDiscovery({
          complianceStatus: createMockComplianceStatus({
            euAiAct: {
              'art-4': { assessment: 'pending', lastAssessedDate: null, dueDate: daysFromNow(5), notes: '' },
            },
          }),
        }),
        makeDiscovery({
          id: 'd2',
          complianceStatus: createMockComplianceStatus({
            euAiAct: {
              'art-6': { assessment: 'pending', lastAssessedDate: null, dueDate: daysFromNow(120), notes: '' },
            },
          }),
        }),
      ]
      const resultDefault = getUpcomingDeadlines(discoveries, settings)
      expect(resultDefault).toHaveLength(1)

      const resultWide = getUpcomingDeadlines(discoveries, settings, 150)
      expect(resultWide).toHaveLength(2)
    })

    it('should use userRiskLevel over defaultRiskLevel', () => {
      const discoveries = [
        makeDiscovery({
          defaultRiskLevel: 'limited',
          userRiskLevel: 'high',
          complianceStatus: createMockComplianceStatus({
            euAiAct: {
              'art-4': { assessment: 'pending', lastAssessedDate: null, dueDate: daysFromNow(5), notes: '' },
            },
          }),
        }),
      ]
      const result = getUpcomingDeadlines(discoveries, settings)
      expect(result[0].riskLevel).toBe('high')
    })

    it('should include overdue articles', () => {
      const discoveries = [
        makeDiscovery({
          complianceStatus: createMockComplianceStatus({
            euAiAct: {
              'art-4': { assessment: 'overdue', lastAssessedDate: null, dueDate: daysFromNow(-5), notes: '' },
            },
          }),
        }),
      ]
      const result = getUpcomingDeadlines(discoveries, settings)
      expect(result).toHaveLength(1)
      expect(result[0].urgency).toBe('overdue')
    })

    it('should generate one deadline per article per regulation', () => {
      const discoveries = [
        makeDiscovery({
          complianceStatus: createMockComplianceStatus({
            euAiAct: {
              'art-4': { assessment: 'pending', lastAssessedDate: null, dueDate: daysFromNow(10), notes: '' },
              'art-6': { assessment: 'pending', lastAssessedDate: null, dueDate: daysFromNow(10), notes: '' },
            },
          }),
        }),
      ]
      const result = getUpcomingDeadlines(discoveries, settings)
      expect(result).toHaveLength(2)
      expect(result[0].articleId).toBe('art-4')
      expect(result[1].articleId).toBe('art-6')
    })
  })

  describe('evaluateBadgeState', () => {
    it('should return hidden badge when badgeNotifications is off', () => {
      const settings = makeDefaultSettings()
      settings.badgeNotifications = false
      const discoveries = [makeDiscovery({ defaultRiskLevel: 'high' })]

      const result = evaluateBadgeState(discoveries, settings)

      expect(result.visible).toBe(false)
      expect(result.text).toBe('')
    })

    it('should return hidden badge when no detected tools match risk levels', () => {
      const settings = makeDefaultSettings()
      settings.alertConfig.newDetectionRiskLevels = ['prohibited']
      const discoveries = [makeDiscovery({ defaultRiskLevel: 'limited' })]

      const result = evaluateBadgeState(discoveries, settings)

      expect(result.visible).toBe(false)
    })

    it('should return hidden badge when no detected tools', () => {
      const settings = makeDefaultSettings()
      const discoveries = [makeDiscovery({ status: 'confirmed' })]

      const result = evaluateBadgeState(discoveries, settings)

      expect(result.visible).toBe(false)
    })

    it('should return blue badge as default for normal detected tools', () => {
      const settings = makeDefaultSettings()
      const discoveries = [makeDiscovery({ defaultRiskLevel: 'high' })]

      const result = evaluateBadgeState(discoveries, settings)

      expect(result.visible).toBe(true)
      expect(result.text).toBe('1')
      expect(result.color).toBe('#3b82f6')
      expect(result.priority).toBe('normal')
    })

    it('should count only tools matching newDetectionRiskLevels', () => {
      const settings = makeDefaultSettings()
      settings.alertConfig.newDetectionRiskLevels = ['prohibited']
      const discoveries = [
        makeDiscovery({ id: 'd1', defaultRiskLevel: 'limited' }),
        makeDiscovery({ id: 'd2', defaultRiskLevel: 'prohibited' }),
      ]

      const result = evaluateBadgeState(discoveries, settings)

      expect(result.visible).toBe(true)
      expect(result.text).toBe('1')
    })

    it('should count all detected tools when newDetectionRiskLevels is empty', () => {
      const settings = makeDefaultSettings()
      settings.alertConfig.newDetectionRiskLevels = []
      const discoveries = [
        makeDiscovery({ id: 'd1', defaultRiskLevel: 'limited' }),
        makeDiscovery({ id: 'd2', defaultRiskLevel: 'prohibited' }),
      ]

      const result = evaluateBadgeState(discoveries, settings)

      expect(result.visible).toBe(true)
      expect(result.text).toBe('2')
    })

    it('should return red badge when overdue articles exist', () => {
      const settings = makeDefaultSettings()
      const discoveries = [
        makeDiscovery({
          defaultRiskLevel: 'high',
          complianceStatus: createMockComplianceStatus({
            euAiAct: {
              'art-4': { assessment: 'overdue', lastAssessedDate: null, dueDate: daysFromNow(-5), notes: '' },
            },
          }),
        }),
      ]

      const result = evaluateBadgeState(discoveries, settings)

      expect(result.visible).toBe(true)
      expect(result.color).toBe('#ef4444')
      expect(result.priority).toBe('overdue')
    })

    it('should return orange badge when assessments due within threshold', () => {
      const settings = makeDefaultSettings()
      const discoveries = [
        makeDiscovery({
          defaultRiskLevel: 'high',
          complianceStatus: createMockComplianceStatus({
            euAiAct: {
              'art-4': { assessment: 'pending', lastAssessedDate: null, dueDate: daysFromNow(7), notes: '' },
            },
          }),
        }),
      ]

      const result = evaluateBadgeState(discoveries, settings)

      expect(result.visible).toBe(true)
      expect(result.color).toBe('#f97316')
      expect(result.priority).toBe('upcoming_due')
    })

    it('should return yellow badge when unassessed count exceeds max', () => {
      const settings = makeDefaultSettings()
      settings.alertConfig.maxUnassessedCount = 2
      const discoveries = [
        makeDiscovery({ id: 'd1', defaultRiskLevel: 'high' }),
        makeDiscovery({ id: 'd2', defaultRiskLevel: 'prohibited' }),
        makeDiscovery({ id: 'd3', defaultRiskLevel: 'high' }),
      ]

      const result = evaluateBadgeState(discoveries, settings)

      expect(result.visible).toBe(true)
      expect(result.color).toBe('#eab308')
      expect(result.priority).toBe('max_unassessed')
    })

    it('should not trigger max_unassessed when count equals threshold', () => {
      const settings = makeDefaultSettings()
      settings.alertConfig.maxUnassessedCount = 3
      const discoveries = [
        makeDiscovery({ id: 'd1', defaultRiskLevel: 'high' }),
        makeDiscovery({ id: 'd2', defaultRiskLevel: 'prohibited' }),
        makeDiscovery({ id: 'd3', defaultRiskLevel: 'high' }),
      ]

      const result = evaluateBadgeState(discoveries, settings)

      expect(result.priority).toBe('normal')
      expect(result.color).toBe('#3b82f6')
    })

    it('should prioritize overdue over upcoming_due', () => {
      const settings = makeDefaultSettings()
      const discoveries = [
        makeDiscovery({
          defaultRiskLevel: 'high',
          complianceStatus: createMockComplianceStatus({
            euAiAct: {
              'art-4': { assessment: 'overdue', lastAssessedDate: null, dueDate: daysFromNow(-5), notes: '' },
              'art-6': { assessment: 'pending', lastAssessedDate: null, dueDate: daysFromNow(7), notes: '' },
            },
          }),
        }),
      ]

      const result = evaluateBadgeState(discoveries, settings)

      expect(result.priority).toBe('overdue')
      expect(result.color).toBe('#ef4444')
    })

    it('should prioritize upcoming_due over max_unassessed', () => {
      const settings = makeDefaultSettings()
      settings.alertConfig.maxUnassessedCount = 1
      const discoveries = [
        makeDiscovery({
          defaultRiskLevel: 'high',
          complianceStatus: createMockComplianceStatus({
            euAiAct: {
              'art-4': { assessment: 'pending', lastAssessedDate: null, dueDate: daysFromNow(5), notes: '' },
            },
          }),
        }),
        makeDiscovery({ id: 'd2', defaultRiskLevel: 'prohibited' }),
      ]

      const result = evaluateBadgeState(discoveries, settings)

      expect(result.priority).toBe('upcoming_due')
      expect(result.color).toBe('#f97316')
    })

    it('should skip dismissed tools for overdue check', () => {
      const settings = makeDefaultSettings()
      const discoveries = [
        makeDiscovery({
          status: 'dismissed',
          defaultRiskLevel: 'high',
          complianceStatus: createMockComplianceStatus({
            euAiAct: {
              'art-4': { assessment: 'overdue', lastAssessedDate: null, dueDate: daysFromNow(-5), notes: '' },
            },
          }),
        }),
      ]

      const result = evaluateBadgeState(discoveries, settings)

      expect(result.visible).toBe(false)
    })

    it('should skip disabled regulations for overdue and upcoming checks', () => {
      const settings = makeDefaultSettings()
      settings.regulationConfig.euAiAct.enabled = false
      const discoveries = [
        makeDiscovery({
          defaultRiskLevel: 'high',
          complianceStatus: createMockComplianceStatus({
            euAiAct: {
              'art-4': { assessment: 'overdue', lastAssessedDate: null, dueDate: daysFromNow(-5), notes: '' },
            },
          }),
        }),
      ]

      const result = evaluateBadgeState(discoveries, settings)

      expect(result.priority).toBe('normal')
    })

    it('should use userRiskLevel over defaultRiskLevel for badge count', () => {
      const settings = makeDefaultSettings()
      settings.alertConfig.newDetectionRiskLevels = ['prohibited']
      const discoveries = [
        makeDiscovery({
          defaultRiskLevel: 'limited',
          userRiskLevel: 'prohibited',
        }),
      ]

      const result = evaluateBadgeState(discoveries, settings)

      expect(result.visible).toBe(true)
      expect(result.text).toBe('1')
    })

    it('should respect custom assessmentDueDays thresholds', () => {
      const settings = makeDefaultSettings()
      settings.alertConfig.assessmentDueDays = [60]
      const discoveries = [
        makeDiscovery({
          defaultRiskLevel: 'high',
          complianceStatus: createMockComplianceStatus({
            euAiAct: {
              'art-4': { assessment: 'pending', lastAssessedDate: null, dueDate: daysFromNow(50), notes: '' },
            },
          }),
        }),
      ]

      const result = evaluateBadgeState(discoveries, settings)

      expect(result.priority).toBe('upcoming_due')
    })

    it('should not trigger upcoming_due when dueDate is outside all thresholds', () => {
      const settings = makeDefaultSettings()
      settings.alertConfig.assessmentDueDays = [7, 1]
      const discoveries = [
        makeDiscovery({
          defaultRiskLevel: 'high',
          complianceStatus: createMockComplianceStatus({
            euAiAct: {
              'art-4': { assessment: 'pending', lastAssessedDate: null, dueDate: daysFromNow(30), notes: '' },
            },
          }),
        }),
      ]

      const result = evaluateBadgeState(discoveries, settings)

      expect(result.priority).toBe('normal')
    })
  })
})
