import { v4 as uuidv4 } from 'uuid'
import type { DiscoveryRecord, AuditEntry, AuditField } from '@shared/types/discovery'
import type { RegulationType, AssessmentStatus } from '@shared/types/compliance'
import { RISK_LEVEL_LABELS, DISCOVERY_STATUS_LABELS } from '@shared/constants/risk-levels'
import { REGULATIONS } from '@shared/constants/regulations'

export const AUDIT_FIELD_LABELS: Record<AuditField, string> = {
  status: 'Estado',
  riskLevel: 'Nivel de Riesgo',
  department: 'Departamento',
  notes: 'Notas',
  compliance: 'Compliance',
}

const ASSESSMENT_LABELS: Record<AssessmentStatus, string> = {
  pending: 'Pendiente',
  complete: 'Completo',
  not_applicable: 'No aplica',
  overdue: 'Vencido',
}

export const MAX_AUDIT_ENTRIES_PER_TOOL = 100

function createEntry(
  field: AuditField,
  oldValue: string,
  newValue: string,
  changedBy: string | null = null,
): AuditEntry {
  return {
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    field,
    oldValue,
    newValue,
    changedBy,
  }
}

function diffRiskLevel(original: DiscoveryRecord, updated: DiscoveryRecord, changedBy: string | null): AuditEntry | null {
  const oldEffective = original.userRiskLevel ?? original.defaultRiskLevel
  const newEffective = updated.userRiskLevel ?? updated.defaultRiskLevel

  if (oldEffective === newEffective) return null

  return createEntry(
    'riskLevel',
    RISK_LEVEL_LABELS[oldEffective],
    RISK_LEVEL_LABELS[newEffective],
    changedBy,
  )
}

function diffStatus(original: DiscoveryRecord, updated: DiscoveryRecord, changedBy: string | null): AuditEntry | null {
  if (original.status === updated.status) return null

  return createEntry(
    'status',
    DISCOVERY_STATUS_LABELS[original.status],
    DISCOVERY_STATUS_LABELS[updated.status],
    changedBy,
  )
}

function diffDepartment(original: DiscoveryRecord, updated: DiscoveryRecord, changedBy: string | null): AuditEntry | null {
  const oldDept = original.department ?? '(sin asignar)'
  const newDept = updated.department ?? '(sin asignar)'

  if (original.department === updated.department) return null

  return createEntry('department', oldDept, newDept, changedBy)
}

function diffNotes(original: DiscoveryRecord, updated: DiscoveryRecord, changedBy: string | null): AuditEntry | null {
  if (original.notes === updated.notes) return null

  const oldDisplay = original.notes || '(vacío)'
  const newDisplay = updated.notes || '(vacío)'

  const truncatedOld = oldDisplay.length > 80 ? oldDisplay.slice(0, 80) + '…' : oldDisplay
  const truncatedNew = newDisplay.length > 80 ? newDisplay.slice(0, 80) + '…' : newDisplay

  return createEntry('notes', truncatedOld, truncatedNew, changedBy)
}

function diffCompliance(original: DiscoveryRecord, updated: DiscoveryRecord, changedBy: string | null): AuditEntry[] {
  const entries: AuditEntry[] = []
  const regulationKeys: RegulationType[] = ['euAiAct', 'iso42001', 'coSb205']

  for (const regKey of regulationKeys) {
    const originalMap = original.complianceStatus[regKey]
    const updatedMap = updated.complianceStatus[regKey]
    const regInfo = REGULATIONS[regKey]

    if (!originalMap || !updatedMap) continue

    const articleIds = new Set([
      ...Object.keys(originalMap),
      ...Object.keys(updatedMap),
    ])

    for (const articleId of articleIds) {
      const oldChecklist = originalMap[articleId]
      const newChecklist = updatedMap[articleId]

      if (!oldChecklist || !newChecklist) continue
      if (oldChecklist.assessment === newChecklist.assessment) continue

      const article = regInfo.articles.find((a) => a.id === articleId)
      const articleLabel = article?.title ?? articleId

      entries.push(
        createEntry(
          'compliance',
          `${regInfo.shortName} · ${articleLabel}: ${ASSESSMENT_LABELS[oldChecklist.assessment]}`,
          `${regInfo.shortName} · ${articleLabel}: ${ASSESSMENT_LABELS[newChecklist.assessment]}`,
          changedBy,
        ),
      )
    }
  }

  return entries
}

export function createAuditEntries(
  original: DiscoveryRecord,
  updated: DiscoveryRecord,
  changedBy: string | null = null,
): AuditEntry[] {
  const entries: AuditEntry[] = []

  const riskEntry = diffRiskLevel(original, updated, changedBy)
  if (riskEntry) entries.push(riskEntry)

  const statusEntry = diffStatus(original, updated, changedBy)
  if (statusEntry) entries.push(statusEntry)

  const deptEntry = diffDepartment(original, updated, changedBy)
  if (deptEntry) entries.push(deptEntry)

  const notesEntry = diffNotes(original, updated, changedBy)
  if (notesEntry) entries.push(notesEntry)

  const complianceEntries = diffCompliance(original, updated, changedBy)
  entries.push(...complianceEntries)

  return entries
}

export function appendAuditEntries(
  existingTrail: AuditEntry[],
  newEntries: AuditEntry[],
): AuditEntry[] {
  const combined = [...existingTrail, ...newEntries]
  if (combined.length > MAX_AUDIT_ENTRIES_PER_TOOL) {
    return combined.slice(combined.length - MAX_AUDIT_ENTRIES_PER_TOOL)
  }
  return combined
}
