import { useMemo } from 'react'
import { useStorage } from '@options/hooks/useStorage'
import { useMetrics } from '@options/hooks/useMetrics'
import { useSnapshots } from '@options/hooks/useSnapshots'
import { useMaturityMetrics } from '@options/hooks/useMaturityMetrics'
import { getUpcomingDeadlines, buildHeatmapData, detectSurge } from '@shared/utils/risk-calculator'
import MetricCard from './MetricCard'
import RiskScoreGauge from './RiskScoreGauge'
import ComplianceStatus from './ComplianceStatus'
import ComplianceTimeline from './ComplianceTimeline'
import RecentActivity from './RecentActivity'
import UpcomingDeadlines from './UpcomingDeadlines'
import RiskHeatmap from './RiskHeatmap'
import SurgeAlert from './SurgeAlert'
import MaturityWidget from './MaturityWidget'

const TotalIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
  </svg>
)

const HighRiskIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
)

const RiskScoreIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20V10" /><path d="M18 20V4" /><path d="M6 20v-4" />
  </svg>
)

const PendingIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><path d="M12 8v4" /><path d="M12 16h.01" />
  </svg>
)

export default function Dashboard() {
  const { discoveries, activityLog, settings } = useStorage()
  const metrics = useMetrics(discoveries, activityLog)
  const { snapshots, reload: reloadSnapshots } = useSnapshots()
  const maturityMetrics = useMaturityMetrics(discoveries, snapshots)

  const deadlines = useMemo(
    () => settings ? getUpcomingDeadlines(discoveries, settings) : [],
    [discoveries, settings],
  )

  const heatmapData = useMemo(
    () => buildHeatmapData(discoveries),
    [discoveries],
  )

  const surgeAlert = useMemo(
    () => detectSurge(discoveries),
    [discoveries],
  )

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          label="Total detectadas"
          value={metrics.totalDetected}
          icon={<TotalIcon />}
        />
        <MetricCard
          label="Alto Riesgo"
          value={metrics.highRiskCount}
          icon={<HighRiskIcon />}
          color="text-orange-600"
        />
        <MetricCard
          label="Risk Score"
          value={metrics.riskScore.score}
          icon={<RiskScoreIcon />}
          color={metrics.totalDetected > 0 ? undefined : 'text-gray-900'}
        />
        <MetricCard
          label="Pendientes"
          value={metrics.pendingCount}
          icon={<PendingIcon />}
          color="text-red-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <RiskScoreGauge riskScore={metrics.riskScore} />
        <ComplianceStatus complianceSummary={metrics.complianceSummary} />
      </div>

      <div className="mb-6">
        <RiskHeatmap data={heatmapData} />
      </div>

      <div className="mb-6">
        <SurgeAlert alert={surgeAlert} />
      </div>

      <div className="mb-6">
        <MaturityWidget metrics={maturityMetrics} />
      </div>

      <div className="mb-6">
        <UpcomingDeadlines deadlines={deadlines} />
      </div>

      <div className="mb-6">
        <ComplianceTimeline
          snapshots={snapshots}
          discoveries={discoveries}
          onSnapshotTaken={reloadSnapshots}
        />
      </div>

      <RecentActivity activities={metrics.recentActivity} />
    </div>
  )
}
