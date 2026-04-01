import type { UpcomingDeadline, DeadlineUrgency } from '@options/utils/risk-calculator'
import { useDateConfig } from '@options/hooks/useDateConfig'
import { formatDate } from '@shared/utils/date-utils'
import { RISK_LEVEL_LABELS } from '@shared/constants/risk-levels'

interface UpcomingDeadlinesProps {
  deadlines: UpcomingDeadline[]
}

interface UrgencyGroup {
  urgency: DeadlineUrgency
  label: string
  color: string
  bgColor: string
  borderColor: string
  icon: React.ReactNode
}

const URGENCY_CONFIG: Record<DeadlineUrgency, Omit<UrgencyGroup, 'urgency'>> = {
  overdue: {
    label: 'Vencidos',
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
  },
  this_week: {
    label: 'Esta semana',
    color: 'text-orange-700',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  this_month: {
    label: 'Este mes',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  upcoming: {
    label: 'Próximos',
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 12 12" />
      </svg>
    ),
  },
}

const URGENCY_ORDER: DeadlineUrgency[] = ['overdue', 'this_week', 'this_month', 'upcoming']

function formatDaysLabel(days: number): string {
  if (days < 0) return `Vencido hace ${Math.abs(days)}d`
  if (days === 0) return 'Vence hoy'
  if (days === 1) return 'Vence mañana'
  return `En ${days} días`
}

function groupByUrgency(deadlines: UpcomingDeadline[]): UrgencyGroup[] {
  const groups = new Map<DeadlineUrgency, UpcomingDeadline[]>()

  for (const d of deadlines) {
    const existing = groups.get(d.urgency) ?? []
    existing.push(d)
    groups.set(d.urgency, existing)
  }

  return URGENCY_ORDER.filter((u) => groups.has(u)).map((urgency) => ({
    urgency,
    ...URGENCY_CONFIG[urgency],
  }))
}

function DeadlineRow({ deadline, dateFormat, timezone }: {
  deadline: UpcomingDeadline
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD'
  timezone: string
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2 px-3 rounded-md hover:bg-gray-50 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-sm font-medium text-gray-900 truncate">{deadline.toolName}</span>
          <span className="text-xs text-gray-400 shrink-0">{deadline.regulationLabel}</span>
        </div>
        <p className="text-xs text-gray-500 truncate">{deadline.articleTitle}</p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
          deadline.riskLevel === 'prohibited' ? 'bg-red-100 text-red-700' :
          deadline.riskLevel === 'high' ? 'bg-orange-100 text-orange-700' :
          deadline.riskLevel === 'limited' ? 'bg-yellow-100 text-yellow-700' :
          'bg-green-100 text-green-700'
        }`}>
          {RISK_LEVEL_LABELS[deadline.riskLevel]}
        </span>
        <div className="text-right">
          <p className="text-xs text-gray-600">{formatDate(deadline.dueDate, dateFormat, timezone)}</p>
          <p className={`text-xs font-medium ${deadline.urgency === 'overdue' ? 'text-red-600' : 'text-gray-500'}`}>
            {formatDaysLabel(deadline.daysRemaining)}
          </p>
        </div>
      </div>
    </div>
  )
}

export default function UpcomingDeadlines({ deadlines }: UpcomingDeadlinesProps) {
  const { dateFormat, timezone } = useDateConfig()

  if (deadlines.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <h2 className="text-sm font-medium text-gray-700 mb-4">Próximos Vencimientos</h2>
        <p className="text-sm text-gray-400">Sin vencimientos próximos</p>
      </div>
    )
  }

  const groups = groupByUrgency(deadlines)

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-gray-700">Próximos Vencimientos</h2>
        <span className="text-xs text-gray-400">{deadlines.length} pendiente{deadlines.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="space-y-4">
        {groups.map((group) => {
          const groupDeadlines = deadlines.filter((d) => d.urgency === group.urgency)
          return (
            <div key={group.urgency}>
              <div className={`flex items-center gap-1.5 mb-2 px-3 py-1.5 rounded-md ${group.bgColor} ${group.borderColor} border`}>
                <span className={group.color}>{group.icon}</span>
                <span className={`text-xs font-medium ${group.color}`}>
                  {group.label}
                </span>
                <span className={`text-xs ${group.color} opacity-70`}>
                  ({groupDeadlines.length})
                </span>
              </div>
              <div className="space-y-0.5">
                {groupDeadlines.map((deadline) => (
                  <DeadlineRow
                    key={`${deadline.toolId}-${deadline.regulationKey}-${deadline.articleId}`}
                    deadline={deadline}
                    dateFormat={dateFormat}
                    timezone={timezone}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
