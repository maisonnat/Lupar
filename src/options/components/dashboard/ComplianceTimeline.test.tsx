// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ComplianceTimeline from '@options/components/dashboard/ComplianceTimeline'
import { mockStore } from '../../../../vitest.setup'
import type { DiscoveryRecord } from '@shared/types/discovery'
import type { ComplianceSnapshot } from '@shared/types/compliance'
import { createMockComplianceStatus } from '@test-utils/mock-helpers'

function makeDiscovery(overrides: Partial<DiscoveryRecord> = {}): DiscoveryRecord {
  return {
    id: 'test-1',
    domain: 'chatgpt.com',
    toolName: 'ChatGPT',
    category: 'chatbot',
    defaultRiskLevel: 'limited',
    userRiskLevel: null,
    status: 'detected',
    department: null,
    firstSeen: '2026-03-15T09:00:00.000Z',
    lastSeen: '2026-03-15T09:00:00.000Z',
    visitCount: 5,
    complianceStatus: createMockComplianceStatus(),
    notes: '',
    tags: [],
    auditTrail: [],
    ...overrides,
  }
}

function makeSnapshot(overrides: Partial<ComplianceSnapshot> = {}): ComplianceSnapshot {
  return {
    id: 'snap-1',
    date: '2026-03-15T12:00:00.000Z',
    trigger: 'manual',
    overallScore: 50,
    totalTools: 3,
    totalGaps: 10,
    regulationBreakdown: {
      euAiAct: { complete: 4, pending: 2, overdue: 0, notApplicable: 2, total: 8 },
      iso42001: { complete: 2, pending: 3, overdue: 0, notApplicable: 0, total: 5 },
      coSb205: { complete: 0, pending: 0, overdue: 0, notApplicable: 5, total: 5 },
    },
    ...overrides,
  }
}

describe('ComplianceTimeline', () => {
  beforeEach(() => {
    Object.keys(mockStore).forEach((k) => delete mockStore[k])
    mockStore['compliance_snapshots'] = []
  })

  it('should render empty state when no snapshots', () => {
    render(
      <ComplianceTimeline
        snapshots={[]}
        discoveries={[makeDiscovery()]}
      />,
    )

    expect(screen.getByText('Sin snapshots de cumplimiento')).toBeInTheDocument()
  })

  it('should show single snapshot score', () => {
    render(
      <ComplianceTimeline
        snapshots={[makeSnapshot({ overallScore: 75 })]}
        discoveries={[makeDiscovery()]}
      />,
    )

    expect(screen.getByText('75%')).toBeInTheDocument()
  })

  it('should show score delta with multiple snapshots', () => {
    render(
      <ComplianceTimeline
        snapshots={[
          makeSnapshot({ id: '2', date: '2026-03-20T12:00:00.000Z', overallScore: 60 }),
          makeSnapshot({ id: '1', date: '2026-03-15T12:00:00.000Z', overallScore: 50 }),
        ]}
        discoveries={[makeDiscovery()]}
      />,
    )

    expect(screen.getAllByText('60%').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByTestId('score-delta')).toHaveTextContent('+10%')
  })

  it('should show negative score delta', () => {
    render(
      <ComplianceTimeline
        snapshots={[
          makeSnapshot({ id: '2', date: '2026-03-20T12:00:00.000Z', overallScore: 40 }),
          makeSnapshot({ id: '1', date: '2026-03-15T12:00:00.000Z', overallScore: 50 }),
        ]}
        discoveries={[makeDiscovery()]}
      />,
    )

    expect(screen.getByTestId('score-delta')).toHaveTextContent('-10%')
  })

  it('should show zero score delta', () => {
    render(
      <ComplianceTimeline
        snapshots={[
          makeSnapshot({ id: '2', date: '2026-03-20T12:00:00.000Z', overallScore: 50 }),
          makeSnapshot({ id: '1', date: '2026-03-15T12:00:00.000Z', overallScore: 50 }),
        ]}
        discoveries={[makeDiscovery()]}
      />,
    )

    expect(screen.getByTestId('score-delta')).toHaveTextContent('0%')
  })

  it('should render chart when 2+ snapshots', () => {
    render(
      <ComplianceTimeline
        snapshots={[
          makeSnapshot({ id: '2', date: '2026-03-20T12:00:00.000Z', overallScore: 60 }),
          makeSnapshot({ id: '1', date: '2026-03-15T12:00:00.000Z', overallScore: 50 }),
        ]}
        discoveries={[makeDiscovery()]}
      />,
    )

    expect(screen.getByTestId('score-chart')).toBeInTheDocument()
  })

  it('should not render chart with single snapshot', () => {
    render(
      <ComplianceTimeline
        snapshots={[makeSnapshot()]}
        discoveries={[makeDiscovery()]}
      />,
    )

    expect(screen.queryByTestId('score-chart')).not.toBeInTheDocument()
  })

  it('should show trigger labels', () => {
    render(
      <ComplianceTimeline
        snapshots={[
          makeSnapshot({ id: '2', date: '2026-03-20T12:00:00.000Z', trigger: 'report', overallScore: 60 }),
          makeSnapshot({ id: '1', date: '2026-03-15T12:00:00.000Z', trigger: 'manual', overallScore: 50 }),
        ]}
        discoveries={[makeDiscovery()]}
      />,
    )

    expect(screen.getByText('Reporte')).toBeInTheDocument()
    expect(screen.getByText('Manual')).toBeInTheDocument()
  })

  it('should disable manual snapshot button when no discoveries', () => {
    render(
      <ComplianceTimeline
        snapshots={[]}
        discoveries={[]}
      />,
    )

    const btn = screen.getByTestId('manual-snapshot-btn')
    expect(btn).toBeDisabled()
  })

  it('should call onSnapshotTaken after manual snapshot', async () => {
    const onSnapshotTaken = vi.fn()
    mockStore['ai_discoveries'] = [makeDiscovery()]

    render(
      <ComplianceTimeline
        snapshots={[]}
        discoveries={[makeDiscovery()]}
        onSnapshotTaken={onSnapshotTaken}
      />,
    )

    const btn = screen.getByTestId('manual-snapshot-btn')
    fireEvent.click(btn)

    await waitFor(() => {
      expect(onSnapshotTaken).toHaveBeenCalledOnce()
    })
  })

  it('should show snapshot count', () => {
    render(
      <ComplianceTimeline
        snapshots={[
          makeSnapshot({ id: '1', overallScore: 50 }),
          makeSnapshot({ id: '2', date: '2026-03-20T12:00:00.000Z', overallScore: 60 }),
          makeSnapshot({ id: '3', date: '2026-03-25T12:00:00.000Z', overallScore: 70 }),
        ]}
        discoveries={[makeDiscovery()]}
      />,
    )

    expect(screen.getByText('3 snapshots')).toBeInTheDocument()
  })

  it('should show tool count in snapshot list', () => {
    render(
      <ComplianceTimeline
        snapshots={[
          makeSnapshot({ id: '2', date: '2026-03-20T12:00:00.000Z', overallScore: 60, totalTools: 5 }),
          makeSnapshot({ id: '1', date: '2026-03-15T12:00:00.000Z', overallScore: 50, totalTools: 3 }),
        ]}
        discoveries={[makeDiscovery()]}
      />,
    )

    expect(screen.getByText('5 herramientas')).toBeInTheDocument()
    expect(screen.getByText('3 herramientas')).toBeInTheDocument()
  })
})
