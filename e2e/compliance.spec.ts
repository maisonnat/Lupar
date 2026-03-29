import { test, expect } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

test.describe('Cumplimiento CSP, Zero-Cloud y Tamaño', () => {
  test('11.12 - sin violaciones CSP ni requests externos', () => {
    const extensionPath = process.env.EXTENSION_PATH
      ? path.resolve(process.env.EXTENSION_PATH)
      : path.resolve(__dirname, '..', 'dist')

    test.step('Verificar dist/ no contiene referencias externas en JS', () => {
      const jsFiles = findFilesRecursive(extensionPath, '.js')
      expect(jsFiles.length).toBeGreaterThan(0)

      for (const file of jsFiles) {
        const content = fs.readFileSync(file, 'utf-8')
        const hasExternalFetch = /fetch\s*\(\s*['"]https?:\/\//.test(content)
        const hasExternalXhr = /XMLHttpRequest/.test(content)
          && /open\s*\(\s*['"]GET['"],\s*['"]https?:\/\//.test(content)
        expect(
          { file, hasExternalFetch, hasExternalXhr },
          `File ${path.relative(extensionPath, file)} should not have external calls`,
        ).toEqual(
          expect.objectContaining({ hasExternalFetch: false, hasExternalXhr: false }),
        )
      }
    })

    test.step('Verificar manifest no tiene content_security_policy con unsafe', () => {
      const manifestPath = path.join(extensionPath, 'manifest.json')
      if (fs.existsSync(manifestPath)) {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'))
        const csp = manifest.content_security_policy?.extension_pages ?? ''
        expect(csp).not.toContain('unsafe-eval')
        expect(csp).not.toContain('unsafe-inline')
      }
    })
  })

  test('11.13 - extensión comprimida < 5 MB', () => {
    const extensionPath = process.env.EXTENSION_PATH
      ? path.resolve(process.env.EXTENSION_PATH)
      : path.resolve(__dirname, '..', 'dist')

    expect(fs.existsSync(extensionPath)).toBe(true)

    const totalBytes = getDirectorySize(extensionPath)
    const totalMB = totalBytes / (1024 * 1024)

    expect(totalMB).toBeLessThan(5)

    const fileCount = countFiles(extensionPath)
    expect(fileCount).toBeGreaterThan(0)
  })
})

function getDirectorySize(dir: string): number {
  let size = 0
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      size += getDirectorySize(fullPath)
    } else if (entry.isFile()) {
      size += fs.statSync(fullPath).size
    }
  }
  return size
}

function countFiles(dir: string): number {
  let count = 0
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      count += countFiles(fullPath)
    } else if (entry.isFile()) {
      count++
    }
  }
  return count
}

function findFilesRecursive(dir: string, ext: string): string[] {
  const files: string[] = []
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...findFilesRecursive(fullPath, ext))
    } else if (entry.isFile() && entry.name.endsWith(ext)) {
      files.push(fullPath)
    }
  }
  return files
}
