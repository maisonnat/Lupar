import type { DomainEntry, AICategory, RiskLevel } from '@shared/types/domain';

const entries: DomainEntry[] = [
  { domain: 'chatgpt.com', toolName: 'ChatGPT', category: 'chatbot', defaultRiskLevel: 'limited' },
  { domain: 'chat.openai.com', toolName: 'ChatGPT Legacy', category: 'chatbot', defaultRiskLevel: 'limited' },
  { domain: 'openai.com', toolName: 'OpenAI', category: 'chatbot', defaultRiskLevel: 'limited' },
  { domain: 'claude.ai', toolName: 'Claude', category: 'chatbot', defaultRiskLevel: 'limited' },
  { domain: 'gemini.google.com', toolName: 'Gemini', category: 'chatbot', defaultRiskLevel: 'limited' },
  { domain: 'copilot.microsoft.com', toolName: 'Microsoft Copilot', category: 'chatbot', defaultRiskLevel: 'limited' },
  { domain: 'perplexity.ai', toolName: 'Perplexity', category: 'chatbot', defaultRiskLevel: 'limited' },
  { domain: 'character.ai', toolName: 'Character.AI', category: 'chatbot', defaultRiskLevel: 'limited' },
  { domain: 'pi.ai', toolName: 'Pi (Inflection)', category: 'chatbot', defaultRiskLevel: 'limited' },
  { domain: 'poe.com', toolName: 'Poe', category: 'chatbot', defaultRiskLevel: 'limited' },
  { domain: 'mistral.ai', toolName: 'Mistral AI', category: 'chatbot', defaultRiskLevel: 'limited' },
  { domain: 'chat.mistral.ai', toolName: 'Mistral Chat', category: 'chatbot', defaultRiskLevel: 'limited' },
  { domain: 'groq.com', toolName: 'Groq', category: 'chatbot', defaultRiskLevel: 'limited' },
  { domain: 'deepseek.com', toolName: 'DeepSeek', category: 'chatbot', defaultRiskLevel: 'limited' },
  { domain: 'chat.deepseek.com', toolName: 'DeepSeek Chat', category: 'chatbot', defaultRiskLevel: 'limited' },
  { domain: 'huggingface.co', toolName: 'Hugging Face', category: 'chatbot', defaultRiskLevel: 'limited' },
  { domain: 'cohere.com', toolName: 'Cohere', category: 'chatbot', defaultRiskLevel: 'limited' },

  { domain: 'github.com', toolName: 'GitHub Copilot', category: 'code_generation', defaultRiskLevel: 'limited' },
  { domain: 'cursor.com', toolName: 'Cursor', category: 'code_generation', defaultRiskLevel: 'limited' },
  { domain: 'replit.com', toolName: 'Replit', category: 'code_generation', defaultRiskLevel: 'limited' },
  { domain: 'codeium.com', toolName: 'Codeium', category: 'code_generation', defaultRiskLevel: 'limited' },
  { domain: 'tabnine.com', toolName: 'Tabnine', category: 'code_generation', defaultRiskLevel: 'limited' },
  { domain: 'sourcegraph.com', toolName: 'Cody (Sourcegraph)', category: 'code_generation', defaultRiskLevel: 'limited' },
  { domain: 'codepal.ai', toolName: 'CodePal', category: 'code_generation', defaultRiskLevel: 'limited' },
  { domain: 'blackbox.ai', toolName: 'Blackbox AI', category: 'code_generation', defaultRiskLevel: 'limited' },
  { domain: 'codewhisperer.amazon.com', toolName: 'Amazon CodeWhisperer', category: 'code_generation', defaultRiskLevel: 'limited' },
  { domain: 'aistudio.google.com', toolName: 'Google AI Studio', category: 'code_generation', defaultRiskLevel: 'limited' },
  { domain: 'v0.dev', toolName: 'v0 (Vercel)', category: 'code_generation', defaultRiskLevel: 'limited' },
  { domain: 'bolt.new', toolName: 'Bolt.new', category: 'code_generation', defaultRiskLevel: 'limited' },
  { domain: 'lovable.dev', toolName: 'Lovable', category: 'code_generation', defaultRiskLevel: 'limited' },

  { domain: 'midjourney.com', toolName: 'Midjourney', category: 'image_generation', defaultRiskLevel: 'limited' },
  { domain: 'dall-e.com', toolName: 'DALL-E', category: 'image_generation', defaultRiskLevel: 'limited' },
  { domain: 'openai.com/dall-e', toolName: 'DALL-E (OpenAI)', category: 'image_generation', defaultRiskLevel: 'limited' },
  { domain: 'stability.ai', toolName: 'Stability AI', category: 'image_generation', defaultRiskLevel: 'limited' },
  { domain: 'ideogram.ai', toolName: 'Ideogram', category: 'image_generation', defaultRiskLevel: 'limited' },
  { domain: 'leonardo.ai', toolName: 'Leonardo.AI', category: 'image_generation', defaultRiskLevel: 'limited' },
  { domain: 'playground.ai', toolName: 'Playground AI', category: 'image_generation', defaultRiskLevel: 'limited' },
  { domain: 'craiyon.com', toolName: 'Craiyon', category: 'image_generation', defaultRiskLevel: 'limited' },
  { domain: 'dreamstudio.ai', toolName: 'DreamStudio', category: 'image_generation', defaultRiskLevel: 'limited' },
  { domain: 'firefly.adobe.com', toolName: 'Adobe Firefly', category: 'image_generation', defaultRiskLevel: 'limited' },
  { domain: 'canva.com', toolName: 'Canva AI', category: 'image_generation', defaultRiskLevel: 'limited' },
  { domain: 'clipdrop.co', toolName: 'ClipDrop', category: 'image_generation', defaultRiskLevel: 'limited' },
  { domain: 'bing.com', toolName: 'Bing Image Creator', category: 'image_generation', defaultRiskLevel: 'limited' },

  { domain: 'runway.com', toolName: 'Runway', category: 'video_audio_generation', defaultRiskLevel: 'limited' },
  { domain: 'elevenlabs.io', toolName: 'ElevenLabs', category: 'video_audio_generation', defaultRiskLevel: 'limited' },
  { domain: 'suno.com', toolName: 'Suno', category: 'video_audio_generation', defaultRiskLevel: 'limited' },
  { domain: 'udio.com', toolName: 'Udio', category: 'video_audio_generation', defaultRiskLevel: 'limited' },
  { domain: 'heygen.com', toolName: 'HeyGen', category: 'video_audio_generation', defaultRiskLevel: 'limited' },
  { domain: 'synthesia.io', toolName: 'Synthesia', category: 'video_audio_generation', defaultRiskLevel: 'limited' },
  { domain: 'descript.com', toolName: 'Descript', category: 'video_audio_generation', defaultRiskLevel: 'limited' },
  { domain: 'murf.ai', toolName: 'Murf AI', category: 'video_audio_generation', defaultRiskLevel: 'limited' },
  { domain: 'pictory.ai', toolName: 'Pictory', category: 'video_audio_generation', defaultRiskLevel: 'limited' },
  { domain: 'lumen5.com', toolName: 'Lumen5', category: 'video_audio_generation', defaultRiskLevel: 'limited' },
  { domain: 'd-id.com', toolName: 'D-ID', category: 'video_audio_generation', defaultRiskLevel: 'limited' },

  { domain: 'hirevue.com', toolName: 'HireVue', category: 'hr_employment', defaultRiskLevel: 'high' },
  { domain: 'pymetrics.com', toolName: 'Pymetrics', category: 'hr_employment', defaultRiskLevel: 'high' },
  { domain: 'eightfold.ai', toolName: 'Eightfold AI', category: 'hr_employment', defaultRiskLevel: 'high' },
  { domain: 'greenhouse.io', toolName: 'Greenhouse AI', category: 'hr_employment', defaultRiskLevel: 'high' },
  { domain: 'lever.co', toolName: 'Lever', category: 'hr_employment', defaultRiskLevel: 'high' },
  { domain: 'smartrecruiters.com', toolName: 'SmartRecruiters', category: 'hr_employment', defaultRiskLevel: 'high' },
  { domain: 'textio.com', toolName: 'Textio', category: 'hr_employment', defaultRiskLevel: 'high' },
  { domain: 'hireez.com', toolName: 'HireEz', category: 'hr_employment', defaultRiskLevel: 'high' },
  { domain: 'seekout.com', toolName: 'SeekOut', category: 'hr_employment', defaultRiskLevel: 'high' },

  { domain: 'upstart.com', toolName: 'Upstart', category: 'finance_credit', defaultRiskLevel: 'high' },
  { domain: 'zestfinance.com', toolName: 'ZestFinance', category: 'finance_credit', defaultRiskLevel: 'high' },
  { domain: 'lenddo.com', toolName: 'Lenddo', category: 'finance_credit', defaultRiskLevel: 'high' },
  { domain: 'kreditech.com', toolName: 'Kreditech', category: 'finance_credit', defaultRiskLevel: 'high' },
  { domain: 'credolab.com', toolName: 'CredoLab', category: 'finance_credit', defaultRiskLevel: 'high' },
  { domain: 'scienaptic.com', toolName: 'Scienaptic', category: 'finance_credit', defaultRiskLevel: 'high' },
  { domain: 'fico.com', toolName: 'FICO (AI Scoring)', category: 'finance_credit', defaultRiskLevel: 'high' },

  { domain: 'glass.health', toolName: 'Glass Health', category: 'healthcare', defaultRiskLevel: 'high' },
  { domain: 'nabla.com', toolName: 'Nabla', category: 'healthcare', defaultRiskLevel: 'high' },
  { domain: 'merative.com', toolName: 'Merative', category: 'healthcare', defaultRiskLevel: 'high' },
  { domain: 'pathai.com', toolName: 'PathAI', category: 'healthcare', defaultRiskLevel: 'high' },
  { domain: 'tempus.com', toolName: 'Tempus', category: 'healthcare', defaultRiskLevel: 'high' },
  { domain: 'butterflynetwork.com', toolName: 'Butterfly Network', category: 'healthcare', defaultRiskLevel: 'high' },
  { domain: 'aidoc.com', toolName: 'Aidoc', category: 'healthcare', defaultRiskLevel: 'high' },
  { domain: 'viz.ai', toolName: 'Viz.ai', category: 'healthcare', defaultRiskLevel: 'high' },

  { domain: 'phind.com', toolName: 'Phind', category: 'analysis_bi', defaultRiskLevel: 'limited' },
  { domain: 'you.com', toolName: 'You.com', category: 'analysis_bi', defaultRiskLevel: 'limited' },
  { domain: 'wolfram.com', toolName: 'Wolfram Alpha', category: 'analysis_bi', defaultRiskLevel: 'limited' },
  { domain: 'kagi.com', toolName: 'Kagi', category: 'analysis_bi', defaultRiskLevel: 'limited' },
  { domain: 'andi.search', toolName: 'Andi Search', category: 'analysis_bi', defaultRiskLevel: 'limited' },
  { domain: 'komo.ai', toolName: 'Komo AI', category: 'analysis_bi', defaultRiskLevel: 'limited' },
  { domain: 'consensus.app', toolName: 'Consensus', category: 'analysis_bi', defaultRiskLevel: 'limited' },
  { domain: 'eamon.com', toolName: 'Elicit', category: 'analysis_bi', defaultRiskLevel: 'limited' },
  { domain: 'scholar.google.com', toolName: 'Google Scholar AI', category: 'analysis_bi', defaultRiskLevel: 'limited' },

  { domain: 'century.tech', toolName: 'Century Tech', category: 'education', defaultRiskLevel: 'limited' },
  { domain: 'cognii.com', toolName: 'Cognii', category: 'education', defaultRiskLevel: 'limited' },
  { domain: 'carnegielearning.com', toolName: 'Carnegie Learning', category: 'education', defaultRiskLevel: 'limited' },
  { domain: 'squirrel.ai', toolName: 'Squirrel AI', category: 'education', defaultRiskLevel: 'limited' },
  { domain: 'duolingo.com', toolName: 'Duolingo AI', category: 'education', defaultRiskLevel: 'limited' },
  { domain: 'khanacademy.org', toolName: 'Khan Academy (Khanmigo)', category: 'education', defaultRiskLevel: 'limited' },
  { domain: 'coursera.org', toolName: 'Coursera AI', category: 'education', defaultRiskLevel: 'limited' },

  { domain: 'clearview.ai', toolName: 'Clearview AI', category: 'biometric_surveillance', defaultRiskLevel: 'prohibited' },
  { domain: 'pimeyes.com', toolName: 'PimEyes', category: 'biometric_surveillance', defaultRiskLevel: 'prohibited' },
  { domain: 'findface.pro', toolName: 'FindFace', category: 'biometric_surveillance', defaultRiskLevel: 'prohibited' },
  { domain: 'cognitec.com', toolName: 'Cognitec', category: 'biometric_surveillance', defaultRiskLevel: 'prohibited' },
  { domain: 'nec.com', toolName: 'NEC Bio-ID', category: 'biometric_surveillance', defaultRiskLevel: 'prohibited' },
  { domain: 'aware.com', toolName: 'Aware Biometrics', category: 'biometric_surveillance', defaultRiskLevel: 'prohibited' },
]

function buildRegistry(): Map<string, DomainEntry> {
  const map = new Map<string, DomainEntry>()
  for (const entry of entries) {
    map.set(entry.domain, entry)
  }
  return map
}

const domainRegistry = buildRegistry()

export function getRegistrySize(): number {
  return domainRegistry.size
}

export function getAllDomains(): string[] {
  return Array.from(domainRegistry.keys())
}

export function lookupDomain(hostname: string): DomainEntry | null {
  const normalized = hostname.toLowerCase().replace(/^www\./, '')

  const exact = domainRegistry.get(normalized)
  if (exact) return exact

  const parts = normalized.split('.')
  for (let i = 1; i < parts.length; i++) {
    const parent = parts.slice(i).join('.')
    const match = domainRegistry.get(parent)
    if (match) return match
  }

  for (const [pattern, entry] of domainRegistry) {
    if (normalized.endsWith(`.${pattern}`)) {
      return entry
    }
  }

  return null
}

export function extractDomain(url: string): string | null {
  try {
    if (!url.includes('://')) {
      url = 'https://' + url
    }
    const parsed = new URL(url)
    let hostname = parsed.hostname.toLowerCase()
    hostname = hostname.replace(/^www\./, '')
    return hostname
  } catch {
    return null
  }
}

export function addCustomEntry(entry: DomainEntry): void {
  domainRegistry.set(entry.domain.toLowerCase(), entry)
}

export function removeEntry(domain: string): void {
  domainRegistry.delete(domain.toLowerCase())
}

export function getEntriesByCategory(category: AICategory): DomainEntry[] {
  return entries.filter((e) => e.category === category)
}

export function getEntriesByRiskLevel(riskLevel: RiskLevel): DomainEntry[] {
  return entries.filter((e) => e.defaultRiskLevel === riskLevel)
}
