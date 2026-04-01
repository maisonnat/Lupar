import type { SurgeAlert as SurgeAlertType } from '@options/utils/risk-calculator'
import { useDateConfig } from '@options/hooks/useDateConfig'
import { formatDate } from '@shared/utils/date-utils'

interface SurgeAlertProps {
  alert: SurgeAlertType
}

const SURGE_LEVEL_CONFIG = {
  none: {
    label: 'Sin actividad sospechosa',
    color: 'text-green-700',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
  },
  low: {
    label: 'Actividad Elevada',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
  medium: {
    label: 'Alerta de Surge',
    color: 'text-orange-700',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
  high: {
    label: 'SURGE CRÍTICO',
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
  },
}

export default function SurgeAlert({ alert }: SurgeAlertProps) {
  const { dateFormat, timezone } = useDateConfig()

  const config = SURGE_LEVEL_CONFIG[alert.level]

  if (!alert.isActive) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <h2 className="text-sm font-medium text-gray-700 mb-3">Detección de Surge</h2>
        <div className={`flex items-center gap-2 px-3 py-2 rounded-md ${config.bgColor} ${config.borderColor} border`}>
          <span className={config.color}>{config.icon}</span>
          <span className={`text-sm ${config.color}`}>{config.label}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium text-gray-700">Detección de Surge</h2>
        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md ${config.bgColor} ${config.borderColor} border`}>
          <span className={config.color}>{config.icon}</span>
          <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-gray-50 rounded-md p-3 text-center">
          <p className="text-lg font-semibold text-gray-900">{alert.recentCount}</p>
          <p className="text-xs text-gray-500">Últimos {alert.recentDays} días</p>
        </div>
        <div className="bg-gray-50 rounded-md p-3 text-center">
          <p className="text-lg font-semibold text-gray-900">{alert.averageCount}</p>
          <p className="text-xs text-gray-500">Promedio histórico</p>
        </div>
        <div className="bg-gray-50 rounded-md p-3 text-center">
          <p className="text-lg font-semibold text-gray-900">{alert.threshold}</p>
          <p className="text-xs text-gray-500">Umbral</p>
        </div>
      </div>

      {alert.newTools.length > 0 && (
        <div>
          <h3 className="text-xs font-medium text-gray-500 mb-2">Nuevas herramientas detectadas</h3>
          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {alert.newTools.map((tool, idx) => (
              <div key={`${tool.domain}-${idx}`} className="flex items-center justify-between py-1.5 px-2 bg-gray-50 rounded text-xs">
                <span className="font-medium text-gray-700 truncate">{tool.toolName}</span>
                <span className="text-gray-400 shrink-0 ml-2">{formatDate(tool.firstSeen, dateFormat, timezone)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}