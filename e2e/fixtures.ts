import { test as base, chromium, expect } from '@playwright/test'
import type { BrowserContext, Page, Worker } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export interface DiscoveryInfo {
  id: string
  domain: string
  toolName: string
  category: string
  defaultRiskLevel: string
  userRiskLevel: string | null
  status: string
  department: string | null
  firstSeen: string
  lastSeen: string
  visitCount: number
  notes: string
  tags: string[]
}

interface ComplianceChecklistInfo {
  assessment: string
  lastAssessedDate: string | null
  dueDate: string | null
  notes: string
}

export interface FullDiscoveryRecord extends DiscoveryInfo {
  complianceStatus: {
    euAiAct: Record<string, ComplianceChecklistInfo>
    iso42001: Record<string, ComplianceChecklistInfo>
    coSb205: Record<string, ComplianceChecklistInfo>
  }
  auditTrail: Array<{
    id: string
    timestamp: string
    field: string
    oldValue: string
    newValue: string
    changedBy: string | null
  }>
}

type ExtensionFixtures = {
  extensionContext: BrowserContext
  extensionId: string
  serviceWorker: Worker
}

export const test = base.extend<ExtensionFixtures>({
  extensionContext: async ({}, use) => {
    const extensionPath = process.env.EXTENSION_PATH
      ? path.resolve(process.env.EXTENSION_PATH)
      : path.resolve(__dirname, '..', 'dist')

    const ctx = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
      ],
    })

    await use(ctx)
    await ctx.close()
  },

  serviceWorker: async ({ extensionContext }, use) => {
    const sw = extensionContext.serviceWorkers()[0]
      ?? await extensionContext.waitForEvent('serviceworker')
    await use(sw)
  },

  extensionId: async ({ extensionContext, serviceWorker }, use) => {
    await use(serviceWorker.url().split('/')[2])
  },

  page: async ({ extensionContext }, use) => {
    const pages = extensionContext.pages()
    const page = pages.length > 0 ? pages[0] : await extensionContext.newPage()
    await use(page)
  },
})

export { expect }

export async function resetExtension(sw: Worker): Promise<void> {
  await sw.evaluate(async () => {
    await chrome.storage.local.clear()
    await chrome.storage.local.set({
      ai_discoveries: [],
      app_settings: {
        version: '1.0.0',
        companyName: '',
        responsiblePerson: '',
        installationDate: new Date().toISOString(),
        badgeNotifications: true,
        requireDepartment: false,
        snapshotFrequencyDays: 0,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
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
        adminProfile: {
          adminName: '',
          adminEmail: '',
          adminRole: 'compliance_officer',
          department: '',
        },
      },
      activity_log: [],
      compliance_snapshots: [],
    })
    chrome.action.setBadgeText({ text: '' })
  })
}

export async function getBadgeText(sw: Worker): Promise<string> {
  return sw.evaluate<string>(() => chrome.action.getBadgeText({}))
}

export async function getDiscoveries(sw: Worker): Promise<DiscoveryInfo[]> {
  return sw.evaluate<DiscoveryInfo[]>(async () => {
    const result = await chrome.storage.local.get('ai_discoveries')
    return result.ai_discoveries ?? []
  })
}

export async function waitForBadge(
  sw: Worker,
  expected: string,
  timeoutMs = 8000,
): Promise<void> {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    const text = await getBadgeText(sw)
    if (text === expected) return
    await new Promise(r => setTimeout(r, 300))
  }
  const actual = await getBadgeText(sw)
  throw new Error(
    `Badge expected "${expected}" but got "${actual}" after ${timeoutMs}ms`,
  )
}

export async function navigateAndWait(page: Page, url: string): Promise<void> {
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 })
  } catch {
    // Page may not fully load, extension detects via webNavigation.onCompleted
  }
  await page.waitForTimeout(2000)
}

export async function openOptionsPage(
  context: BrowserContext,
  extensionId: string,
): Promise<Page> {
  const page = await context.newPage()
  await page.goto(`chrome-extension://${extensionId}/src/options/index.html`)
  await page.waitForLoadState('domcontentloaded')
  return page
}

export async function seedDiscoveries(
  sw: Worker,
  count: number,
): Promise<FullDiscoveryRecord[]> {
  const records: FullDiscoveryRecord[] = Array.from({ length: count }, (_, i) => ({
    id: `seed-${i}-${Date.now()}`,
    domain: `tool-${i}.example.com`,
    toolName: `Seed Tool ${i}`,
    category: i % 3 === 0 ? 'hr_employment' : 'chatbot',
    defaultRiskLevel: i % 3 === 0 ? 'high' : 'limited',
    userRiskLevel: null,
    status: i % 5 === 0 ? 'authorized' : 'detected',
    department: null,
    firstSeen: new Date(Date.now() - i * 60000).toISOString(),
    lastSeen: new Date().toISOString(),
    visitCount: i + 1,
    complianceStatus: {
      euAiAct: Object.fromEntries(['art-4','art-6','art-9','art-11','art-12','art-26','art-27','art-50'].map(id => [id, { assessment: 'pending', lastAssessedDate: null, dueDate: null, notes: '' }])),
      iso42001: Object.fromEntries(['iso-aims-inventory','iso-risk-assessment','iso-documentation','iso-monitoring','iso-governance'].map(id => [id, { assessment: 'pending', lastAssessedDate: null, dueDate: null, notes: '' }])),
      coSb205: Object.fromEntries(['co-risk-policy','co-impact-assessment','co-disclosure','co-public-statement','co-affirmative-defense'].map(id => [id, { assessment: 'not_applicable', lastAssessedDate: null, dueDate: null, notes: '' }])),
    },
    notes: '',
    tags: [],
    auditTrail: [],
  }))

  await sw.evaluate(async (data: FullDiscoveryRecord[]) => {
    await chrome.storage.local.set({ ai_discoveries: data })
  }, records)

  return records
}
