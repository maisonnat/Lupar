// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Reports from '@options/components/reports/Reports'
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
  companyName: 'Test Corp',
  responsiblePerson: 'Juan Pérez',
  installationDate: '',
  badgeNotifications: true,
  customDomains: [],
  excludedDomains: [],
}

async function renderReports() {
  render(<Reports />)
  await waitFor(() => {
    expect(screen.getByText('Reportes de Cumplimiento')).toBeInTheDocument()
  })
}

describe('Reports', () => {
  beforeEach(() => {
    Object.keys(mockStore).forEach((k) => delete mockStore[k])
  })

  it('should show empty state when no discoveries', async () => {
    mockStore['ai_discoveries'] = []
    mockStore['app_settings'] = defaultSettings
    mockStore['activity_log'] = []

    await renderReports()

    expect(screen.getByText('Sin datos para generar')).toBeInTheDocument()
  })

  it('should show generate button when discoveries exist', async () => {
    mockStore['ai_discoveries'] = [makeDiscovery()]
    mockStore['app_settings'] = defaultSettings
    mockStore['activity_log'] = []

    await renderReports()

    expect(screen.getByText('Generar Reporte HTML')).toBeInTheDocument()
  })

  it('should generate report on button click', async () => {
    mockStore['ai_discoveries'] = [makeDiscovery()]
    mockStore['app_settings'] = defaultSettings
    mockStore['activity_log'] = []

    await renderReports()

    const btn = screen.getByTestId('generate-report-btn')
    fireEvent.click(btn)

    await waitFor(() => {
      expect(screen.getByText('Descargar HTML')).toBeInTheDocument()
    })

    expect(screen.getByText('Vista previa')).toBeInTheDocument()
    expect(screen.getByText('Reporte generado')).toBeInTheDocument()
  })

  it('should log activity on report generation', async () => {
    mockStore['ai_discoveries'] = [makeDiscovery()]
    mockStore['app_settings'] = defaultSettings
    mockStore['activity_log'] = []

    await renderReports()

    const btn = screen.getByTestId('generate-report-btn')
    fireEvent.click(btn)

    await waitFor(() => {
      expect(screen.getByText('Reporte generado')).toBeInTheDocument()
    })

    const log = mockStore['activity_log'] as Array<{ eventType: string; details: string }>
    expect(log).toBeDefined()
    expect(log.length).toBeGreaterThan(0)
    expect(log[log.length - 1].eventType).toBe('report_generated')
  })
})
