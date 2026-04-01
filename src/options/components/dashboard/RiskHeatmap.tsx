import type { HeatmapData } from '@shared/utils/risk-calculator'
import { RISK_LEVEL_ORDER, NO_DEPARTMENT_LABEL } from '@shared/utils/risk-calculator'
import { RISK_LEVEL_LABELS, RISK_LEVEL_COLORS } from '@shared/constants/risk-levels'

interface RiskHeatmapProps {
  data: HeatmapData
}

const RISK_COLUMN_HEADER_COLORS: Record<string, string> = {
  prohibited: 'bg-red-50 text-red-700 border-red-200',
  high: 'bg-orange-50 text-orange-700 border-orange-200',
  limited: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  minimal: 'bg-green-50 text-green-700 border-green-200',
}

function getCellOpacity(count: number, maxCount: number): number {
  if (count === 0 || maxCount === 0) return 0
  const ratio = count / maxCount
  if (ratio <= 0.25) return 0.15
  if (ratio <= 0.5) return 0.3
  if (ratio <= 0.75) return 0.5
  return 0.75
}

function getCellTextColor(count: number, maxCount: number): string {
  if (count === 0) return 'text-gray-300'
  const ratio = count / maxCount
  return ratio > 0.5 ? 'text-white font-semibold' : 'text-gray-800'
}

function HeatmapCell({
  count,
  maxCount,
  hexColor,
}: {
  count: number
  maxCount: number
  hexColor: string
}) {
  const opacity = getCellOpacity(count, maxCount)
  const textColor = getCellTextColor(count, maxCount)

  return (
    <td
      className="px-3 py-2.5 text-center text-sm border border-gray-100 min-w-[72px]"
      style={{
        backgroundColor: opacity > 0 ? hexColor : undefined,
        opacity: opacity > 0 ? 1 : undefined,
        color: textColor,
        backgroundBlendMode: 'normal',
      }}
    >
      <span
        style={{
          backgroundColor: hexColor,
          opacity,
          position: 'absolute',
          inset: 0,
          borderRadius: 0,
          zIndex: 0,
        }}
        className="hidden"
      />
      <span className="relative">{count || ''}</span>
    </td>
  )
}

export default function RiskHeatmap({ data }: RiskHeatmapProps) {
  if (data.departments.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <h2 className="text-sm font-medium text-gray-700 mb-4">Mapa de Calor — Departamento × Riesgo</h2>
        <p className="text-sm text-gray-400">Sin datos para mostrar. Detectá herramientas para ver el mapa de calor.</p>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-gray-700">Mapa de Calor — Departamento × Riesgo</h2>
        <span className="text-xs text-gray-400">{data.totalTools} herramienta{data.totalTools !== 1 ? 's' : ''}</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="text-left text-xs font-medium text-gray-500 px-3 py-2 border-b border-gray-200 min-w-[140px]">
                Departamento
              </th>
              {RISK_LEVEL_ORDER.map((level) => (
                <th
                  key={level}
                  className={`text-center text-xs font-medium px-3 py-2 border-b border-gray-200 ${RISK_COLUMN_HEADER_COLORS[level]}`}
                >
                  {RISK_LEVEL_LABELS[level]}
                </th>
              ))}
              <th className="text-center text-xs font-medium text-gray-500 px-3 py-2 border-b border-gray-200 min-w-[60px]">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {data.departments.map((dept) => {
              const row = data.cells[dept]
              const total = RISK_LEVEL_ORDER.reduce((sum, level) => sum + row[level], 0)

              return (
                <tr key={dept} className="hover:bg-gray-50 transition-colors">
                  <td className={`px-3 py-2.5 text-sm border border-gray-100 ${dept === NO_DEPARTMENT_LABEL ? 'text-gray-400 italic' : 'text-gray-700 font-medium'}`}>
                    {dept}
                  </td>
                  {RISK_LEVEL_ORDER.map((level) => (
                    <HeatmapCell
                      key={`${dept}-${level}`}
                      count={row[level]}
                      maxCount={data.maxCount}
                      hexColor={RISK_LEVEL_COLORS[level]}
                    />
                  ))}
                  <td className="px-3 py-2.5 text-center text-sm font-medium text-gray-700 border border-gray-100 bg-gray-50">
                    {total}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
        <span className="text-xs text-gray-400">Intensidad:</span>
        <div className="flex items-center gap-1">
          {[0.15, 0.3, 0.5, 0.75].map((opacity) => (
            <div
              key={opacity}
              className="w-4 h-3 rounded-sm border border-gray-200"
              style={{ backgroundColor: '#6366f1', opacity }}
            />
          ))}
        </div>
        <span className="text-xs text-gray-400">Bajo → Alto</span>
      </div>
    </div>
  )
}
