import { useState, useEffect, useRef, useCallback } from 'react'
import { useStorage } from '@options/hooks/useStorage'
import { STORAGE_KEYS } from '@shared/types/storage'
import type { AppSettings, CustomDomainEntry } from '@shared/types/storage'
import type { AICategory, RiskLevel } from '@shared/types/domain'
import { CATEGORY_LABELS } from '@shared/constants/categories'
import {
  RISK_LEVEL_LABELS,
  RISK_LEVEL_COLORS,
} from '@shared/constants/risk-levels'

type FeedbackType = 'success' | 'error'

interface FeedbackState {
  message: string
  type: FeedbackType
}

type TextField = 'companyName' | 'responsiblePerson'

export default function Settings() {
  const { settings } = useStorage()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [feedback, setFeedback] = useState<FeedbackState | null>(null)
  const [showClearModal, setShowClearModal] = useState(false)

  const [companyName, setCompanyName] = useState('')
  const [responsiblePerson, setResponsiblePerson] = useState('')
  const [badgeNotifications, setBadgeNotifications] = useState(true)

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

  async function handleBadgeToggle() {
    const newValue = !badgeNotifications
    setBadgeNotifications(newValue)
    await updateSettings({ badgeNotifications: newValue })
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

      await chrome.storage.local.set({
        [STORAGE_KEYS.AI_DISCOVERIES]: data.ai_discoveries,
        [STORAGE_KEYS.APP_SETTINGS]: data.app_settings,
        [STORAGE_KEYS.ACTIVITY_LOG]: data.activity_log,
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
      customDomains: [],
      excludedDomains: [],
    }

    await chrome.storage.local.set({
      [STORAGE_KEYS.AI_DISCOVERIES]: [],
      [STORAGE_KEYS.APP_SETTINGS]: defaultSettings,
      [STORAGE_KEYS.ACTIVITY_LOG]: [],
    })

    setCompanyName('')
    setResponsiblePerson('')
    setBadgeNotifications(true)
    resetCustomDomainForm()
    setExcludedDomain('')
    setShowClearModal(false)
    initialized.current = false

    showFeedbackMessage('Todos los datos han sido eliminados', 'success')
  }

  if (!settings) return null

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
        </section>

        <section className="bg-white border border-gray-200 rounded-lg p-5">
          <h2 className="text-sm font-medium text-gray-700 mb-2">
            Dominios Personalizados
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Agregue dominios de IA internos no cubiertos por el registro
            automático.
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

        <section className="bg-white border border-gray-200 rounded-lg p-5">
          <h2 className="text-sm font-medium text-gray-700 mb-2">
            Dominios Excluidos
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Dominios que serán ignorados durante la detección automática.
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
              className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors"
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
              className="border border-red-300 text-red-600 px-4 py-2 rounded-md text-sm font-medium hover:bg-red-50 transition-colors"
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
    </div>
  )
}
