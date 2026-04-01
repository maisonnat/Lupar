// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import SurgeAlert from '@options/components/dashboard/SurgeAlert'
import type { SurgeAlert as SurgeAlertType } from '@shared/utils/risk-calculator'

vi.mock('@options/hooks/useDateConfig', () => ({
  useDateConfig: () => ({
    dateFormat: 'DD/MM/YYYY',
    timezone: 'America/Argentina/Buenos_Aires',
  }),
}))

describe('SurgeAlert', () => {
  it('should render empty state when isActive is false', () => {
    const alert: SurgeAlertType = {
      isActive: false,
      level: 'none',
      recentCount: 0,
      averageCount: 0,
      threshold: 0,
      recentDays: 7,
      newTools: [],
    }

    render(<SurgeAlert alert={alert} />)
    expect(screen.getByText('Sin actividad sospechosa')).toBeDefined()
    expect(screen.getByText('Detección de Surge')).toBeDefined()
  })

  it('should render low surge level', () => {
    const alert: SurgeAlertType = {
      isActive: true,
      level: 'low',
      recentCount: 3,
      averageCount: 1,
      threshold: 2,
      recentDays: 7,
      newTools: [
        { domain: 'chat.openai.com', toolName: 'ChatGPT', firstSeen: '2026-04-01T10:00:00.000Z' },
      ],
    }

    render(<SurgeAlert alert={alert} />)
    expect(screen.getByText('Actividad Elevada')).toBeDefined()
    expect(screen.getByText('3')).toBeDefined() // recentCount
    expect(screen.getByText('1')).toBeDefined() // averageCount
    expect(screen.getByText('2')).toBeDefined() // threshold
  })

  it('should render medium surge level', () => {
    const alert: SurgeAlertType = {
      isActive: true,
      level: 'medium',
      recentCount: 4,
      averageCount: 1,
      threshold: 2,
      recentDays: 7,
      newTools: [],
    }

    render(<SurgeAlert alert={alert} />)
    expect(screen.getByText('Alerta de Surge')).toBeDefined()
  })

  it('should render high surge level', () => {
    const alert: SurgeAlertType = {
      isActive: true,
      level: 'high',
      recentCount: 6,
      averageCount: 1,
      threshold: 2,
      recentDays: 7,
      newTools: [],
    }

    render(<SurgeAlert alert={alert} />)
    expect(screen.getByText('SURGE CRÍTICO')).toBeDefined()
  })

  it('should show new tools list when present', () => {
    const alert: SurgeAlertType = {
      isActive: true,
      level: 'low',
      recentCount: 2,
      averageCount: 1,
      threshold: 2,
      recentDays: 7,
      newTools: [
        { domain: 'chat.openai.com', toolName: 'ChatGPT', firstSeen: '2026-04-01T10:00:00.000Z' },
        { domain: 'claude.ai', toolName: 'Claude', firstSeen: '2026-04-01T09:00:00.000Z' },
      ],
    }

    render(<SurgeAlert alert={alert} />)
    expect(screen.getByText('Nuevas herramientas detectadas')).toBeDefined()
    expect(screen.getByText('ChatGPT')).toBeDefined()
    expect(screen.getByText('Claude')).toBeDefined()
  })

  it('should show metrics grid', () => {
    const alert: SurgeAlertType = {
      isActive: true,
      level: 'low',
      recentCount: 5,
      averageCount: 2,
      threshold: 3,
      recentDays: 7,
      newTools: [],
    }

    render(<SurgeAlert alert={alert} />)
    expect(screen.getByText('Últimos 7 días')).toBeDefined()
    expect(screen.getByText('Promedio histórico')).toBeDefined()
    expect(screen.getByText('Umbral')).toBeDefined()
  })
})