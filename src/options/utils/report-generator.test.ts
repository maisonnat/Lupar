import { describe, it, expect } from 'vitest'
import { generateReport, generateContentHash, generateReportWithHash } from '@options/utils/report-generator'
import { createMockComplianceStatus } from '@test-utils/mock-helpers'
import type { DiscoveryRecord } from '@shared/types/discovery'
import type { AppSettings } from '@shared/types/storage'

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

const defaultSettings: AppSettings = {
  version: '1.0.0',
  companyName: 'Test Corp',
  responsiblePerson: 'María García',
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
    newDetectionRiskLevels: ['prohibited', 'high', 'limited', 'minimal'],
    maxUnassessedCount: 10,
  },
  adminProfile: {
    adminName: '',
    adminEmail: '',
    adminRole: 'compliance_officer',
    department: '',
  },
}

describe('generateReport', () => {
  it('should generate valid HTML with DOCTYPE', () => {
    const html = generateReport([makeDiscovery()], defaultSettings)
    expect(html).toContain('<!DOCTYPE html>')
    expect(html).toContain('<html lang="es">')
    expect(html).toContain('</html>')
  })

  it('should include inline CSS (no external deps)', () => {
    const html = generateReport([makeDiscovery()], defaultSettings)
    expect(html).toContain('<style>')
    expect(html).toContain('</style>')
    expect(html).not.toContain('<link')
    expect(html).not.toContain('href=')
  })

  it('should include cover with company name', () => {
    const html = generateReport([makeDiscovery()], defaultSettings)
    expect(html).toContain('Test Corp')
    expect(html).toContain('María García')
    expect(html).toContain('Reporte de Cumplimiento IA')
  })

  it('should include all 5 sections', () => {
    const html = generateReport([makeDiscovery()], defaultSettings)
    expect(html).toContain('Resumen Ejecutivo')
    expect(html).toContain('Inventario de Herramientas IA')
    expect(html).toContain('Mapa de Cumplimiento')
    expect(html).toContain('Recomendaciones')
    expect(html).toContain('Generado por AI Compliance Tracker')
  })

  it('should include tool data in inventory table', () => {
    const html = generateReport([
      makeDiscovery({ toolName: 'ChatGPT', domain: 'chatgpt.com' }),
      makeDiscovery({ toolName: 'Claude', domain: 'claude.ai' }),
    ], defaultSettings)
    expect(html).toContain('ChatGPT')
    expect(html).toContain('claude.ai')
    expect(html).toContain('Claude')
  })

  it('should include risk score gauge', () => {
    const html = generateReport([makeDiscovery()], defaultSettings)
    expect(html).toContain('Risk Score')
    expect(html).toContain('risk-gauge')
    expect(html).toContain('risk-fill')
  })

  it('should include SVG shield icon (no external images)', () => {
    const html = generateReport([makeDiscovery()], defaultSettings)
    expect(html).toContain('<svg')
    expect(html).not.toContain('<img')
    expect(html).not.toContain('src=')
  })

  it('should handle Spanish characters correctly (UTF-8)', () => {
    const html = generateReport([makeDiscovery()], {
      ...defaultSettings,
      companyName: 'Compañía Española Ñ',
      responsiblePerson: 'José María García',
    })
    expect(html).toContain('Compañía Española Ñ')
    expect(html).toContain('José María García')
    expect(html).toContain('charset="UTF-8"')
  })

  it('should include compliance progress bars', () => {
    const html = generateReport([makeDiscovery()], defaultSettings)
    expect(html).toContain('EU AI Act')
    expect(html).toContain('ISO 42001')
    expect(html).toContain('CO SB 205')
    expect(html).toContain('reg-progress')
  })

  it('should generate report under 500KB for 50 tools', () => {
    const many = Array.from({ length: 50 }, (_, i) =>
      makeDiscovery({
        id: String(i),
        toolName: `Tool ${i}`,
        domain: `tool${i}.com`,
        visitCount: i * 10,
      }),
    )
    const html = generateReport(many, defaultSettings)
    const sizeKB = Buffer.byteLength(html, 'utf8') / 1024
    expect(sizeKB).toBeLessThan(500)
  })

  it('should handle empty discoveries', () => {
    const html = generateReport([], defaultSettings)
    expect(html).toContain('Reporte de Cumplimiento IA')
    expect(html).toContain('Herramientas analizadas')
  })

  it('should show badges for risk levels', () => {
    const html = generateReport([
      makeDiscovery({ defaultRiskLevel: 'high', toolName: 'HireVue' }),
    ], defaultSettings)
    expect(html).toContain('badge-high')
  })
})

describe('generateContentHash', () => {
  it('should return a 64-character hex string (SHA-256)', async () => {
    const hash = await generateContentHash('hello world')
    expect(hash).toHaveLength(64)
    expect(hash).toMatch(/^[0-9a-f]{64}$/)
  })

  it('should return different hashes for different inputs', async () => {
    const hash1 = await generateContentHash('input-1')
    const hash2 = await generateContentHash('input-2')
    expect(hash1).not.toBe(hash2)
  })

  it('should return same hash for same input (deterministic)', async () => {
    const hash1 = await generateContentHash('deterministic')
    const hash2 = await generateContentHash('deterministic')
    expect(hash1).toBe(hash2)
  })

  it('should return 64-char hash for empty string', async () => {
    const hash = await generateContentHash('')
    expect(hash).toHaveLength(64)
  })
})

describe('generateReportWithHash', () => {
  it('should return plain report without audit badge when audit mode is off', async () => {
    const html = await generateReportWithHash([makeDiscovery()], defaultSettings)
    expect(html).toContain('<!DOCTYPE html>')
    expect(html).not.toContain('MODO AUDITOR')
    expect(html).not.toContain('SHA-256')
  })

  it('should include audit badge and hash when audit mode is on', async () => {
    const auditSettings: AppSettings = {
      ...defaultSettings,
      auditModeConfig: {
        auditMode: true,
        auditModeActivatedAt: '2026-03-31T18:00:00.000Z',
        auditModeActivatedBy: 'Compliance Officer',
      },
    }
    const html = await generateReportWithHash([makeDiscovery()], auditSettings)
    expect(html).toContain('MODO AUDITOR')
    expect(html).toContain('SHA-256')
    expect(html).toContain('Compliance Officer')
    expect(html).toContain('31 de marzo de 2026')
    const hashMatch = html.match(/[0-9a-f]{64}/)
    expect(hashMatch).toBeTruthy()
  })

  it('should not include placeholder div in final output', async () => {
    const auditSettings: AppSettings = {
      ...defaultSettings,
      auditModeConfig: {
        auditMode: true,
        auditModeActivatedAt: '2026-03-31T18:00:00.000Z',
        auditModeActivatedBy: 'Test',
      },
    }
    const html = await generateReportWithHash([makeDiscovery()], auditSettings)
    expect(html).not.toContain('audit-badge-placeholder')
  })

  describe('Admin Profile in cover', () => {
    it('should include admin name, role, email and department in cover when configured', () => {
      const adminSettings: AppSettings = {
        ...defaultSettings,
        adminProfile: {
          adminName: 'Ana Martínez',
          adminEmail: 'ana.martinez@empresa.com',
          adminRole: 'auditor',
          department: 'Legal',
        },
      }
      const html = generateReport([makeDiscovery()], adminSettings)
      expect(html).toContain('Ana Martínez')
      expect(html).toContain('Auditor')
      expect(html).toContain('ana.martinez@empresa.com')
      expect(html).toContain('Legal')
    })

    it('should fall back to responsiblePerson when admin profile is empty', () => {
      const html = generateReport([makeDiscovery()], defaultSettings)
      expect(html).toContain('María García')
      expect(html).toContain('Responsable')
    })

    it('should include role in parentheses after name', () => {
      const adminSettings: AppSettings = {
        ...defaultSettings,
        adminProfile: {
          adminName: 'Juan Pérez',
          adminEmail: 'juan@empresa.com',
          adminRole: 'compliance_officer',
          department: 'Compliance',
        },
      }
      const html = generateReport([makeDiscovery()], adminSettings)
      expect(html).toContain('Juan Pérez (Oficial de Compliance)')
    })

    it('should omit email when not configured', () => {
      const adminSettings: AppSettings = {
        ...defaultSettings,
        adminProfile: {
          adminName: 'Solo Nombre',
          adminEmail: '',
          adminRole: 'it_admin',
          department: 'IT',
        },
      }
      const html = generateReport([makeDiscovery()], adminSettings)
      expect(html).toContain('Solo Nombre')
      expect(html).toContain('Administrador IT')
      expect(html).toContain('IT')
      expect(html).not.toContain('<strong>Email:</strong>')
    })
  })
})
