import type { AuditModeConfig } from '@shared/types/storage'
import { formatDateTimeLong } from '@shared/utils/date-utils'

interface AuditBannerProps {
  auditModeConfig: AuditModeConfig
  timezone: string
}

export default function AuditBanner({ auditModeConfig, timezone }: AuditBannerProps) {
  if (!auditModeConfig.auditMode) return null

  const activatedAt = auditModeConfig.auditModeActivatedAt
    ? formatDateTimeLong(auditModeConfig.auditModeActivatedAt, timezone)
    : null

  const activatedBy = auditModeConfig.auditModeActivatedBy

  return (
    <div
      className="bg-amber-50 border-b border-amber-300 px-6 py-2.5 flex items-center justify-between"
      data-testid="audit-banner"
    >
      <div className="flex items-center gap-3">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#b45309"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="shrink-0"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
        <div>
          <span className="text-sm font-semibold text-amber-900">
            MODO AUDITOR ACTIVO
          </span>
          <span className="text-sm text-amber-700 ml-2">
            — Todos los datos están en solo lectura
          </span>
        </div>
      </div>
      <div className="text-xs text-amber-600">
        {activatedAt && <span>Activado: {activatedAt}</span>}
        {activatedBy && activatedAt && <span> · </span>}
        {activatedBy && <span>Por: {activatedBy}</span>}
      </div>
    </div>
  )
}
