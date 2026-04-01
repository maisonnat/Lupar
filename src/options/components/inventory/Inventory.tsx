import { useState } from 'react'
import type { DiscoveryRecord } from '@shared/types/discovery'
import { useStorage } from '@options/hooks/useStorage'
import { useInventory } from '@options/hooks/useInventory'
import { STORAGE_KEYS } from '@shared/types/storage'
import FilterBar from './FilterBar'
import InventoryTable from './InventoryTable'
import ToolDetailModal from './ToolDetailModal'

export default function Inventory() {
  const { discoveries, settings } = useStorage()
  const inventory = useInventory(discoveries)
  const [selectedTool, setSelectedTool] = useState<DiscoveryRecord | null>(null)

  async function handleSave(updated: DiscoveryRecord) {
    const updatedDiscoveries = discoveries.map((d) =>
      d.id === updated.id ? updated : d,
    )
    await chrome.storage.local.set({ [STORAGE_KEYS.AI_DISCOVERIES]: updatedDiscoveries })
    setSelectedTool(null)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Inventario de IA</h1>
        <span className="text-sm text-gray-400">
          {discoveries.length} herramienta{discoveries.length !== 1 ? 's' : ''} detectada{discoveries.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg">
        <FilterBar
          filters={inventory.filters}
          onFilterChange={inventory.updateFilter}
          onReset={inventory.resetFilters}
          resultCount={inventory.totalFiltered}
        />

        <InventoryTable
          discoveries={inventory.paginated}
          sort={inventory.sort}
          onSort={inventory.toggleSort}
          currentPage={inventory.currentPage}
          totalPages={inventory.totalPages}
          onPageChange={inventory.setCurrentPage}
          onRowClick={setSelectedTool}
        />
      </div>

      {selectedTool && settings && (
        <ToolDetailModal
          discovery={selectedTool}
          onSave={handleSave}
          onClose={() => setSelectedTool(null)}
          settings={settings}
        />
      )}
    </div>
  )
}
