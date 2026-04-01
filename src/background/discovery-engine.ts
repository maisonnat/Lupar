import { extractDomain, lookupDomain, addCustomEntry } from '@background/domain-registry'
import {
  getDiscoveries,
  createDiscovery,
  updateDiscovery,
  saveDiscovery,
  getSettings,
  logActivity,
  initializeWithMigration,
} from '@background/storage-service'
import { markOverdueAssessments, evaluateBadgeState } from '@options/utils/risk-calculator'
import { checkAndTakeScheduledSnapshot } from '@options/utils/snapshot-service'

const THROTTLE_MS = 5000
const throttleMap = new Map<string, number>()

export function resetThrottleMap(): void {
  throttleMap.clear()
}

function isThrottled(domain: string): boolean {
  const lastTime = throttleMap.get(domain)
  if (lastTime === undefined) return false
  return Date.now() - lastTime < THROTTLE_MS
}

function markThrottled(domain: string): void {
  throttleMap.set(domain, Date.now())
}

export async function handleNavigation(url: string): Promise<void> {
  const domain = extractDomain(url)
  if (!domain) return

  const settings = await getSettings()
  if (settings.excludedDomains.includes(domain)) return

  const entry = lookupDomain(domain)
  if (!entry) return

  if (isThrottled(domain)) return
  markThrottled(domain)

  const discoveries = await getDiscoveries()
  const existing = discoveries.find((d) => d.domain === domain)

  if (existing) {
    const newCount = existing.visitCount + 1
    await updateDiscovery(existing.id, {
      visitCount: newCount,
      lastSeen: new Date().toISOString(),
    })

    if (newCount % 10 === 0) {
      await logActivity(
        'status_changed',
        domain,
        `Herramienta visitada ${newCount} veces: ${existing.toolName}`,
      )
    }
  } else {
    await createDiscovery(domain, entry.toolName, entry.category, entry.defaultRiskLevel, settings)
    await logActivity(
      'new_detection',
      domain,
      `Nueva herramienta detectada: ${entry.toolName}`,
    )
  }

  await updateBadge()
}

export async function updateBadge(): Promise<void> {
  const [discoveries, settings] = await Promise.all([
    getDiscoveries(),
    getSettings(),
  ])

  const state = evaluateBadgeState(discoveries, settings)

  chrome.action.setBadgeText({
    text: state.visible ? state.text : '',
  })
  chrome.action.setBadgeBackgroundColor({ color: state.color })
}

export async function loadCustomDomains(): Promise<void> {
  const settings = await getSettings()
  for (const custom of settings.customDomains) {
    addCustomEntry({
      domain: custom.domain,
      toolName: custom.toolName,
      category: custom.category,
      defaultRiskLevel: custom.defaultRiskLevel,
    })
  }
}

async function markOverdueOnStartup(): Promise<void> {
  const [discoveries, settings] = await Promise.all([
    getDiscoveries(),
    getSettings(),
  ])

  const updated = markOverdueAssessments(discoveries, settings)
  const hasChanges = updated.some((d, i) =>
    JSON.stringify(d.complianceStatus) !== JSON.stringify(discoveries[i].complianceStatus)
  )

  if (hasChanges) {
    await Promise.all(updated.map((d) => saveDiscovery(d)))
  }
}

export async function initializeEngine(): Promise<void> {
  resetThrottleMap()
  await initializeWithMigration()
  await loadCustomDomains()
  await markOverdueOnStartup()
  await checkScheduledSnapshot()
  await updateBadge()
}

async function checkScheduledSnapshot(): Promise<void> {
  const settings = await getSettings()
  await checkAndTakeScheduledSnapshot(settings.snapshotFrequencyDays)
}
