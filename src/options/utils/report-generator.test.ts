import { describe, it, expect } from 'vitest'
import { generateReport } from '@options/utils/report-generator'
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

const defaultSettings: AppSettings = {
  version: '1.0.0',
  companyName: 'Test Corp',
  responsiblePerson: 'María García',
  installationDate: '2026-03-01T00:00:00.000Z',
  badgeNotifications: true,
  customDomains: [],
  excludedDomains: [],
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
