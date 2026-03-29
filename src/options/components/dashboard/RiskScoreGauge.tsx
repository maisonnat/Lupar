import type { RiskScoreResult } from '@options/utils/risk-calculator'

interface RiskScoreGaugeProps {
  riskScore: RiskScoreResult
}

export default function RiskScoreGauge({ riskScore }: RiskScoreGaugeProps) {
  const { score, label, color } = riskScore

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5">
      <h2 className="text-sm font-medium text-gray-700 mb-4">Risk Score</h2>
      <div className="flex items-center gap-4">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-lg"
          style={{ backgroundColor: color }}
        >
          {score}
        </div>
        <div>
          <p className="text-lg font-semibold text-gray-900">{label}</p>
          <p className="text-xs text-gray-500">Puntuación agregada 0-100</p>
        </div>
      </div>
      <div className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
      <div className="flex justify-between mt-1 text-xs text-gray-400">
        <span>0</span>
        <span>25</span>
        <span>50</span>
        <span>75</span>
        <span>100</span>
      </div>
    </div>
  )
}
