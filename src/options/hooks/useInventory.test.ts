// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useInventory } from '@options/hooks/useInventory'
import type { DiscoveryRecord } from '@shared/types/discovery'

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
    complianceStatus: {
      euAiAct: { assessment: 'pending', lastAssessedDate: null, dueDate: null, notes: '' },
      iso42001: { assessment: 'pending', lastAssessedDate: null, dueDate: null, notes: '' },
      coSb205: { assessment: 'not_applicable', lastAssessedDate: null, dueDate: null, notes: '' },
    },
    notes: '',
    tags: [],
    ...overrides,
  }
}

describe('useInventory', () => {
  const sampleDiscoveries: DiscoveryRecord[] = [
    makeDiscovery({ id: '1', toolName: 'ChatGPT', domain: 'chatgpt.com', category: 'chatbot', defaultRiskLevel: 'limited', status: 'detected', visitCount: 10, lastSeen: '2026-03-28T10:00:00.000Z' }),
    makeDiscovery({ id: '2', toolName: 'Claude', domain: 'claude.ai', category: 'chatbot', defaultRiskLevel: 'limited', status: 'confirmed', visitCount: 5, lastSeen: '2026-03-27T10:00:00.000Z' }),
    makeDiscovery({ id: '3', toolName: 'Midjourney', domain: 'midjourney.com', category: 'image_generation', defaultRiskLevel: 'limited', status: 'detected', visitCount: 3, lastSeen: '2026-03-26T10:00:00.000Z' }),
    makeDiscovery({ id: '4', toolName: 'HireVue', domain: 'hirevue.com', category: 'hr_employment', defaultRiskLevel: 'high', status: 'authorized', visitCount: 20, lastSeen: '2026-03-25T10:00:00.000Z' }),
  ]

  it('should return all discoveries with no filters', () => {
    const { result } = renderHook(() => useInventory(sampleDiscoveries))
    expect(result.current.totalFiltered).toBe(4)
    expect(result.current.paginated).toHaveLength(4)
  })

  it('should filter by search text', () => {
    const { result } = renderHook(() => useInventory(sampleDiscoveries))

    act(() => {
      result.current.updateFilter('searchText', 'chat')
    })

    expect(result.current.totalFiltered).toBe(1)
    expect(result.current.paginated[0].toolName).toBe('ChatGPT')
  })

  it('should filter by category', () => {
    const { result } = renderHook(() => useInventory(sampleDiscoveries))

    act(() => {
      result.current.updateFilter('category', 'image_generation')
    })

    expect(result.current.totalFiltered).toBe(1)
    expect(result.current.paginated[0].toolName).toBe('Midjourney')
  })

  it('should filter by risk level', () => {
    const { result } = renderHook(() => useInventory(sampleDiscoveries))

    act(() => {
      result.current.updateFilter('riskLevel', 'high')
    })

    expect(result.current.totalFiltered).toBe(1)
    expect(result.current.paginated[0].toolName).toBe('HireVue')
  })

  it('should filter by status', () => {
    const { result } = renderHook(() => useInventory(sampleDiscoveries))

    act(() => {
      result.current.updateFilter('status', 'authorized')
    })

    expect(result.current.totalFiltered).toBe(1)
    expect(result.current.paginated[0].toolName).toBe('HireVue')
  })

  it('should combine multiple filters', () => {
    const { result } = renderHook(() => useInventory(sampleDiscoveries))

    act(() => {
      result.current.updateFilter('category', 'chatbot')
      result.current.updateFilter('status', 'detected')
    })

    expect(result.current.totalFiltered).toBe(1)
    expect(result.current.paginated[0].toolName).toBe('ChatGPT')
  })

  it('should reset filters', () => {
    const { result } = renderHook(() => useInventory(sampleDiscoveries))

    act(() => {
      result.current.updateFilter('searchText', 'chat')
    })
    expect(result.current.totalFiltered).toBe(1)

    act(() => {
      result.current.resetFilters()
    })
    expect(result.current.totalFiltered).toBe(4)
  })

  it('should sort by toolName ascending', () => {
    const { result } = renderHook(() => useInventory(sampleDiscoveries))

    act(() => {
      result.current.toggleSort('toolName')
    })

    expect(result.current.paginated[0].toolName).toBe('ChatGPT')
    expect(result.current.paginated[1].toolName).toBe('Claude')
  })

  it('should toggle sort direction on same field', () => {
    const { result } = renderHook(() => useInventory(sampleDiscoveries))

    act(() => {
      result.current.toggleSort('toolName')
    })
    expect(result.current.sort.direction).toBe('asc')

    act(() => {
      result.current.toggleSort('toolName')
    })
    expect(result.current.sort.direction).toBe('desc')
    expect(result.current.paginated[0].toolName).toBe('Midjourney')
  })

  it('should sort by visitCount descending by default', () => {
    const { result } = renderHook(() => useInventory(sampleDiscoveries))

    act(() => {
      result.current.toggleSort('visitCount')
    })

    expect(result.current.sort.direction).toBe('asc')
    expect(result.current.paginated[0].visitCount).toBe(3)
  })

  it('should sort by riskLevel (prohibited first)', () => {
    const discoveries = [
      makeDiscovery({ id: '1', toolName: 'Safe', defaultRiskLevel: 'minimal' }),
      makeDiscovery({ id: '2', toolName: 'Danger', defaultRiskLevel: 'prohibited' }),
      makeDiscovery({ id: '3', toolName: 'Medium', defaultRiskLevel: 'limited' }),
    ]
    const { result } = renderHook(() => useInventory(discoveries))

    act(() => {
      result.current.toggleSort('riskLevel')
    })

    expect(result.current.paginated[0].toolName).toBe('Danger')
    expect(result.current.paginated[2].toolName).toBe('Safe')
  })

  it('should paginate with PAGE_SIZE', () => {
    const many = Array.from({ length: 25 }, (_, i) =>
      makeDiscovery({ id: String(i), toolName: `Tool ${i}`, visitCount: i }),
    )

    const { result } = renderHook(() => useInventory(many))

    expect(result.current.totalPages).toBe(2)
    expect(result.current.paginated).toHaveLength(20)

    act(() => {
      result.current.setCurrentPage(2)
    })
    expect(result.current.paginated).toHaveLength(5)
  })

  it('should reset page when filter changes', () => {
    const many = Array.from({ length: 25 }, (_, i) =>
      makeDiscovery({ id: String(i), toolName: `Tool ${i}`, category: i < 3 ? 'chatbot' : 'image_generation' }),
    )

    const { result } = renderHook(() => useInventory(many))

    act(() => {
      result.current.setCurrentPage(2)
    })
    expect(result.current.currentPage).toBe(2)

    act(() => {
      result.current.updateFilter('category', 'chatbot')
    })
    expect(result.current.currentPage).toBe(1)
  })

  it('should handle empty discoveries', () => {
    const { result } = renderHook(() => useInventory([]))

    expect(result.current.totalFiltered).toBe(0)
    expect(result.current.paginated).toHaveLength(0)
    expect(result.current.totalPages).toBe(1)
  })
})
