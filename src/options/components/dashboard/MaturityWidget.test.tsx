// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import MaturityWidget from '@options/components/dashboard/MaturityWidget'
import type { MaturityMetrics } from '@shared/utils/risk-calculator'

describe('MaturityWidget', () => {
  it('should render empty state when no articles', () => {
    const metrics: MaturityMetrics = {
      coveragePercent: 0,
      averageAssessmentDays: null,
      trend: 'unknown',
      trendDelta: 0,
      totalArticles: 0,
      assessedArticles: 0,
      pendingArticles: 0,
      overdueArticles: 0,
      notApplicableArticles: 0,
      recentAssessments: 0,
    }

    render(<MaturityWidget metrics={metrics} />)
    expect(screen.getByText('Métricas de Madurez')).toBeDefined()
    expect(screen.getByText('No hay artículos de compliance para evaluar.')).toBeDefined()
  })

  it('should render coverage percentage', () => {
    const metrics: MaturityMetrics = {
      coveragePercent: 75,
      averageAssessmentDays: 30,
      trend: 'improving',
      trendDelta: 10,
      totalArticles: 10,
      assessedArticles: 7,
      pendingArticles: 2,
      overdueArticles: 1,
      notApplicableArticles: 0,
      recentAssessments: 3,
    }

    render(<MaturityWidget metrics={metrics} />)
    expect(screen.getByText('75%')).toBeDefined()
    expect(screen.getByText('Cobertura')).toBeDefined()
  })

  it('should render average assessment time', () => {
    const metrics: MaturityMetrics = {
      coveragePercent: 50,
      averageAssessmentDays: 30,
      trend: 'stable',
      trendDelta: 0,
      totalArticles: 8,
      assessedArticles: 4,
      pendingArticles: 4,
      overdueArticles: 0,
      notApplicableArticles: 0,
      recentAssessments: 1,
    }

    render(<MaturityWidget metrics={metrics} />)
    expect(screen.getByText('< 1 mes')).toBeDefined()
    expect(screen.getByText('Tiempo promedio')).toBeDefined()
  })

  it('should render recent assessments count', () => {
    const metrics: MaturityMetrics = {
      coveragePercent: 60,
      averageAssessmentDays: 14,
      trend: 'declining',
      trendDelta: -8,
      totalArticles: 12,
      assessedArticles: 7,
      pendingArticles: 3,
      overdueArticles: 2,
      notApplicableArticles: 0,
      recentAssessments: 5,
    }

    render(<MaturityWidget metrics={metrics} />)
    expect(screen.getByText('5')).toBeDefined()
    expect(screen.getByText('Evaluaciones (7d)')).toBeDefined()
  })

  it('should render improving trend', () => {
    const metrics: MaturityMetrics = {
      coveragePercent: 80,
      averageAssessmentDays: 20,
      trend: 'improving',
      trendDelta: 15,
      totalArticles: 10,
      assessedArticles: 8,
      pendingArticles: 2,
      overdueArticles: 0,
      notApplicableArticles: 0,
      recentAssessments: 2,
    }

    render(<MaturityWidget metrics={metrics} />)
    expect(screen.getByText('Mejorando')).toBeDefined()
    expect(screen.getByText('+15% vs período anterior')).toBeDefined()
  })

  it('should render declining trend', () => {
    const metrics: MaturityMetrics = {
      coveragePercent: 40,
      averageAssessmentDays: 60,
      trend: 'declining',
      trendDelta: -12,
      totalArticles: 10,
      assessedArticles: 4,
      pendingArticles: 4,
      overdueArticles: 2,
      notApplicableArticles: 0,
      recentAssessments: 0,
    }

    render(<MaturityWidget metrics={metrics} />)
    expect(screen.getByText('Declinando')).toBeDefined()
    expect(screen.getByText('-12% vs período anterior')).toBeDefined()
  })

  it('should render stable trend', () => {
    const metrics: MaturityMetrics = {
      coveragePercent: 55,
      averageAssessmentDays: 45,
      trend: 'stable',
      trendDelta: 2,
      totalArticles: 8,
      assessedArticles: 4,
      pendingArticles: 3,
      overdueArticles: 1,
      notApplicableArticles: 0,
      recentAssessments: 1,
    }

    render(<MaturityWidget metrics={metrics} />)
    expect(screen.getByText('Estable')).toBeDefined()
  })

  it('should render unknown trend', () => {
    const metrics: MaturityMetrics = {
      coveragePercent: 0,
      averageAssessmentDays: null,
      trend: 'unknown',
      trendDelta: 0,
      totalArticles: 5,
      assessedArticles: 0,
      pendingArticles: 5,
      overdueArticles: 0,
      notApplicableArticles: 0,
      recentAssessments: 0,
    }

    render(<MaturityWidget metrics={metrics} />)
    expect(screen.getByText('Sin datos')).toBeDefined()
  })

  it('should render article status badges', () => {
    const metrics: MaturityMetrics = {
      coveragePercent: 70,
      averageAssessmentDays: 25,
      trend: 'improving',
      trendDelta: 5,
      totalArticles: 10,
      assessedArticles: 7,
      pendingArticles: 2,
      overdueArticles: 1,
      notApplicableArticles: 0,
      recentAssessments: 3,
    }

    render(<MaturityWidget metrics={metrics} />)
    expect(screen.getByText('Estado de artículos (10 total)')).toBeDefined()
  })

  it('should render article count', () => {
    const metrics: MaturityMetrics = {
      coveragePercent: 100,
      averageAssessmentDays: 10,
      trend: 'stable',
      trendDelta: 0,
      totalArticles: 15,
      assessedArticles: 15,
      pendingArticles: 0,
      overdueArticles: 0,
      notApplicableArticles: 0,
      recentAssessments: 2,
    }

    render(<MaturityWidget metrics={metrics} />)
    expect(screen.getByText('Estado de artículos (15 total)')).toBeDefined()
  })
})