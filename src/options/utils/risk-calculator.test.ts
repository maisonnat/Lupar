import { describe, it, expect } from 'vitest'
import {
  calculateRiskScore,
  getRiskLevelColor,
  countByRiskLevel,
  countByStatus,
} from '@options/utils/risk-calculator'
import type { DiscoveryRecord } from '@shared/types/discovery'

function makeDiscovery(
  overrides: Partial<Pick<DiscoveryRecord, 'defaultRiskLevel' | 'userRiskLevel' | 'status'>> = {},
): DiscoveryRecord {
  return {
    id: 'test-id',
    domain: 'test.com',
    toolName: 'Test Tool',
    category: 'chatbot',
    defaultRiskLevel: overrides.defaultRiskLevel ?? 'limited',
    userRiskLevel: overrides.userRiskLevel ?? null,
    status: overrides.status ?? 'detected',
    department: null,
    firstSeen: '2026-03-15T09:00:00.000Z',
    lastSeen: '2026-03-15T09:00:00.000Z',
    visitCount: 1,
    complianceStatus: {
      euAiAct: { assessment: 'pending', lastAssessedDate: null, dueDate: null, notes: '' },
      iso42001: { assessment: 'pending', lastAssessedDate: null, dueDate: null, notes: '' },
      coSb205: { assessment: 'not_applicable', lastAssessedDate: null, dueDate: null, notes: '' },
    },
    notes: '',
    tags: [],
  }
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
})
