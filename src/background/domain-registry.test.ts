import { describe, it, expect } from 'vitest'
import {
  lookupDomain,
  extractDomain,
  getRegistrySize,
  getAllDomains,
  addCustomEntry,
  removeEntry,
  getEntriesByCategory,
  getEntriesByRiskLevel,
} from '@background/domain-registry'

describe('domain-registry', () => {
  describe('getRegistrySize', () => {
    it('should have at least 80 domains', () => {
      expect(getRegistrySize()).toBeGreaterThanOrEqual(80)
    })
  })

  describe('lookupDomain', () => {
    it('should find chatgpt.com as chatbot', () => {
      const result = lookupDomain('chatgpt.com')
      expect(result).not.toBeNull()
      expect(result!.toolName).toBe('ChatGPT')
      expect(result!.category).toBe('chatbot')
      expect(result!.defaultRiskLevel).toBe('limited')
    })

    it('should find claude.ai as chatbot', () => {
      const result = lookupDomain('claude.ai')
      expect(result).not.toBeNull()
      expect(result!.toolName).toBe('Claude')
      expect(result!.category).toBe('chatbot')
    })

    it('should find hirevue.com as hr_employment with high risk', () => {
      const result = lookupDomain('hirevue.com')
      expect(result).not.toBeNull()
      expect(result!.category).toBe('hr_employment')
      expect(result!.defaultRiskLevel).toBe('high')
    })

    it('should find clearview.ai as biometric_surveillance with prohibited risk', () => {
      const result = lookupDomain('clearview.ai')
      expect(result).not.toBeNull()
      expect(result!.category).toBe('biometric_surveillance')
      expect(result!.defaultRiskLevel).toBe('prohibited')
    })

    it('should return null for google.com (non-AI domain)', () => {
      const result = lookupDomain('google.com')
      expect(result).toBeNull()
    })

    it('should return null for wikipedia.org', () => {
      const result = lookupDomain('wikipedia.org')
      expect(result).toBeNull()
    })

    it('should resolve subdomains via parent domain match (chat.openai.com)', () => {
      const result = lookupDomain('chat.openai.com')
      expect(result).not.toBeNull()
    })

    it('should handle case-insensitive lookup', () => {
      const result = lookupDomain('ChatGPT.Com')
      expect(result).not.toBeNull()
      expect(result!.toolName).toBe('ChatGPT')
    })

    it('should strip www prefix and find domain', () => {
      const result = lookupDomain('www.chatgpt.com')
      expect(result).not.toBeNull()
      expect(result!.toolName).toBe('ChatGPT')
    })

    it('should resolve wildcard subdomain for openai.com subdomains', () => {
      const result = lookupDomain('api.openai.com')
      expect(result).not.toBeNull()
      expect(result!.toolName).toBe('OpenAI')
    })

    it('should find cursor.com as code_generation', () => {
      const result = lookupDomain('cursor.com')
      expect(result).not.toBeNull()
      expect(result!.category).toBe('code_generation')
    })

    it('should find midjourney.com as image_generation', () => {
      const result = lookupDomain('midjourney.com')
      expect(result).not.toBeNull()
      expect(result!.category).toBe('image_generation')
    })

    it('should find runway.com as video_audio_generation', () => {
      const result = lookupDomain('runway.com')
      expect(result).not.toBeNull()
      expect(result!.category).toBe('video_audio_generation')
    })

    it('should find perplexity.ai as chatbot (dual with analysis_bi)', () => {
      const result = lookupDomain('perplexity.ai')
      expect(result).not.toBeNull()
    })

    it('should find upstart.com as finance_credit with high risk', () => {
      const result = lookupDomain('upstart.com')
      expect(result).not.toBeNull()
      expect(result!.category).toBe('finance_credit')
      expect(result!.defaultRiskLevel).toBe('high')
    })

    it('should find glass.health as healthcare', () => {
      const result = lookupDomain('glass.health')
      expect(result).not.toBeNull()
      expect(result!.category).toBe('healthcare')
    })

    it('should find century.tech as education', () => {
      const result = lookupDomain('century.tech')
      expect(result).not.toBeNull()
      expect(result!.category).toBe('education')
    })
  })

  describe('extractDomain', () => {
    it('should extract domain from https URL', () => {
      expect(extractDomain('https://chatgpt.com/chat')).toBe('chatgpt.com')
    })

    it('should extract domain from http URL', () => {
      expect(extractDomain('http://chatgpt.com')).toBe('chatgpt.com')
    })

    it('should normalize to lowercase', () => {
      expect(extractDomain('https://www.ChatGPT.com/chat?x=1')).toBe('chatgpt.com')
    })

    it('should strip www prefix', () => {
      expect(extractDomain('https://www.claude.ai/chat')).toBe('claude.ai')
    })

    it('should strip port number', () => {
      expect(extractDomain('https://chatgpt.com:443/chat')).toBe('chatgpt.com')
    })

    it('should handle URL without protocol', () => {
      expect(extractDomain('chatgpt.com')).toBe('chatgpt.com')
    })

    it('should handle URL with query params', () => {
      expect(extractDomain('https://chatgpt.com/chat?model=gpt-4&temp=0.7')).toBe('chatgpt.com')
    })

    it('should handle URL with hash fragment', () => {
      expect(extractDomain('https://chatgpt.com/chat#section')).toBe('chatgpt.com')
    })

    it('should return null for invalid URL', () => {
      expect(extractDomain('')).toBeNull()
    })

    it('should handle complex URL with path and params', () => {
      expect(extractDomain('https://www.hirevue.com/candidates/interview/123?lang=es')).toBe('hirevue.com')
    })
  })

  describe('getAllDomains', () => {
    it('should return an array of domain strings', () => {
      const domains = getAllDomains()
      expect(Array.isArray(domains)).toBe(true)
      expect(domains.length).toBeGreaterThanOrEqual(80)
      expect(domains).toContain('chatgpt.com')
      expect(domains).toContain('claude.ai')
    })
  })

  describe('getEntriesByCategory', () => {
    it('should return only chatbot entries', () => {
      const chatbots = getEntriesByCategory('chatbot')
      expect(chatbots.length).toBeGreaterThanOrEqual(15)
      chatbots.forEach((e) => expect(e.category).toBe('chatbot'))
    })

    it('should return hr_employment entries with high risk', () => {
      const hr = getEntriesByCategory('hr_employment')
      expect(hr.length).toBeGreaterThanOrEqual(5)
      hr.forEach((e) => expect(e.defaultRiskLevel).toBe('high'))
    })

    it('should return biometric_surveillance entries with prohibited risk', () => {
      const bio = getEntriesByCategory('biometric_surveillance')
      expect(bio.length).toBeGreaterThanOrEqual(3)
      bio.forEach((e) => expect(e.defaultRiskLevel).toBe('prohibited'))
    })
  })

  describe('getEntriesByRiskLevel', () => {
    it('should return only high risk entries', () => {
      const high = getEntriesByRiskLevel('high')
      expect(high.length).toBeGreaterThanOrEqual(10)
      high.forEach((e) => expect(e.defaultRiskLevel).toBe('high'))
    })

    it('should return prohibited entries', () => {
      const prohibited = getEntriesByRiskLevel('prohibited')
      expect(prohibited.length).toBeGreaterThanOrEqual(3)
      prohibited.forEach((e) => expect(e.defaultRiskLevel).toBe('prohibited'))
    })
  })

  describe('addCustomEntry / removeEntry', () => {
    it('should add and find a custom domain', () => {
      addCustomEntry({
        domain: 'custom-ai-tool.example.com',
        toolName: 'Custom AI Tool',
        category: 'chatbot',
        defaultRiskLevel: 'limited',
      })

      const result = lookupDomain('custom-ai-tool.example.com')
      expect(result).not.toBeNull()
      expect(result!.toolName).toBe('Custom AI Tool')

      removeEntry('custom-ai-tool.example.com')
    })

    it('should remove a custom domain', () => {
      addCustomEntry({
        domain: 'temp-tool.example.com',
        toolName: 'Temp Tool',
        category: 'code_generation',
        defaultRiskLevel: 'limited',
      })

      expect(lookupDomain('temp-tool.example.com')).not.toBeNull()

      removeEntry('temp-tool.example.com')
      expect(lookupDomain('temp-tool.example.com')).toBeNull()
    })

    it('should match wildcard pattern *.example.com', () => {
      addCustomEntry({
        domain: '*.example.com',
        pattern: '*.example.com',
        toolName: 'Internal AI',
        category: 'chatbot',
        defaultRiskLevel: 'limited',
      })

      expect(lookupDomain('app.example.com')).not.toBeNull()
      expect(lookupDomain('app.example.com')!.toolName).toBe('Internal AI')
      expect(lookupDomain('dev.example.com')).not.toBeNull()
      expect(lookupDomain('dev.example.com')!.toolName).toBe('Internal AI')
      expect(lookupDomain('api.example.com')).not.toBeNull()
      expect(lookupDomain('api.example.com')!.toolName).toBe('Internal AI')
      expect(lookupDomain('random-unrelated.com')).toBeNull()

      removeEntry('*.example.com')
    })

    it('should not match unrelated domains with wildcard', () => {
      addCustomEntry({
        domain: '*.company.com',
        pattern: '*.company.com',
        toolName: 'Company AI',
        category: 'chatbot',
        defaultRiskLevel: 'limited',
      })

      expect(lookupDomain('app.company.com')).not.toBeNull()
      expect(lookupDomain('app.company.com')!.toolName).toBe('Company AI')
      expect(lookupDomain('random-unrelated.com')).toBeNull()

      removeEntry('*.company.com')
    })
  })
})
