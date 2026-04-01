// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import Dashboard from '@options/components/dashboard/Dashboard'
import { mockStore } from '../../../../vitest.setup'
import type { DiscoveryRecord } from '@shared/types/discovery'
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
    detectionEvents: [],
    ...overrides,
  }
}

const defaultSettings = {
  version: '1.0.0',
  companyName: '',
  responsiblePerson: '',
  installationDate: '',
  badgeNotifications: true,
    requireDepartment: false,
    snapshotFrequencyDays: 0,
    timezone: 'America/Argentina/Buenos_Aires',
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
    alertConfig: {
      assessmentDueDays: [30, 15, 7, 1],
      newDetectionRiskLevels: ['prohibited', 'high', 'limited', 'minimal'],
      maxUnassessedCount: 10,
    },
    adminProfile: {
      adminName: '',
      adminEmail: '',
      adminRole: 'compliance_officer',
      department: '',
    },
    retentionPolicy: {
      discoveryRetentionDays: 365,
      snapshotRetentionDays: 730,
      activityLogRetentionDays: 180,
    },
    exportConfig: {
      defaultFormat: 'html',
      includeInventory: true,
      includeComplianceMap: true,
      includeRecommendations: true,
      includeAuditTrail: true,
      defaultDateRangeDays: 0,
    },
  }

async function renderAndWait(ui: React.ReactElement) {
  render(ui)
  await waitFor(() => screen.getByText('Dashboard'))
}

describe('Dashboard', () => {
  beforeEach(() => {
    Object.keys(mockStore).forEach((k) => delete mockStore[k])
  })

  it('should render all metric cards', async () => {
    mockStore['ai_discoveries'] = []
    mockStore['app_settings'] = defaultSettings
    mockStore['activity_log'] = []
    mockStore['compliance_snapshots'] = []

    await renderAndWait(<Dashboard />)

    expect(screen.getAllByText('Total detectadas')).toHaveLength(1)
    expect(screen.getAllByText('Alto Riesgo')).toHaveLength(1)
    expect(screen.getAllByText('Pendientes')).toHaveLength(1)
  })

  it('should show correct counts with discoveries', async () => {
    mockStore['ai_discoveries'] = [
      makeDiscovery({ id: '1', domain: 'chatgpt.com', defaultRiskLevel: 'limited', status: 'detected' }),
      makeDiscovery({ id: '2', domain: 'hirevue.com', defaultRiskLevel: 'high', status: 'detected' }),
      makeDiscovery({ id: '3', domain: 'claude.ai', defaultRiskLevel: 'limited', status: 'confirmed' }),
    ]
    mockStore['app_settings'] = defaultSettings
    mockStore['activity_log'] = []
    mockStore['compliance_snapshots'] = []

    await renderAndWait(<Dashboard />)

    await waitFor(() => {
      expect(screen.getByText('Total detectadas')).toBeInTheDocument()
    })
    const values = screen.getAllByText('3')
    expect(values.length).toBeGreaterThanOrEqual(1)
  })

  it('should render compliance status for 3 regulations', async () => {
    mockStore['ai_discoveries'] = []
    mockStore['app_settings'] = defaultSettings
    mockStore['activity_log'] = []
    mockStore['compliance_snapshots'] = []

    await renderAndWait(<Dashboard />)

    expect(screen.getByText('EU AI Act')).toBeInTheDocument()
    expect(screen.getByText('ISO 42001')).toBeInTheDocument()
    expect(screen.getByText('CO SB 205')).toBeInTheDocument()
  })

  it('should show recent activity entries', async () => {
    mockStore['ai_discoveries'] = []
    mockStore['app_settings'] = defaultSettings
    mockStore['activity_log'] = [
      { id: 'log-1', timestamp: new Date().toISOString(), eventType: 'new_detection', domain: 'chatgpt.com', details: 'Nueva herramienta: ChatGPT' },
      { id: 'log-2', timestamp: new Date().toISOString(), eventType: 'status_changed', domain: 'claude.ai', details: 'Estado actualizado: Claude' },
    ]
    mockStore['compliance_snapshots'] = []

    await renderAndWait(<Dashboard />)

    await waitFor(() => {
      expect(screen.getByText('Nueva herramienta: ChatGPT')).toBeInTheDocument()
    })
    expect(screen.getByText('Estado actualizado: Claude')).toBeInTheDocument()
  })

  it('should show empty state when no discoveries', async () => {
    mockStore['ai_discoveries'] = []
    mockStore['app_settings'] = defaultSettings
    mockStore['activity_log'] = []
    mockStore['compliance_snapshots'] = []

    await renderAndWait(<Dashboard />)

    expect(screen.getByText('Sin actividad registrada')).toBeInTheDocument()
  })
})
