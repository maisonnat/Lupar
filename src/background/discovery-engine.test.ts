import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mockStore } from '../../vitest.setup'
import {
  handleNavigation,
  updateBadge,
  resetThrottleMap,
  loadCustomDomains,
  initializeEngine,
} from '@background/discovery-engine'
import { getDiscoveries, getActivityLog, saveDiscovery } from '@background/storage-service'
import type { DiscoveryRecord } from '@shared/types/discovery'

function makeDiscovery(overrides: Partial<DiscoveryRecord> = {}): DiscoveryRecord {
  return {
    id: 'test-id-1',
    domain: 'chatgpt.com',
    toolName: 'ChatGPT',
    category: 'chatbot',
    defaultRiskLevel: 'limited',
    userRiskLevel: null,
    status: 'detected',
    department: null,
    firstSeen: '2026-03-15T09:00:00.000Z',
    lastSeen: '2026-03-15T09:00:00.000Z',
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

describe('discovery-engine', () => {
  beforeEach(() => {
    Object.keys(mockStore).forEach((k) => delete mockStore[k])
    resetThrottleMap()
    vi.clearAllMocks()
  })

  describe('handleNavigation — new detection', () => {
    it('should create a new discovery for chatgpt.com', async () => {
      await handleNavigation('https://chatgpt.com/chat')

      const discoveries = await getDiscoveries()
      expect(discoveries).toHaveLength(1)
      expect(discoveries[0].domain).toBe('chatgpt.com')
      expect(discoveries[0].toolName).toBe('ChatGPT')
      expect(discoveries[0].category).toBe('chatbot')
      expect(discoveries[0].defaultRiskLevel).toBe('limited')
      expect(discoveries[0].status).toBe('detected')
      expect(discoveries[0].visitCount).toBe(1)
    })

    it('should create a new discovery for claude.ai', async () => {
      await handleNavigation('https://claude.ai')

      const discoveries = await getDiscoveries()
      expect(discoveries).toHaveLength(1)
      expect(discoveries[0].domain).toBe('claude.ai')
      expect(discoveries[0].toolName).toBe('Claude')
    })

    it('should create a high-risk discovery for hirevue.com', async () => {
      await handleNavigation('https://hirevue.com/interview')

      const discoveries = await getDiscoveries()
      expect(discoveries).toHaveLength(1)
      expect(discoveries[0].category).toBe('hr_employment')
      expect(discoveries[0].defaultRiskLevel).toBe('high')
    })

    it('should create a prohibited-risk discovery for clearview.ai', async () => {
      await handleNavigation('https://clearview.ai')

      const discoveries = await getDiscoveries()
      expect(discoveries).toHaveLength(1)
      expect(discoveries[0].category).toBe('biometric_surveillance')
      expect(discoveries[0].defaultRiskLevel).toBe('prohibited')
    })

    it('should resolve subdomains via registry wildcard', async () => {
      await handleNavigation('https://api.openai.com/v1/models')

      const discoveries = await getDiscoveries()
      expect(discoveries).toHaveLength(1)
      expect(discoveries[0].toolName).toBe('OpenAI')
      expect(discoveries[0].domain).toBe('api.openai.com')
    })

    it('should log new_detection activity', async () => {
      await handleNavigation('https://chatgpt.com')

      const log = await getActivityLog()
      expect(log).toHaveLength(1)
      expect(log[0].eventType).toBe('new_detection')
      expect(log[0].domain).toBe('chatgpt.com')
      expect(log[0].details).toContain('ChatGPT')
    })
  })

  describe('handleNavigation — update existing', () => {
    it('should increment visitCount and update lastSeen', async () => {
      await handleNavigation('https://chatgpt.com')
      resetThrottleMap()

      await handleNavigation('https://chatgpt.com/chat?model=gpt-4')

      const discoveries = await getDiscoveries()
      expect(discoveries).toHaveLength(1)
      expect(discoveries[0].visitCount).toBe(2)
      expect(discoveries[0].lastSeen).not.toBe('2026-03-15T09:00:00.000Z')
    })

    it('should not overwrite user-edited fields', async () => {
      await handleNavigation('https://chatgpt.com')
      resetThrottleMap()

      const discoveries = await getDiscoveries()
      const updated = { ...discoveries[0], status: 'confirmed' as const, userRiskLevel: 'high' as const, department: 'IT', notes: 'Revisado' }
      await saveDiscovery(updated)

      await handleNavigation('https://chatgpt.com')

      const after = await getDiscoveries()
      expect(after[0].status).toBe('confirmed')
      expect(after[0].userRiskLevel).toBe('high')
      expect(after[0].department).toBe('IT')
      expect(after[0].notes).toBe('Revisado')
      expect(after[0].visitCount).toBe(2)
    })

    it('should detect multiple different domains', async () => {
      await handleNavigation('https://chatgpt.com')
      resetThrottleMap()
      await handleNavigation('https://claude.ai')
      resetThrottleMap()
      await handleNavigation('https://midjourney.com')

      const discoveries = await getDiscoveries()
      expect(discoveries).toHaveLength(3)
      const domains = discoveries.map((d) => d.domain)
      expect(domains).toContain('chatgpt.com')
      expect(domains).toContain('claude.ai')
      expect(domains).toContain('midjourney.com')
    })
  })

  describe('handleNavigation — throttle', () => {
    it('should throttle rapid navigations to the same domain', async () => {
      await handleNavigation('https://chatgpt.com')
      await handleNavigation('https://chatgpt.com')
      await handleNavigation('https://chatgpt.com')

      const discoveries = await getDiscoveries()
      expect(discoveries).toHaveLength(1)
      expect(discoveries[0].visitCount).toBe(1)
    })

    it('should allow navigation after throttle period expires', async () => {
      vi.useFakeTimers()

      await handleNavigation('https://chatgpt.com')

      vi.advanceTimersByTime(5001)
      await handleNavigation('https://chatgpt.com')

      const discoveries = await getDiscoveries()
      expect(discoveries[0].visitCount).toBe(2)

      vi.useRealTimers()
    })

    it('should not throttle different domains', async () => {
      await handleNavigation('https://chatgpt.com')
      await handleNavigation('https://claude.ai')

      const discoveries = await getDiscoveries()
      expect(discoveries).toHaveLength(2)
    })
  })

  describe('handleNavigation — excluded domains', () => {
    it('should ignore excluded domains', async () => {
      mockStore['app_settings'] = {
        version: '1.0.0',
        companyName: '',
        responsiblePerson: '',
        installationDate: '2026-03-01T00:00:00.000Z',
        badgeNotifications: true,
        customDomains: [],
        excludedDomains: ['chatgpt.com'],
      }

      await handleNavigation('https://chatgpt.com')

      const discoveries = await getDiscoveries()
      expect(discoveries).toHaveLength(0)
    })

    it('should still detect non-excluded domains', async () => {
      mockStore['app_settings'] = {
        version: '1.0.0',
        companyName: '',
        responsiblePerson: '',
        installationDate: '2026-03-01T00:00:00.000Z',
        badgeNotifications: true,
        customDomains: [],
        excludedDomains: ['chatgpt.com'],
      }

      await handleNavigation('https://claude.ai')

      const discoveries = await getDiscoveries()
      expect(discoveries).toHaveLength(1)
      expect(discoveries[0].domain).toBe('claude.ai')
    })
  })

  describe('handleNavigation — non-AI domains', () => {
    it('should ignore google.com', async () => {
      await handleNavigation('https://google.com/search?q=test')

      const discoveries = await getDiscoveries()
      expect(discoveries).toHaveLength(0)
    })

    it('should ignore wikipedia.org', async () => {
      await handleNavigation('https://es.wikipedia.org/wiki/IA')

      const discoveries = await getDiscoveries()
      expect(discoveries).toHaveLength(0)
    })

    it('should ignore invalid URLs', async () => {
      await handleNavigation('')

      const discoveries = await getDiscoveries()
      expect(discoveries).toHaveLength(0)
    })
  })

  describe('handleNavigation — activity log on 10th visit', () => {
    it('should log activity every 10 visits', async () => {
      const discovery = makeDiscovery({ visitCount: 9 })
      await saveDiscovery(discovery)
      resetThrottleMap()

      await handleNavigation('https://chatgpt.com')

      const log = await getActivityLog()
      expect(log).toHaveLength(1)
      expect(log[0].eventType).toBe('status_changed')
      expect(log[0].details).toContain('10')
    })

    it('should not log activity on non-10th visits', async () => {
      const discovery = makeDiscovery({ visitCount: 5 })
      await saveDiscovery(discovery)
      resetThrottleMap()

      await handleNavigation('https://chatgpt.com')

      const log = await getActivityLog()
      expect(log).toHaveLength(0)
    })
  })

  describe('updateBadge', () => {
    it('should show pending count when there are detected tools', async () => {
      await handleNavigation('https://chatgpt.com')
      resetThrottleMap()
      await handleNavigation('https://claude.ai')

      expect(chrome.action.setBadgeText).toHaveBeenCalledWith({ text: '2' })
      expect(chrome.action.setBadgeBackgroundColor).toHaveBeenCalledWith({ color: '#ef4444' })
    })

    it('should clear badge when no pending tools', async () => {
      const discovery = makeDiscovery({ status: 'authorized' })
      await saveDiscovery(discovery)

      await updateBadge()

      expect(chrome.action.setBadgeText).toHaveBeenCalledWith({ text: '' })
    })

    it('should count only detected status tools', async () => {
      await saveDiscovery(makeDiscovery({ id: '1', domain: 'a.com', status: 'detected' }))
      await saveDiscovery(makeDiscovery({ id: '2', domain: 'b.com', status: 'confirmed' }))
      await saveDiscovery(makeDiscovery({ id: '3', domain: 'c.com', status: 'authorized' }))
      await saveDiscovery(makeDiscovery({ id: '4', domain: 'd.com', status: 'dismissed' }))

      await updateBadge()

      expect(chrome.action.setBadgeText).toHaveBeenCalledWith({ text: '1' })
    })
  })

  describe('loadCustomDomains', () => {
    it('should load custom domains from settings into registry', async () => {
      mockStore['app_settings'] = {
        version: '1.0.0',
        companyName: '',
        responsiblePerson: '',
        installationDate: '2026-03-01T00:00:00.000Z',
        badgeNotifications: true,
        customDomains: [
          {
            domain: 'internal-ai.mycompany.com',
            toolName: 'Internal AI',
            category: 'chatbot',
            defaultRiskLevel: 'high',
          },
        ],
        excludedDomains: [],
      }

      await loadCustomDomains()
      await handleNavigation('https://internal-ai.mycompany.com/chat')

      const discoveries = await getDiscoveries()
      expect(discoveries).toHaveLength(1)
      expect(discoveries[0].toolName).toBe('Internal AI')
      expect(discoveries[0].defaultRiskLevel).toBe('high')
    })
  })

  describe('initializeEngine', () => {
    it('should initialize storage defaults', async () => {
      await initializeEngine()

      expect(mockStore['ai_discoveries']).toEqual([])
      expect(mockStore['activity_log']).toEqual([])
    })

    it('should reset throttle map', async () => {
      await handleNavigation('https://chatgpt.com')

      await initializeEngine()

      await handleNavigation('https://chatgpt.com')
      const discoveries = await getDiscoveries()
      expect(discoveries[0].visitCount).toBe(2)
    })

    it('should update badge after initialization', async () => {
      await initializeEngine()

      expect(chrome.action.setBadgeText).toHaveBeenCalled()
    })
  })
})
