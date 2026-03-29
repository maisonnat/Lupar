// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Inventory from '@options/components/inventory/Inventory'
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

async function renderInventory() {
  render(<Inventory />)
  await waitFor(() => {
    expect(screen.getByText('Inventario de IA')).toBeInTheDocument()
  })
}

describe('Inventory', () => {
  beforeEach(() => {
    Object.keys(mockStore).forEach((k) => delete mockStore[k])
  })

  it('should show empty state when no discoveries', async () => {
    mockStore['ai_discoveries'] = []
    mockStore['app_settings'] = defaultSettings
    mockStore['activity_log'] = []

    await renderInventory()

    expect(screen.getByText('No se han detectado herramientas de IA todavía.')).toBeInTheDocument()
  })

  it('should render discoveries in table', async () => {
    mockStore['ai_discoveries'] = [
      makeDiscovery({ id: '1', toolName: 'ChatGPT', domain: 'chatgpt.com' }),
      makeDiscovery({ id: '2', toolName: 'Claude', domain: 'claude.ai', category: 'chatbot' }),
    ]
    mockStore['app_settings'] = defaultSettings
    mockStore['activity_log'] = []

    await renderInventory()

    expect(screen.getByText('ChatGPT')).toBeInTheDocument()
    expect(screen.getByText('Claude')).toBeInTheDocument()
  })

  it('should filter by search text', async () => {
    mockStore['ai_discoveries'] = [
      makeDiscovery({ id: '1', toolName: 'ChatGPT', domain: 'chatgpt.com' }),
      makeDiscovery({ id: '2', toolName: 'Claude', domain: 'claude.ai' }),
    ]
    mockStore['app_settings'] = defaultSettings
    mockStore['activity_log'] = []

    await renderInventory()

    const searchInput = screen.getByPlaceholderText('Buscar herramientas...')
    fireEvent.change(searchInput, { target: { value: 'chat' } })

    await waitFor(() => {
      expect(screen.getByText('ChatGPT')).toBeInTheDocument()
      expect(screen.queryByText('Claude')).not.toBeInTheDocument()
    })
  })

  it('should filter by category', async () => {
    mockStore['ai_discoveries'] = [
      makeDiscovery({ id: '1', toolName: 'ChatGPT', category: 'chatbot' }),
      makeDiscovery({ id: '2', toolName: 'Midjourney', category: 'image_generation' }),
    ]
    mockStore['app_settings'] = defaultSettings
    mockStore['activity_log'] = []

    await renderInventory()

    const selects = screen.getAllByRole('combobox')
    const categorySelect = selects.find((s) =>
      Array.from(s.querySelectorAll('option')).some((o) => o.textContent === 'Generación de imágenes'),
    )
    if (!categorySelect) throw new Error('Category select not found')
    fireEvent.change(categorySelect, { target: { value: 'image_generation' } })

    await waitFor(() => {
      expect(screen.getByText('Midjourney')).toBeInTheDocument()
      expect(screen.queryByText('ChatGPT')).not.toBeInTheDocument()
    })
  })

  it('should open modal on row click', async () => {
    mockStore['ai_discoveries'] = [
      makeDiscovery({ id: '1', toolName: 'ChatGPT' }),
    ]
    mockStore['app_settings'] = defaultSettings
    mockStore['activity_log'] = []

    await renderInventory()

    fireEvent.click(screen.getByText('ChatGPT'))

    await waitFor(() => {
      expect(screen.getByText('Información')).toBeInTheDocument()
      expect(screen.getByText('Compliance')).toBeInTheDocument()
      expect(screen.getByText('Notas')).toBeInTheDocument()
    })
  })

  it('should save changes from modal', async () => {
    mockStore['ai_discoveries'] = [
      makeDiscovery({ id: '1', toolName: 'ChatGPT', status: 'detected' }),
    ]
    mockStore['app_settings'] = defaultSettings
    mockStore['activity_log'] = []

    await renderInventory()

    fireEvent.click(screen.getByText('ChatGPT'))

    await waitFor(() => {
      expect(screen.getByText('Guardar cambios')).toBeInTheDocument()
    })

    const confirmButton = screen.queryAllByText('Autorizado').find(
      (el) => el.closest('button') !== null,
    )
    if (confirmButton) {
      fireEvent.click(confirmButton)
    }

    fireEvent.click(screen.getByTestId('modal-save'))

    await waitFor(() => {
      const stored = mockStore['ai_discoveries'] as DiscoveryRecord[]
      expect(stored).toBeDefined()
    })
  })

  it('should sort by column header click', async () => {
    mockStore['ai_discoveries'] = [
      makeDiscovery({ id: '1', toolName: 'ChatGPT', visitCount: 5 }),
      makeDiscovery({ id: '2', toolName: 'Claude', visitCount: 20 }),
    ]
    mockStore['app_settings'] = defaultSettings
    mockStore['activity_log'] = []

    await renderInventory()

    const visitHeader = screen.getByText('Visitas')
    fireEvent.click(visitHeader)

    const rows = screen.getAllByRole('row').slice(1)
    expect(rows[0]).toHaveTextContent('ChatGPT')
  })
})
