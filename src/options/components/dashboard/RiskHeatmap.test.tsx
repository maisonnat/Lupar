// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import RiskHeatmap from '@options/components/dashboard/RiskHeatmap'
import type { HeatmapData } from '@shared/utils/risk-calculator'

function makeEmptyData(): HeatmapData {
  return { departments: [], cells: {}, maxCount: 0, totalTools: 0 }
}

function makeData(): HeatmapData {
  return {
    departments: ['Engineering', 'Marketing', 'Sin asignar'],
    cells: {
      Engineering: { prohibited: 2, high: 3, limited: 1, minimal: 0 },
      Marketing: { prohibited: 0, high: 1, limited: 2, minimal: 4 },
      'Sin asignar': { prohibited: 1, high: 0, limited: 0, minimal: 1 },
    },
    maxCount: 4,
    totalTools: 14,
  }
}

describe('RiskHeatmap', () => {
  it('should render empty state when no data', () => {
    render(<RiskHeatmap data={makeEmptyData()} />)
    expect(screen.getByText('Mapa de Calor — Departamento × Riesgo')).toBeInTheDocument()
    expect(screen.getByText(/Sin datos para mostrar/)).toBeInTheDocument()
  })

  it('should render heading and total tools count', () => {
    render(<RiskHeatmap data={makeData()} />)
    expect(screen.getByText('Mapa de Calor — Departamento × Riesgo')).toBeInTheDocument()
    expect(screen.getByText('14 herramientas')).toBeInTheDocument()
  })

  it('should render singular count when 1 tool', () => {
    const data: HeatmapData = {
      departments: ['IT'],
      cells: { IT: { prohibited: 1, high: 0, limited: 0, minimal: 0 } },
      maxCount: 1,
      totalTools: 1,
    }
    render(<RiskHeatmap data={data} />)
    expect(screen.getByText('1 herramienta')).toBeInTheDocument()
  })

  it('should render risk level column headers', () => {
    render(<RiskHeatmap data={makeData()} />)
    expect(screen.getByText('Prohibido')).toBeInTheDocument()
    expect(screen.getByText('Alto')).toBeInTheDocument()
    expect(screen.getByText('Limitado')).toBeInTheDocument()
    expect(screen.getByText('Mínimo')).toBeInTheDocument()
  })

  it('should render department names', () => {
    render(<RiskHeatmap data={makeData()} />)
    expect(screen.getByText('Engineering')).toBeInTheDocument()
    expect(screen.getByText('Marketing')).toBeInTheDocument()
    expect(screen.getByText('Sin asignar')).toBeInTheDocument()
  })

  it('should render counts in cells', () => {
    render(<RiskHeatmap data={makeData()} />)
    const counts = screen.getAllByText('2')
    expect(counts.length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()
  })

  it('should render total column', () => {
    render(<RiskHeatmap data={makeData()} />)
    const engineeringRow = screen.getByText('Engineering').closest('tr')
    expect(engineeringRow).not.toBeNull()
    const totalCell = engineeringRow!.querySelector('td:last-child')
    expect(totalCell?.textContent).toBe('6')
  })

  it('should render intensity legend', () => {
    render(<RiskHeatmap data={makeData()} />)
    expect(screen.getByText('Intensidad:')).toBeInTheDocument()
    expect(screen.getByText('Bajo → Alto')).toBeInTheDocument()
  })

  it('should not show empty cells as zero', () => {
    const data: HeatmapData = {
      departments: ['IT'],
      cells: { IT: { prohibited: 0, high: 0, limited: 0, minimal: 0 } },
      maxCount: 0,
      totalTools: 0,
    }
    render(<RiskHeatmap data={data} />)
    const cells = screen.getByText('IT').closest('tr')!.querySelectorAll('td')
    const dataCells = Array.from(cells).slice(1, 5)
    for (const cell of dataCells) {
      expect(cell.textContent).toBe('')
    }
  })
})
