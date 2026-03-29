// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Settings from '@options/components/settings/Settings'
import { mockStore } from '../../../../vitest.setup'
import type { CustomDomainEntry } from '@shared/types/storage'

const defaultSettings = {
  version: '1.0.0',
  companyName: '',
  responsiblePerson: '',
  installationDate: '2026-01-01T00:00:00.000Z',
  badgeNotifications: true,
  customDomains: [] as CustomDomainEntry[],
  excludedDomains: [] as string[],
}

async function renderSettings() {
  render(<Settings />)
  await waitFor(() => {
    expect(screen.getByText('Configuración')).toBeInTheDocument()
  })
}

describe('Settings', () => {
  beforeEach(() => {
    Object.keys(mockStore).forEach((k) => delete mockStore[k])
  })

  it('should render all settings sections', async () => {
    mockStore['app_settings'] = { ...defaultSettings }
    mockStore['ai_discoveries'] = []
    mockStore['activity_log'] = []

    await renderSettings()

    expect(screen.getByText('Datos de la Organización')).toBeInTheDocument()
    expect(screen.getByText('Dominios Personalizados')).toBeInTheDocument()
    expect(screen.getByText('Dominios Excluidos')).toBeInTheDocument()
    expect(screen.getByText('Backup y Limpieza')).toBeInTheDocument()
  })

  it('should load company name and responsible person from storage', async () => {
    mockStore['app_settings'] = {
      ...defaultSettings,
      companyName: 'Test Corp',
      responsiblePerson: 'Ana García',
    }
    mockStore['ai_discoveries'] = []
    mockStore['activity_log'] = []

    await renderSettings()

    const inputs = screen.getAllByPlaceholderText('Ingrese el nombre...')
    await waitFor(() => {
      expect(inputs[0]).toHaveValue('Test Corp')
    })
    expect(inputs[1]).toHaveValue('Ana García')
  })

  it('should save company name on blur', async () => {
    mockStore['app_settings'] = { ...defaultSettings }
    mockStore['ai_discoveries'] = []
    mockStore['activity_log'] = []

    await renderSettings()

    const inputs = screen.getAllByPlaceholderText('Ingrese el nombre...')
    fireEvent.change(inputs[0], { target: { value: 'Mi Empresa' } })
    fireEvent.blur(inputs[0])

    await waitFor(() => {
      const stored = mockStore['app_settings'] as typeof defaultSettings
      expect(stored.companyName).toBe('Mi Empresa')
    })
  })

  it('should save responsible person on blur', async () => {
    mockStore['app_settings'] = { ...defaultSettings }
    mockStore['ai_discoveries'] = []
    mockStore['activity_log'] = []

    await renderSettings()

    const inputs = screen.getAllByPlaceholderText('Ingrese el nombre...')
    fireEvent.change(inputs[1], { target: { value: 'Carlos López' } })
    fireEvent.blur(inputs[1])

    await waitFor(() => {
      const stored = mockStore['app_settings'] as typeof defaultSettings
      expect(stored.responsiblePerson).toBe('Carlos López')
    })
  })

  it('should toggle badge notifications and persist', async () => {
    mockStore['app_settings'] = {
      ...defaultSettings,
      badgeNotifications: true,
    }
    mockStore['ai_discoveries'] = []
    mockStore['activity_log'] = []

    await renderSettings()

    const toggle = screen.getByRole('switch')
    expect(toggle).toHaveAttribute('aria-checked', 'true')

    fireEvent.click(toggle)

    await waitFor(() => {
      const stored = mockStore['app_settings'] as typeof defaultSettings
      expect(stored.badgeNotifications).toBe(false)
    })
  })

  it('should add a custom domain', async () => {
    mockStore['app_settings'] = { ...defaultSettings }
    mockStore['ai_discoveries'] = []
    mockStore['activity_log'] = []

    await renderSettings()

    const domainInputs = screen.getAllByPlaceholderText('dominio.com')
    fireEvent.change(domainInputs[0], { target: { value: 'internal-ai.com' } })
    fireEvent.change(screen.getByPlaceholderText('Nombre de herramienta'), {
      target: { value: 'Internal AI' },
    })
    fireEvent.click(screen.getByText('Agregar Dominio'))

    await waitFor(() => {
      const stored = mockStore['app_settings'] as typeof defaultSettings
      expect(stored.customDomains).toHaveLength(1)
      expect(stored.customDomains[0].domain).toBe('internal-ai.com')
      expect(stored.customDomains[0].toolName).toBe('Internal AI')
    })
  })

  it('should show error when adding empty domain', async () => {
    mockStore['app_settings'] = { ...defaultSettings }
    mockStore['ai_discoveries'] = []
    mockStore['activity_log'] = []

    await renderSettings()

    fireEvent.click(screen.getByText('Agregar Dominio'))

    await waitFor(() => {
      expect(
        screen.getByText('Ingrese un dominio válido'),
      ).toBeInTheDocument()
    })
  })

  it('should show error when adding duplicate domain', async () => {
    mockStore['app_settings'] = {
      ...defaultSettings,
      customDomains: [
        {
          domain: 'internal-ai.com',
          toolName: 'Internal AI',
          category: 'chatbot' as const,
          defaultRiskLevel: 'limited' as const,
        },
      ],
    }
    mockStore['ai_discoveries'] = []
    mockStore['activity_log'] = []

    await renderSettings()

    const domainInputs = screen.getAllByPlaceholderText('dominio.com')
    fireEvent.change(domainInputs[0], { target: { value: 'internal-ai.com' } })
    fireEvent.change(screen.getByPlaceholderText('Nombre de herramienta'), {
      target: { value: 'Internal AI' },
    })
    fireEvent.click(screen.getByText('Agregar Dominio'))

    await waitFor(() => {
      expect(
        screen.getByText('Este dominio ya está en la lista'),
      ).toBeInTheDocument()
    })
  })

  it('should remove a custom domain', async () => {
    mockStore['app_settings'] = {
      ...defaultSettings,
      customDomains: [
        {
          domain: 'internal-ai.com',
          toolName: 'Internal AI',
          category: 'chatbot' as const,
          defaultRiskLevel: 'limited' as const,
        },
      ],
    }
    mockStore['ai_discoveries'] = []
    mockStore['activity_log'] = []

    await renderSettings()

    expect(screen.getByText('Internal AI')).toBeInTheDocument()

    const removeButtons = screen.getAllByText('Eliminar')
    fireEvent.click(removeButtons[0])

    await waitFor(() => {
      const stored = mockStore['app_settings'] as typeof defaultSettings
      expect(stored.customDomains).toHaveLength(0)
    })
  })

  it('should strip protocol and path from custom domain', async () => {
    mockStore['app_settings'] = { ...defaultSettings }
    mockStore['ai_discoveries'] = []
    mockStore['activity_log'] = []

    await renderSettings()

    const domainInputs = screen.getAllByPlaceholderText('dominio.com')
    fireEvent.change(domainInputs[0], {
      target: { value: 'https://my-tool.company.com/chat' },
    })
    fireEvent.change(screen.getByPlaceholderText('Nombre de herramienta'), {
      target: { value: 'My Tool' },
    })
    fireEvent.click(screen.getByText('Agregar Dominio'))

    await waitFor(() => {
      const stored = mockStore['app_settings'] as typeof defaultSettings
      expect(stored.customDomains[0].domain).toBe('my-tool.company.com')
    })
  })

  it('should add an excluded domain', async () => {
    mockStore['app_settings'] = { ...defaultSettings }
    mockStore['ai_discoveries'] = []
    mockStore['activity_log'] = []

    await renderSettings()

    const domainInputs = screen.getAllByPlaceholderText('dominio.com')
    fireEvent.change(domainInputs[1], { target: { value: 'google.com' } })
    fireEvent.click(screen.getByText('Agregar'))

    await waitFor(() => {
      const stored = mockStore['app_settings'] as typeof defaultSettings
      expect(stored.excludedDomains).toContain('google.com')
    })
  })

  it('should show error when adding duplicate excluded domain', async () => {
    mockStore['app_settings'] = {
      ...defaultSettings,
      excludedDomains: ['google.com'],
    }
    mockStore['ai_discoveries'] = []
    mockStore['activity_log'] = []

    await renderSettings()

    const domainInputs = screen.getAllByPlaceholderText('dominio.com')
    fireEvent.change(domainInputs[1], { target: { value: 'google.com' } })
    fireEvent.click(screen.getByText('Agregar'))

    await waitFor(() => {
      expect(
        screen.getByText('Este dominio ya está excluido'),
      ).toBeInTheDocument()
    })
  })

  it('should remove an excluded domain', async () => {
    mockStore['app_settings'] = {
      ...defaultSettings,
      excludedDomains: ['google.com'],
    }
    mockStore['ai_discoveries'] = []
    mockStore['activity_log'] = []

    await renderSettings()

    expect(screen.getByText('google.com')).toBeInTheDocument()

    const removeButtons = screen.getAllByText('Eliminar')
    const excludedSection = screen
      .getAllByText('Dominios Excluidos')
      .find((el) => el.tagName === 'H2')
    const excludedRemoveBtn = removeButtons.find((btn) => {
      const section = btn.closest('section')
      return section?.contains(excludedSection!)
    })
    expect(excludedRemoveBtn).toBeTruthy()
    fireEvent.click(excludedRemoveBtn!)

    await waitFor(() => {
      const stored = mockStore['app_settings'] as typeof defaultSettings
      expect(stored.excludedDomains).toHaveLength(0)
    })
  })

  it('should show clear confirmation modal', async () => {
    mockStore['app_settings'] = { ...defaultSettings }
    mockStore['ai_discoveries'] = []
    mockStore['activity_log'] = []

    await renderSettings()

    fireEvent.click(screen.getByText('Limpiar Todo'))

    expect(screen.getByText('Confirmar Limpieza')).toBeInTheDocument()
    expect(
      screen.getByText(/Esta acción eliminará TODOS los datos/),
    ).toBeInTheDocument()
    expect(screen.getByText('Sí, eliminar todo')).toBeInTheDocument()
    expect(screen.getByText('Cancelar')).toBeInTheDocument()
  })

  it('should cancel clear operation', async () => {
    mockStore['app_settings'] = {
      ...defaultSettings,
      companyName: 'Keep This',
    }
    mockStore['ai_discoveries'] = [{ id: 'test-1' }]
    mockStore['activity_log'] = []

    await renderSettings()

    fireEvent.click(screen.getByText('Limpiar Todo'))
    fireEvent.click(screen.getByText('Cancelar'))

    await waitFor(() => {
      expect(
        screen.queryByText('Confirmar Limpieza'),
      ).not.toBeInTheDocument()
    })

    expect(mockStore['app_settings']).toBeDefined()
    const stored = mockStore['app_settings'] as typeof defaultSettings
    expect(stored.companyName).toBe('Keep This')
  })

  it('should clear all data on confirmation', async () => {
    mockStore['app_settings'] = {
      ...defaultSettings,
      companyName: 'Delete Me',
      customDomains: [
        {
          domain: 'test.com',
          toolName: 'Test',
          category: 'chatbot' as const,
          defaultRiskLevel: 'limited' as const,
        },
      ],
    }
    mockStore['ai_discoveries'] = [{ id: 'disc-1' }]
    mockStore['activity_log'] = [{ id: 'log-1' }]

    await renderSettings()

    fireEvent.click(screen.getByText('Limpiar Todo'))
    fireEvent.click(screen.getByText('Sí, eliminar todo'))

    await waitFor(() => {
      expect(
        screen.getByText('Todos los datos han sido eliminados'),
      ).toBeInTheDocument()
    })

    const storedSettings = mockStore['app_settings'] as typeof defaultSettings
    expect(storedSettings.companyName).toBe('')
    expect(storedSettings.customDomains).toHaveLength(0)
    expect(mockStore['ai_discoveries']).toEqual([])
    expect(mockStore['activity_log']).toEqual([])
  })

  it('should export backup as JSON download', async () => {
    mockStore['app_settings'] = { ...defaultSettings }
    mockStore['ai_discoveries'] = [{ id: 'test-1' }]
    mockStore['activity_log'] = []

    const mockUrl = 'blob:mock-export-url'
    const origCreateObjectURL = URL.createObjectURL
    const origRevokeObjectURL = URL.revokeObjectURL
    URL.createObjectURL = vi.fn(() => mockUrl)
    URL.revokeObjectURL = vi.fn()

    await renderSettings()

    fireEvent.click(screen.getByText('Exportar Backup'))

    await waitFor(() => {
      expect(screen.getByText('Backup exportado correctamente')).toBeInTheDocument()
    })

    expect(URL.createObjectURL).toHaveBeenCalled()

    URL.createObjectURL = origCreateObjectURL
    URL.revokeObjectURL = origRevokeObjectURL
  })

  it('should import valid backup', async () => {
    mockStore['app_settings'] = { ...defaultSettings }
    mockStore['ai_discoveries'] = []
    mockStore['activity_log'] = []

    await renderSettings()

    const backupData = {
      ai_discoveries: [{ id: 'imported-1', domain: 'test.com' }],
      app_settings: {
        ...defaultSettings,
        companyName: 'Imported Corp',
      },
      activity_log: [],
    }

    const json = JSON.stringify(backupData)
    const file = new File([json], 'backup.json', {
      type: 'application/json',
    })
    Object.defineProperty(file, 'text', {
      value: () => Promise.resolve(json),
      writable: true,
    })

    const fileInput = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement

    fireEvent.change(fileInput, { target: { files: [file] } })

    await waitFor(() => {
      expect(
        screen.getByText('Backup importado correctamente'),
      ).toBeInTheDocument()
    })

    const storedSettings = mockStore['app_settings'] as typeof defaultSettings
    expect(storedSettings.companyName).toBe('Imported Corp')
  })

  it('should reject invalid backup missing ai_discoveries', async () => {
    mockStore['app_settings'] = { ...defaultSettings }
    mockStore['ai_discoveries'] = []
    mockStore['activity_log'] = []

    await renderSettings()

    const badData = { app_settings: {}, activity_log: [] }
    const json = JSON.stringify(badData)
    const file = new File([json], 'bad.json', {
      type: 'application/json',
    })
    Object.defineProperty(file, 'text', {
      value: () => Promise.resolve(json),
      writable: true,
    })

    const fileInput = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement

    fireEvent.change(fileInput, { target: { files: [file] } })

    await waitFor(() => {
      expect(
        screen.getByText('Backup inválido: falta ai_discoveries'),
      ).toBeInTheDocument()
    })
  })

  it('should reject backup with invalid JSON', async () => {
    mockStore['app_settings'] = { ...defaultSettings }
    mockStore['ai_discoveries'] = []
    mockStore['activity_log'] = []

    await renderSettings()

    const file = new File(['not json'], 'bad.json', {
      type: 'application/json',
    })
    Object.defineProperty(file, 'text', {
      value: () => Promise.resolve('not json'),
      writable: true,
    })

    const fileInput = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement

    fireEvent.change(fileInput, { target: { files: [file] } })

    await waitFor(() => {
      expect(
        screen.getByText('Error al importar backup: archivo inválido'),
      ).toBeInTheDocument()
    })
  })

  it('should show empty state for custom domains and excluded domains', async () => {
    mockStore['app_settings'] = { ...defaultSettings }
    mockStore['ai_discoveries'] = []
    mockStore['activity_log'] = []

    await renderSettings()

    expect(
      screen.getByText('No hay dominios personalizados configurados'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('No hay dominios excluidos configurados'),
    ).toBeInTheDocument()
  })
})
