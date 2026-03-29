import { useState } from 'react'
import { useStorage } from '@options/hooks/useStorage'
import { generateReport, downloadReport } from '@options/utils/report-generator'
import { STORAGE_KEYS } from '@shared/types/storage'
import type { ActivityLogEntry } from '@shared/types/storage'

export default function Reports() {
  const { discoveries, settings } = useStorage()
  const [generating, setGenerating] = useState(false)
  const [previewHtml, setPreviewHtml] = useState<string | null>(null)

  async function handleGenerate() {
    if (!settings) return
    setGenerating(true)

    await new Promise((r) => setTimeout(r, 100))

    const html = generateReport(discoveries, settings)
    setPreviewHtml(html)

    await logActivity(discoveries.length)

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
    if (previewHtml) {
      downloadReport(previewHtml)
    }
  }

  function handlePreview() {
    if (!previewHtml) return
    const blob = new Blob([previewHtml], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
  }

  const hasDiscoveries = discoveries.length > 0

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Reportes de Cumplimiento</h1>
        <div className="flex gap-2">
          {previewHtml && (
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
          <button
            onClick={handleGenerate}
            disabled={generating || !hasDiscoveries || !settings}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="generate-report-btn"
          >
            {generating ? 'Generando...' : 'Generar Reporte HTML'}
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

      {hasDiscoveries && !previewHtml && (
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
              Genera un reporte HTML autocontenido con el inventario completo de herramientas IA,
              mapa de brechas regulatorias y recomendaciones de acción.
            </p>
            <div className="mt-4 text-sm text-gray-400">
              {discoveries.length} herramienta{discoveries.length !== 1 ? 's' : ''} disponible{discoveries.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      )}

      {previewHtml && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="border-b border-gray-200 px-4 py-3 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Reporte generado</span>
            <span className="text-xs text-gray-400">
              {discoveries.length} herramientas · {new Intl.DateTimeFormat('es-AR', { dateStyle: 'long', timeStyle: 'short' }).format(new Date())}
            </span>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-blue-50 rounded-lg p-3">
                <div className="text-2xl font-bold text-blue-700">{discoveries.length}</div>
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
  )
}
