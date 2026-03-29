import { useState } from 'react'
import type { ReactNode } from 'react'
import type { DiscoveryRecord, DiscoveryStatus } from '@shared/types/discovery'
import type { RiskLevel } from '@shared/types/domain'
import { CATEGORY_LABELS } from '@shared/constants/categories'
import { RISK_LEVEL_LABELS, DISCOVERY_STATUS_LABELS } from '@shared/constants/risk-levels'

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

type ModalTab = 'info' | 'compliance' | 'notes'

interface ToolDetailModalProps {
  discovery: DiscoveryRecord
  onSave: (updated: DiscoveryRecord) => void
  onClose: () => void
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

export default function ToolDetailModal({ discovery, onSave, onClose }: ToolDetailModalProps) {
  const [activeTab, setActiveTab] = useState<ModalTab>('info')
  const [riskLevel, setRiskLevel] = useState<RiskLevel>(
    discovery.userRiskLevel ?? discovery.defaultRiskLevel,
  )
  const [status, setStatus] = useState<DiscoveryStatus>(discovery.status)
  const [department, setDepartment] = useState<string>(discovery.department ?? '')
  const [notes, setNotes] = useState<string>(discovery.notes)
  const [customDept, setCustomDept] = useState(!DEPARTMENTS.includes(discovery.department ?? '') && !!discovery.department)

  function handleSave() {
    onSave({
      ...discovery,
      userRiskLevel: riskLevel === discovery.defaultRiskLevel ? null : riskLevel,
      status,
      department: department || null,
      notes,
    })
  }

  function handleStatusChange(newStatus: DiscoveryStatus) {
    setStatus(newStatus)
  }

  const tabs: { key: ModalTab; label: string }[] = [
    { key: 'info', label: 'Información' },
    { key: 'compliance', label: 'Compliance' },
    { key: 'notes', label: 'Notas' },
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
                <InfoRow label="Primera detección" value={new Date(discovery.firstSeen).toLocaleDateString('es-AR')} />
                <InfoRow label="Última visita" value={new Date(discovery.lastSeen).toLocaleDateString('es-AR')} />
                <InfoRow label="Visitas" value={String(discovery.visitCount)} />
              </Section>

              <Section title="Clasificación de Riesgo">
                <div className="flex gap-2 flex-wrap">
                  {riskOptions.map((risk) => (
                    <button
                      key={risk}
                      onClick={() => setRiskLevel(risk)}
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
                <div className="flex gap-2 flex-wrap">
                  {statusOptions.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleStatusChange(s)}
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
                <div className="space-y-2">
                  <select
                    value={customDept ? 'Otro' : (department || '')}
                    onChange={(e) => {
                      if (e.target.value === 'Otro') {
                        setCustomDept(true)
                        setDepartment('')
                      } else {
                        setCustomDept(false)
                        setDepartment(e.target.value)
                      }
                    }}
                    className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      placeholder="Nombre del departamento..."
                      className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                </div>
              </Section>
            </div>
          )}

          {activeTab === 'compliance' && (
            <div className="space-y-3">
              {(['euAiAct', 'iso42001', 'coSb205'] as const).map((regKey) => {
                const cs = discovery.complianceStatus[regKey]
                const regLabels = { euAiAct: 'EU AI Act', iso42001: 'ISO 42001', coSb205: 'CO SB 205' }
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

                return (
                  <div key={regKey} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900">{regLabels[regKey]}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${assessmentColors[cs.assessment]}`}>
                        {assessmentLabels[cs.assessment]}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 space-y-1">
                      {cs.lastAssessedDate && (
                        <div>Evaluado: {new Date(cs.lastAssessedDate).toLocaleDateString('es-AR')}</div>
                      )}
                      {cs.dueDate && (
                        <div>Vencimiento: {new Date(cs.dueDate).toLocaleDateString('es-AR')}</div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {activeTab === 'notes' && (
            <div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Agregar notas sobre esta herramienta..."
                rows={6}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700"
            data-testid="modal-save"
          >
            Guardar cambios
          </button>
        </div>
      </div>
    </div>
  )
}
