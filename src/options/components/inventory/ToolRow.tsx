import type { DiscoveryRecord } from '@shared/types/discovery'
import type { RiskLevel } from '@shared/types/domain'
import { CATEGORY_LABELS } from '@shared/constants/categories'
import { RISK_LEVEL_LABELS, RISK_LEVEL_COLORS, DISCOVERY_STATUS_LABELS } from '@shared/constants/risk-levels'
import { useDateConfig } from '@options/hooks/useDateConfig'
import { formatDateShort } from '@shared/utils/date-utils'

const statusColors: Record<DiscoveryRecord['status'], string> = {
  detected: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  dismissed: 'bg-gray-100 text-gray-600',
  authorized: 'bg-green-100 text-green-800',
}

const riskBgClasses: Record<RiskLevel, string> = {
  prohibited: 'bg-red-100 text-red-800',
  high: 'bg-orange-100 text-orange-800',
  limited: 'bg-yellow-100 text-yellow-800',
  minimal: 'bg-green-100 text-green-800',
}

function formatRelativeTime(isoString: string, timezone: string): string {
  const date = new Date(isoString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMin / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMin < 1) return 'Ahora'
  if (diffMin < 60) return `Hace ${diffMin} min`
  if (diffHours < 24) return `Hace ${diffHours}h`
  if (diffDays < 30) return `Hace ${diffDays}d`
  return formatDateShort(isoString, timezone)
}

interface ToolRowProps {
  discovery: DiscoveryRecord
  onClick: (discovery: DiscoveryRecord) => void
}

export default function ToolRow({ discovery, onClick }: ToolRowProps) {
  const effectiveRisk: RiskLevel = discovery.userRiskLevel ?? discovery.defaultRiskLevel
  const { timezone } = useDateConfig()

  return (
    <tr
      className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
      onClick={() => onClick(discovery)}
      data-testid={`tool-row-${discovery.id}`}
    >
      <td className="px-4 py-3">
        <div>
          <div className="font-medium text-gray-900">{discovery.toolName}</div>
          <div className="text-xs text-gray-400">{discovery.domain}</div>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
          {CATEGORY_LABELS[discovery.category]}
        </span>
      </td>
      <td className="px-4 py-3">
        <span
          className={`inline-block text-xs px-2 py-0.5 rounded-full ${riskBgClasses[effectiveRisk]}`}
          style={{ borderLeft: `3px solid ${RISK_LEVEL_COLORS[effectiveRisk]}` }}
        >
          {RISK_LEVEL_LABELS[effectiveRisk]}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className={`inline-block text-xs px-2 py-0.5 rounded-full ${statusColors[discovery.status]}`}>
          {DISCOVERY_STATUS_LABELS[discovery.status]}
        </span>
      </td>
      <td className="px-4 py-3 text-gray-600 tabular-nums">
        {discovery.visitCount}
      </td>
      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
        {formatRelativeTime(discovery.lastSeen, timezone)}
      </td>
    </tr>
  )
}
