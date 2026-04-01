import type { MaturityMetrics } from '@shared/utils/risk-calculator'

interface MaturityWidgetProps {
  metrics: MaturityMetrics
}

const TREND_CONFIG = {
  improving: {
    label: 'Mejorando',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
      </svg>
    ),
  },
  stable: {
    label: 'Estable',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    ),
  },
  declining: {
    label: 'Declinando',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" /><polyline points="17 18 23 18 23 12" />
      </svg>
    ),
  },
  unknown: {
    label: 'Sin datos',
    color: 'text-gray-500',
    bgColor: 'bg-gray-50',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    ),
  },
}

function getTrendLabel(days: number | null): string {
  if (days === null) return '-'
  if (days <= 7) return '< 1 semana'
  if (days <= 30) return '< 1 mes'
  if (days <= 90) return '< 3 meses'
  return `${days} días`
}

export default function MaturityWidget({ metrics }: MaturityWidgetProps) {
  const trend = TREND_CONFIG[metrics.trend]

  if (metrics.totalArticles === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <h2 className="text-sm font-medium text-gray-700 mb-3">Métricas de Madurez</h2>
        <p className="text-sm text-gray-500">No hay artículos de compliance para evaluar.</p>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5">
      <h2 className="text-sm font-medium text-gray-700 mb-4">Métricas de Madurez</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="text-center">
          <p className="text-3xl font-bold text-gray-900">{metrics.coveragePercent}%</p>
          <p className="text-xs text-gray-500 mt-1">Cobertura</p>
        </div>

        <div className="text-center">
          <p className="text-3xl font-bold text-gray-900">{getTrendLabel(metrics.averageAssessmentDays)}</p>
          <p className="text-xs text-gray-500 mt-1">Tiempo promedio</p>
        </div>

        <div className="text-center">
          <p className="text-3xl font-bold text-gray-900">{metrics.recentAssessments}</p>
          <p className="text-xs text-gray-500 mt-1">Evaluaciones (7d)</p>
        </div>

        <div className="text-center">
          <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md ${trend.bgColor}`}>
            <span className={trend.color}>{trend.icon}</span>
            <span className={`text-sm font-medium ${trend.color}`}>{trend.label}</span>
          </div>
          {metrics.trend !== 'unknown' && (
            <p className="text-xs text-gray-500 mt-1">
              {metrics.trendDelta > 0 ? '+' : ''}{metrics.trendDelta}% vs período anterior
            </p>
          )}
        </div>
      </div>

      <div className="border-t border-gray-100 pt-3">
        <p className="text-xs text-gray-500 mb-2">Estado de artículos ({metrics.totalArticles} total)</p>
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
            {metrics.assessedArticles} completados
          </span>
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
            {metrics.pendingArticles} pendientes
          </span>
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
            {metrics.overdueArticles} vencidos
          </span>
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
            {metrics.notApplicableArticles} N/A
          </span>
        </div>
      </div>
    </div>
  )
}