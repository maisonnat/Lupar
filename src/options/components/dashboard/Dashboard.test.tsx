// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import Dashboard from '@options/components/dashboard/Dashboard'
import { mockStore } from '../../../../vitest.setup'
import type { DiscoveryRecord } from '@shared/types/discovery'

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
    complianceStatus: {
      euAiAct: { assessment: 'pending', lastAssessedDate: null, dueDate: null, notes: '' },
      iso42001: { assessment: 'pending', lastAssessedDate: null, dueDate: null, notes: '' },
      coSb205: { assessment: 'not_applicable', lastAssessedDate: null, dueDate: null, notes: '' },
    },
    notes: '',
    tags: [],
    ...overrides,
  }
}

const defaultSettings = {
  version: '1.0.0',
  companyName: '',
  responsiblePerson: '',
  installationDate: '',
  badgeNotifications: true,
  customDomains: [],
  excludedDomains: [],
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

    await renderAndWait(<Dashboard />)

    expect(screen.getByText('Sin actividad registrada')).toBeInTheDocument()
  })
})
