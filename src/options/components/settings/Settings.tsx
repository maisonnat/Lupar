import { useState, useEffect, useRef, useCallback } from 'react'
import { useStorage } from '@options/hooks/useStorage'
import { STORAGE_KEYS } from '@shared/types/storage'
import type { AppSettings, CustomDomainEntry, AdminRole, DateFormat } from '@shared/types/storage'
import type { AICategory, RiskLevel } from '@shared/types/domain'
import { CATEGORY_LABELS } from '@shared/constants/categories'
import {
  RISK_LEVEL_LABELS,
  RISK_LEVEL_COLORS,
} from '@shared/constants/risk-levels'
import { formatDateTimeLong } from '@shared/utils/date-utils'
import { detectTimezone } from '@shared/utils/date-utils'

const ADMIN_ROLE_LABELS: Record<AdminRole, string> = {
  compliance_officer: 'Oficial de Compliance',
  it_admin: 'Administrador IT',
  auditor: 'Auditor',
  executive: 'Ejecutivo',
}

const TIMEZONE_OPTIONS = [
  { value: 'America/Argentina/Buenos_Aires', label: 'Argentina (Buenos Aires)' },
  { value: 'America/Argentina/Cordoba', label: 'Argentina (Córdoba)' },
  { value: 'America/Argentina/Mendoza', label: 'Argentina (Mendoza)' },
  { value: 'America/Bogota', label: 'Colombia (Bogotá)' },
  { value: 'America/Mexico_City', label: 'México (Ciudad de México)' },
  { value: 'America/Lima', label: 'Perú (Lima)' },
  { value: 'America/Santiago', label: 'Chile (Santiago)' },
  { value: 'America/Montevideo', label: 'Uruguay (Montevideo)' },
  { value: 'America/Caracas', label: 'Venezuela (Caracas)' },
  { value: 'America/Sao_Paulo', label: 'Brasil (São Paulo)' },
  { value: 'America/New_York', label: 'EE.UU. (New York, EST)' },
  { value: 'America/Chicago', label: 'EE.UU. (Chicago, CST)' },
  { value: 'America/Los_Angeles', label: 'EE.UU. (Los Angeles, PST)' },
  { value: 'Europe/Madrid', label: 'España (Madrid)' },
  { value: 'Europe/London', label: 'Reino Unido (Londres)' },
  { value: 'Europe/Paris', label: 'Francia (París)' },
  { value: 'Europe/Berlin', label: 'Alemania (Berlín)' },
  { value: 'Asia/Tokyo', label: 'Japón (Tokio)' },
  { value: 'Asia/Shanghai', label: 'China (Shanghái)' },
  { value: 'Australia/Sydney', label: 'Australia (Sídney)' },
  { value: 'UTC', label: 'UTC' },
] as const

const DATE_FORMAT_OPTIONS: { value: DateFormat; label: string }[] = [
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (01/04/2026)' },
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (04/01/2026)' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (2026-04-01)' },
]

type FeedbackType = 'success' | 'error'

interface FeedbackState {
  message: string
  type: FeedbackType
}

type TextField = 'companyName' | 'responsiblePerson'

type AdminProfileField = 'adminName' | 'adminEmail' | 'department'

export default function Settings() {
  const { settings } = useStorage()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [feedback, setFeedback] = useState<FeedbackState | null>(null)
  const [showClearModal, setShowClearModal] = useState(false)
  const [showAuditActivateModal, setShowAuditActivateModal] = useState(false)

  const [companyName, setCompanyName] = useState('')
  const [responsiblePerson, setResponsiblePerson] = useState('')
  const [badgeNotifications, setBadgeNotifications] = useState(true)
  const [requireDepartment, setRequireDepartment] = useState(false)
  const [snapshotFrequencyDays, setSnapshotFrequencyDays] = useState(0)
  const [timezone, setTimezone] = useState('')
  const [dateFormat, setDateFormat] = useState<DateFormat>('DD/MM/YYYY')

  const [adminName, setAdminName] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const [adminRole, setAdminRole] = useState<AdminRole>('compliance_officer')
  const [adminDepartment, setAdminDepartment] = useState('')

  const [customDomain, setCustomDomain] = useState('')
  const [customToolName, setCustomToolName] = useState('')
  const [customCategory, setCustomCategory] = useState<AICategory>('chatbot')
  const [customRisk, setCustomRisk] = useState<RiskLevel>('limited')

  const [excludedDomain, setExcludedDomain] = useState('')

  const initialized = useRef(false)

  useEffect(() => {
    if (settings && !initialized.current) {
      setCompanyName(settings.companyName)
      setResponsiblePerson(settings.responsiblePerson)
      setBadgeNotifications(settings.badgeNotifications)
      setRequireDepartment(settings.requireDepartment ?? false)
      setSnapshotFrequencyDays(settings.snapshotFrequencyDays ?? 0)
      setTimezone(settings.timezone ?? detectTimezone())
      setDateFormat(settings.dateFormat ?? 'DD/MM/YYYY')
      setAdminName(settings.adminProfile?.adminName ?? '')
      setAdminEmail(settings.adminProfile?.adminEmail ?? '')
      setAdminRole(settings.adminProfile?.adminRole ?? 'compliance_officer')
      setAdminDepartment(settings.adminProfile?.department ?? '')
      initialized.current = true
    }
  }, [settings])

  useEffect(() => {
    if (!feedback) return
    const timer = setTimeout(() => setFeedback(null), 3000)
    return () => clearTimeout(timer)
  }, [feedback])

  const showFeedbackMessage = useCallback(
    (message: string, type: FeedbackType) => {
      setFeedback({ message, type })
    },
    [],
  )

  const updateSettings = useCallback(
    async (updates: Partial<AppSettings>) => {
      if (!settings) return
      const updated = { ...settings, ...updates }
      await chrome.storage.local.set({ [STORAGE_KEYS.APP_SETTINGS]: updated })
    },
    [settings],
  )

  const handleBlur = useCallback(
    (field: TextField) => {
      return async () => {
        if (!settings) return
        const value = field === 'companyName' ? companyName : responsiblePerson
        if (settings[field] !== value) {
          await updateSettings({ [field]: value })
        }
      }
    },
    [settings, companyName, responsiblePerson, updateSettings],
  )

  const handleAdminBlur = useCallback(
    (field: AdminProfileField) => {
      return async () => {
        if (!settings) return
        const valueMap: Record<AdminProfileField, string> = {
          adminName,
          adminEmail,
          department: adminDepartment,
        }
        const currentProfile = settings.adminProfile
        if (currentProfile[field] !== valueMap[field]) {
          await updateSettings({
            adminProfile: { ...currentProfile, [field]: valueMap[field] },
          })
        }
      }
    },
    [settings, adminName, adminEmail, adminDepartment, updateSettings],
  )

  async function handleAdminRoleChange(newRole: AdminRole) {
    if (!settings) return
    setAdminRole(newRole)
    await updateSettings({
      adminProfile: { ...settings.adminProfile, adminRole: newRole },
    })
  }

  async function handleBadgeToggle() {
    const newValue = !badgeNotifications
    setBadgeNotifications(newValue)
    await updateSettings({ badgeNotifications: newValue })
  }

  async function handleRequireDepartmentToggle() {
    const newValue = !requireDepartment
    setRequireDepartment(newValue)
    await updateSettings({ requireDepartment: newValue })
  }

  async function handleSnapshotFrequencyChange(value: string) {
    const num = value === '' ? 0 : Math.max(0, Math.min(365, parseInt(value, 10) || 0))
    setSnapshotFrequencyDays(num)
    await updateSettings({ snapshotFrequencyDays: num })
  }

  async function handleTimezoneChange(newTimezone: string) {
    setTimezone(newTimezone)
    await updateSettings({ timezone: newTimezone })
  }

  async function handleDateFormatChange(newFormat: DateFormat) {
    setDateFormat(newFormat)
    await updateSettings({ dateFormat: newFormat })
  }

  function handleAuditToggle() {
    if (!settings) return
    const isCurrentlyActive = settings.auditModeConfig?.auditMode ?? false
    if (isCurrentlyActive) {
      updateSettings({
        auditModeConfig: {
          auditMode: false,
          auditModeActivatedAt: null,
          auditModeActivatedBy: null,
        },
      })
      return
    }
    setShowAuditActivateModal(true)
  }

  async function handleActivateAuditMode() {
    if (!settings) return
    const activatedBy = settings.adminProfile?.adminName || settings.responsiblePerson || null
    await updateSettings({
      auditModeConfig: {
        auditMode: true,
        auditModeActivatedAt: new Date().toISOString(),
        auditModeActivatedBy: activatedBy,
      },
    })
    setShowAuditActivateModal(false)
    showFeedbackMessage('Modo auditor activado — datos en solo lectura', 'success')
  }

  function resetCustomDomainForm() {
    setCustomDomain('')
    setCustomToolName('')
    setCustomCategory('chatbot')
    setCustomRisk('limited')
  }

  async function handleAddCustomDomain() {
    const domain = customDomain
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/\/.*$/, '')
    if (!domain) {
      showFeedbackMessage('Ingrese un dominio válido', 'error')
      return
    }
    if (!customToolName.trim()) {
      showFeedbackMessage('Ingrese un nombre para la herramienta', 'error')
      return
    }
    if (!settings) return
    if (settings.customDomains.some((d) => d.domain === domain)) {
      showFeedbackMessage('Este dominio ya está en la lista', 'error')
      return
    }

    const entry: CustomDomainEntry = {
      domain,
      toolName: customToolName.trim(),
      category: customCategory,
      defaultRiskLevel: customRisk,
    }

    await updateSettings({
      customDomains: [...settings.customDomains, entry],
    })
    resetCustomDomainForm()
    showFeedbackMessage(
      `Dominio "${domain}" agregado correctamente`,
      'success',
    )
  }

  async function handleRemoveCustomDomain(domain: string) {
    if (!settings) return
    const filtered = settings.customDomains.filter((d) => d.domain !== domain)
    await updateSettings({ customDomains: filtered })
    showFeedbackMessage(`Dominio "${domain}" eliminado`, 'success')
  }

  async function handleAddExcludedDomain() {
    const domain = excludedDomain
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/\/.*$/, '')
    if (!domain) {
      showFeedbackMessage('Ingrese un dominio válido', 'error')
      return
    }
    if (!settings) return
    if (settings.excludedDomains.includes(domain)) {
      showFeedbackMessage('Este dominio ya está excluido', 'error')
      return
    }

    await updateSettings({
      excludedDomains: [...settings.excludedDomains, domain],
    })
    setExcludedDomain('')
    showFeedbackMessage(
      `Dominio "${domain}" excluido de la detección`,
      'success',
    )
  }

  async function handleRemoveExcludedDomain(domain: string) {
    if (!settings) return
    const filtered = settings.excludedDomains.filter((d) => d !== domain)
    await updateSettings({ excludedDomains: filtered })
    showFeedbackMessage(
      `Dominio "${domain}" removido de exclusiones`,
      'success',
    )
  }

  async function handleExport() {
    try {
      const result = await chrome.storage.local.get([
        STORAGE_KEYS.AI_DISCOVERIES,
        STORAGE_KEYS.APP_SETTINGS,
        STORAGE_KEYS.ACTIVITY_LOG,
        STORAGE_KEYS.COMPLIANCE_SNAPSHOTS,
      ])

      const blob = new Blob([JSON.stringify(result, null, 2)], {
        type: 'application/json',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const date = new Date().toISOString().slice(0, 10)
      a.download = `ai-compliance-backup-${date}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      showFeedbackMessage('Backup exportado correctamente', 'success')
    } catch {
      showFeedbackMessage('Error al exportar backup', 'error')
    }
  }

  async function handleImport(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const data = JSON.parse(text)

      if (!Array.isArray(data.ai_discoveries)) {
        showFeedbackMessage('Backup inválido: falta ai_discoveries', 'error')
        return
      }
      if (!data.app_settings || typeof data.app_settings !== 'object') {
        showFeedbackMessage('Backup inválido: falta app_settings', 'error')
        return
      }
      if (!Array.isArray(data.activity_log)) {
        showFeedbackMessage('Backup inválido: falta activity_log', 'error')
        return
      }

      const snapshots = Array.isArray(data.compliance_snapshots) ? data.compliance_snapshots : []

      await chrome.storage.local.set({
        [STORAGE_KEYS.AI_DISCOVERIES]: data.ai_discoveries,
        [STORAGE_KEYS.APP_SETTINGS]: data.app_settings,
        [STORAGE_KEYS.ACTIVITY_LOG]: data.activity_log,
        [STORAGE_KEYS.COMPLIANCE_SNAPSHOTS]: snapshots,
      })

      initialized.current = false
      showFeedbackMessage('Backup importado correctamente', 'success')
    } catch {
      showFeedbackMessage(
        'Error al importar backup: archivo inválido',
        'error',
      )
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  async function handleClearAll() {
    await chrome.storage.local.clear()

    const defaultSettings: AppSettings = {
      version: '1.0.0',
      companyName: '',
      responsiblePerson: '',
      installationDate: new Date().toISOString(),
      badgeNotifications: true,
      requireDepartment: false,
      snapshotFrequencyDays: 0,
      timezone: detectTimezone(),
      dateFormat: 'DD/MM/YYYY',
      customDomains: [],
      excludedDomains: [],
      regulationConfig: {
        euAiAct: { enabled: true, customDueDateOffsetDays: 90 },
        iso42001: { enabled: true, customDueDateOffsetDays: 90 },
        coSb205: { enabled: false, customDueDateOffsetDays: 90 },
      },
      auditModeConfig: {
        auditMode: false,
        auditModeActivatedAt: null,
        auditModeActivatedBy: null,
      },
      adminProfile: {
        adminName: '',
        adminEmail: '',
        adminRole: 'compliance_officer',
        department: '',
      },
    }

    await chrome.storage.local.set({
      [STORAGE_KEYS.AI_DISCOVERIES]: [],
      [STORAGE_KEYS.APP_SETTINGS]: defaultSettings,
      [STORAGE_KEYS.ACTIVITY_LOG]: [],
      [STORAGE_KEYS.COMPLIANCE_SNAPSHOTS]: [],
    })

    setCompanyName('')
    setResponsiblePerson('')
    setBadgeNotifications(true)
    setRequireDepartment(false)
    setSnapshotFrequencyDays(0)
    setTimezone(detectTimezone())
    setDateFormat('DD/MM/YYYY')
    setAdminName('')
    setAdminEmail('')
    setAdminRole('compliance_officer')
    setAdminDepartment('')
    resetCustomDomainForm()
    setExcludedDomain('')
    setShowClearModal(false)
    initialized.current = false

    showFeedbackMessage('Todos los datos han sido eliminados', 'success')
  }

  if (!settings) return null

  const isAuditMode = settings.auditModeConfig?.auditMode ?? false
  const disabledSectionClass = isAuditMode ? 'opacity-50 pointer-events-none' : ''

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Configuración</h1>
        {feedback && (
          <span
            className={`text-sm px-3 py-1 rounded-md ${
              feedback.type === 'success'
                ? 'bg-green-50 text-green-700'
                : 'bg-red-50 text-red-700'
            }`}
          >
            {feedback.message}
          </span>
        )}
      </div>

      <div className="space-y-6">
        <section className="bg-white border border-gray-200 rounded-lg p-5">
          <h2 className="text-sm font-medium text-gray-700 mb-4">
            Datos de la Organización
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Nombre de la empresa
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ingrese el nombre..."
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                onBlur={handleBlur('companyName')}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Persona responsable
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ingrese el nombre..."
                value={responsiblePerson}
                onChange={(e) => setResponsiblePerson(e.target.value)}
                onBlur={handleBlur('responsiblePerson')}
              />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              role="switch"
              aria-checked={badgeNotifications}
              onClick={handleBadgeToggle}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                badgeNotifications ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  badgeNotifications ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className="text-sm text-gray-600">
              Mostrar contador en badge de la extensión
            </span>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <button
              type="button"
              role="switch"
              aria-checked={requireDepartment}
              onClick={handleRequireDepartmentToggle}
              data-testid="require-department-toggle"
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                requireDepartment ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  requireDepartment ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className="text-sm text-gray-600">
              Exigir departamento al guardar herramientas
            </span>
          </div>
        </section>

        <section className="bg-white border border-gray-200 rounded-lg p-5">
          <h2 className="text-sm font-medium text-gray-700 mb-2">
            Snapshots de Cumplimiento
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Guarda periódicamente el estado de cumplimiento para rastrear la evolución en el tiempo.
            Los snapshots se crean automáticamente al generar reportes.
          </p>
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-600 whitespace-nowrap">
              Cada
            </label>
            <input
              type="number"
              min="0"
              max="365"
              value={snapshotFrequencyDays || ''}
              placeholder="0"
              onChange={(e) => handleSnapshotFrequencyChange(e.target.value)}
              className="w-20 border border-gray-300 rounded-md px-3 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
              data-testid="snapshot-frequency-input"
            />
            <span className="text-sm text-gray-600">
              días (0 = deshabilitado)
            </span>
          </div>
        </section>

        <section className="bg-white border border-gray-200 rounded-lg p-5">
          <h2 className="text-sm font-medium text-gray-700 mb-2">
            Formato de Fecha y Hora
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Configura la zona horaria y el formato de fecha para todo el sistema.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Zona horaria
              </label>
              <select
                value={timezone}
                onChange={(e) => handleTimezoneChange(e.target.value)}
                data-testid="timezone-select"
                className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {TIMEZONE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Formato de fecha
              </label>
              <select
                value={dateFormat}
                onChange={(e) => handleDateFormatChange(e.target.value as DateFormat)}
                data-testid="date-format-select"
                className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {DATE_FORMAT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section className="bg-white border border-gray-200 rounded-lg p-5">
          <h2 className="text-sm font-medium text-gray-700 mb-2">
            Perfil del Administrador
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Datos del responsable de compliance. Se incluyen en los reportes y el historial de cambios.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Nombre completo
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ingrese el nombre..."
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                onBlur={handleAdminBlur('adminName')}
                data-testid="admin-name-input"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Email
              </label>
              <input
                type="email"
                className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="admin@empresa.com"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                onBlur={handleAdminBlur('adminEmail')}
                data-testid="admin-email-input"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Rol
              </label>
              <select
                className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={adminRole}
                onChange={(e) => handleAdminRoleChange(e.target.value as AdminRole)}
                data-testid="admin-role-select"
              >
                {Object.entries(ADMIN_ROLE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Departamento
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: Legal, IT, Compliance..."
                value={adminDepartment}
                onChange={(e) => setAdminDepartment(e.target.value)}
                onBlur={handleAdminBlur('department')}
                data-testid="admin-department-input"
              />
            </div>
          </div>
        </section>

        <section className={`bg-white border border-gray-200 rounded-lg p-5 ${isAuditMode ? 'border-amber-400 bg-amber-50/30' : ''}`}>
          <h2 className="text-sm font-medium text-gray-700 mb-2">
            Modo Auditor
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Congela todos los datos en solo lectura para revisión de auditoría.
            El reporte generado incluirá un hash de integridad SHA-256.
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              role="switch"
              aria-checked={isAuditMode}
              onClick={handleAuditToggle}
              data-testid="audit-mode-toggle"
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isAuditMode ? 'bg-amber-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isAuditMode ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className="text-sm text-gray-600">
              {isAuditMode ? 'Modo auditor activo' : 'Activar modo auditor'}
            </span>
          </div>
          {isAuditMode && settings.auditModeConfig.auditModeActivatedAt && (
            <p className="mt-3 text-xs text-amber-700">
              Activado el {formatDateTimeLong(settings.auditModeConfig.auditModeActivatedAt, settings.timezone ?? detectTimezone())}
              {settings.auditModeConfig.auditModeActivatedBy && (
                <> por <strong>{settings.auditModeConfig.auditModeActivatedBy}</strong></>
              )}
            </p>
          )}
        </section>

        <section className={`bg-white border border-gray-200 rounded-lg p-5 ${disabledSectionClass}`}>
          <h2 className="text-sm font-medium text-gray-700 mb-2">
            Dominios Personalizados
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Agregue dominios de IA internos no cubiertos por el registro
            automático.
            {isAuditMode && (
              <span className="block mt-1 text-amber-600 text-xs font-medium">
                Edición deshabilitada — modo auditor activo
              </span>
            )}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
            <input
              type="text"
              placeholder="dominio.com"
              className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={customDomain}
              onChange={(e) => setCustomDomain(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddCustomDomain()
              }}
            />
            <input
              type="text"
              placeholder="Nombre de herramienta"
              className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={customToolName}
              onChange={(e) => setCustomToolName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddCustomDomain()
              }}
            />
            <select
              className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value as AICategory)}
            >
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
            <select
              className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={customRisk}
              onChange={(e) => setCustomRisk(e.target.value as RiskLevel)}
            >
              {Object.entries(RISK_LEVEL_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleAddCustomDomain}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors mb-4"
          >
            Agregar Dominio
          </button>

          {settings.customDomains.length > 0 && (
            <div className="border border-gray-200 rounded-md divide-y divide-gray-100">
              {settings.customDomains.map((entry) => (
                <div
                  key={entry.domain}
                  className="flex items-center justify-between px-4 py-2.5"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-900">
                      {entry.toolName}
                    </span>
                    <span className="text-xs text-gray-400">
                      {entry.domain}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                      {CATEGORY_LABELS[entry.category]}
                    </span>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full text-white"
                      style={{
                        backgroundColor: RISK_LEVEL_COLORS[entry.defaultRiskLevel],
                      }}
                    >
                      {RISK_LEVEL_LABELS[entry.defaultRiskLevel]}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveCustomDomain(entry.domain)}
                    className="text-red-400 hover:text-red-600 transition-colors text-sm"
                  >
                    Eliminar
                  </button>
                </div>
              ))}
            </div>
          )}

          {settings.customDomains.length === 0 && (
            <p className="text-sm text-gray-400 italic">
              No hay dominios personalizados configurados
            </p>
          )}
        </section>

        <section className={`bg-white border border-gray-200 rounded-lg p-5 ${disabledSectionClass}`}>
          <h2 className="text-sm font-medium text-gray-700 mb-2">
            Dominios Excluidos
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Dominios que serán ignorados durante la detección automática.
            {isAuditMode && (
              <span className="block mt-1 text-amber-600 text-xs font-medium">
                Edición deshabilitada — modo auditor activo
              </span>
            )}
          </p>

          <div className="flex gap-3 mb-4">
            <input
              type="text"
              placeholder="dominio.com"
              className="flex-1 border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={excludedDomain}
              onChange={(e) => setExcludedDomain(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddExcludedDomain()
              }}
            />
            <button
              type="button"
              onClick={handleAddExcludedDomain}
              className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Agregar
            </button>
          </div>

          {settings.excludedDomains.length > 0 && (
            <div className="border border-gray-200 rounded-md divide-y divide-gray-100">
              {settings.excludedDomains.map((domain) => (
                <div
                  key={domain}
                  className="flex items-center justify-between px-4 py-2.5"
                >
                  <span className="text-sm text-gray-900">{domain}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveExcludedDomain(domain)}
                    className="text-red-400 hover:text-red-600 transition-colors text-sm"
                  >
                    Eliminar
                  </button>
                </div>
              ))}
            </div>
          )}

          {settings.excludedDomains.length === 0 && (
            <p className="text-sm text-gray-400 italic">
              No hay dominios excluidos configurados
            </p>
          )}
        </section>

        <section className="bg-white border border-gray-200 rounded-lg p-5">
          <h2 className="text-sm font-medium text-gray-700 mb-4">
            Backup y Limpieza
          </h2>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleExport}
              className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Exportar Backup
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isAuditMode}
              className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title={isAuditMode ? 'Deshabilitado en modo auditor' : undefined}
            >
              Importar Backup
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImport}
            />
            <button
              type="button"
              onClick={() => setShowClearModal(true)}
              disabled={isAuditMode}
              className="border border-red-300 text-red-600 px-4 py-2 rounded-md text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title={isAuditMode ? 'Deshabilitado en modo auditor' : undefined}
            >
              Limpiar Todo
            </button>
          </div>
        </section>
      </div>

      {showClearModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Confirmar Limpieza
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Esta acción eliminará TODOS los datos: herramientas detectadas,
              configuración, dominios personalizados y registro de actividad.
              Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowClearModal(false)}
                className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition-colors"
              >
                Sí, eliminar todo
              </button>
            </div>
          </div>
        </div>
      )}

      {showAuditActivateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Activar Modo Auditor
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Al activar el modo auditor se bloqueará la edición de TODOS los datos:
            </p>
            <ul className="text-sm text-gray-600 mb-6 list-disc list-inside space-y-1">
              <li>No se podrán modificar herramientas detectadas</li>
              <li>No se podrán cambiar estados de compliance</li>
              <li>No se podrán agregar o eliminar dominios</li>
              <li>No se podrán importar backups ni limpiar datos</li>
            </ul>
            <p className="text-sm text-amber-700 font-medium mb-6">
              El reporte generado incluirá un hash SHA-256 de integridad.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowAuditActivateModal(false)}
                className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleActivateAuditMode}
                className="bg-amber-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-amber-700 transition-colors"
                data-testid="activate-audit-mode-btn"
              >
                Activar Modo Auditor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
