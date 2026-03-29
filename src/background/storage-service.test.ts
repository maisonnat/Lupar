import { describe, it, expect, beforeEach } from 'vitest'
import { mockStore } from '../../vitest.setup'
import {
  getDiscoveries,
  saveDiscovery,
  createDiscovery,
  updateDiscovery,
  deleteDiscovery,
  getSettings,
  saveSettings,
  updateSettings,
  getActivityLog,
  logActivity,
  initializeDefaults,
  exportAll,
  importAll,
  clearAll,
  StorageError,
} from '@background/storage-service'
import type { DiscoveryRecord } from '@shared/types/discovery'

function createMockDiscovery(overrides: Partial<DiscoveryRecord> = {}): DiscoveryRecord {
  return {
    id: 'test-id-1',
    domain: 'chatgpt.com',
    toolName: 'ChatGPT',
    category: 'chatbot',
    defaultRiskLevel: 'limited',
    userRiskLevel: null,
    status: 'detected',
    department: null,
    firstSeen: '2026-03-15T09:23:41.000Z',
    lastSeen: '2026-03-28T14:55:12.000Z',
    visitCount: 1,
    complianceStatus: {
      euAiAct: { assessment: 'pending', lastAssessedDate: null, dueDate: null, notes: '' },
      iso42001: { assessment: 'pending', lastAssessedDate: null, dueDate: null, notes: '' },
      coSb205: { assessment: 'not_applicable', lastAssessedDate: null, dueDate: null, notes: '' },
    },
    notes: '',
    tags: [],
    ...overrides,
  }
}

describe('storage-service', () => {
  beforeEach(() => {
    Object.keys(mockStore).forEach((k) => delete mockStore[k])
  })

  describe('getDiscoveries', () => {
    it('should return empty array when no discoveries exist', async () => {
      const result = await getDiscoveries()
      expect(result).toEqual([])
    })

    it('should return stored discoveries', async () => {
      const discovery = createMockDiscovery()
      mockStore['ai_discoveries'] = [discovery]

      const result = await getDiscoveries()
      expect(result).toHaveLength(1)
      expect(result[0].domain).toBe('chatgpt.com')
    })
  })

  describe('saveDiscovery', () => {
    it('should create a new discovery', async () => {
      const discovery = createMockDiscovery()
      await saveDiscovery(discovery)

      const stored = mockStore['ai_discoveries'] as DiscoveryRecord[]
      expect(stored).toHaveLength(1)
      expect(stored[0].id).toBe('test-id-1')
    })

    it('should update an existing discovery', async () => {
      const discovery = createMockDiscovery()
      await saveDiscovery(discovery)

      const updated = createMockDiscovery({ visitCount: 10, lastSeen: '2026-03-29T10:00:00.000Z' })
      await saveDiscovery(updated)

      const stored = mockStore['ai_discoveries'] as DiscoveryRecord[]
      expect(stored).toHaveLength(1)
      expect(stored[0].visitCount).toBe(10)
    })

    it('should add multiple discoveries', async () => {
      await saveDiscovery(createMockDiscovery({ id: 'id-1', domain: 'chatgpt.com' }))
      await saveDiscovery(createMockDiscovery({ id: 'id-2', domain: 'claude.ai' }))

      const stored = mockStore['ai_discoveries'] as DiscoveryRecord[]
      expect(stored).toHaveLength(2)
    })
  })

  describe('createDiscovery', () => {
    it('should create a discovery with correct defaults', async () => {
      const record = await createDiscovery('chatgpt.com', 'ChatGPT', 'chatbot', 'limited')

      expect(record.id).toBeTruthy()
      expect(record.domain).toBe('chatgpt.com')
      expect(record.toolName).toBe('ChatGPT')
      expect(record.category).toBe('chatbot')
      expect(record.defaultRiskLevel).toBe('limited')
      expect(record.userRiskLevel).toBeNull()
      expect(record.status).toBe('detected')
      expect(record.department).toBeNull()
      expect(record.visitCount).toBe(1)
      expect(record.notes).toBe('')
      expect(record.tags).toEqual([])
    })

    it('should set compliance status with correct defaults', async () => {
      const record = await createDiscovery('chatgpt.com', 'ChatGPT', 'chatbot', 'limited')

      expect(record.complianceStatus.euAiAct.assessment).toBe('pending')
      expect(record.complianceStatus.iso42001.assessment).toBe('pending')
      expect(record.complianceStatus.coSb205.assessment).toBe('not_applicable')
    })

    it('should persist the created discovery', async () => {
      await createDiscovery('chatgpt.com', 'ChatGPT', 'chatbot', 'limited')

      const stored = mockStore['ai_discoveries'] as DiscoveryRecord[]
      expect(stored).toHaveLength(1)
      expect(stored[0].domain).toBe('chatgpt.com')
    })
  })

  describe('updateDiscovery', () => {
    it('should update specific fields of a discovery', async () => {
      await saveDiscovery(createMockDiscovery({ id: 'id-1' }))

      const result = await updateDiscovery('id-1', { visitCount: 5, status: 'confirmed' })

      expect(result).not.toBeNull()
      expect(result!.visitCount).toBe(5)
      expect(result!.status).toBe('confirmed')
    })

    it('should return null for non-existent discovery', async () => {
      const result = await updateDiscovery('non-existent', { visitCount: 5 })
      expect(result).toBeNull()
    })
  })

  describe('deleteDiscovery', () => {
    it('should delete an existing discovery', async () => {
      await saveDiscovery(createMockDiscovery({ id: 'id-1' }))

      const result = await deleteDiscovery('id-1')
      expect(result).toBe(true)

      const stored = mockStore['ai_discoveries'] as DiscoveryRecord[]
      expect(stored).toHaveLength(0)
    })

    it('should return false for non-existent discovery', async () => {
      const result = await deleteDiscovery('non-existent')
      expect(result).toBe(false)
    })

    it('should not affect other discoveries', async () => {
      await saveDiscovery(createMockDiscovery({ id: 'id-1', domain: 'a.com' }))
      await saveDiscovery(createMockDiscovery({ id: 'id-2', domain: 'b.com' }))

      await deleteDiscovery('id-1')

      const stored = mockStore['ai_discoveries'] as DiscoveryRecord[]
      expect(stored).toHaveLength(1)
      expect(stored[0].id).toBe('id-2')
    })
  })

  describe('getSettings / saveSettings', () => {
    it('should return default settings when none exist', async () => {
      const settings = await getSettings()
      expect(settings.version).toBe('1.0.0')
      expect(settings.companyName).toBe('')
      expect(settings.badgeNotifications).toBe(true)
      expect(settings.customDomains).toEqual([])
      expect(settings.excludedDomains).toEqual([])
    })

    it('should save and retrieve settings', async () => {
      await saveSettings({
        version: '1.0.0',
        companyName: 'Test Corp',
        responsiblePerson: 'John Doe',
        installationDate: '2026-03-01T00:00:00.000Z',
        badgeNotifications: false,
        customDomains: [],
        excludedDomains: ['test.com'],
      })

      const settings = await getSettings()
      expect(settings.companyName).toBe('Test Corp')
      expect(settings.responsiblePerson).toBe('John Doe')
      expect(settings.badgeNotifications).toBe(false)
      expect(settings.excludedDomains).toContain('test.com')
    })
  })

  describe('updateSettings', () => {
    it('should merge updates with existing settings', async () => {
      await saveSettings({
        version: '1.0.0',
        companyName: '',
        responsiblePerson: '',
        installationDate: '2026-03-01T00:00:00.000Z',
        badgeNotifications: true,
        customDomains: [],
        excludedDomains: [],
      })

      const updated = await updateSettings({ companyName: 'New Corp' })
      expect(updated.companyName).toBe('New Corp')
      expect(updated.badgeNotifications).toBe(true)
    })
  })

  describe('getActivityLog / logActivity', () => {
    it('should return empty array when no log exists', async () => {
      const log = await getActivityLog()
      expect(log).toEqual([])
    })

    it('should append a new log entry', async () => {
      const entry = await logActivity('new_detection', 'chatgpt.com', 'Nueva herramienta detectada')

      expect(entry.id).toBeTruthy()
      expect(entry.eventType).toBe('new_detection')
      expect(entry.domain).toBe('chatgpt.com')
      expect(entry.details).toBe('Nueva herramienta detectada')
      expect(entry.timestamp).toBeTruthy()

      const log = await getActivityLog()
      expect(log).toHaveLength(1)
    })

    it('should append multiple entries in order', async () => {
      await logActivity('new_detection', 'a.com', 'First')
      await logActivity('status_changed', 'b.com', 'Second')

      const log = await getActivityLog()
      expect(log).toHaveLength(2)
      expect(log[0].eventType).toBe('new_detection')
      expect(log[1].eventType).toBe('status_changed')
    })

    it('should enforce FIFO limit of 1000 entries', async () => {
      const existingLog = Array.from({ length: 1000 }, (_, i) => ({
        id: `log-${i}`,
        timestamp: new Date().toISOString(),
        eventType: 'new_detection' as const,
        domain: `domain${i}.com`,
        details: `Entry ${i}`,
      }))
      mockStore['activity_log'] = existingLog

      await logActivity('new_detection', 'new.com', 'Entry 1001')

      const log = await getActivityLog()
      expect(log).toHaveLength(1000)
      expect(log[0].domain).toBe('domain1.com')
      expect(log[999].domain).toBe('new.com')
    })
  })

  describe('initializeDefaults', () => {
    it('should create default keys when none exist', async () => {
      await initializeDefaults()

      expect(mockStore['ai_discoveries']).toEqual([])
      expect(mockStore['activity_log']).toEqual([])
      expect((mockStore['app_settings'] as Record<string, unknown>).version).toBe('1.0.0')
    })

    it('should not overwrite existing data', async () => {
      const existing = [createMockDiscovery()]
      mockStore['ai_discoveries'] = existing

      await initializeDefaults()

      expect(mockStore['ai_discoveries']).toEqual(existing)
    })
  })

  describe('exportAll / importAll', () => {
    it('should export all storage data', async () => {
      await saveDiscovery(createMockDiscovery())
      await saveSettings({
        version: '1.0.0',
        companyName: 'Test',
        responsiblePerson: 'Admin',
        installationDate: '2026-03-01T00:00:00.000Z',
        badgeNotifications: true,
        customDomains: [],
        excludedDomains: [],
      })
      await logActivity('new_detection', 'chatgpt.com', 'Test')

      const exported = await exportAll()

      expect(exported.ai_discoveries).toHaveLength(1)
      expect(exported.app_settings.companyName).toBe('Test')
      expect(exported.activity_log).toHaveLength(1)
    })

    it('should import valid data', async () => {
      const data = {
        ai_discoveries: [createMockDiscovery()],
        app_settings: {
          version: '1.0.0',
          companyName: 'Imported',
          responsiblePerson: '',
          installationDate: '2026-03-01T00:00:00.000Z',
          badgeNotifications: true,
          customDomains: [],
          excludedDomains: [],
        },
        activity_log: [],
      }

      await importAll(data)

      const settings = await getSettings()
      expect(settings.companyName).toBe('Imported')

      const discoveries = await getDiscoveries()
      expect(discoveries).toHaveLength(1)
    })

    it('should reject invalid data with missing ai_discoveries', async () => {
      const invalid = {
        ai_discoveries: 'not-array' as unknown as [],
        app_settings: {} as unknown as import('@shared/types/storage').AppSettings,
        activity_log: [] as unknown as import('@shared/types/storage').ActivityLogEntry[],
      }
      await expect(importAll(invalid)).rejects.toThrow(StorageError)
    })

    it('should reject invalid data with missing app_settings', async () => {
      const invalid = {
        ai_discoveries: [],
        app_settings: null as unknown as import('@shared/types/storage').AppSettings,
        activity_log: [] as unknown as import('@shared/types/storage').ActivityLogEntry[],
      }
      await expect(importAll(invalid)).rejects.toThrow(StorageError)
    })

    it('should reject invalid data with missing activity_log', async () => {
      const invalid = {
        ai_discoveries: [],
        app_settings: { version: '1' } as unknown as import('@shared/types/storage').AppSettings,
        activity_log: 'not-array' as unknown as import('@shared/types/storage').ActivityLogEntry[],
      }
      await expect(importAll(invalid)).rejects.toThrow(StorageError)
    })
  })

  describe('clearAll', () => {
    it('should remove all data and reinitialize defaults', async () => {
      await saveDiscovery(createMockDiscovery())
      await logActivity('new_detection', 'test.com', 'Test')

      await clearAll()

      const discoveries = await getDiscoveries()
      expect(discoveries).toEqual([])

      const settings = await getSettings()
      expect(settings.version).toBe('1.0.0')

      const log = await getActivityLog()
      expect(log).toEqual([])
    })
  })

  describe('StorageError', () => {
    it('should have correct name and message', () => {
      const error = new StorageError('test message')
      expect(error.name).toBe('StorageError')
      expect(error.message).toBe('test message')
    })

    it('should preserve cause', () => {
      const cause = new Error('original error')
      const error = new StorageError('wrapped', cause)
      expect(error.cause).toBe(cause)
    })
  })
})
