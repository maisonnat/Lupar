import { v4 as uuidv4 } from 'uuid'
import type { DiscoveryRecord } from '@shared/types/discovery'
import type {
  AppSettings,
  ActivityLogEntry,
  StorageSchema,
} from '@shared/types/storage'
import type { RiskLevel } from '@shared/types/domain'
import {
  STORAGE_KEYS,
  ACTIVITY_LOG_MAX_ENTRIES,
} from '@shared/types/storage'
import type { RegulationType } from '@shared/types/compliance'
import { calculateDueDate } from '@options/utils/risk-calculator'
import { createArticleChecklistMap } from '@shared/constants/regulations'
import { detectTimezone } from '@shared/utils/date-utils'

function createDefaultSettings(): AppSettings {
  return {
    version: '1.0.0',
    companyName: '',
    responsiblePerson: '',
    installationDate: new Date().toISOString(),
    badgeNotifications: true,
    requireDepartment: false,
    snapshotFrequencyDays: 0,
    timezone: detectTimezone(),
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
      newDetectionRiskLevels: ['prohibited', 'high'] as RiskLevel[],
      maxUnassessedCount: 10,
    },
    adminProfile: {
      adminName: '',
      adminEmail: '',
      adminRole: 'compliance_officer',
      department: '',
    },
  }
}

async function readKey<T>(key: string, defaultValue: T): Promise<T> {
  try {
    const result = await chrome.storage.local.get(key)
    if (result[key] !== undefined) {
      return result[key] as T
    }
    return defaultValue
  } catch (error) {
    throw new StorageError(`Error leyendo clave "${key}"`, error)
  }
}

async function writeKey<T>(key: string, value: T): Promise<void> {
  try {
    await chrome.storage.local.set({ [key]: value })
  } catch (error) {
    throw new StorageError(`Error escribiendo clave "${key}"`, error)
  }
}

class StorageError extends Error {
  readonly cause: unknown

  constructor(message: string, cause?: unknown) {
    super(message)
    this.name = 'StorageError'
    this.cause = cause
  }
}

export async function getDiscoveries(): Promise<DiscoveryRecord[]> {
  return readKey<DiscoveryRecord[]>(STORAGE_KEYS.AI_DISCOVERIES, [])
}

export async function saveDiscovery(record: DiscoveryRecord): Promise<void> {
  const discoveries = await getDiscoveries()
  const index = discoveries.findIndex((d) => d.id === record.id)

  if (index >= 0) {
    discoveries[index] = record
  } else {
    discoveries.push(record)
  }

  await writeKey(STORAGE_KEYS.AI_DISCOVERIES, discoveries)
}

export async function createDiscovery(
  domain: string,
  toolName: string,
  category: DiscoveryRecord['category'],
  defaultRiskLevel: DiscoveryRecord['defaultRiskLevel'],
  settings: AppSettings,
): Promise<DiscoveryRecord> {
  const now = new Date().toISOString()
  const regulationKeys: RegulationType[] = ['euAiAct', 'iso42001', 'coSb205']
  const complianceStatus: DiscoveryRecord['complianceStatus'] = {} as DiscoveryRecord['complianceStatus']
  for (const regKey of regulationKeys) {
    const config = settings.regulationConfig?.[regKey]
    const enabled = config?.enabled ?? true
    const dueDate = enabled ? calculateDueDate(regKey, settings) : null
    complianceStatus[regKey] = createArticleChecklistMap(regKey, enabled, dueDate)
  }
  const record: DiscoveryRecord = {
    id: uuidv4(),
    domain,
    toolName,
    category,
    defaultRiskLevel,
    userRiskLevel: null,
    status: 'detected',
    department: null,
    firstSeen: now,
    lastSeen: now,
    visitCount: 1,
    complianceStatus,
    notes: '',
    tags: [],
    auditTrail: [],
  }

  await saveDiscovery(record)
  return record
}

export async function updateDiscovery(
  id: string,
  updates: Partial<Omit<DiscoveryRecord, 'id'>>,
): Promise<DiscoveryRecord | null> {
  const discoveries = await getDiscoveries()
  const index = discoveries.findIndex((d) => d.id === id)

  if (index < 0) return null

  discoveries[index] = { ...discoveries[index], ...updates }
  await writeKey(STORAGE_KEYS.AI_DISCOVERIES, discoveries)
  return discoveries[index]
}

export async function deleteDiscovery(id: string): Promise<boolean> {
  const discoveries = await getDiscoveries()
  const filtered = discoveries.filter((d) => d.id !== id)

  if (filtered.length === discoveries.length) return false

  await writeKey(STORAGE_KEYS.AI_DISCOVERIES, filtered)
  return true
}

export async function getSettings(): Promise<AppSettings> {
  return readKey<AppSettings>(STORAGE_KEYS.APP_SETTINGS, createDefaultSettings())
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await writeKey(STORAGE_KEYS.APP_SETTINGS, settings)
}

export async function updateSettings(
  updates: Partial<AppSettings>,
): Promise<AppSettings> {
  const current = await getSettings()
  const updated = { ...current, ...updates }
  await writeKey(STORAGE_KEYS.APP_SETTINGS, updated)
  return updated
}

export async function getActivityLog(): Promise<ActivityLogEntry[]> {
  return readKey<ActivityLogEntry[]>(STORAGE_KEYS.ACTIVITY_LOG, [])
}

export async function logActivity(
  eventType: ActivityLogEntry['eventType'],
  domain: string,
  details: string,
): Promise<ActivityLogEntry> {
  const log = await getActivityLog()
  const entry: ActivityLogEntry = {
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    eventType,
    domain,
    details,
  }

  log.push(entry)

  if (log.length > ACTIVITY_LOG_MAX_ENTRIES) {
    log.splice(0, log.length - ACTIVITY_LOG_MAX_ENTRIES)
  }

  await writeKey(STORAGE_KEYS.ACTIVITY_LOG, log)
  return entry
}

export async function initializeDefaults(): Promise<void> {
  const existing = await chrome.storage.local.get(STORAGE_KEYS.AI_DISCOVERIES)
  if (existing[STORAGE_KEYS.AI_DISCOVERIES] === undefined) {
    await writeKey(STORAGE_KEYS.AI_DISCOVERIES, [])
  }

  const existingSettings = await chrome.storage.local.get(STORAGE_KEYS.APP_SETTINGS)
  if (existingSettings[STORAGE_KEYS.APP_SETTINGS] === undefined) {
    await writeKey(STORAGE_KEYS.APP_SETTINGS, createDefaultSettings())
  }

  const existingLog = await chrome.storage.local.get(STORAGE_KEYS.ACTIVITY_LOG)
  if (existingLog[STORAGE_KEYS.ACTIVITY_LOG] === undefined) {
    await writeKey(STORAGE_KEYS.ACTIVITY_LOG, [])
  }

  const existingSnapshots = await chrome.storage.local.get(STORAGE_KEYS.COMPLIANCE_SNAPSHOTS)
  if (existingSnapshots[STORAGE_KEYS.COMPLIANCE_SNAPSHOTS] === undefined) {
    await writeKey(STORAGE_KEYS.COMPLIANCE_SNAPSHOTS, [])
  }
}

function isLegacyComplianceStatus(
  cs: unknown,
): cs is Record<string, { assessment: string; lastAssessedDate: string | null; dueDate: string | null; notes: string }> {
  if (typeof cs !== 'object' || cs === null) return false
  const obj = cs as Record<string, unknown>
  const regKeys = ['euAiAct', 'iso42001', 'coSb205']
  return regKeys.every((key) => {
    const val = obj[key]
    return (
      typeof val === 'object' &&
      val !== null &&
      'assessment' in val &&
      !('art-4' in val) &&
      !('iso-aims-inventory' in val)
    )
  })
}

async function migrateComplianceToPerArticle(): Promise<boolean> {
  const discoveries = await getDiscoveries()
  const settings = await getSettings()
  const regulationKeys: RegulationType[] = ['euAiAct', 'iso42001', 'coSb205']
  let migrated = false

  for (const discovery of discoveries) {
    if (!isLegacyComplianceStatus(discovery.complianceStatus as unknown)) continue

    const legacyStatus = discovery.complianceStatus as unknown as Record<string, { assessment: string; lastAssessedDate: string | null; dueDate: string | null; notes: string }>

    const newStatus: DiscoveryRecord['complianceStatus'] = {} as DiscoveryRecord['complianceStatus']
    for (const regKey of regulationKeys) {
      const old = legacyStatus[regKey]
      const config = settings.regulationConfig?.[regKey]
      const enabled = config?.enabled ?? true
      const dueDate = enabled ? calculateDueDate(regKey, settings) : null
      const articleMap = createArticleChecklistMap(regKey, enabled, dueDate)

      if (old && (old.assessment === 'complete' || old.assessment === 'not_applicable')) {
        for (const articleId of Object.keys(articleMap)) {
          articleMap[articleId] = {
            assessment: old.assessment,
            lastAssessedDate: old.lastAssessedDate,
            dueDate: old.dueDate,
            notes: old.notes,
          }
        }
      }

      newStatus[regKey] = articleMap
    }

    discovery.complianceStatus = newStatus
    migrated = true
  }

  if (migrated) {
    await writeKey(STORAGE_KEYS.AI_DISCOVERIES, discoveries)
  }

  return migrated
}

export async function initializeWithMigration(): Promise<void> {
  await initializeDefaults()
  await migrateComplianceToPerArticle()
}

export async function exportAll(): Promise<StorageSchema> {
  const [discoveries, settings, log] = await Promise.all([
    getDiscoveries(),
    getSettings(),
    getActivityLog(),
  ])

  const snapshotsResult = await chrome.storage.local.get(STORAGE_KEYS.COMPLIANCE_SNAPSHOTS)
  const snapshots = (snapshotsResult[STORAGE_KEYS.COMPLIANCE_SNAPSHOTS] as StorageSchema['compliance_snapshots']) ?? []

  return {
    ai_discoveries: discoveries,
    app_settings: settings,
    activity_log: log,
    compliance_snapshots: snapshots,
  }
}

export async function importAll(data: StorageSchema): Promise<void> {
  if (!Array.isArray(data.ai_discoveries)) {
    throw new StorageError('Esquema inválido: ai_discoveries debe ser un array')
  }
  if (!data.app_settings || typeof data.app_settings !== 'object') {
    throw new StorageError('Esquema inválido: app_settings debe ser un objeto')
  }
  if (!Array.isArray(data.activity_log)) {
    throw new StorageError('Esquema inválido: activity_log debe ser un array')
  }

  const snapshots = Array.isArray(data.compliance_snapshots) ? data.compliance_snapshots : []

  await Promise.all([
    writeKey(STORAGE_KEYS.AI_DISCOVERIES, data.ai_discoveries),
    writeKey(STORAGE_KEYS.APP_SETTINGS, data.app_settings),
    writeKey(STORAGE_KEYS.ACTIVITY_LOG, data.activity_log),
    writeKey(STORAGE_KEYS.COMPLIANCE_SNAPSHOTS, snapshots),
  ])
}

export async function clearAll(): Promise<void> {
  try {
    await chrome.storage.local.clear()
    await initializeDefaults()
  } catch (error) {
    throw new StorageError('Error limpiando almacenamiento', error)
  }
}

export { StorageError }
