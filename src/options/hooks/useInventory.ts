import { useState, useMemo, useCallback } from 'react'
import type { DiscoveryRecord } from '@shared/types/discovery'
import type { AICategory, RiskLevel } from '@shared/types/domain'

export interface InventoryFilters {
  searchText: string
  category: AICategory | ''
  riskLevel: RiskLevel | ''
  status: DiscoveryRecord['status'] | ''
}

export type SortField = 'toolName' | 'category' | 'riskLevel' | 'status' | 'visitCount' | 'lastSeen'
export type SortDirection = 'asc' | 'desc'

export interface SortConfig {
  field: SortField
  direction: SortDirection
}

export const PAGE_SIZE = 20

export function useInventory(discoveries: DiscoveryRecord[]) {
  const [filters, setFilters] = useState<InventoryFilters>({
    searchText: '',
    category: '',
    riskLevel: '',
    status: '',
  })
  const [sort, setSort] = useState<SortConfig>({ field: 'lastSeen', direction: 'desc' })
  const [currentPage, setCurrentPage] = useState(1)

  const filtered = useMemo(() => {
    let result = [...discoveries]

    if (filters.searchText) {
      const query = filters.searchText.toLowerCase()
      result = result.filter(
        (d) =>
          d.toolName.toLowerCase().includes(query) ||
          d.domain.toLowerCase().includes(query),
      )
    }

    if (filters.category) {
      result = result.filter((d) => d.category === filters.category)
    }

    if (filters.riskLevel) {
      result = result.filter(
        (d) => (d.userRiskLevel ?? d.defaultRiskLevel) === filters.riskLevel,
      )
    }

    if (filters.status) {
      result = result.filter((d) => d.status === filters.status)
    }

    return result
  }, [discoveries, filters])

  const sorted = useMemo(() => {
    const { field, direction } = sort
    const sorted = [...filtered].sort((a, b) => {
      let valA: string | number
      let valB: string | number

      switch (field) {
        case 'toolName':
          valA = a.toolName.toLowerCase()
          valB = b.toolName.toLowerCase()
          break
        case 'category':
          valA = a.category
          valB = b.category
          break
        case 'riskLevel': {
          const riskOrder: Record<RiskLevel, number> = { prohibited: 0, high: 1, limited: 2, minimal: 3 }
          valA = riskOrder[a.userRiskLevel ?? a.defaultRiskLevel]
          valB = riskOrder[b.userRiskLevel ?? b.defaultRiskLevel]
          break
        }
        case 'status': {
          const statusOrder: Record<string, number> = { detected: 0, confirmed: 1, authorized: 2, dismissed: 3 }
          valA = statusOrder[a.status]
          valB = statusOrder[b.status]
          break
        }
        case 'visitCount':
          valA = a.visitCount
          valB = b.visitCount
          break
        case 'lastSeen':
          valA = new Date(a.lastSeen).getTime()
          valB = new Date(b.lastSeen).getTime()
          break
      }

      if (valA < valB) return direction === 'asc' ? -1 : 1
      if (valA > valB) return direction === 'asc' ? 1 : -1
      return 0
    })
    return sorted
  }, [filtered, sort])

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const safeCurrentPage = Math.min(currentPage, totalPages)

  const paginated = useMemo(() => {
    const start = (safeCurrentPage - 1) * PAGE_SIZE
    return sorted.slice(start, start + PAGE_SIZE)
  }, [sorted, safeCurrentPage])

  const toggleSort = useCallback((field: SortField) => {
    setSort((prev) => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
    }))
    setCurrentPage(1)
  }, [])

  const updateFilter = useCallback(<K extends keyof InventoryFilters>(
    key: K,
    value: InventoryFilters[K],
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setCurrentPage(1)
  }, [])

  const resetFilters = useCallback(() => {
    setFilters({ searchText: '', category: '', riskLevel: '', status: '' })
    setCurrentPage(1)
  }, [])

  return {
    filters,
    sort,
    currentPage: safeCurrentPage,
    totalPages,
    totalFiltered: sorted.length,
    paginated,
    toggleSort,
    updateFilter,
    resetFilters,
    setCurrentPage,
  }
}
