import type { ActivityLogEntry } from '@shared/types/storage'
import { useDateConfig } from '@options/hooks/useDateConfig'
import { formatDateShort } from '@shared/utils/date-utils'

interface RecentActivityProps {
  activities: ActivityLogEntry[]
}

const eventTypeLabels: Record<string, string> = {
  new_detection: 'Nueva detección',
  risk_classified: 'Riesgo clasificado',
  status_changed: 'Estado cambiado',
  assessment_completed: 'Evaluación completada',
  report_generated: 'Reporte generado',
  settings_updated: 'Configuración actualizada',
}

function formatTimestamp(iso: string, timezone: string): string {
  const date = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)

  if (diffMin < 1) return 'Ahora'
  if (diffMin < 60) return `Hace ${diffMin} min`
  const diffHours = Math.floor(diffMin / 60)
  if (diffHours < 24) return `Hace ${diffHours}h`
  return formatDateShort(iso, timezone)
}

export default function RecentActivity({ activities }: RecentActivityProps) {
  const { timezone } = useDateConfig()
  if (activities.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <h2 className="text-sm font-medium text-gray-700 mb-4">Actividad Reciente</h2>
        <p className="text-sm text-gray-400">Sin actividad registrada</p>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5">
      <h2 className="text-sm font-medium text-gray-700 mb-4">Actividad Reciente</h2>
      <div className="space-y-3">
        {activities.map((entry) => (
          <div key={entry.id} className="flex items-start gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm text-gray-700 truncate">{entry.details}</p>
                <span className="text-xs text-gray-400 shrink-0">{formatTimestamp(entry.timestamp, timezone)}</span>
              </div>
              <p className="text-xs text-gray-400">{eventTypeLabels[entry.eventType] ?? entry.eventType}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
