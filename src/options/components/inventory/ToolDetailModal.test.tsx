// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ToolDetailModal from './ToolDetailModal'
import type { DiscoveryRecord, AuditEntry } from '@shared/types/discovery'
import type { AppSettings } from '@shared/types/storage'
import { createMockComplianceStatus } from '@test-utils/mock-helpers'

function createMockSettings(overrides: Partial<AppSettings> = {}): AppSettings {
  return {
    version: '1.0.0',
    companyName: 'Test Company',
    responsiblePerson: 'Test User',
    installationDate: '2026-03-01T00:00:00.000Z',
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
      newDetectionRiskLevels: ['prohibited', 'high'],
      maxUnassessedCount: 10,
    },
    adminProfile: {
      adminName: '',
      adminEmail: '',
      adminRole: 'compliance_officer',
      department: '',
    },
    ...overrides,
  }
}

function createMockDiscovery(overrides: Partial<DiscoveryRecord> = {}): DiscoveryRecord {
  return {
    id: 'test-id-1',
    domain: 'chatgpt.com',
    toolName: 'ChatGPT',
    category: 'chatbot',
    defaultRiskLevel: 'limited',
    userRiskLevel: null,
    status: 'detected',
    department: null,
    firstSeen: '2026-03-15T09:00:00.000Z',
    lastSeen: '2026-03-15T09:00:00.000Z',
    visitCount: 1,
    complianceStatus: createMockComplianceStatus(),
    notes: '',
    tags: [],
    auditTrail: [],
    ...overrides,
  }
}

describe('ToolDetailModal', () => {
  const mockSettings = createMockSettings()
  const mockDiscovery = createMockDiscovery()
  const mockOnSave = vi.fn()
  const mockOnClose = vi.fn()

  beforeEach(() => {
    mockOnSave.mockClear()
    mockOnClose.mockClear()
  })

  function renderModal(overrides: { discovery?: DiscoveryRecord; settings?: AppSettings } = {}) {
    return render(
      <ToolDetailModal
        discovery={overrides.discovery ?? mockDiscovery}
        onSave={mockOnSave}
        onClose={mockOnClose}
        settings={overrides.settings ?? mockSettings}
      />,
    )
  }

  describe('Compliance Tab - Assessment Dropdown', () => {
    it('should render assessment dropdown for each enabled regulation', () => {
      renderModal()
      fireEvent.click(screen.getByText('Compliance'))
      const selects = screen.getAllByRole('combobox')
      expect(selects).toHaveLength(13)
    })

    it('should change assessment to complete and set lastAssessedDate and dueDate', () => {
      renderModal()
      fireEvent.click(screen.getByText('Compliance'))
      fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'complete' } })
      fireEvent.click(screen.getByTestId('modal-save'))

      expect(mockOnSave).toHaveBeenCalledTimes(1)
      const saved = mockOnSave.mock.calls[0][0] as DiscoveryRecord
      expect(saved.complianceStatus.euAiAct['art-4'].assessment).toBe('complete')
      expect(saved.complianceStatus.euAiAct['art-4'].lastAssessedDate).not.toBeNull()
      expect(saved.complianceStatus.euAiAct['art-4'].dueDate).not.toBeNull()
    })

    it('should change assessment to not_applicable and clear dueDate', () => {
      renderModal()
      fireEvent.click(screen.getByText('Compliance'))
      fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'not_applicable' } })
      fireEvent.click(screen.getByTestId('modal-save'))

      expect(mockOnSave).toHaveBeenCalledTimes(1)
      const saved = mockOnSave.mock.calls[0][0] as DiscoveryRecord
      expect(saved.complianceStatus.euAiAct['art-4'].assessment).toBe('not_applicable')
      expect(saved.complianceStatus.euAiAct['art-4'].lastAssessedDate).not.toBeNull()
      expect(saved.complianceStatus.euAiAct['art-4'].dueDate).toBeNull()
    })

    it('should change assessment to pending and recalculate dueDate', () => {
      const discovery = createMockDiscovery({
        complianceStatus: createMockComplianceStatus({
          euAiAct: Object.fromEntries(
            ['art-4', 'art-6', 'art-9', 'art-11', 'art-12', 'art-26', 'art-27', 'art-50'].map((id) => [
              id,
              { assessment: 'complete' as const, lastAssessedDate: '2026-03-01T00:00:00.000Z', dueDate: null, notes: '' },
            ]),
          ),
        }),
      })
      renderModal({ discovery })
      fireEvent.click(screen.getByText('Compliance'))
      fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'pending' } })
      fireEvent.click(screen.getByTestId('modal-save'))

      expect(mockOnSave).toHaveBeenCalledTimes(1)
      const saved = mockOnSave.mock.calls[0][0] as DiscoveryRecord
      expect(saved.complianceStatus.euAiAct['art-4'].assessment).toBe('pending')
      expect(saved.complianceStatus.euAiAct['art-4'].lastAssessedDate).toBeNull()
      expect(saved.complianceStatus.euAiAct['art-4'].dueDate).not.toBeNull()
    })

    it('should not show disabled regulations', () => {
      const settings = createMockSettings({
        regulationConfig: {
          euAiAct: { enabled: true, customDueDateOffsetDays: 90 },
          iso42001: { enabled: false, customDueDateOffsetDays: 90 },
          coSb205: { enabled: false, customDueDateOffsetDays: 90 },
        },
      })
      renderModal({ settings })
      fireEvent.click(screen.getByText('Compliance'))
      const selects = screen.queryAllByRole('combobox')
      expect(selects).toHaveLength(8)
      expect(screen.getByText('Art. 4 — Alfabetización en IA')).toBeInTheDocument()
      expect(screen.queryByText('Inventario de sistemas de IA')).not.toBeInTheDocument()
      expect(screen.queryByText('Política de gestión de riesgos')).not.toBeInTheDocument()
    })

    it('should show overdue badge instead of dropdown for overdue assessments', () => {
      const discovery = createMockDiscovery({
        complianceStatus: createMockComplianceStatus({
          euAiAct: Object.fromEntries(
            ['art-4', 'art-6', 'art-9', 'art-11', 'art-12', 'art-26', 'art-27', 'art-50'].map((id) => [
              id,
              id === 'art-4'
                ? { assessment: 'overdue' as const, lastAssessedDate: null, dueDate: '2026-03-01T00:00:00.000Z', notes: '' }
                : { assessment: 'pending' as const, lastAssessedDate: null, dueDate: null, notes: '' },
            ]),
          ),
        }),
      })
      renderModal({ discovery })
      fireEvent.click(screen.getByText('Compliance'))

      expect(screen.getByText('Vencido')).toBeInTheDocument()
      const selects = screen.queryAllByRole('combobox')
      expect(selects).toHaveLength(12)
    })
  })

  describe('Save', () => {
    it('should call onSave with complianceStatus included', () => {
      renderModal()
      fireEvent.click(screen.getByTestId('modal-save'))

      expect(mockOnSave).toHaveBeenCalledTimes(1)
      const saved = mockOnSave.mock.calls[0][0] as DiscoveryRecord
      expect(saved).toHaveProperty('complianceStatus')
    })

    it('should preserve other fields when saving compliance changes', () => {
      const discovery = createMockDiscovery({
        status: 'confirmed',
        userRiskLevel: 'high',
        department: 'IT',
      })
      renderModal({ discovery })
      fireEvent.click(screen.getByText('Compliance'))
      fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'complete' } })
      fireEvent.click(screen.getByTestId('modal-save'))

      const saved = mockOnSave.mock.calls[0][0] as DiscoveryRecord
      expect(saved.status).toBe('confirmed')
      expect(saved.userRiskLevel).toBe('high')
      expect(saved.department).toBe('IT')
    })
  })

  describe('Audit Mode', () => {
    it('should hide save button when audit mode is active', () => {
      renderModal({
        settings: createMockSettings({
          auditModeConfig: {
            auditMode: true,
            auditModeActivatedAt: '2026-03-31T18:00:00.000Z',
            auditModeActivatedBy: 'Auditor',
          },
        }),
      })
      expect(screen.queryByTestId('modal-save')).not.toBeInTheDocument()
    })

    it('should disable risk level buttons when audit mode is active', () => {
      renderModal({
        settings: createMockSettings({
          auditModeConfig: {
            auditMode: true,
            auditModeActivatedAt: '2026-03-31T18:00:00.000Z',
            auditModeActivatedBy: 'Auditor',
          },
        }),
      })
      const riskButtons = screen.getAllByRole('button').filter(
        (btn) => ['Prohibido', 'Alto', 'Limitado', 'Mínimo'].includes(btn.textContent ?? ''),
      )
      riskButtons.forEach((btn) => {
        expect(btn).toBeDisabled()
      })
    })

    it('should disable department select when audit mode is active', () => {
      renderModal({
        settings: createMockSettings({
          auditModeConfig: {
            auditMode: true,
            auditModeActivatedAt: '2026-03-31T18:00:00.000Z',
            auditModeActivatedBy: 'Auditor',
          },
        }),
      })
      const select = screen.getByRole('combobox')
      expect(select).toBeDisabled()
    })

    it('should disable notes textarea when audit mode is active', () => {
      renderModal({
        settings: createMockSettings({
          auditModeConfig: {
            auditMode: true,
            auditModeActivatedAt: '2026-03-31T18:00:00.000Z',
            auditModeActivatedBy: 'Auditor',
          },
        }),
      })
      fireEvent.click(screen.getByText('Notas'))
      const textarea = screen.getByPlaceholderText('Agregar notas sobre esta herramienta...')
      expect(textarea).toBeDisabled()
    })
  })

  describe('History Tab (Audit Trail)', () => {
    it('should show empty state when no audit entries exist', () => {
      renderModal()
      fireEvent.click(screen.getByText('Historial'))
      expect(screen.getByTestId('audit-empty')).toBeInTheDocument()
      expect(screen.getByText('No hay registros de cambios')).toBeInTheDocument()
    })

    it('should display audit entries when they exist', () => {
      const auditTrail: AuditEntry[] = [
        {
          id: 'entry-1',
          timestamp: '2026-03-30T10:00:00.000Z',
          field: 'status',
          oldValue: 'Detectado',
          newValue: 'Confirmado',
          changedBy: null,
        },
        {
          id: 'entry-2',
          timestamp: '2026-03-31T14:00:00.000Z',
          field: 'riskLevel',
          oldValue: 'Limitado',
          newValue: 'Alto',
          changedBy: null,
        },
      ]
      renderModal({ discovery: createMockDiscovery({ auditTrail }) })
      fireEvent.click(screen.getByText('Historial'))

      expect(screen.getByText('Estado')).toBeInTheDocument()
      expect(screen.getByText('Nivel de Riesgo')).toBeInTheDocument()
      expect(screen.getByText('Detectado')).toBeInTheDocument()
      expect(screen.getByText('Confirmado')).toBeInTheDocument()
      expect(screen.getByText('Limitado')).toBeInTheDocument()
      expect(screen.getByText('Alto')).toBeInTheDocument()
    })

    it('should show compliance audit entries with regulation and article context', () => {
      const auditTrail: AuditEntry[] = [
        {
          id: 'entry-1',
          timestamp: '2026-03-31T14:00:00.000Z',
          field: 'compliance',
          oldValue: 'EU AI Act · Art. 4 — Alfabetización en IA: Pendiente',
          newValue: 'EU AI Act · Art. 4 — Alfabetización en IA: Completo',
          changedBy: null,
        },
      ]
      renderModal({ discovery: createMockDiscovery({ auditTrail }) })
      fireEvent.click(screen.getByText('Historial'))

      expect(screen.getAllByText('Compliance').length).toBeGreaterThanOrEqual(2)
      expect(screen.getAllByText(/EU AI Act/).length).toBeGreaterThanOrEqual(2)
      expect(screen.getAllByText(/Art\. 4/).length).toBeGreaterThanOrEqual(2)
    })

    it('should show the Historial tab in the tab list', () => {
      renderModal()
      expect(screen.getByText('Historial')).toBeInTheDocument()
    })
  })

  describe('Audit Trail Generation on Save', () => {
    it('should include audit trail entries in saved record when status changes', () => {
      renderModal()
      fireEvent.click(screen.getByTestId('modal-save'))

      expect(mockOnSave).toHaveBeenCalledTimes(1)
      const saved = mockOnSave.mock.calls[0][0] as DiscoveryRecord
      expect(saved.auditTrail).toHaveLength(0)
    })

    it('should generate audit entry when status is changed before save', () => {
      renderModal()
      const statusButtons = screen.getAllByRole('button').filter(
        (btn) => ['Detectado', 'Confirmado', 'Descartado', 'Autorizado'].includes(btn.textContent ?? ''),
      )
      fireEvent.click(statusButtons[1])
      fireEvent.click(screen.getByTestId('modal-save'))

      expect(mockOnSave).toHaveBeenCalledTimes(1)
      const saved = mockOnSave.mock.calls[0][0] as DiscoveryRecord
      expect(saved.auditTrail).toHaveLength(1)
      expect(saved.auditTrail[0].field).toBe('status')
      expect(saved.auditTrail[0].oldValue).toBe('Detectado')
      expect(saved.auditTrail[0].newValue).toBe('Confirmado')
    })

    it('should generate audit entry when risk level is changed before save', () => {
      renderModal()
      const riskButtons = screen.getAllByRole('button').filter(
        (btn) => ['Prohibido', 'Alto', 'Limitado', 'Mínimo'].includes(btn.textContent ?? ''),
      )
      fireEvent.click(riskButtons[1])
      fireEvent.click(screen.getByTestId('modal-save'))

      expect(mockOnSave).toHaveBeenCalledTimes(1)
      const saved = mockOnSave.mock.calls[0][0] as DiscoveryRecord
      expect(saved.auditTrail).toHaveLength(1)
      expect(saved.auditTrail[0].field).toBe('riskLevel')
      expect(saved.auditTrail[0].oldValue).toBe('Limitado')
      expect(saved.auditTrail[0].newValue).toBe('Alto')
    })

    it('should generate audit entry when compliance assessment is changed', () => {
      renderModal()
      fireEvent.click(screen.getByText('Compliance'))
      fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'complete' } })
      fireEvent.click(screen.getByTestId('modal-save'))

      expect(mockOnSave).toHaveBeenCalledTimes(1)
      const saved = mockOnSave.mock.calls[0][0] as DiscoveryRecord
      const complianceEntries = saved.auditTrail.filter((e) => e.field === 'compliance')
      expect(complianceEntries).toHaveLength(1)
      expect(complianceEntries[0].oldValue).toContain('Pendiente')
      expect(complianceEntries[0].newValue).toContain('Completo')
    })

    it('should generate multiple audit entries when multiple fields change', () => {
      renderModal()
      const statusButtons = screen.getAllByRole('button').filter(
        (btn) => ['Detectado', 'Confirmado', 'Descartado', 'Autorizado'].includes(btn.textContent ?? ''),
      )
      fireEvent.click(statusButtons[1])
      fireEvent.click(screen.getByText('Notas'))
      const textarea = screen.getByPlaceholderText('Agregar notas sobre esta herramienta...')
      fireEvent.change(textarea, { target: { value: 'Revisado' } })
      fireEvent.click(screen.getByTestId('modal-save'))

      expect(mockOnSave).toHaveBeenCalledTimes(1)
      const saved = mockOnSave.mock.calls[0][0] as DiscoveryRecord
      expect(saved.auditTrail).toHaveLength(2)
      const fields = saved.auditTrail.map((e) => e.field)
      expect(fields).toContain('status')
      expect(fields).toContain('notes')
    })

    it('should append new entries to existing audit trail', () => {
      const existingTrail: AuditEntry[] = [
        {
          id: 'existing-1',
          timestamp: '2026-03-30T10:00:00.000Z',
          field: 'status',
          oldValue: 'Detectado',
          newValue: 'Confirmado',
          changedBy: null,
        },
      ]
      renderModal({ discovery: createMockDiscovery({ auditTrail: existingTrail }) })
      const riskButtons = screen.getAllByRole('button').filter(
        (btn) => ['Prohibido', 'Alto', 'Limitado', 'Mínimo'].includes(btn.textContent ?? ''),
      )
      fireEvent.click(riskButtons[1])
      fireEvent.click(screen.getByTestId('modal-save'))

      const saved = mockOnSave.mock.calls[0][0] as DiscoveryRecord
      expect(saved.auditTrail).toHaveLength(2)
      expect(saved.auditTrail[0].id).toBe('existing-1')
      expect(saved.auditTrail[1].field).toBe('riskLevel')
    })

    it('should not generate entries when no fields changed', () => {
      renderModal()
      fireEvent.click(screen.getByTestId('modal-save'))

      const saved = mockOnSave.mock.calls[0][0] as DiscoveryRecord
      expect(saved.auditTrail).toHaveLength(0)
    })
  })

  describe('Require Department Validation', () => {
    it('should block save when requireDepartment is true and department is empty', () => {
      renderModal({
        settings: createMockSettings({ requireDepartment: true }),
      })

      fireEvent.click(screen.getByTestId('modal-save'))

      expect(mockOnSave).not.toHaveBeenCalled()
      expect(screen.getByTestId('modal-save-error')).toBeInTheDocument()
      expect(screen.getByTestId('modal-save-error').textContent).toContain('departamento es obligatorio')
    })

    it('should allow save when requireDepartment is true and department is set', () => {
      renderModal({
        settings: createMockSettings({ requireDepartment: true }),
      })

      const statusButtons = screen.getAllByRole('button').filter(
        (btn) => ['Detectado', 'Confirmado', 'Descartado', 'Autorizado'].includes(btn.textContent ?? ''),
      )
      fireEvent.click(statusButtons[1])

      const deptSelect = screen.getByRole('combobox')
      fireEvent.change(deptSelect, { target: { value: 'IT' } })

      fireEvent.click(screen.getByTestId('modal-save'))

      expect(mockOnSave).toHaveBeenCalledTimes(1)
      expect(screen.queryByTestId('modal-save-error')).not.toBeInTheDocument()
    })

    it('should allow save when requireDepartment is false and department is empty', () => {
      renderModal({
        settings: createMockSettings({ requireDepartment: false }),
      })

      fireEvent.click(screen.getByTestId('modal-save'))

      expect(mockOnSave).toHaveBeenCalledTimes(1)
      expect(screen.queryByTestId('modal-save-error')).not.toBeInTheDocument()
    })

    it('should clear error when department is selected', () => {
      renderModal({
        settings: createMockSettings({ requireDepartment: true }),
      })

      fireEvent.click(screen.getByTestId('modal-save'))
      expect(screen.getByTestId('modal-save-error')).toBeInTheDocument()

      const deptSelect = screen.getByRole('combobox')
      fireEvent.change(deptSelect, { target: { value: 'IT' } })

      expect(screen.queryByTestId('modal-save-error')).not.toBeInTheDocument()
    })

    it('should block save with custom department when it is empty', () => {
      renderModal({
        settings: createMockSettings({ requireDepartment: true }),
      })

      const deptSelect = screen.getByRole('combobox')
      fireEvent.change(deptSelect, { target: { value: 'Otro' } })

      fireEvent.click(screen.getByTestId('modal-save'))

      expect(mockOnSave).not.toHaveBeenCalled()
      expect(screen.getByTestId('modal-save-error')).toBeInTheDocument()
    })
  })
})
