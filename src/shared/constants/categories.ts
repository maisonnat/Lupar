import type { AICategory } from '@shared/types/domain';

export const CATEGORY_LABELS: Record<AICategory, string> = {
  chatbot: 'Chatbots / Asistentes',
  code_generation: 'Generación de código',
  image_generation: 'Generación de imágenes',
  video_audio_generation: 'Generación de video/audio',
  analysis_bi: 'Análisis / BI con IA',
  hr_employment: 'Recursos humanos',
  finance_credit: 'Finanzas / Crédito',
  healthcare: 'Salud',
  education: 'Educación',
  biometric_surveillance: 'Biometría / Vigilancia',
};

export const CATEGORY_DESCRIPTIONS: Record<AICategory, string> = {
  chatbot:
    'Asistentes conversacionales basados en IA: ChatGPT, Claude, Gemini, Copilot y similares.',
  code_generation:
    'Herramientas de generación y asistencia de código: GitHub Copilot, Cursor, Replit y similares.',
  image_generation:
    'Plataformas de generación de imágenes con IA: Midjourney, DALL-E, Stable Diffusion y similares.',
  video_audio_generation:
    'Herramientas de generación de video y audio con IA: Runway, ElevenLabs, Suno y similares.',
  analysis_bi:
    'Plataformas de análisis e inteligencia de negocio potenciadas con IA: Perplexity, You.com y similares.',
  hr_employment:
    'Sistemas de IA aplicados a recursos humanos y empleo: evaluación de candidatos, reclutamiento automatizado.',
  finance_credit:
    'Sistemas de IA aplicados a finanzas y crédito: evaluación crediticia, scoring automatizado.',
  healthcare:
    'Sistemas de IA aplicados al sector salud: diagnóstico asistido, gestión clínica.',
  education:
    'Plataformas de IA aplicadas a educación: tutoría personalizada, evaluación automatizada.',
  biometric_surveillance:
    'Sistemas de biometría y vigilancia basados en IA: reconocimiento facial, identificación biométrica remota.',
};
