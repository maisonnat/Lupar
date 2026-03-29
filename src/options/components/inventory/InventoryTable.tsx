import type { DiscoveryRecord } from '@shared/types/discovery'
import type { SortField, SortConfig } from '@options/hooks/useInventory'
import ToolRow from './ToolRow'

interface InventoryTableProps {
  discoveries: DiscoveryRecord[]
  sort: SortConfig
  onSort: (field: SortField) => void
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  onRowClick: (discovery: DiscoveryRecord) => void
}

interface ColumnDef {
  field: SortField
  label: string
  className?: string
}

const columns: ColumnDef[] = [
  { field: 'toolName', label: 'Herramienta' },
  { field: 'category', label: 'Categoría' },
  { field: 'riskLevel', label: 'Riesgo' },
  { field: 'status', label: 'Estado' },
  { field: 'visitCount', label: 'Visitas', className: 'text-right' },
  { field: 'lastSeen', label: 'Última vez' },
]

function SortIndicator({ field, sort }: { field: SortField; sort: SortConfig }) {
  if (sort.field !== field) return <span className="text-gray-300 ml-1">↕</span>
  return <span className="text-blue-600 ml-1">{sort.direction === 'asc' ? '↑' : '↓'}</span>
}

export default function InventoryTable({
  discoveries,
  sort,
  onSort,
  currentPage,
  totalPages,
  onPageChange,
  onRowClick,
}: InventoryTableProps) {
  if (discoveries.length === 0) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-gray-500">
              {columns.map((col) => (
                <th key={col.field} className={`px-4 py-3 font-medium ${col.className ?? ''}`}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                No se han detectado herramientas de IA todavía.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-gray-500">
              {columns.map((col) => (
                <th
                  key={col.field}
                  className={`px-4 py-3 font-medium cursor-pointer select-none hover:text-gray-700 transition-colors ${col.className ?? ''}`}
                  onClick={() => onSort(col.field)}
                >
                  {col.label}
                  <SortIndicator field={col.field} sort={sort} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {discoveries.map((d) => (
              <ToolRow key={d.id} discovery={d} onClick={onRowClick} />
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="text-sm px-3 py-1 rounded border border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Anterior
          </button>
          <span className="text-sm text-gray-500">
            Página {currentPage} de {totalPages}
          </span>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="text-sm px-3 py-1 rounded border border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  )
}
