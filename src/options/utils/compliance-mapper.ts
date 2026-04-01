import type { DiscoveryRecord } from '@shared/types/discovery'
import type { RegulationType, AssessmentStatus } from '@shared/types/compliance'
import type { RiskLevel } from '@shared/types/domain'
import type { RegulationArticle } from '@shared/constants/regulations'
import { REGULATIONS } from '@shared/constants/regulations'
import { RISK_LEVEL_LABELS, DISCOVERY_STATUS_LABELS } from '@shared/constants/risk-levels'
import { CATEGORY_LABELS } from '@shared/constants/categories'

export interface ComplianceGap {
  regulationId: RegulationType
  regulationName: string
  articleId: string
  articleTitle: string
  toolName: string
  domain: string
  category: string
  riskLevel: RiskLevel
  status: string
  assessment: AssessmentStatus
  action: string
  severity: number
  dueDate: string | null
}

export interface RegulationComplianceSummary {
  regulationId: RegulationType
  regulationName: string
  totalTools: number
  complete: number
  pending: number
  overdue: number
  notApplicable: number
  percentComplete: number
  gaps: ComplianceGap[]
}

export interface ComplianceMapResult {
  summaries: RegulationComplianceSummary[]
  allGaps: ComplianceGap[]
  totalGaps: number
  overallPercentComplete: number
}

const severityMap: Record<AssessmentStatus, number> = {
  overdue: 4,
  pending: 3,
  not_applicable: 0,
  complete: 0,
}

function suggestAction(
  assessment: AssessmentStatus,
  riskLevel: RiskLevel,
  article: RegulationArticle,
): string {
  if (assessment === 'overdue') {
    return `URGENTE: Evaluar "${article.title}" para la herramienta de ${RISK_LEVEL_LABELS[riskLevel]} riesgo. Plazo vencido.`
  }
  if (assessment === 'pending') {
    if (riskLevel === 'prohibited' || riskLevel === 'high') {
      return `Prioridad alta: Completar "${article.title}". Herramienta de riesgo ${RISK_LEVEL_LABELS[riskLevel]}.`
    }
    return `Completar "${article.title}" según cronograma de evaluación.`
  }
  return ''
}

function relevantArticles(
  regId: RegulationType,
  riskLevel: RiskLevel,
): RegulationArticle[] {
  const articles = REGULATIONS[regId].articles

  if (regId === 'euAiAct') {
    if (riskLevel === 'prohibited') return articles.filter((a) => ['art-4', 'art-50'].includes(a.id))
    if (riskLevel === 'high') return articles.filter((a) => !['art-4'].includes(a.id))
    return articles.filter((a) => ['art-4', 'art-50'].includes(a.id))
  }

  if (regId === 'iso42001') {
    return articles
  }

  if (regId === 'coSb205') {
    if (riskLevel === 'high' || riskLevel === 'prohibited') return articles
    return articles.filter((a) => ['co-disclosure', 'co-public-statement'].includes(a.id))
  }

  return articles
}

export function mapCompliance(discoveries: DiscoveryRecord[]): ComplianceMapResult {
  const regulationKeys: RegulationType[] = ['euAiAct', 'iso42001', 'coSb205']
  const allGaps: ComplianceGap[] = []

  const summaries = regulationKeys.map((regId) => {
    const reg = REGULATIONS[regId]
    let totalChecklists = 0
    let complete = 0
    let pending = 0
    let overdue = 0
    let notApplicable = 0

    const gaps: ComplianceGap[] = []

    for (const d of discoveries) {
      const articleMap = d.complianceStatus[regId]
      const effectiveRisk: RiskLevel = d.userRiskLevel ?? d.defaultRiskLevel
      const articles = relevantArticles(regId, effectiveRisk)

      for (const article of articles) {
        const checklist = articleMap[article.id]
        if (!checklist) continue

        totalChecklists++

        if (checklist.assessment === 'complete') {
          complete++
          continue
        }
        if (checklist.assessment === 'not_applicable') {
          notApplicable++
          continue
        }
        if (checklist.assessment === 'overdue') {
          overdue++
        } else {
          pending++
        }

        const action = suggestAction(checklist.assessment, effectiveRisk, article)
        gaps.push({
          regulationId: regId,
          regulationName: reg.shortName,
          articleId: article.id,
          articleTitle: article.title,
          toolName: d.toolName,
          domain: d.domain,
          category: CATEGORY_LABELS[d.category],
          riskLevel: effectiveRisk,
          status: DISCOVERY_STATUS_LABELS[d.status],
          assessment: checklist.assessment,
          action,
          severity: severityMap[checklist.assessment],
          dueDate: checklist.dueDate,
        })
      }
    }

    const assessable = totalChecklists - notApplicable
    const percentComplete = assessable > 0 ? Math.round((complete / assessable) * 100) : 100

    gaps.sort((a, b) => b.severity - a.severity)
    allGaps.push(...gaps)

    return {
      regulationId: regId,
      regulationName: reg.shortName,
      totalTools: discoveries.length,
      complete,
      pending,
      overdue,
      notApplicable,
      percentComplete,
      gaps,
    }
  })

  allGaps.sort((a, b) => b.severity - a.severity)

  const totalAssessable = summaries.reduce((sum, s) => sum + s.complete + s.pending + s.overdue, 0)
  const totalComplete = summaries.reduce((sum, s) => sum + s.complete, 0)
  const overallPercentComplete = totalAssessable > 0 ? Math.round((totalComplete / totalAssessable) * 100) : 100

  return {
    summaries,
    allGaps,
    totalGaps: allGaps.length,
    overallPercentComplete,
  }
}
