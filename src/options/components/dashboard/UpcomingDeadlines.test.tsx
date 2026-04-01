// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import UpcomingDeadlines from '@options/components/dashboard/UpcomingDeadlines'
import { mockStore } from '../../../../vitest.setup'
import type { UpcomingDeadline } from '@shared/utils/risk-calculator'

const mockStoreGet = mockStore

beforeEach(() => {
  Object.keys(mockStoreGet).forEach((k) => delete mockStoreGet[k])
  mockStoreGet['app_settings'] = {
    timezone: 'America/Argentina/Buenos_Aires',
    dateFormat: 'DD/MM/YYYY',
  }
})

function makeDeadline(overrides: Partial<UpcomingDeadline> = {}): UpcomingDeadline {
  return {
    toolName: 'ChatGPT',
    toolId: 'chat-1',
    regulationKey: 'euAiAct',
    regulationLabel: 'EU AI Act',
    articleId: 'art-4',
    articleTitle: 'Art. 4 — Alfabetización en IA',
    dueDate: new Date().toISOString(),
    daysRemaining: 5,
    riskLevel: 'limited',
    urgency: 'this_week',
    ...overrides,
  }
}

async function renderAndWait(ui: React.ReactElement) {
  render(ui)
  await waitFor(() => screen.getByText('Próximos Vencimientos'))
}

describe('UpcomingDeadlines', () => {
  it('should render empty state when no deadlines', async () => {
    await renderAndWait(<UpcomingDeadlines deadlines={[]} />)
    expect(screen.getByText('Sin vencimientos próximos')).toBeInTheDocument()
  })

  it('should render heading and total count', async () => {
    await renderAndWait(<UpcomingDeadlines deadlines={[makeDeadline(), makeDeadline()]} />)
    expect(screen.getByText('Próximos Vencimientos')).toBeInTheDocument()
    expect(screen.getByText('2 pendientes')).toBeInTheDocument()
  })

  it('should render singular count when 1 deadline', async () => {
    await renderAndWait(<UpcomingDeadlines deadlines={[makeDeadline()]} />)
    expect(screen.getByText('1 pendiente')).toBeInTheDocument()
  })

  it('should group deadlines by urgency', async () => {
    const deadlines = [
      makeDeadline({ urgency: 'overdue', daysRemaining: -3, toolId: 'd1' }),
      makeDeadline({ urgency: 'overdue', daysRemaining: -1, toolId: 'd2' }),
      makeDeadline({ urgency: 'this_week', daysRemaining: 3, toolId: 'd3' }),
      makeDeadline({ urgency: 'this_month', daysRemaining: 15, toolId: 'd4' }),
      makeDeadline({ urgency: 'upcoming', daysRemaining: 60, toolId: 'd5' }),
    ]
    await renderAndWait(<UpcomingDeadlines deadlines={deadlines} />)

    expect(screen.getByText('Vencidos')).toBeInTheDocument()
    expect(screen.getByText('Esta semana')).toBeInTheDocument()
    expect(screen.getByText('Este mes')).toBeInTheDocument()
    expect(screen.getByText('Próximos')).toBeInTheDocument()
  })

  it('should show tool name and article title', async () => {
    await renderAndWait(<UpcomingDeadlines deadlines={[makeDeadline()]} />)
    expect(screen.getByText('ChatGPT')).toBeInTheDocument()
    expect(screen.getByText('Art. 4 — Alfabetización en IA')).toBeInTheDocument()
  })

  it('should show regulation label', async () => {
    await renderAndWait(<UpcomingDeadlines deadlines={[makeDeadline()]} />)
    expect(screen.getByText('EU AI Act')).toBeInTheDocument()
  })

  it('should show risk level badge', async () => {
    await renderAndWait(<UpcomingDeadlines deadlines={[makeDeadline({ riskLevel: 'high' })]} />)
    expect(screen.getByText('Alto')).toBeInTheDocument()
  })

  it('should show formatted due date', async () => {
    const dueDate = new Date(2026, 3, 15).toISOString()
    await renderAndWait(<UpcomingDeadlines deadlines={[makeDeadline({ dueDate })]} />)
    expect(screen.getByText(/15\/04\/2026/)).toBeInTheDocument()
  })

  it('should show correct days label for overdue', async () => {
    await renderAndWait(<UpcomingDeadlines deadlines={[makeDeadline({ daysRemaining: -5, urgency: 'overdue' })]} />)
    expect(screen.getByText('Vencido hace 5d')).toBeInTheDocument()
  })

  it('should show correct days label for today', async () => {
    await renderAndWait(<UpcomingDeadlines deadlines={[makeDeadline({ daysRemaining: 0, urgency: 'this_week' })]} />)
    expect(screen.getByText('Vence hoy')).toBeInTheDocument()
  })

  it('should show correct days label for tomorrow', async () => {
    await renderAndWait(<UpcomingDeadlines deadlines={[makeDeadline({ daysRemaining: 1, urgency: 'this_week' })]} />)
    expect(screen.getByText('Vence mañana')).toBeInTheDocument()
  })

  it('should show correct days label for future', async () => {
    await renderAndWait(<UpcomingDeadlines deadlines={[makeDeadline({ daysRemaining: 10, urgency: 'this_month' })]} />)
    expect(screen.getByText('En 10 días')).toBeInTheDocument()
  })

  it('should show count per urgency group', async () => {
    const deadlines = [
      makeDeadline({ urgency: 'overdue', daysRemaining: -3, toolId: 'd1' }),
      makeDeadline({ urgency: 'overdue', daysRemaining: -1, toolId: 'd2' }),
      makeDeadline({ urgency: 'this_week', daysRemaining: 3, toolId: 'd3' }),
    ]
    await renderAndWait(<UpcomingDeadlines deadlines={deadlines} />)
    expect(screen.getByText('(2)')).toBeInTheDocument()
  })
})
