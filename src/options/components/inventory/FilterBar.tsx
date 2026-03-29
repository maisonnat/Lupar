import type { InventoryFilters } from '@options/hooks/useInventory'
import type { AICategory, RiskLevel } from '@shared/types/domain'
import type { DiscoveryStatus } from '@shared/types/discovery'
import { CATEGORY_LABELS } from '@shared/constants/categories'
import { RISK_LEVEL_LABELS, DISCOVERY_STATUS_LABELS } from '@shared/constants/risk-levels'

interface FilterBarProps {
  filters: InventoryFilters
  onFilterChange: <K extends keyof InventoryFilters>(
    key: K,
    value: InventoryFilters[K],
  ) => void
  onReset: () => void
  resultCount: number
}

const categoryEntries = Object.entries(CATEGORY_LABELS) as [AICategory, string][]
const riskEntries = Object.entries(RISK_LEVEL_LABELS) as [RiskLevel, string][]
const statusEntries = Object.entries(DISCOVERY_STATUS_LABELS) as [DiscoveryStatus, string][]

export default function FilterBar({ filters, onFilterChange, onReset, resultCount }: FilterBarProps) {
  const hasFilters = filters.searchText || filters.category || filters.riskLevel || filters.status

  return (
    <div className="border-b border-gray-200 p-4">
      <div className="flex items-center gap-3 flex-wrap">
        <input
          type="text"
          placeholder="Buscar herramientas..."
          value={filters.searchText}
          onChange={(e) => onFilterChange('searchText', e.target.value)}
          className="flex-1 min-w-[200px] border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />

        <select
          value={filters.category}
          onChange={(e) => onFilterChange('category', e.target.value as AICategory | '')}
          className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Categoría</option>
          {categoryEntries.map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>

        <select
          value={filters.riskLevel}
          onChange={(e) => onFilterChange('riskLevel', e.target.value as RiskLevel | '')}
          className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Riesgo</option>
          {riskEntries.map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>

        <select
          value={filters.status}
          onChange={(e) => onFilterChange('status', e.target.value as DiscoveryStatus | '')}
          className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Estado</option>
          {statusEntries.map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>

        {hasFilters && (
          <button
            onClick={onReset}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      <div className="mt-2 text-xs text-gray-400">
        {resultCount} resultado{resultCount !== 1 ? 's' : ''}
      </div>
    </div>
  )
}
