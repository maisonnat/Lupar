import { test, expect } from './fixtures'

test.describe('Options Page — Inventario, Clasificación y Reportes', () => {
  test('11.5 - inventario muestra tools detectadas con datos correctos', async ({
    extensionContext,
    extensionId,
    serviceWorker,
    page,
  }) => {
    await test.step('Detectar 2 herramientas', async () => {
      await page.goto('https://chatgpt.com', { waitUntil: 'domcontentloaded', timeout: 15000 })
      await page.waitForTimeout(3000)
      await page.goto('https://hirevue.com', { waitUntil: 'domcontentloaded', timeout: 15000 })
      await page.waitForTimeout(3000)
    })

    const optionsPage = await extensionContext.newPage()

    await test.step('Abrir Options Page', async () => {
      await optionsPage.goto(`chrome-extension://${extensionId}/src/options/index.html`, { waitUntil: 'load', timeout: 10000 })
    })

    await test.step('Navegar a Inventario', async () => {
      await optionsPage.getByRole('button', { name: 'Inventario' }).click()
      await optionsPage.waitForTimeout(500)
    })

    await test.step('Tabla muestra 2 herramientas', async () => {
      const rows = optionsPage.locator('tbody tr')
      await expect(rows).toHaveCount(2, { timeout: 5000 })
    })

    await test.step('Verificar datos de ChatGPT', async () => {
      const chatgptRow = optionsPage.locator('tbody tr').filter({ hasText: 'ChatGPT' })
      await expect(chatgptRow).toBeVisible()
    })

    await test.step('Verificar datos de HireVue', async () => {
      const hirevueRow = optionsPage.locator('tbody tr').filter({ hasText: 'HireVue' })
      await expect(hirevueRow).toBeVisible()
    })

    await optionsPage.close()
  })

  test('11.6 - clasificación persiste tras recarga', async ({
    extensionContext,
    extensionId,
    serviceWorker,
    page,
  }) => {
    await test.step('Detectar herramienta', async () => {
      await page.goto('https://chatgpt.com', { waitUntil: 'domcontentloaded', timeout: 15000 })
      await page.waitForTimeout(3000)
    })

    const optionsPage = await extensionContext.newPage()

    await test.step('Abrir Options Page → Inventario', async () => {
      await optionsPage.goto(`chrome-extension://${extensionId}/src/options/index.html`, { waitUntil: 'load', timeout: 10000 })
      await optionsPage.getByRole('button', { name: 'Inventario' }).click()
      await optionsPage.waitForTimeout(500)
    })

    await test.step('Esperar tabla con datos', async () => {
      const rows = optionsPage.locator('tbody tr')
      await expect(rows).toHaveCount(1, { timeout: 5000 })
    })

    await test.step('Click en herramienta abre modal', async () => {
      const row = optionsPage.locator('tbody tr').first()
      await row.click()
      await expect(optionsPage.locator('h2').filter({ hasText: 'ChatGPT' })).toBeVisible({ timeout: 5000 })
    })

    await test.step('Cambiar estado a "Autorizado"', async () => {
      const autorizadoBtn = optionsPage.locator('button').filter({ hasText: 'Autorizado' })
      await autorizadoBtn.click()
    })

    await test.step('Guardar cambios', async () => {
      await optionsPage.locator('[data-testid="modal-save"]').click()
      await optionsPage.waitForTimeout(1000)
    })

    await test.step('Recargar y verificar persistencia', async () => {
      await optionsPage.reload({ waitUntil: 'load' })
      await optionsPage.getByRole('button', { name: 'Inventario' }).click()
      await optionsPage.waitForTimeout(500)

      const discoveries = await serviceWorker.evaluate<unknown[]>(async () => {
        const result = await chrome.storage.local.get('ai_discoveries')
        return result.ai_discoveries ?? []
      })
      expect(discoveries).toHaveLength(1)
      const record = discoveries[0] as Record<string, unknown>
      expect(record.status).toBe('authorized')
    })

    await optionsPage.close()
  })

  test('11.7 - genera reporte HTML autocontenido', async ({
    extensionContext,
    extensionId,
    serviceWorker,
    page,
  }) => {
    await test.step('Detectar herramientas', async () => {
      await page.goto('https://chatgpt.com', { waitUntil: 'domcontentloaded', timeout: 15000 })
      await page.waitForTimeout(3000)
    })

    const optionsPage = await extensionContext.newPage()

    await test.step('Abrir Options Page → Reportes', async () => {
      await optionsPage.goto(`chrome-extension://${extensionId}/src/options/index.html`, { waitUntil: 'load', timeout: 10000 })
      await optionsPage.getByRole('button', { name: 'Reportes' }).click()
      await optionsPage.waitForTimeout(500)
    })

    await test.step('Click en "Generar Reporte HTML"', async () => {
      const btn = optionsPage.locator('[data-testid="generate-report-btn"]')
      await expect(btn).toBeEnabled()
      await btn.click()
      await optionsPage.waitForTimeout(1000)
    })

    await test.step('Preview del reporte visible', async () => {
      await expect(optionsPage.getByText('Reporte generado')).toBeVisible({ timeout: 5000 })
      await expect(optionsPage.getByText('Herramientas', { exact: true })).toBeVisible()
      await expect(optionsPage.getByText('Autocontenido')).toBeVisible()
    })

    await test.step('Descargar HTML', async () => {
      const [download] = await Promise.all([
        optionsPage.waitForEvent('download', { timeout: 10000 }),
        optionsPage.getByRole('button', { name: 'Descargar HTML' }).click(),
      ])

      expect(download).toBeTruthy()
      const filename = download.suggestedFilename()
      expect(filename).toMatch(/^ai-compliance-report-\d{4}-\d{2}-\d{2}\.html$/)

      const path = await download.path()
      expect(path).toBeTruthy()
    })

    await optionsPage.close()
  })
})
