import { test, expect } from './fixtures'

test.describe('Detección de herramientas IA', () => {
  test('11.2 - detecta herramienta de IA básica al navegar', async ({
    page,
    serviceWorker,
  }) => {
    await test.step('Navegar a chatgpt.com', async () => {
      await page.goto('https://chatgpt.com', { waitUntil: 'domcontentloaded', timeout: 15000 })
      await page.waitForTimeout(2000)
    })

    await test.step('Badge muestra "1"', async () => {
      await expect(async () => {
        const text = await serviceWorker.evaluate<string>(
          () => chrome.action.getBadgeText({}),
        )
        expect(text).toBe('1')
      }).toPass({ timeout: 8000 })
    })

    await test.step('Registro existe en storage', async () => {
      const discoveries = await serviceWorker.evaluate<unknown[]>(async () => {
        const result = await chrome.storage.local.get('ai_discoveries')
        return result.ai_discoveries ?? []
      })
      expect(discoveries).toHaveLength(1)
      const record = discoveries[0] as Record<string, unknown>
      expect(record).toHaveProperty('domain')
      expect(String(record.domain)).toContain('chat')
      expect(record).toHaveProperty('toolName')
      expect(String(record.toolName)).toContain('ChatGPT')
    })
  })

  test('11.3 - detecta múltiples herramientas con badge incremental', async ({
    page,
    serviceWorker,
  }) => {
    await test.step('Primera herramienta: chatgpt.com → badge "1"', async () => {
      await page.goto('https://chatgpt.com', { waitUntil: 'domcontentloaded', timeout: 15000 })
      await page.waitForTimeout(2000)
      await expect(async () => {
        const text = await serviceWorker.evaluate<string>(
          () => chrome.action.getBadgeText({}),
        )
        expect(text).toBe('1')
      }).toPass({ timeout: 8000 })
    })

    await test.step('Segunda herramienta: github.com → badge "2"', async () => {
      await page.goto('https://github.com/features/copilot', {
        waitUntil: 'domcontentloaded',
        timeout: 15000,
      })
      await page.waitForTimeout(2000)
      await expect(async () => {
        const text = await serviceWorker.evaluate<string>(
          () => chrome.action.getBadgeText({}),
        )
        expect(text).toBe('2')
      }).toPass({ timeout: 8000 })
    })

    await test.step('Tercera herramienta: hirevue.com → badge "3"', async () => {
      await page.goto('https://hirevue.com', {
        waitUntil: 'domcontentloaded',
        timeout: 15000,
      })
      await page.waitForTimeout(2000)
      await expect(async () => {
        const text = await serviceWorker.evaluate<string>(
          () => chrome.action.getBadgeText({}),
        )
        expect(text).toBe('3')
      }).toPass({ timeout: 8000 })
    })

    await test.step('Storage tiene 3 registros', async () => {
      const discoveries = await serviceWorker.evaluate<unknown[]>(async () => {
        const result = await chrome.storage.local.get('ai_discoveries')
        return result.ai_discoveries ?? []
      })
      expect(discoveries).toHaveLength(3)
    })
  })

  test('11.4 - detecta herramienta de alto riesgo correctamente', async ({
    page,
    serviceWorker,
  }) => {
    await test.step('Navegar a hirevue.com', async () => {
      await page.goto('https://hirevue.com', { waitUntil: 'domcontentloaded', timeout: 15000 })
      await page.waitForTimeout(2000)
    })

    let record: Record<string, unknown>

    await test.step('Badge muestra "1"', async () => {
      await expect(async () => {
        const text = await serviceWorker.evaluate<string>(
          () => chrome.action.getBadgeText({}),
        )
        expect(text).toBe('1')
      }).toPass({ timeout: 8000 })
    })

    await test.step('Registro tiene categoría hr_employment', async () => {
      const discoveries = await serviceWorker.evaluate<unknown[]>(async () => {
        const result = await chrome.storage.local.get('ai_discoveries')
        return result.ai_discoveries ?? []
      })
      expect(discoveries).toHaveLength(1)
      record = discoveries[0] as Record<string, unknown>
      expect(record.category).toBe('hr_employment')
    })

    await test.step('Registro tiene riesgo alto', async () => {
      expect(record!.defaultRiskLevel).toBe('high')
    })

    await test.step('Badge tiene fondo rojo', async () => {
      const color = await serviceWorker.evaluate<number[]>(
        () => {
          const c = chrome.action.getBadgeBackgroundColor({})
          return [c[0], c[1], c[2], c[3]]
        },
      )
      expect(color).toBeTruthy()
      expect(color.length).toBe(4)
    })
  })

  test('11.8 - no detecta dominio excluido', async ({
    page,
    serviceWorker,
  }) => {
    await test.step('Agregar chatgpt.com a exclusiones', async () => {
      await serviceWorker.evaluate(async () => {
        const result = await chrome.storage.local.get('app_settings')
        const settings = result.app_settings ?? {}
        await chrome.storage.local.set({
          app_settings: {
            ...settings,
            excludedDomains: ['chatgpt.com'],
          },
        })
      })
    })

    await test.step('Navegar a chatgpt.com', async () => {
      await page.goto('https://chatgpt.com', { waitUntil: 'domcontentloaded', timeout: 15000 })
      await page.waitForTimeout(3000)
    })

    await test.step('Badge NO cambia (vacío)', async () => {
      const text = await serviceWorker.evaluate<string>(
        () => chrome.action.getBadgeText({}),
      )
      expect(text).toBe('')
    })

    await test.step('No hay registros en storage', async () => {
      const discoveries = await serviceWorker.evaluate<unknown[]>(async () => {
        const result = await chrome.storage.local.get('ai_discoveries')
        return result.ai_discoveries ?? []
      })
      expect(discoveries).toHaveLength(0)
    })
  })

  test('11.9 - no detecta sitio que no es IA', async ({
    page,
    serviceWorker,
  }) => {
    await test.step('Navegar a wikipedia.org', async () => {
      await page.goto('https://es.wikipedia.org', { waitUntil: 'domcontentloaded', timeout: 15000 })
      await page.waitForTimeout(2000)
    })

    await test.step('Badge NO cambia (vacío)', async () => {
      const text = await serviceWorker.evaluate<string>(
        () => chrome.action.getBadgeText({}),
      )
      expect(text).toBe('')
    })

    await test.step('No hay registros en storage', async () => {
      const discoveries = await serviceWorker.evaluate<unknown[]>(async () => {
        const result = await chrome.storage.local.get('ai_discoveries')
        return result.ai_discoveries ?? []
      })
      expect(discoveries).toHaveLength(0)
    })
  })
})
