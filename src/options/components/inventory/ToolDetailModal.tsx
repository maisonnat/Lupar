import { useState } from 'react'
import type { ReactNode } from 'react'
import type { DiscoveryRecord, DiscoveryStatus, ComplianceStatusMap } from '@shared/types/discovery'
import type { RiskLevel } from '@shared/types/domain'
import type { AppSettings } from '@shared/types/storage'
import type { RegulationType, AssessmentStatus, ComplianceChecklist } from '@shared/types/compliance'
import { CATEGORY_LABELS } from '@shared/constants/categories'
import { RISK_LEVEL_LABELS, DISCOVERY_STATUS_LABELS } from '@shared/constants/risk-levels'
import { calculateDueDate } from '@shared/utils/risk-calculator'
import { REGULATIONS } from '@shared/constants/regulations'
import { createAuditEntries, appendAuditEntries, AUDIT_FIELD_LABELS } from '@options/utils/audit-trail'
import { useAuditTrail } from '@options/hooks/useAuditTrail'
import { useDateConfig } from '@options/hooks/useDateConfig'
import { formatDate, formatDateTime } from '@shared/utils/date-utils'

const DEPARTMENTS = [
  'Ventas',
  'IT',
  'RRHH',
  'Finanzas',
  'Legal',
  'Marketing',
  'Operaciones',
  'Otro',
]

const riskOptions: RiskLevel[] = ['prohibited', 'high', 'limited', 'minimal']
const statusOptions: DiscoveryStatus[] = ['detected', 'confirmed', 'dismissed', 'authorized']

type ModalTab = 'info' | 'compliance' | 'notes' | 'history' | 'timeline'

interface ToolDetailModalProps {
  discovery: DiscoveryRecord
  onSave: (updated: DiscoveryRecord) => void
  onClose: () => void
  settings: AppSettings
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 mb-2">{title}</h3>
      {children}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1.5 border-b border-gray-100">
      <span className="text-gray-500 text-sm">{label}</span>
      <span className="text-sm text-gray-900">{value}</span>
    </div>
  )
}

function formatTimestamp(iso: string): string {
  return formatDateTime(iso, 'DD/MM/YYYY', 'America/Argentina/Buenos_Aires')
}

export default function ToolDetailModal({ discovery, onSave, onClose, settings }: ToolDetailModalProps) {
  const [activeTab, setActiveTab] = useState<ModalTab>('info')
  const [riskLevel, setRiskLevel] = useState<RiskLevel>(
    discovery.userRiskLevel ?? discovery.defaultRiskLevel,
  )
  const [status, setStatus] = useState<DiscoveryStatus>(discovery.status)
  const [department, setDepartment] = useState<string>(discovery.department ?? '')
  const [notes, setNotes] = useState<string>(discovery.notes)
  const [customDept, setCustomDept] = useState(!DEPARTMENTS.includes(discovery.department ?? '') && !!discovery.department)
  const [complianceStatus, setComplianceStatus] = useState<ComplianceStatusMap>(discovery.complianceStatus)
  const [saveError, setSaveError] = useState<string | null>(null)

  const isAuditMode = settings.auditModeConfig?.auditMode ?? false
  const disabledClass = isAuditMode ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''
  const { timezone: tz, dateFormat: df } = useDateConfig()

  const { entries: auditEntries, hasEntries } = useAuditTrail(discovery.auditTrail)

  function handleSave() {
    if (settings.requireDepartment && !department.trim()) {
      setSaveError('El departamento es obligatorio. Asigne un departamento antes de guardar.')
      return
    }
    setSaveError(null)

    const updatedDiscovery: DiscoveryRecord = {
      ...discovery,
      userRiskLevel: riskLevel === discovery.defaultRiskLevel ? null : riskLevel,
      status,
      department: department || null,
      notes,
      complianceStatus,
    }

    const newEntries = createAuditEntries(
      discovery,
      updatedDiscovery,
      settings.adminProfile?.adminName || null,
    )
    const mergedTrail = appendAuditEntries(discovery.auditTrail, newEntries)

    onSave({
      ...updatedDiscovery,
      auditTrail: mergedTrail,
    })
  }

  function handleStatusChange(newStatus: DiscoveryStatus) {
    setStatus(newStatus)
  }

  function handleAssessmentChange(regKey: RegulationType, articleId: string, newAssessment: AssessmentStatus) {
    const prevChecklist = complianceStatus[regKey][articleId]
    let updatedChecklist: ComplianceChecklist

    if (newAssessment === 'complete') {
      updatedChecklist = {
        ...prevChecklist,
        assessment: 'complete',
        lastAssessedDate: new Date().toISOString(),
        dueDate: calculateDueDate(regKey, settings),
        notes: prevChecklist.notes,
      }
    } else if (newAssessment === 'not_applicable') {
      updatedChecklist = {
        ...prevChecklist,
        assessment: 'not_applicable',
        lastAssessedDate: new Date().toISOString(),
        dueDate: null,
        notes: prevChecklist.notes,
      }
    } else if (newAssessment === 'pending') {
      updatedChecklist = {
        ...prevChecklist,
        assessment: 'pending',
        lastAssessedDate: null,
        dueDate: calculateDueDate(regKey, settings),
        notes: prevChecklist.notes,
      }
    } else {
      return
    }

    setComplianceStatus(prev => ({
      ...prev,
      [regKey]: {
        ...prev[regKey],
        [articleId]: updatedChecklist,
      },
    }))
  }

  const tabs: { key: ModalTab; label: string }[] = [
    { key: 'info', label: 'Información' },
    { key: 'compliance', label: 'Compliance' },
    { key: 'notes', label: 'Notas' },
    { key: 'history', label: 'Historial' },
    { key: 'timeline', label: 'Timeline' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        data-testid="modal-overlay"
      />
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[85vh] overflow-hidden mx-4">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{discovery.toolName}</h2>
            <p className="text-sm text-gray-400">{discovery.domain}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
            data-testid="modal-close"
          >
            ×
          </button>
        </div>

        <div className="flex border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-4 overflow-y-auto max-h-[50vh]">
          {activeTab === 'info' && (
            <div className="space-y-4">
              <Section title="Datos Generales">
                <InfoRow label="Categoría" value={CATEGORY_LABELS[discovery.category]} />
                <InfoRow label="Riesgo por defecto" value={RISK_LEVEL_LABELS[discovery.defaultRiskLevel]} />
                <InfoRow label="Primera detección" value={formatDate(discovery.firstSeen, df, tz)} />
                <InfoRow label="Última visita" value={formatDate(discovery.lastSeen, df, tz)} />
                <InfoRow label="Visitas" value={String(discovery.visitCount)} />
              </Section>

              <Section title="Clasificación de Riesgo">
                <div className={`flex gap-2 flex-wrap ${disabledClass}`}>
                  {riskOptions.map((risk) => (
                    <button
                      key={risk}
                      onClick={() => !isAuditMode && setRiskLevel(risk)}
                      disabled={isAuditMode}
                      className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                        riskLevel === risk
                          ? 'bg-blue-50 border-blue-400 text-blue-700 font-medium'
                          : 'border-gray-300 text-gray-600 hover:border-gray-400'
                      }`}
                    >
                      {RISK_LEVEL_LABELS[risk]}
                    </button>
                  ))}
                </div>
              </Section>

              <Section title="Estado">
                <div className={`flex gap-2 flex-wrap ${disabledClass}`}>
                  {statusOptions.map((s) => (
                    <button
                      key={s}
                      onClick={() => !isAuditMode && handleStatusChange(s)}
                      disabled={isAuditMode}
                      className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                        status === s
                          ? 'bg-blue-50 border-blue-400 text-blue-700 font-medium'
                          : 'border-gray-300 text-gray-600 hover:border-gray-400'
                      }`}
                    >
                      {DISCOVERY_STATUS_LABELS[s]}
                    </button>
                  ))}
                </div>
              </Section>

              <Section title="Departamento">
                <div className={`space-y-2 ${disabledClass}`}>
                  <select
                    value={customDept ? 'Otro' : (department || '')}
                    onChange={(e) => {
                      if (isAuditMode) return
                      if (e.target.value === 'Otro') {
                        setCustomDept(true)
                        setDepartment('')
                      } else {
                        setCustomDept(false)
                        setDepartment(e.target.value)
                      }
                      setSaveError(null)
                    }}
                    disabled={isAuditMode}
                    className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                  >
                    <option value="">Sin asignar</option>
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                  {customDept && (
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      disabled={isAuditMode}
                      placeholder="Nombre del departamento..."
                      className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                      onInput={() => setSaveError(null)}
                    />
                  )}
                </div>
              </Section>
            </div>
          )}

          {activeTab === 'compliance' && (
            <div className="space-y-3">
              {(['euAiAct', 'iso42001', 'coSb205'] as const).map((regKey) => {
                const regConfig = settings.regulationConfig?.[regKey]
                const isRegulationEnabled = regConfig?.enabled ?? true
                const regInfo = REGULATIONS[regKey]
                const articleMap = complianceStatus[regKey]

                if (!isRegulationEnabled) {
                  return null
                }

                return (
                  <div key={regKey} className="border border-gray-200 rounded-lg p-3">
                    <div className="text-sm font-medium text-gray-900 mb-2">{regInfo.shortName}</div>
                    <div className="space-y-2">
                      {regInfo.articles.map((article) => {
                        const cs = articleMap[article.id]
                        if (!cs) return null
                        const assessmentLabels: Record<string, string> = {
                          complete: 'Completo',
                          pending: 'Pendiente',
                          not_applicable: 'No aplica',
                          overdue: 'Vencido',
                        }
                        const assessmentColors: Record<string, string> = {
                          complete: 'bg-green-100 text-green-800',
                          pending: 'bg-yellow-100 text-yellow-800',
                          not_applicable: 'bg-gray-100 text-gray-600',
                          overdue: 'bg-red-100 text-red-800',
                        }
                        const editableOptions: AssessmentStatus[] = ['pending', 'complete', 'not_applicable']

                        return (
                          <div key={article.id} className="flex items-center justify-between py-1">
                            <div>
                              <div className="text-xs text-gray-700">{article.title}</div>
                              <div className="text-xs text-gray-400">
                                {cs.lastAssessedDate && (
                                  <span>Evaluado: {formatDate(cs.lastAssessedDate, df, tz)}</span>
                                )}
                                {cs.dueDate && (
                                  <span> · Vencimiento: {formatDate(cs.dueDate, df, tz)}</span>
                                )}
                              </div>
                            </div>
                            {cs.assessment === 'overdue' ? (
                              <span className={`text-xs px-2 py-0.5 rounded-full ${assessmentColors[cs.assessment]}`}>
                                {assessmentLabels[cs.assessment]}
                              </span>
                            ) : (
                              <select
                                value={cs.assessment}
                                onChange={(e) => !isAuditMode && handleAssessmentChange(regKey, article.id, e.target.value as AssessmentStatus)}
                                disabled={isAuditMode}
                                className="text-xs px-2 py-0.5 rounded-full border border-gray-300 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
                              >
                                {editableOptions.map((opt) => (
                                  <option key={opt} value={opt}>{assessmentLabels[opt]}</option>
                                ))}
                              </select>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {activeTab === 'notes' && (
            <div className={disabledClass}>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={isAuditMode}
                placeholder="Agregar notas sobre esta herramienta..."
                rows={6}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none disabled:bg-gray-50"
              />
            </div>
          )}

          {activeTab === 'history' && (
            <div>
              {!hasEntries ? (
                <div className="text-center py-8 text-gray-400" data-testid="audit-empty">
                  <svg className="mx-auto mb-3 text-gray-300" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  <p className="text-sm">No hay registros de cambios</p>
                  <p className="text-xs mt-1">Los cambios realizados en esta herramienta aparecerán aquí.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {auditEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="border border-gray-100 rounded-lg p-3 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                              {AUDIT_FIELD_LABELS[entry.field]}
                            </span>
                          </div>
                          <div className="text-sm text-gray-900">
                            <span className="line-through text-gray-400">{entry.oldValue}</span>
                            <span className="mx-2 text-gray-300">→</span>
                            <span className="font-medium">{entry.newValue}</span>
                          </div>
                        </div>
                        <div className="text-xs text-gray-400 whitespace-nowrap mt-0.5">
                          {formatTimestamp(entry.timestamp)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'timeline' && (
            <div>
              {!discovery.detectionEvents || discovery.detectionEvents.length === 0 ? (
                <div className="text-center py-8 text-gray-400" data-testid="timeline-empty">
                  <svg className="mx-auto mb-3 text-gray-300" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 8v4l3 3" />
                    <circle cx="12" cy="12" r="10" />
                  </svg>
                  <p className="text-sm">No hay eventos de detección</p>
                  <p className="text-xs mt-1">Las visitas a esta herramienta aparecerán aquí.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {[...discovery.detectionEvents].reverse().map((event) => {
                    const typeLabels: Record<string, string> = {
                      first_seen: 'Primera detección',
                      visit: 'Visita',
                      status_change: 'Cambio de estado',
                      risk_change: 'Cambio de riesgo',
                    }
                    const typeColors: Record<string, string> = {
                      first_seen: 'bg-green-100 text-green-800',
                      visit: 'bg-blue-100 text-blue-800',
                      status_change: 'bg-purple-100 text-purple-800',
                      risk_change: 'bg-orange-100 text-orange-800',
                    }
                    return (
                      <div
                        key={event.id}
                        className="border border-gray-100 rounded-lg p-3 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${typeColors[event.type]}`}>
                                {typeLabels[event.type]}
                              </span>
                              <span className="text-xs text-gray-500">
                                #{event.visitCount}
                              </span>
                            </div>
                            <div className="text-sm text-gray-900">{event.details}</div>
                          </div>
                          <div className="text-xs text-gray-400 whitespace-nowrap mt-0.5">
                            {formatTimestamp(event.timestamp)}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 p-4 border-t border-gray-200">
          <div>
            {saveError && (
              <p className="text-sm text-red-600" data-testid="modal-save-error">
                {saveError}
              </p>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancelar
            </button>
            {!isAuditMode && (
              <button
                onClick={handleSave}
                className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700"
                data-testid="modal-save"
              >
                Guardar cambios
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
