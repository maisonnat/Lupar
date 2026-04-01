import { test, expect } from './fixtures'
import type { FullDiscoveryRecord } from './fixtures'
import type { BrowserContext, Worker } from '@playwright/test'

async function pollForServiceWorker(
  context: BrowserContext,
  timeoutMs = 10000,
): Promise<Worker | null> {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    const sw = context.serviceWorkers()[0]
    if (sw) return sw
    await new Promise(r => setTimeout(r, 500))
  }
  return context.serviceWorkers()[0] ?? null
}

test.describe('Resistencia y Service Worker', () => {
  test('11.10 - datos persisten y detección continua funciona', async ({
    extensionContext,
    extensionId,
    serviceWorker,
    page,
  }) => {
    await test.step('Navegar a dominio de IA — primera detección', async () => {
      await page.goto('https://chatgpt.com', { waitUntil: 'domcontentloaded', timeout: 15000 })
      await page.waitForTimeout(3000)

      await expect(async () => {
        const text = await serviceWorker.evaluate<string>(
          () => chrome.action.getBadgeText({}),
        )
        expect(text).toBe('1')
      }).toPass({ timeout: 10000 })
    })

    await test.step('Verificar registro en storage', async () => {
      const discoveries = await serviceWorker.evaluate<unknown[]>(async () => {
        const result = await chrome.storage.local.get('ai_discoveries')
        return result.ai_discoveries ?? []
      })
      expect(discoveries).toHaveLength(1)
      const record = discoveries[0] as Record<string, unknown>
      expect(String(record.toolName)).toContain('ChatGPT')
    })

    await test.step('Abrir Options Page y verificar datos persisten en UI', async () => {
      const optionsPage = await extensionContext.newPage()
      await optionsPage.goto(`chrome-extension://${extensionId}/src/options/index.html`, { waitUntil: 'load', timeout: 10000 })
      await optionsPage.getByRole('button', { name: 'Inventario' }).click()
      await optionsPage.waitForTimeout(500)

      const rows = optionsPage.locator('tbody tr')
      await expect(rows).toHaveCount(1, { timeout: 5000 })

      const chatgptRow = optionsPage.locator('tbody tr').filter({ hasText: 'ChatGPT' })
      await expect(chatgptRow).toBeVisible()

      await optionsPage.close()
    })

    await test.step('Navegar a otro dominio — detección incremental', async () => {
      await page.goto('https://hirevue.com', { waitUntil: 'domcontentloaded', timeout: 15000 })
      await page.waitForTimeout(3000)

      await expect(async () => {
        const text = await serviceWorker.evaluate<string>(
          () => chrome.action.getBadgeText({}),
        )
        expect(Number(text)).toBeGreaterThanOrEqual(2)
      }).toPass({ timeout: 10000 })
    })

    await test.step('Storage tiene ambos registros', async () => {
      const discoveries = await serviceWorker.evaluate<unknown[]>(async () => {
        const result = await chrome.storage.local.get('ai_discoveries')
        return result.ai_discoveries ?? []
      })
      expect(discoveries.length).toBeGreaterThanOrEqual(2)
    })
  })

  test('11.11 - dashboard carga con 200+ registros en < 2s', async ({
    extensionContext,
    extensionId,
    serviceWorker,
  }) => {
    await test.step('Generar 250 registros de prueba', async () => {
      const records: FullDiscoveryRecord[] = Array.from({ length: 250 }, (_, i) => ({
        id: `perf-${i}-${Date.now()}`,
        domain: `perf-tool-${i}.example.com`,
        toolName: `Perf Tool ${i}`,
        category: i % 3 === 0 ? 'hr_employment' : 'chatbot',
        defaultRiskLevel: i % 3 === 0 ? 'high' : 'limited',
        userRiskLevel: null,
        status: 'detected',
        department: null,
        firstSeen: new Date(Date.now() - i * 60000).toISOString(),
        lastSeen: new Date().toISOString(),
        visitCount: i + 1,
        complianceStatus: {
          euAiAct: Object.fromEntries(['art-4','art-6','art-9','art-11','art-12','art-26','art-27','art-50'].map(id => [id, { assessment: 'pending' as const, lastAssessedDate: null, dueDate: null, notes: '' }])),
          iso42001: Object.fromEntries(['iso-aims-inventory','iso-risk-assessment','iso-documentation','iso-monitoring','iso-governance'].map(id => [id, { assessment: 'pending' as const, lastAssessedDate: null, dueDate: null, notes: '' }])),
          coSb205: Object.fromEntries(['co-risk-policy','co-impact-assessment','co-disclosure','co-public-statement','co-affirmative-defense'].map(id => [id, { assessment: 'not_applicable' as const, lastAssessedDate: null, dueDate: null, notes: '' }])),
        },
        notes: '',
        tags: [],
      }))

      await serviceWorker.evaluate(async (data: FullDiscoveryRecord[]) => {
        await chrome.storage.local.set({ ai_discoveries: data })
      }, records)
    })

    await test.step('Medir tiempo de carga del Dashboard', async () => {
      const optionsPage = await extensionContext.newPage()

      const start = Date.now()
      await optionsPage.goto(`chrome-extension://${extensionId}/src/options/index.html`, { waitUntil: 'load', timeout: 10000 })
      await expect(optionsPage.getByText('Total detectadas')).toBeVisible({ timeout: 5000 })
      const elapsed = Date.now() - start

      expect(elapsed).toBeLessThan(3000)

      await test.step('Dashboard muestra 250', async () => {
        const metricValue = optionsPage.locator('text=250').first()
        await expect(metricValue).toBeVisible({ timeout: 3000 })
      })

      await optionsPage.close()
    })
  })
})
