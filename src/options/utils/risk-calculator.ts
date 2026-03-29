import type { RiskLevel } from '@shared/types/domain'
import type { DiscoveryStatus } from '@shared/types/discovery'
import type { DiscoveryRecord } from '@shared/types/discovery'
import { RISK_WEIGHTS, STATUS_WEIGHTS, RISK_THRESHOLDS } from '@shared/constants/risk-levels'

export interface RiskScoreResult {
  score: number
  label: string
  color: string
}

export function calculateRiskScore(discoveries: DiscoveryRecord[]): RiskScoreResult {
  if (discoveries.length === 0) {
    return { score: 0, label: 'Bajo', color: '#22c55e' }
  }

  const rawScore = discoveries.reduce((sum, d) => {
    const effectiveRisk: RiskLevel = d.userRiskLevel ?? d.defaultRiskLevel
    const riskWeight = RISK_WEIGHTS[effectiveRisk]
    const statusWeight = STATUS_WEIGHTS[d.status]
    return sum + riskWeight * statusWeight
  }, 0)

  const maxScore = discoveries.reduce((sum, d) => {
    const effectiveRisk: RiskLevel = d.userRiskLevel ?? d.defaultRiskLevel
    return sum + RISK_WEIGHTS[effectiveRisk] * 1.5
  }, 0)

  const normalized = maxScore > 0 ? Math.round((rawScore / maxScore) * 100) : 0
  const clamped = Math.min(100, Math.max(0, normalized))

  const threshold = RISK_THRESHOLDS.find(
    (t) => clamped >= t.min && clamped <= t.max,
  ) ?? RISK_THRESHOLDS[0]

  return {
    score: clamped,
    label: threshold.label,
    color: threshold.color,
  }
}

export function getRiskLevelColor(level: RiskLevel): string {
  const colors: Record<RiskLevel, string> = {
    prohibited: '#ef4444',
    high: '#f97316',
    limited: '#eab308',
    minimal: '#22c55e',
  }
  return colors[level]
}

export function getStatusLabel(status: DiscoveryStatus): string {
  const labels: Record<DiscoveryStatus, string> = {
    detected: 'Detectado',
    confirmed: 'Confirmado',
    dismissed: 'Descartado',
    authorized: 'Autorizado',
  }
  return labels[status]
}

export function countByRiskLevel(
  discoveries: DiscoveryRecord[],
): Record<RiskLevel, number> {
  return {
    prohibited: discoveries.filter((d) => (d.userRiskLevel ?? d.defaultRiskLevel) === 'prohibited').length,
    high: discoveries.filter((d) => (d.userRiskLevel ?? d.defaultRiskLevel) === 'high').length,
    limited: discoveries.filter((d) => (d.userRiskLevel ?? d.defaultRiskLevel) === 'limited').length,
    minimal: discoveries.filter((d) => (d.userRiskLevel ?? d.defaultRiskLevel) === 'minimal').length,
  }
}

export function countByStatus(
  discoveries: DiscoveryRecord[],
): Record<DiscoveryStatus, number> {
  return {
    detected: discoveries.filter((d) => d.status === 'detected').length,
    confirmed: discoveries.filter((d) => d.status === 'confirmed').length,
    dismissed: discoveries.filter((d) => d.status === 'dismissed').length,
    authorized: discoveries.filter((d) => d.status === 'authorized').length,
  }
}
