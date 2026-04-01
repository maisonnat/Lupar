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
  requireDepartment: false,
  snapshotFrequencyDays: 0,
  timezone: 'America/Argentina/Buenos_Aires',
  dateFormat: 'DD/MM/YYYY',
  customDomains: [] as CustomDomainEntry[],
  excludedDomains: [] as string[],
  regulationConfig: {
    euAiAct: { enabled: true, customDueDateOffsetDays: 90 },
    iso42001: { enabled: true, customDueDateOffsetDays: 90 },
    coSb205: { enabled: true, customDueDateOffsetDays: 90 },
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

    const toggles = screen.getAllByRole('switch')
    const toggle = toggles[0]
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
        screen.getByText('Ingrese un dominio o patrón válido'),
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

  describe('Audit Mode', () => {
    it('should show audit mode toggle', async () => {
      mockStore['app_settings'] = { ...defaultSettings }
      mockStore['ai_discoveries'] = []
      mockStore['activity_log'] = []

      await renderSettings()

      expect(screen.getByTestId('audit-mode-toggle')).toBeInTheDocument()
      expect(screen.getByText('Activar modo auditor')).toBeInTheDocument()
    })

    it('should show confirmation modal when activating audit mode', async () => {
      mockStore['app_settings'] = { ...defaultSettings }
      mockStore['ai_discoveries'] = []
      mockStore['activity_log'] = []

      await renderSettings()

      const toggles = screen.getAllByRole('switch')
      fireEvent.click(toggles[2])

      await waitFor(() => {
        expect(screen.getByTestId('activate-audit-mode-btn')).toBeInTheDocument()
      })
      expect(screen.getByTestId('activate-audit-mode-btn')).toBeInTheDocument()
    })

    it('should activate audit mode and persist', async () => {
      mockStore['app_settings'] = {
        ...defaultSettings,
        responsiblePerson: 'Carlos',
      }
      mockStore['ai_discoveries'] = []
      mockStore['activity_log'] = []

      await renderSettings()

      const toggles = screen.getAllByRole('switch')
      fireEvent.click(toggles[2])

      await waitFor(() => {
        expect(screen.getByTestId('activate-audit-mode-btn')).toBeInTheDocument()
      })
      fireEvent.click(screen.getByTestId('activate-audit-mode-btn'))

      await waitFor(() => {
        const stored = mockStore['app_settings'] as typeof defaultSettings
        expect(stored.auditModeConfig.auditMode).toBe(true)
        expect(stored.auditModeConfig.auditModeActivatedBy).toBe('Carlos')
        expect(stored.auditModeConfig.auditModeActivatedAt).not.toBeNull()
      })
    })

    it('should disable Import and Clear buttons when audit mode is active', async () => {
      mockStore['app_settings'] = {
        ...defaultSettings,
        auditModeConfig: {
          auditMode: true,
          auditModeActivatedAt: '2026-03-31T18:00:00.000Z',
          auditModeActivatedBy: 'Auditor',
        },
      }
      mockStore['ai_discoveries'] = []
      mockStore['activity_log'] = []

      await renderSettings()

      expect(screen.getByText('Importar Backup')).toBeDisabled()
      expect(screen.getByText('Limpiar Todo')).toBeDisabled()
    })

    it('should keep Export button enabled when audit mode is active', async () => {
      mockStore['app_settings'] = {
        ...defaultSettings,
        auditModeConfig: {
          auditMode: true,
          auditModeActivatedAt: '2026-03-31T18:00:00.000Z',
          auditModeActivatedBy: 'Auditor',
        },
      }
      mockStore['ai_discoveries'] = []
      mockStore['activity_log'] = []

      await renderSettings()

      expect(screen.getByText('Exportar Backup')).not.toBeDisabled()
    })

    it('should deactivate audit mode directly (no confirmation needed)', async () => {
      mockStore['app_settings'] = {
        ...defaultSettings,
        auditModeConfig: {
          auditMode: true,
          auditModeActivatedAt: '2026-03-31T18:00:00.000Z',
          auditModeActivatedBy: 'Auditor',
        },
      }
      mockStore['ai_discoveries'] = []
      mockStore['activity_log'] = []

      await renderSettings()

      const toggles = screen.getAllByRole('switch')
      fireEvent.click(toggles[2])

      await waitFor(() => {
        const stored = mockStore['app_settings'] as typeof defaultSettings
        expect(stored.auditModeConfig.auditMode).toBe(false)
        expect(stored.auditModeConfig.auditModeActivatedAt).toBeNull()
      })
    })
  })

  describe('Admin Profile', () => {
    it('should render admin profile section', async () => {
      mockStore['app_settings'] = { ...defaultSettings }
      mockStore['ai_discoveries'] = []
      mockStore['activity_log'] = []

      await renderSettings()

      expect(screen.getByText('Perfil del Administrador')).toBeInTheDocument()
      expect(screen.getByTestId('admin-name-input')).toBeInTheDocument()
      expect(screen.getByTestId('admin-email-input')).toBeInTheDocument()
      expect(screen.getByTestId('admin-role-select')).toBeInTheDocument()
      expect(screen.getByTestId('admin-department-input')).toBeInTheDocument()
    })

    it('should load admin profile from storage', async () => {
      mockStore['app_settings'] = {
        ...defaultSettings,
        adminProfile: {
          adminName: 'María López',
          adminEmail: 'maria@empresa.com',
          adminRole: 'auditor',
          department: 'Legal',
        },
      }
      mockStore['ai_discoveries'] = []
      mockStore['activity_log'] = []

      await renderSettings()

      await waitFor(() => {
        expect(screen.getByTestId('admin-name-input')).toHaveValue('María López')
      })
      expect(screen.getByTestId('admin-email-input')).toHaveValue('maria@empresa.com')
      expect(screen.getByTestId('admin-role-select')).toHaveValue('auditor')
      expect(screen.getByTestId('admin-department-input')).toHaveValue('Legal')
    })

    it('should save admin name on blur', async () => {
      mockStore['app_settings'] = { ...defaultSettings }
      mockStore['ai_discoveries'] = []
      mockStore['activity_log'] = []

      await renderSettings()

      const nameInput = screen.getByTestId('admin-name-input')
      fireEvent.change(nameInput, { target: { value: 'Carlos García' } })
      fireEvent.blur(nameInput)

      await waitFor(() => {
        const stored = mockStore['app_settings'] as typeof defaultSettings
        expect(stored.adminProfile.adminName).toBe('Carlos García')
      })
    })

    it('should save admin email on blur', async () => {
      mockStore['app_settings'] = { ...defaultSettings }
      mockStore['ai_discoveries'] = []
      mockStore['activity_log'] = []

      await renderSettings()

      const emailInput = screen.getByTestId('admin-email-input')
      fireEvent.change(emailInput, { target: { value: 'carlos@empresa.com' } })
      fireEvent.blur(emailInput)

      await waitFor(() => {
        const stored = mockStore['app_settings'] as typeof defaultSettings
        expect(stored.adminProfile.adminEmail).toBe('carlos@empresa.com')
      })
    })

    it('should save admin department on blur', async () => {
      mockStore['app_settings'] = { ...defaultSettings }
      mockStore['ai_discoveries'] = []
      mockStore['activity_log'] = []

      await renderSettings()

      const deptInput = screen.getByTestId('admin-department-input')
      fireEvent.change(deptInput, { target: { value: 'Compliance' } })
      fireEvent.blur(deptInput)

      await waitFor(() => {
        const stored = mockStore['app_settings'] as typeof defaultSettings
        expect(stored.adminProfile.department).toBe('Compliance')
      })
    })

    it('should save admin role on change', async () => {
      mockStore['app_settings'] = { ...defaultSettings }
      mockStore['ai_discoveries'] = []
      mockStore['activity_log'] = []

      await renderSettings()

      const roleSelect = screen.getByTestId('admin-role-select')
      fireEvent.change(roleSelect, { target: { value: 'auditor' } })

      await waitFor(() => {
        const stored = mockStore['app_settings'] as typeof defaultSettings
        expect(stored.adminProfile.adminRole).toBe('auditor')
      })
    })

    it('should show all 4 role options', async () => {
      mockStore['app_settings'] = { ...defaultSettings }
      mockStore['ai_discoveries'] = []
      mockStore['activity_log'] = []

      await renderSettings()

      const roleSelect = screen.getByTestId('admin-role-select') as HTMLSelectElement
      expect(roleSelect.options).toHaveLength(4)
      expect(roleSelect.options[0].value).toBe('compliance_officer')
      expect(roleSelect.options[1].value).toBe('it_admin')
      expect(roleSelect.options[2].value).toBe('auditor')
      expect(roleSelect.options[3].value).toBe('executive')
    })

    it('should use adminName for audit mode activation', async () => {
      mockStore['app_settings'] = {
        ...defaultSettings,
        adminProfile: {
          adminName: 'Auditor Test',
          adminEmail: 'auditor@empresa.com',
          adminRole: 'auditor',
          department: 'Legal',
        },
      }
      mockStore['ai_discoveries'] = []
      mockStore['activity_log'] = []

      await renderSettings()

      const toggles = screen.getAllByRole('switch')
      fireEvent.click(toggles[2])

      await waitFor(() => {
        expect(screen.getByTestId('activate-audit-mode-btn')).toBeInTheDocument()
      })
      fireEvent.click(screen.getByTestId('activate-audit-mode-btn'))

      await waitFor(() => {
        const stored = mockStore['app_settings'] as typeof defaultSettings
        expect(stored.auditModeConfig.auditModeActivatedBy).toBe('Auditor Test')
      })
    })

    it('should reset admin profile on clear all', async () => {
      mockStore['app_settings'] = {
        ...defaultSettings,
        adminProfile: {
          adminName: 'Delete Me',
          adminEmail: 'delete@empresa.com',
          adminRole: 'auditor',
          department: 'Legal',
        },
      }
      mockStore['ai_discoveries'] = [{ id: 'disc-1' }]
      mockStore['activity_log'] = []

      await renderSettings()

      fireEvent.click(screen.getByText('Limpiar Todo'))
      fireEvent.click(screen.getByText('Sí, eliminar todo'))

      await waitFor(() => {
        const stored = mockStore['app_settings'] as typeof defaultSettings
        expect(stored.adminProfile.adminName).toBe('')
        expect(stored.adminProfile.adminEmail).toBe('')
        expect(stored.adminProfile.adminRole).toBe('compliance_officer')
        expect(stored.adminProfile.department).toBe('')
      })
    })
  })

  describe('Require Department', () => {
    it('should show require department toggle in organization section', async () => {
      mockStore['app_settings'] = { ...defaultSettings }
      mockStore['ai_discoveries'] = []
      mockStore['activity_log'] = []

      await renderSettings()

      expect(screen.getByTestId('require-department-toggle')).toBeInTheDocument()
      expect(screen.getByText('Exigir departamento al guardar herramientas')).toBeInTheDocument()
    })

    it('should load requireDepartment from storage', async () => {
      mockStore['app_settings'] = {
        ...defaultSettings,
        requireDepartment: true,
      }
      mockStore['ai_discoveries'] = []
      mockStore['activity_log'] = []

      await renderSettings()

      const toggle = screen.getByTestId('require-department-toggle')
      await waitFor(() => {
        expect(toggle).toHaveAttribute('aria-checked', 'true')
      })
    })

    it('should toggle requireDepartment and persist', async () => {
      mockStore['app_settings'] = {
        ...defaultSettings,
        requireDepartment: false,
      }
      mockStore['ai_discoveries'] = []
      mockStore['activity_log'] = []

      await renderSettings()

      const toggle = screen.getByTestId('require-department-toggle')
      expect(toggle).toHaveAttribute('aria-checked', 'false')

      fireEvent.click(toggle)

      await waitFor(() => {
        const stored = mockStore['app_settings'] as typeof defaultSettings
        expect(stored.requireDepartment).toBe(true)
      })
    })

    it('should reset requireDepartment on clear all', async () => {
      mockStore['app_settings'] = {
        ...defaultSettings,
        requireDepartment: true,
      }
      mockStore['ai_discoveries'] = [{ id: 'disc-1' }]
      mockStore['activity_log'] = []

      await renderSettings()

      fireEvent.click(screen.getByText('Limpiar Todo'))
      fireEvent.click(screen.getByText('Sí, eliminar todo'))

      await waitFor(() => {
        const stored = mockStore['app_settings'] as typeof defaultSettings
        expect(stored.requireDepartment).toBe(false)
      })
    })
  })

  describe('snapshotFrequencyDays', () => {
    it('should render snapshot frequency input', async () => {
      mockStore['app_settings'] = { ...defaultSettings }
      mockStore['ai_discoveries'] = []
      mockStore['activity_log'] = []

      await renderSettings()

      expect(screen.getByText('Snapshots de Cumplimiento')).toBeInTheDocument()
      expect(screen.getByTestId('snapshot-frequency-input')).toBeInTheDocument()
    })

    it('should load snapshotFrequencyDays from storage', async () => {
      mockStore['app_settings'] = {
        ...defaultSettings,
        snapshotFrequencyDays: 30,
      }
      mockStore['ai_discoveries'] = []
      mockStore['activity_log'] = []

      await renderSettings()

      const input = screen.getByTestId('snapshot-frequency-input') as HTMLInputElement
      await waitFor(() => {
        expect(input.value).toBe('30')
      })
    })

    it('should persist snapshotFrequencyDays on change', async () => {
      mockStore['app_settings'] = { ...defaultSettings }
      mockStore['ai_discoveries'] = []
      mockStore['activity_log'] = []

      await renderSettings()

      const input = screen.getByTestId('snapshot-frequency-input')
      fireEvent.change(input, { target: { value: '14' } })

      await waitFor(() => {
        const stored = mockStore['app_settings'] as typeof defaultSettings
        expect(stored.snapshotFrequencyDays).toBe(14)
      })
    })

    it('should reset snapshotFrequencyDays on clear all', async () => {
      mockStore['app_settings'] = {
        ...defaultSettings,
        snapshotFrequencyDays: 30,
      }
      mockStore['ai_discoveries'] = []
      mockStore['activity_log'] = []

      await renderSettings()

      fireEvent.click(screen.getByText('Limpiar Todo'))
      fireEvent.click(screen.getByText('Sí, eliminar todo'))

      await waitFor(() => {
        const stored = mockStore['app_settings'] as typeof defaultSettings
        expect(stored.snapshotFrequencyDays).toBe(0)
      })
    })
  })

  describe('Timezone and Date Format', () => {
    it('should render date/time format section with selects', async () => {
      mockStore['app_settings'] = { ...defaultSettings }
      mockStore['ai_discoveries'] = []
      mockStore['activity_log'] = []

      await renderSettings()

      expect(screen.getByText('Formato de Fecha y Hora')).toBeInTheDocument()
      expect(screen.getByTestId('timezone-select')).toBeInTheDocument()
      expect(screen.getByTestId('date-format-select')).toBeInTheDocument()
    })

    it('should show all 21 timezone options', async () => {
      mockStore['app_settings'] = { ...defaultSettings }
      mockStore['ai_discoveries'] = []
      mockStore['activity_log'] = []

      await renderSettings()

      const select = screen.getByTestId('timezone-select') as HTMLSelectElement
      expect(select.options).toHaveLength(21)
      expect(select.options[0].value).toBe('America/Argentina/Buenos_Aires')
      expect(select.options[20].value).toBe('UTC')
    })

    it('should load timezone from storage', async () => {
      mockStore['app_settings'] = {
        ...defaultSettings,
        timezone: 'America/Mexico_City',
      }
      mockStore['ai_discoveries'] = []
      mockStore['activity_log'] = []

      await renderSettings()

      const select = screen.getByTestId('timezone-select') as HTMLSelectElement
      await waitFor(() => {
        expect(select.value).toBe('America/Mexico_City')
      })
    })

    it('should persist timezone on change', async () => {
      mockStore['app_settings'] = { ...defaultSettings }
      mockStore['ai_discoveries'] = []
      mockStore['activity_log'] = []

      await renderSettings()

      const select = screen.getByTestId('timezone-select')
      fireEvent.change(select, { target: { value: 'Europe/Madrid' } })

      await waitFor(() => {
        const stored = mockStore['app_settings'] as typeof defaultSettings
        expect(stored.timezone).toBe('Europe/Madrid')
      })
    })

    it('should show all 3 date format options', async () => {
      mockStore['app_settings'] = { ...defaultSettings }
      mockStore['ai_discoveries'] = []
      mockStore['activity_log'] = []

      await renderSettings()

      const select = screen.getByTestId('date-format-select') as HTMLSelectElement
      expect(select.options).toHaveLength(3)
      expect(select.options[0].value).toBe('DD/MM/YYYY')
      expect(select.options[1].value).toBe('MM/DD/YYYY')
      expect(select.options[2].value).toBe('YYYY-MM-DD')
    })

    it('should load date format from storage', async () => {
      mockStore['app_settings'] = {
        ...defaultSettings,
        dateFormat: 'YYYY-MM-DD',
      }
      mockStore['ai_discoveries'] = []
      mockStore['activity_log'] = []

      await renderSettings()

      const select = screen.getByTestId('date-format-select') as HTMLSelectElement
      await waitFor(() => {
        expect(select.value).toBe('YYYY-MM-DD')
      })
    })

    it('should persist date format on change', async () => {
      mockStore['app_settings'] = { ...defaultSettings }
      mockStore['ai_discoveries'] = []
      mockStore['activity_log'] = []

      await renderSettings()

      const select = screen.getByTestId('date-format-select')
      fireEvent.change(select, { target: { value: 'MM/DD/YYYY' } })

      await waitFor(() => {
        const stored = mockStore['app_settings'] as typeof defaultSettings
        expect(stored.dateFormat).toBe('MM/DD/YYYY')
      })
    })

    it('should reset timezone and dateFormat on clear all', async () => {
      mockStore['app_settings'] = {
        ...defaultSettings,
        timezone: 'America/New_York',
        dateFormat: 'YYYY-MM-DD',
      }
      mockStore['ai_discoveries'] = [{ id: 'disc-1' }]
      mockStore['activity_log'] = []

      await renderSettings()

      fireEvent.click(screen.getByText('Limpiar Todo'))
      fireEvent.click(screen.getByText('Sí, eliminar todo'))

      await waitFor(() => {
        const stored = mockStore['app_settings'] as typeof defaultSettings
        expect(stored.dateFormat).toBe('DD/MM/YYYY')
      })
    })
  })

  describe('Alert Config', () => {
    it('should render alert config section', async () => {
      mockStore['app_settings'] = { ...defaultSettings }
      mockStore['ai_discoveries'] = []
      mockStore['activity_log'] = []

      await renderSettings()

      expect(screen.getByText('Configuración de Alertas')).toBeInTheDocument()
      expect(screen.getByTestId('assessment-due-days-input')).toBeInTheDocument()
      expect(screen.getByTestId('max-unassessed-input')).toBeInTheDocument()
      expect(screen.getByTestId('risk-level-toggle-prohibited')).toBeInTheDocument()
      expect(screen.getByTestId('risk-level-toggle-high')).toBeInTheDocument()
      expect(screen.getByTestId('risk-level-toggle-limited')).toBeInTheDocument()
      expect(screen.getByTestId('risk-level-toggle-minimal')).toBeInTheDocument()
    })

    it('should load alertConfig from storage', async () => {
      mockStore['app_settings'] = {
        ...defaultSettings,
        alertConfig: {
          assessmentDueDays: [60, 30],
          newDetectionRiskLevels: ['prohibited'],
          maxUnassessedCount: 5,
        },
      }
      mockStore['ai_discoveries'] = []
      mockStore['activity_log'] = []

      await renderSettings()

      await waitFor(() => {
        expect(screen.getByTestId('assessment-due-days-input')).toHaveValue('60, 30')
      })
      expect(screen.getByTestId('max-unassessed-input')).toHaveValue(5)
    })

    it('should persist assessmentDueDays on blur', async () => {
      mockStore['app_settings'] = { ...defaultSettings }
      mockStore['ai_discoveries'] = []
      mockStore['activity_log'] = []

      await renderSettings()

      const input = screen.getByTestId('assessment-due-days-input')
      fireEvent.change(input, { target: { value: '60, 30, 7' } })
      fireEvent.blur(input)

      await waitFor(() => {
        const stored = mockStore['app_settings'] as typeof defaultSettings
        expect(stored.alertConfig.assessmentDueDays).toEqual([60, 30, 7])
      })
    })

    it('should sort assessmentDueDays descending on blur', async () => {
      mockStore['app_settings'] = { ...defaultSettings }
      mockStore['ai_discoveries'] = []
      mockStore['activity_log'] = []

      await renderSettings()

      const input = screen.getByTestId('assessment-due-days-input')
      fireEvent.change(input, { target: { value: '7, 60, 15' } })
      fireEvent.blur(input)

      await waitFor(() => {
        const stored = mockStore['app_settings'] as typeof defaultSettings
        expect(stored.alertConfig.assessmentDueDays).toEqual([60, 15, 7])
      })
    })

    it('should persist newDetectionRiskLevels on toggle', async () => {
      mockStore['app_settings'] = {
        ...defaultSettings,
        alertConfig: {
          assessmentDueDays: [30, 15, 7, 1],
          newDetectionRiskLevels: ['prohibited', 'high'],
          maxUnassessedCount: 10,
        },
      }
      mockStore['ai_discoveries'] = []
      mockStore['activity_log'] = []

      await renderSettings()

      const limitedBtn = screen.getByTestId('risk-level-toggle-limited')
      fireEvent.click(limitedBtn)

      await waitFor(() => {
        const stored = mockStore['app_settings'] as typeof defaultSettings
        expect(stored.alertConfig.newDetectionRiskLevels).toEqual(['prohibited', 'high', 'limited'])
      })
    })

    it('should remove risk level on toggle off', async () => {
      mockStore['app_settings'] = {
        ...defaultSettings,
        alertConfig: {
          assessmentDueDays: [30, 15, 7, 1],
          newDetectionRiskLevels: ['prohibited', 'high'],
          maxUnassessedCount: 10,
        },
      }
      mockStore['ai_discoveries'] = []
      mockStore['activity_log'] = []

      await renderSettings()

      const highBtn = screen.getByTestId('risk-level-toggle-high')
      fireEvent.click(highBtn)

      await waitFor(() => {
        const stored = mockStore['app_settings'] as typeof defaultSettings
        expect(stored.alertConfig.newDetectionRiskLevels).toEqual(['prohibited'])
      })
    })

    it('should persist maxUnassessedCount on change', async () => {
      mockStore['app_settings'] = { ...defaultSettings }
      mockStore['ai_discoveries'] = []
      mockStore['activity_log'] = []

      await renderSettings()

      const input = screen.getByTestId('max-unassessed-input')
      fireEvent.change(input, { target: { value: '25' } })

      await waitFor(() => {
        const stored = mockStore['app_settings'] as typeof defaultSettings
        expect(stored.alertConfig.maxUnassessedCount).toBe(25)
      })
    })

    it('should reset alertConfig on clear all', async () => {
      mockStore['app_settings'] = {
        ...defaultSettings,
        alertConfig: {
          assessmentDueDays: [60, 30],
          newDetectionRiskLevels: ['prohibited'],
          maxUnassessedCount: 5,
        },
      }
      mockStore['ai_discoveries'] = [{ id: 'disc-1' }]
      mockStore['activity_log'] = []

      await renderSettings()

      fireEvent.click(screen.getByText('Limpiar Todo'))
      fireEvent.click(screen.getByText('Sí, eliminar todo'))

      await waitFor(() => {
        const stored = mockStore['app_settings'] as typeof defaultSettings
        expect(stored.alertConfig.assessmentDueDays).toEqual([30, 15, 7, 1])
        expect(stored.alertConfig.maxUnassessedCount).toBe(10)
      })
    })
  })
})
