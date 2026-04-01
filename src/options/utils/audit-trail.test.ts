import { describe, it, expect } from 'vitest'
import { createAuditEntries, appendAuditEntries, MAX_AUDIT_ENTRIES_PER_TOOL } from './audit-trail'
import type { DiscoveryRecord, AuditEntry } from '@shared/types/discovery'
import { createMockComplianceStatus } from '@test-utils/mock-helpers'

function makeDiscovery(overrides: Partial<DiscoveryRecord> = {}): DiscoveryRecord {
  return {
    id: 'test-id-1',
    domain: 'chatgpt.com',
    toolName: 'ChatGPT',
    category: 'chatbot',
    defaultRiskLevel: 'limited',
    userRiskLevel: null,
    status: 'detected',
    department: null,
    firstSeen: '2026-03-15T09:00:00.000Z',
    lastSeen: '2026-03-15T09:00:00.000Z',
    visitCount: 1,
    complianceStatus: createMockComplianceStatus(),
    notes: '',
    tags: [],
    auditTrail: [],
    ...overrides,
  }
}

describe('createAuditEntries', () => {
  it('should return empty array when nothing changed', () => {
    const original = makeDiscovery()
    const updated = makeDiscovery()
    const entries = createAuditEntries(original, updated)
    expect(entries).toHaveLength(0)
  })

  it('should detect status change', () => {
    const original = makeDiscovery({ status: 'detected' })
    const updated = makeDiscovery({ status: 'confirmed' })
    const entries = createAuditEntries(original, updated)

    expect(entries).toHaveLength(1)
    expect(entries[0].field).toBe('status')
    expect(entries[0].oldValue).toBe('Detectado')
    expect(entries[0].newValue).toBe('Confirmado')
    expect(entries[0].id).toBeTruthy()
    expect(entries[0].timestamp).toBeTruthy()
    expect(entries[0].changedBy).toBeNull()
  })

  it('should detect risk level change', () => {
    const original = makeDiscovery({ userRiskLevel: null, defaultRiskLevel: 'limited' })
    const updated = makeDiscovery({ userRiskLevel: 'high', defaultRiskLevel: 'limited' })
    const entries = createAuditEntries(original, updated)

    expect(entries).toHaveLength(1)
    expect(entries[0].field).toBe('riskLevel')
    expect(entries[0].oldValue).toBe('Limitado')
    expect(entries[0].newValue).toBe('Alto')
  })

  it('should detect risk level change when userRiskLevel is null but matches default', () => {
    const original = makeDiscovery({ userRiskLevel: null, defaultRiskLevel: 'limited' })
    const updated = makeDiscovery({ userRiskLevel: null, defaultRiskLevel: 'limited' })
    const entries = createAuditEntries(original, updated)

    expect(entries).toHaveLength(0)
  })

  it('should detect department change', () => {
    const original = makeDiscovery({ department: null })
    const updated = makeDiscovery({ department: 'IT' })
    const entries = createAuditEntries(original, updated)

    expect(entries).toHaveLength(1)
    expect(entries[0].field).toBe('department')
    expect(entries[0].oldValue).toBe('(sin asignar)')
    expect(entries[0].newValue).toBe('IT')
  })

  it('should detect notes change', () => {
    const original = makeDiscovery({ notes: '' })
    const updated = makeDiscovery({ notes: 'Revisado por auditor' })
    const entries = createAuditEntries(original, updated)

    expect(entries).toHaveLength(1)
    expect(entries[0].field).toBe('notes')
    expect(entries[0].oldValue).toBe('(vacío)')
    expect(entries[0].newValue).toBe('Revisado por auditor')
  })

  it('should truncate long notes values', () => {
    const longNotes = 'a'.repeat(100)
    const original = makeDiscovery({ notes: '' })
    const updated = makeDiscovery({ notes: longNotes })
    const entries = createAuditEntries(original, updated)

    expect(entries).toHaveLength(1)
    expect(entries[0].newValue.length).toBeLessThanOrEqual(83)
    expect(entries[0].newValue).toContain('…')
  })

  it('should detect single compliance article change', () => {
    const original = makeDiscovery()
    const updated = makeDiscovery({
      complianceStatus: createMockComplianceStatus({
        euAiAct: {
          ...Object.fromEntries(
            ['art-4', 'art-6', 'art-9', 'art-11', 'art-12', 'art-26', 'art-27', 'art-50'].map((id) => [
              id,
              { assessment: 'pending' as const, lastAssessedDate: null, dueDate: null, notes: '' },
            ]),
          ),
          'art-4': { assessment: 'complete' as const, lastAssessedDate: '2026-03-31', dueDate: '2026-06-29', notes: '' },
        },
      }),
    })
    const entries = createAuditEntries(original, updated)

    expect(entries).toHaveLength(1)
    expect(entries[0].field).toBe('compliance')
    expect(entries[0].oldValue).toContain('EU AI Act')
    expect(entries[0].oldValue).toContain('Pendiente')
    expect(entries[0].newValue).toContain('Completo')
  })

  it('should detect multiple compliance article changes across regulations', () => {
    const original = makeDiscovery()
    const updated = makeDiscovery({
      complianceStatus: createMockComplianceStatus({
        euAiAct: Object.fromEntries(
          ['art-4', 'art-6', 'art-9', 'art-11', 'art-12', 'art-26', 'art-27', 'art-50'].map((id) => [
            id,
            id === 'art-4'
              ? { assessment: 'complete' as const, lastAssessedDate: '2026-03-31', dueDate: '2026-06-29', notes: '' }
              : { assessment: 'pending' as const, lastAssessedDate: null, dueDate: null, notes: '' },
          ]),
        ),
        iso42001: Object.fromEntries(
          ['iso-aims-inventory', 'iso-risk-assessment', 'iso-documentation', 'iso-monitoring', 'iso-governance'].map((id) => [
            id,
            id === 'iso-aims-inventory'
              ? { assessment: 'complete' as const, lastAssessedDate: '2026-03-31', dueDate: '2026-06-29', notes: '' }
              : { assessment: 'pending' as const, lastAssessedDate: null, dueDate: null, notes: '' },
          ]),
        ),
      }),
    })
    const entries = createAuditEntries(original, updated)

    expect(entries.length).toBeGreaterThanOrEqual(2)
    const complianceEntries = entries.filter((e) => e.field === 'compliance')
    expect(complianceEntries).toHaveLength(2)
  })

  it('should detect multiple field changes at once', () => {
    const original = makeDiscovery({ status: 'detected', department: null, notes: '' })
    const updated = makeDiscovery({
      status: 'confirmed',
      department: 'IT',
      notes: 'Algo',
      userRiskLevel: 'high',
    })
    const entries = createAuditEntries(original, updated)

    expect(entries.length).toBeGreaterThanOrEqual(3)
    const fields = entries.map((e) => e.field)
    expect(fields).toContain('status')
    expect(fields).toContain('department')
    expect(fields).toContain('notes')
    expect(fields).toContain('riskLevel')
  })

  it('should not generate entry for compliance articles that did not change', () => {
    const original = makeDiscovery()
    const updated = makeDiscovery({ status: 'confirmed' })
    const entries = createAuditEntries(original, updated)

    const complianceEntries = entries.filter((e) => e.field === 'compliance')
    expect(complianceEntries).toHaveLength(0)
  })
})

describe('appendAuditEntries', () => {
  it('should append entries to existing trail', () => {
    const existing: AuditEntry[] = [
      { id: 'old-1', timestamp: '2026-03-30T10:00:00.000Z', field: 'status', oldValue: 'Detectado', newValue: 'Confirmado', changedBy: null },
    ]
    const newEntries: AuditEntry[] = [
      { id: 'new-1', timestamp: '2026-03-31T10:00:00.000Z', field: 'riskLevel', oldValue: 'Limitado', newValue: 'Alto', changedBy: null },
    ]

    const result = appendAuditEntries(existing, newEntries)
    expect(result).toHaveLength(2)
    expect(result[0].id).toBe('old-1')
    expect(result[1].id).toBe('new-1')
  })

  it('should trim trail when exceeding max entries', () => {
    const existing: AuditEntry[] = Array.from({ length: MAX_AUDIT_ENTRIES_PER_TOOL }, (_, i) => ({
      id: `old-${i}`,
      timestamp: `2026-03-30T10:00:0${String(i).padStart(2, '0')}.000Z`,
      field: 'status' as const,
      oldValue: 'Detectado',
      newValue: 'Confirmado',
      changedBy: null,
    }))
    const newEntries: AuditEntry[] = [
      { id: 'new-1', timestamp: '2026-03-31T10:00:00.000Z', field: 'riskLevel', oldValue: 'Limitado', newValue: 'Alto', changedBy: null },
    ]

    const result = appendAuditEntries(existing, newEntries)
    expect(result).toHaveLength(MAX_AUDIT_ENTRIES_PER_TOOL)
    expect(result[result.length - 1].id).toBe('new-1')
    expect(result[0].id).toBe('old-1')
  })

  it('should return new entries when existing trail is empty', () => {
    const newEntries: AuditEntry[] = [
      { id: 'new-1', timestamp: '2026-03-31T10:00:00.000Z', field: 'status', oldValue: 'Detectado', newValue: 'Confirmado', changedBy: null },
    ]

    const result = appendAuditEntries([], newEntries)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('new-1')
  })

  describe('changedBy parameter', () => {
    it('should default changedBy to null when not provided', () => {
      const original = makeDiscovery({ status: 'detected' })
      const updated = makeDiscovery({ status: 'confirmed' })
      const entries = createAuditEntries(original, updated)
      expect(entries[0].changedBy).toBeNull()
    })

    it('should set changedBy on all entries when provided', () => {
      const original = makeDiscovery({ status: 'detected', userRiskLevel: null, defaultRiskLevel: 'limited' })
      const updated = makeDiscovery({ status: 'confirmed', userRiskLevel: 'high', defaultRiskLevel: 'limited' })
      const entries = createAuditEntries(original, updated, 'María García')
      expect(entries).toHaveLength(2)
      expect(entries[0].changedBy).toBe('María García')
      expect(entries[1].changedBy).toBe('María García')
    })

    it('should set changedBy on compliance entries', () => {
      const original = makeDiscovery()
      const updatedCompliance = createMockComplianceStatus({
        euAiAct: {
          'art-6': { assessment: 'complete', lastAssessedDate: '2026-03-31T10:00:00.000Z', dueDate: null, notes: '' },
        },
      })
      const updated = makeDiscovery({ complianceStatus: updatedCompliance })
      const entries = createAuditEntries(original, updated, 'Auditor')
      expect(entries).toHaveLength(1)
      expect(entries[0].field).toBe('compliance')
      expect(entries[0].changedBy).toBe('Auditor')
    })
  })
})
