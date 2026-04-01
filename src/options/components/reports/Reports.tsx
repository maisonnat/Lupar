import { useState, useMemo, useEffect } from 'react'
import { useStorage } from '@options/hooks/useStorage'
import { generateReport, generateReportWithHash, downloadReport, generateCSV, generateJSON } from '@options/utils/report-generator'
import { takeSnapshot, getSnapshots } from '@shared/utils/snapshot-service'
import { STORAGE_KEYS } from '@shared/types/storage'
import type { ActivityLogEntry, ExportFormat, AppSettings } from '@shared/types/storage'
import { useDateConfig } from '@options/hooks/useDateConfig'
import { formatDateTimeLong } from '@shared/utils/date-utils'

interface ExportSection {
  key: 'includeInventory' | 'includeComplianceMap' | 'includeRecommendations' | 'includeAuditTrail'
  label: string
  defaultChecked: boolean
}

const EXPORT_SECTIONS: ExportSection[] = [
  { key: 'includeInventory', label: 'Inventario de herramientas', defaultChecked: true },
  { key: 'includeComplianceMap', label: 'Mapa de cumplimiento', defaultChecked: true },
  { key: 'includeRecommendations', label: 'Recomendaciones', defaultChecked: true },
  { key: 'includeAuditTrail', label: 'Historial de cambios', defaultChecked: true },
]

export default function Reports() {
  const { discoveries, settings } = useStorage()
  const [generating, setGenerating] = useState(false)
  const [previewHtml, setPreviewHtml] = useState<string | null>(null)
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('html')
  const [dateRangeDays, setDateRangeDays] = useState(0)
  const [sections, setSections] = useState({
    includeInventory: true,
    includeComplianceMap: true,
    includeRecommendations: true,
    includeAuditTrail: true,
  })
  const { timezone } = useDateConfig()

  const exportConfig = settings?.exportConfig

  useEffect(() => {
    if (exportConfig) {
      setSelectedFormat(exportConfig.defaultFormat)
      setDateRangeDays(exportConfig.defaultDateRangeDays)
      setSections({
        includeInventory: exportConfig.includeInventory,
        includeComplianceMap: exportConfig.includeComplianceMap,
        includeRecommendations: exportConfig.includeRecommendations,
        includeAuditTrail: exportConfig.includeAuditTrail,
      })
    }
  }, [exportConfig])

  const filteredDiscoveries = useMemo(() => {
    if (dateRangeDays <= 0) return discoveries
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - dateRangeDays)
    const cutoffISO = cutoff.toISOString()
    return discoveries.filter((d) => d.firstSeen >= cutoffISO || d.lastSeen >= cutoffISO)
  }, [discoveries, dateRangeDays])

  async function updateExportConfig(partial: Partial<AppSettings['exportConfig']>) {
    if (!settings) return
    const updated = { ...settings.exportConfig, ...partial } as AppSettings['exportConfig']
    const newSettings = { ...settings, exportConfig: updated }
    await chrome.storage.local.set({ [STORAGE_KEYS.APP_SETTINGS]: newSettings })
  }

  const handleFormatChange = (format: ExportFormat) => {
    setSelectedFormat(format)
    updateExportConfig({ defaultFormat: format })
  }

  const handleDateRangeChange = (days: number) => {
    setDateRangeDays(days)
    updateExportConfig({ defaultDateRangeDays: days })
  }

  const handleSectionToggle = (key: keyof typeof sections) => {
    const newSections = { ...sections, [key]: !sections[key] }
    setSections(newSections)
    updateExportConfig({ [key]: newSections[key] })
  }

  async function handleGenerate() {
    if (!settings) return
    setGenerating(true)

    await new Promise((r) => setTimeout(r, 100))

    if (selectedFormat === 'html') {
      const snapshots = await getSnapshots()
      const isAuditMode = settings.auditModeConfig?.auditMode ?? false
      const html = isAuditMode
        ? await generateReportWithHash(filteredDiscoveries, settings, snapshots)
        : generateReport(filteredDiscoveries, settings, snapshots)
      setPreviewHtml(html)
    }

    await logActivity(filteredDiscoveries.length)
    await takeSnapshot(filteredDiscoveries, 'report')

    setGenerating(false)
  }

  async function logActivity(toolCount: number) {
    const result = await chrome.storage.local.get(STORAGE_KEYS.ACTIVITY_LOG)
    const log = (result[STORAGE_KEYS.ACTIVITY_LOG] as ActivityLogEntry[]) ?? []

    const entry: ActivityLogEntry = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      eventType: 'report_generated',
      domain: '',
      details: `Reporte generado con ${toolCount} herramienta${toolCount !== 1 ? 's' : ''}`,
    }

    log.push(entry)
    if (log.length > 1000) log.splice(0, log.length - 1000)

    await chrome.storage.local.set({ [STORAGE_KEYS.ACTIVITY_LOG]: log })
  }

  function handleDownload() {
    if (!settings) return

    const data = {
      discoveries: filteredDiscoveries,
      settings,
      sections,
      timezone,
    }

    if (selectedFormat === 'html' && previewHtml) {
      downloadReport(previewHtml)
    } else if (selectedFormat === 'csv') {
      const csv = generateCSV(filteredDiscoveries, settings)
      downloadExport(csv, 'csv')
    } else if (selectedFormat === 'json') {
      const json = generateJSON(data)
      downloadExport(json, 'json')
    }
  }

  function downloadExport(content: string, format: 'csv' | 'json') {
    const ext = format === 'csv' ? 'csv' : 'json'
    const mimeType = format === 'csv' ? 'text/csv;charset=utf-8' : 'application/json;charset=utf-8'
    const d = new Date()
    const filename = `ai-compliance-export-${d.toISOString().split('T')[0]}.${ext}`
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  function handlePreview() {
    if (!previewHtml) return
    const blob = new Blob([previewHtml], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
  }

  const hasDiscoveries = discoveries.length > 0

  const formatOptions: { value: ExportFormat; label: string; icon: string }[] = [
    { value: 'html', label: 'HTML', icon: '📄' },
    { value: 'csv', label: 'CSV', icon: '📊' },
    { value: 'json', label: 'JSON', icon: '📋' },
  ]

  const dateRangeOptions = [
    { value: 0, label: 'Todo el período' },
    { value: 30, label: 'Últimos 30 días' },
    { value: 90, label: 'Últimos 90 días' },
    { value: 180, label: 'Últimos 6 meses' },
    { value: 365, label: 'Último año' },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Reportes de Cumplimiento</h1>
        <div className="flex gap-2">
          {previewHtml && selectedFormat === 'html' && (
            <>
              <button
                onClick={handlePreview}
                className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Vista previa
              </button>
              <button
                onClick={handleDownload}
                className="border border-blue-600 text-blue-600 px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-50 transition-colors"
              >
                Descargar HTML
              </button>
            </>
          )}
          {selectedFormat !== 'html' && (
            <button
              onClick={handleDownload}
              disabled={!hasDiscoveries || !settings}
              className="border border-blue-600 text-blue-600 px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Descargar {selectedFormat.toUpperCase()}
            </button>
          )}
          <button
            onClick={handleGenerate}
            disabled={generating || !hasDiscoveries || !settings}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="generate-report-btn"
          >
            {generating ? 'Generando...' : `Generar Reporte ${selectedFormat.toUpperCase()}`}
          </button>
        </div>
      </div>

      {!hasDiscoveries && (
        <div className="bg-white border border-gray-200 rounded-lg p-8">
          <div className="text-center">
            <svg className="mx-auto mb-4 text-gray-300" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <h3 className="text-gray-700 font-medium mb-2">Sin datos para generar</h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              Navega a sitios de IA para que el tracker detecte herramientas. Luego podras generar un reporte completo.
            </p>
          </div>
        </div>
      )}

      {hasDiscoveries && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Configuración de Exportación</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Formato</label>
                <div className="flex gap-2">
                  {formatOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => handleFormatChange(opt.value)}
                      className={`flex-1 py-2 px-3 rounded-md text-sm font-medium border transition-colors ${
                        selectedFormat === opt.value
                          ? 'bg-blue-50 border-blue-600 text-blue-700'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span className="mr-1">{opt.icon}</span>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rango de fechas</label>
                <select
                  value={dateRangeDays}
                  onChange={(e) => handleDateRangeChange(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {dateRangeOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Herramientas en rango: <span className="text-blue-600 font-semibold">{filteredDiscoveries.length}</span>
                </label>
                {dateRangeDays > 0 && filteredDiscoveries.length < discoveries.length && (
                  <p className="text-xs text-gray-500">
                    {discoveries.length - filteredDiscoveries.length} herramienta{discoveries.length - filteredDiscoveries.length !== 1 ? 's' : ''} fuera del período
                  </p>
                )}
              </div>
            </div>

            {selectedFormat === 'html' && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-3">Secciones a incluir</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {EXPORT_SECTIONS.map((section) => (
                    <label key={section.key} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={sections[section.key]}
                        onChange={() => handleSectionToggle(section.key as keyof typeof sections)}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{section.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {!previewHtml && (
            <div className="bg-white border border-gray-200 rounded-lg p-8">
              <div className="text-center">
                <svg className="mx-auto mb-4 text-gray-300" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
                <h3 className="text-gray-700 font-medium mb-2">Reporte de Cumplimiento</h3>
                <p className="text-sm text-gray-500 max-w-md mx-auto">
                  Genera un reporte {selectedFormat.toUpperCase()} autocontenido con el inventario completo de herramientas IA,
                  mapa de brechas regulatorias y recomendaciones de acción.
                </p>
                <div className="mt-4 text-sm text-gray-400">
                  {filteredDiscoveries.length} herramienta{filteredDiscoveries.length !== 1 ? 's' : ''} disponible{filteredDiscoveries.length !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
          )}

          {previewHtml && (
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="border-b border-gray-200 px-4 py-3 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Reporte generado</span>
                <span className="text-xs text-gray-400">
                  {filteredDiscoveries.length} herramientas · {formatDateTimeLong(new Date().toISOString(), timezone)}
                </span>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-blue-700">{filteredDiscoveries.length}</div>
                    <div className="text-xs text-blue-600">Herramientas</div>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-orange-700">
                      {(previewHtml.length / 1024).toFixed(0)}
                    </div>
                    <div className="text-xs text-orange-600">KB HTML</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-green-700">✓</div>
                    <div className="text-xs text-green-600">Autocontenido</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
