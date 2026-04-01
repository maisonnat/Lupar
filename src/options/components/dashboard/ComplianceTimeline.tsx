import { useState } from 'react'
import type { DiscoveryRecord } from '@shared/types/discovery'
import type { ComplianceSnapshot } from '@shared/types/compliance'
import { takeSnapshot } from '@shared/utils/snapshot-service'
import { useDateConfig } from '@options/hooks/useDateConfig'
import { formatDateShort } from '@shared/utils/date-utils'

interface ComplianceTimelineProps {
  snapshots: ComplianceSnapshot[]
  discoveries: DiscoveryRecord[]
  onSnapshotTaken?: () => void
}

const TRIGGER_LABELS: Record<ComplianceSnapshot['trigger'], string> = {
  manual: 'Manual',
  report: 'Reporte',
  scheduled: 'Programado',
}

const TRIGGER_COLORS: Record<ComplianceSnapshot['trigger'], string> = {
  manual: 'bg-blue-100 text-blue-700',
  report: 'bg-purple-100 text-purple-700',
  scheduled: 'bg-gray-100 text-gray-600',
}

function scoreColor(score: number): string {
  if (score >= 80) return 'bg-green-500'
  if (score >= 50) return 'bg-yellow-400'
  return 'bg-red-500'
}

function ScoreChart({ snapshots }: { snapshots: ComplianceSnapshot[] }) {
  const display = snapshots.slice(-20)

  if (display.length < 2) return null

  const chartWidth = 100
  const chartHeight = 60
  const stepX = chartWidth / (display.length - 1)

  const points = display.map((s, i) => ({
    x: i * stepX,
    y: chartHeight - (s.overallScore / 100) * chartHeight,
  }))

  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ')

  const areaD = `${pathD} L ${points[points.length - 1].x} ${chartHeight} L ${points[0].x} ${chartHeight} Z`

  return (
    <svg
      viewBox={`0 0 ${chartWidth} ${chartHeight}`}
      className="w-full h-24"
      preserveAspectRatio="none"
      data-testid="score-chart"
    >
      <line x1="0" y1={chartHeight} x2={chartWidth} y2={chartHeight} stroke="#e5e7eb" strokeWidth="0.5" />
      <line x1="0" y1={chartHeight / 2} x2={chartWidth} y2={chartHeight / 2} stroke="#e5e7eb" strokeWidth="0.3" strokeDasharray="2" />
      <path d={areaD} fill="url(#scoreGradient)" opacity="0.3" />
      <path d={pathD} fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {display.map((s, i) => (
        <circle key={s.id} cx={points[i].x} cy={points[i].y} r="1.5" fill="#3b82f6" />
      ))}
      <defs>
        <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  )
}

export default function ComplianceTimeline({ snapshots, discoveries, onSnapshotTaken }: ComplianceTimelineProps) {
  const [taking, setTaking] = useState(false)
  const { timezone } = useDateConfig()

  async function handleManualSnapshot() {
    setTaking(true)
    try {
      await takeSnapshot(discoveries, 'manual')
      onSnapshotTaken?.()
    } finally {
      setTaking(false)
    }
  }

  const sorted = [...snapshots].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  )

  const latestScore = sorted.length > 0 ? sorted[0].overallScore : null
  const prevScore = sorted.length > 1 ? sorted[1].overallScore : null
  const scoreDelta = latestScore !== null && prevScore !== null ? latestScore - prevScore : null

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-gray-700">Evolución de Cumplimiento</h2>
        <button
          onClick={handleManualSnapshot}
          disabled={taking || discoveries.length === 0}
          className="text-xs px-3 py-1.5 rounded-md bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          data-testid="manual-snapshot-btn"
        >
          {taking ? 'Guardando...' : 'Tomar Snapshot'}
        </button>
      </div>

      {sorted.length === 0 && (
        <div className="text-center py-6">
          <p className="text-sm text-gray-400 mb-1">Sin snapshots de cumplimiento</p>
          <p className="text-xs text-gray-300">
            Los snapshots se crean automáticamente al generar reportes o manualmente.
          </p>
        </div>
      )}

      {sorted.length === 1 && (
        <div className="flex items-center justify-center py-4">
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-900">{latestScore}%</p>
            <p className="text-xs text-gray-400 mt-1">
              {formatDateShort(sorted[0].date, timezone)} · {TRIGGER_LABELS[sorted[0].trigger]}
            </p>
          </div>
        </div>
      )}

      {sorted.length >= 2 && (
        <>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-gray-900">{latestScore}%</span>
              {scoreDelta !== null && (
                <span
                  className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                    scoreDelta > 0
                      ? 'bg-green-100 text-green-700'
                      : scoreDelta < 0
                        ? 'bg-red-100 text-red-700'
                        : 'bg-gray-100 text-gray-500'
                  }`}
                  data-testid="score-delta"
                >
                  {scoreDelta > 0 ? '+' : ''}{scoreDelta}%
                </span>
              )}
            </div>
            <span className="text-xs text-gray-400">
              {sorted.length} snapshot{sorted.length !== 1 ? 's' : ''}
            </span>
          </div>

          <ScoreChart snapshots={[...sorted].reverse()} />

          <div className="mt-3 space-y-1.5 max-h-40 overflow-y-auto">
            {sorted.slice(0, 8).map((s) => (
              <div key={s.id} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${scoreColor(s.overallScore)}`} />
                  <span className="text-gray-500">{formatDateShort(s.date, timezone)}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${TRIGGER_COLORS[s.trigger]}`}>
                    {TRIGGER_LABELS[s.trigger]}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-gray-400">{s.totalTools} herramientas</span>
                  <span className="font-medium text-gray-700">{s.overallScore}%</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
