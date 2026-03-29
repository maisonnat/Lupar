import type { RegulationType } from '@shared/types/compliance'
import { REGULATIONS } from '@shared/constants/regulations'

interface ComplianceSummary {
  complete: number
  pending: number
  overdue: number
  total: number
}

interface ComplianceStatusProps {
  complianceSummary: Record<RegulationType, ComplianceSummary>
}

function getStatusInfo(summary: ComplianceSummary): { label: string; color: string; pct: number } {
  if (summary.total === 0) {
    return { label: 'Sin datos', color: 'bg-gray-100 text-gray-500', pct: 0 }
  }
  if (summary.overdue > 0) {
    return { label: 'Vencido', color: 'bg-red-100 text-red-700', pct: Math.round((summary.complete / summary.total) * 100) }
  }
  if (summary.pending > 0) {
    return { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-700', pct: Math.round((summary.complete / summary.total) * 100) }
  }
  return { label: 'Completo', color: 'bg-green-100 text-green-700', pct: 100 }
}

export default function ComplianceStatus({ complianceSummary }: ComplianceStatusProps) {
  const regulationKeys: RegulationType[] = ['euAiAct', 'iso42001', 'coSb205']

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5">
      <h2 className="text-sm font-medium text-gray-700 mb-4">Cumplimiento</h2>
      <div className="space-y-3">
        {regulationKeys.map((key) => {
          const regulation = REGULATIONS[key]
          const summary = complianceSummary[key]
          const status = getStatusInfo(summary)

          return (
            <div key={key} className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-700">{regulation.shortName}</p>
                {summary.total > 0 && (
                  <p className="text-xs text-gray-400">{summary.complete}/{summary.total} evaluadas</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {summary.total > 0 && (
                  <span className="text-xs text-gray-400">{status.pct}%</span>
                )}
                <span className={`text-xs px-2 py-0.5 rounded font-medium ${status.color}`}>
                  {status.label}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
