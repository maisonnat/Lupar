import { describe, it, expect } from 'vitest'
import { mapCompliance } from '@options/utils/compliance-mapper'
import type { DiscoveryRecord } from '@shared/types/discovery'
import { createMockComplianceStatus, createMockDetectionEvent } from '@test-utils/mock-helpers'

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
    detectionEvents: [createMockDetectionEvent()],
    ...overrides,
  }
}

describe('mapCompliance', () => {
  it('should return 3 regulation summaries', () => {
    const result = mapCompliance([makeDiscovery()])
    expect(result.summaries).toHaveLength(3)
    expect(result.summaries.map((s) => s.regulationId)).toEqual(['euAiAct', 'iso42001', 'coSb205'])
  })

  it('should calculate percentComplete correctly', () => {
    const result = mapCompliance([makeDiscovery()])
    const euSummary = result.summaries.find((s) => s.regulationId === 'euAiAct')!
    expect(euSummary.pending).toBe(2)
    expect(euSummary.complete).toBe(0)
    expect(euSummary.percentComplete).toBe(0)
  })

  it('should count complete assessments', () => {
    const result = mapCompliance([
      makeDiscovery({
        id: '1',
        complianceStatus: {
          euAiAct: Object.fromEntries(['art-4','art-6','art-9','art-11','art-12','art-26','art-27','art-50'].map(id => [id, { assessment: 'complete' as const, lastAssessedDate: '2026-03-15', dueDate: null, notes: '' }])),
          iso42001: Object.fromEntries(['iso-aims-inventory','iso-risk-assessment','iso-documentation','iso-monitoring','iso-governance'].map(id => [id, { assessment: 'complete' as const, lastAssessedDate: '2026-03-15', dueDate: null, notes: '' }])),
          coSb205: Object.fromEntries(['co-risk-policy','co-impact-assessment','co-disclosure','co-public-statement','co-affirmative-defense'].map(id => [id, { assessment: 'not_applicable' as const, lastAssessedDate: null, dueDate: null, notes: '' }])),
        },
      }),
    ])

    const euSummary = result.summaries.find((s) => s.regulationId === 'euAiAct')!
    expect(euSummary.complete).toBe(2)
    expect(euSummary.percentComplete).toBe(100)
  })

  it('should generate gaps for pending assessments', () => {
    const result = mapCompliance([makeDiscovery()])
    expect(result.totalGaps).toBeGreaterThan(0)

    const euGaps = result.summaries.find((s) => s.regulationId === 'euAiAct')!.gaps
    expect(euGaps.length).toBeGreaterThan(0)
    expect(euGaps[0].assessment).toBe('pending')
  })

  it('should not generate gaps for complete or not_applicable', () => {
    const result = mapCompliance([
      makeDiscovery({
        complianceStatus: {
          euAiAct: Object.fromEntries(['art-4','art-6','art-9','art-11','art-12','art-26','art-27','art-50'].map(id => [id, { assessment: 'complete' as const, lastAssessedDate: '2026-03-15', dueDate: null, notes: '' }])),
          iso42001: Object.fromEntries(['iso-aims-inventory','iso-risk-assessment','iso-documentation','iso-monitoring','iso-governance'].map(id => [id, { assessment: 'not_applicable' as const, lastAssessedDate: null, dueDate: null, notes: '' }])),
          coSb205: Object.fromEntries(['co-risk-policy','co-impact-assessment','co-disclosure','co-public-statement','co-affirmative-defense'].map(id => [id, { assessment: 'not_applicable' as const, lastAssessedDate: null, dueDate: null, notes: '' }])),
        },
      }),
    ])
    expect(result.totalGaps).toBe(0)
  })

  it('should sort gaps by severity (overdue first)', () => {
    const result = mapCompliance([
      makeDiscovery({ id: '1' }),
      makeDiscovery({ id: '2', complianceStatus: createMockComplianceStatus({
        euAiAct: {
          ...createMockComplianceStatus().euAiAct,
          'art-4': { assessment: 'overdue' as const, lastAssessedDate: null, dueDate: '2026-01-01', notes: '' },
        },
      })}),
    ])

    const euGaps = result.allGaps.filter((g) => g.regulationId === 'euAiAct')
    const overdueGaps = euGaps.filter((g) => g.assessment === 'overdue')
    const pendingGaps = euGaps.filter((g) => g.assessment === 'pending')
    expect(overdueGaps.length).toBeGreaterThan(0)
    expect(pendingGaps.length).toBeGreaterThan(0)

    const firstOverdueIdx = euGaps.findIndex((g) => g.assessment === 'overdue')
    const lastPendingIdx = euGaps.length - 1 - [...euGaps].reverse().findIndex((g) => g.assessment === 'pending')
    expect(firstOverdueIdx).toBeLessThan(lastPendingIdx)
  })

  it('should calculate overallPercentComplete excluding not_applicable', () => {
    const result = mapCompliance([
      makeDiscovery({
        complianceStatus: {
          euAiAct: Object.fromEntries(['art-4','art-6','art-9','art-11','art-12','art-26','art-27','art-50'].map(id => [id, { assessment: 'complete' as const, lastAssessedDate: '2026-03-15', dueDate: null, notes: '' }])),
          iso42001: Object.fromEntries(['iso-aims-inventory','iso-risk-assessment','iso-documentation','iso-monitoring','iso-governance'].map(id => [id, { assessment: 'pending' as const, lastAssessedDate: null, dueDate: null, notes: '' }])),
          coSb205: Object.fromEntries(['co-risk-policy','co-impact-assessment','co-disclosure','co-public-statement','co-affirmative-defense'].map(id => [id, { assessment: 'not_applicable' as const, lastAssessedDate: null, dueDate: null, notes: '' }])),
        },
      }),
    ])

    expect(result.overallPercentComplete).toBe(29)
  })

  it('should handle empty discoveries', () => {
    const result = mapCompliance([])
    expect(result.summaries).toHaveLength(3)
    expect(result.totalGaps).toBe(0)
    expect(result.overallPercentComplete).toBe(100)
    result.summaries.forEach((s) => {
      expect(s.totalTools).toBe(0)
      expect(s.percentComplete).toBe(100)
    })
  })

  it('should generate high-risk action for prohibited risk', () => {
    const result = mapCompliance([
      makeDiscovery({
        defaultRiskLevel: 'prohibited',
        complianceStatus: createMockComplianceStatus({
          coSb205: Object.fromEntries(['co-risk-policy','co-impact-assessment','co-disclosure','co-public-statement','co-affirmative-defense'].map(id => [id, { assessment: 'pending' as const, lastAssessedDate: null, dueDate: null, notes: '' }])),
        }),
      }),
    ])

    const highRiskGaps = result.allGaps.filter(
      (g) => g.riskLevel === 'prohibited' && g.action.includes('Prioridad'),
    )
    expect(highRiskGaps.length).toBeGreaterThan(0)
  })

  it('should generate urgent action for overdue assessment', () => {
    const result = mapCompliance([
      makeDiscovery({
        complianceStatus: createMockComplianceStatus({
          euAiAct: {
            ...createMockComplianceStatus().euAiAct,
            'art-4': { assessment: 'overdue' as const, lastAssessedDate: null, dueDate: '2026-01-01', notes: '' },
          },
        }),
      }),
    ])

    const overdueGaps = result.allGaps.filter((g) => g.assessment === 'overdue')
    expect(overdueGaps.length).toBeGreaterThan(0)
    expect(overdueGaps[0].action).toContain('URGENTE')
  })

  it('should map multiple discoveries across regulations', () => {
    const result = mapCompliance([
      makeDiscovery({ id: '1', toolName: 'ChatGPT' }),
      makeDiscovery({ id: '2', toolName: 'Claude' }),
      makeDiscovery({ id: '3', toolName: 'HireVue', defaultRiskLevel: 'high' }),
    ])

    const euSummary = result.summaries.find((s) => s.regulationId === 'euAiAct')!
    expect(euSummary.totalTools).toBe(3)
    expect(euSummary.pending).toBe(11)
    expect(result.totalGaps).toBeGreaterThan(0)
  })
})
