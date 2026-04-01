import type { RegulationType, ComplianceChecklist } from '@shared/types/compliance';

export interface RegulationArticle {
  id: string;
  title: string;
  description: string;
}

export interface RegulationInfo {
  id: RegulationType;
  name: string;
  shortName: string;
  description: string;
  articles: RegulationArticle[];
}

export const REGULATIONS: Record<RegulationType, RegulationInfo> = {
  euAiAct: {
    id: 'euAiAct',
    name: 'EU Artificial Intelligence Act',
    shortName: 'EU AI Act',
    description:
      'Reglamento del Parlamento Europeo y del Consejo por el que se establecen normas armonizadas en materia de inteligencia artificial.',
    articles: [
      {
        id: 'art-4',
        title: 'Art. 4 — Alfabetización en IA',
        description:
          'Los proveedores y desplegadores de sistemas de IA deberán garantizar un nivel adecuado de alfabetización en IA de su personal.',
      },
      {
        id: 'art-6',
        title: 'Art. 6 — Clasificación de sistemas de alto riesgo',
        description:
          'Los sistemas de IA utilizados en determinados ámbitos se clasificarán como de alto riesgo y estarán sujetos a requisitos adicionales.',
      },
      {
        id: 'art-9',
        title: 'Art. 9 — Sistema de gestión de riesgos',
        description:
          'Los sistemas de IA de alto riesgo deberán implementar un sistema de gestión de riesgos continuo.',
      },
      {
        id: 'art-11',
        title: 'Art. 11 — Documentación técnica',
        description:
          'Los proveedores deberán elaborar y mantener documentación técnica que demuestre el cumplimiento de los requisitos establecidos.',
      },
      {
        id: 'art-12',
        title: 'Art. 12 — Registro y logs',
        description:
          'Los sistemas de IA de alto riesgo deberán generar y conservar registros (logs) automáticamente.',
      },
      {
        id: 'art-26',
        title: 'Art. 26 — Obligaciones del desplegador',
        description:
          'Los desplegadores de sistemas de IA de alto riesgo deberán cumplir obligaciones específicas de uso, supervisión y documentación.',
      },
      {
        id: 'art-27',
        title: 'Art. 27 — Evaluación de impacto en derechos fundamentales',
        description:
          'Antes de poner en servicio un sistema de IA de alto riesgo, los desplegadores deberán realizar una evaluación de impacto.',
      },
      {
        id: 'art-50',
        title: 'Art. 50 — Transparencia',
        description:
          'Los proveedores deberán garantizar que los sistemas de IA sean transparentes y que los usuarios estén informados de su interacción con IA.',
      },
    ],
  },
  iso42001: {
    id: 'iso42001',
    name: 'ISO/IEC 42001:2023 — Sistema de Gestión de IA',
    shortName: 'ISO 42001',
    description:
      'Estándar internacional que especifica requisitos para establecer, implementar, mantener y mejorar continuamente un Sistema de Gestión de Inteligencia Artificial (AIMS).',
    articles: [
      {
        id: 'iso-aims-inventory',
        title: 'Inventario de sistemas de IA',
        description:
          'La organización deberá mantener un inventario actualizado de todos los sistemas de IA desplegados, incluyendo su propósito, alcance y riesgos asociados.',
      },
      {
        id: 'iso-risk-assessment',
        title: 'Evaluación de riesgos de IA',
        description:
          'La organización deberá realizar evaluaciones de riesgos sistemáticas para cada sistema de IA identificado.',
      },
      {
        id: 'iso-documentation',
        title: 'Documentación del AIMS',
        description:
          'La organización deberá mantener documentación que demuestre la eficacia del Sistema de Gestión de Inteligencia Artificial.',
      },
      {
        id: 'iso-monitoring',
        title: 'Monitoreo de rendimiento',
        description:
          'La organización deberá monitorear, medir, analizar y evaluar el rendimiento de los sistemas de IA y el AIMS.',
      },
      {
        id: 'iso-governance',
        title: 'Responsabilidad y gobernanza',
        description:
          'La organización deberá asignar roles, responsabilidades y autoridades claras para la gestión de IA.',
      },
    ],
  },
  coSb205: {
    id: 'coSb205',
    name: 'Colorado SB 24-205 — Protecciones del Consumidor en IA',
    shortName: 'CO SB 205',
    description:
      'Ley del estado de Colorado que establece obligaciones para los desarrolladores y desplegadores de sistemas de IA de alto riesgo en materia de protección al consumidor.',
    articles: [
      {
        id: 'co-risk-policy',
        title: 'Política de gestión de riesgos',
        description:
          'Los desarrolladores y desplegadores deberán implementar y mantener una política de gestión de riesgos para sistemas de IA de alto riesgo.',
      },
      {
        id: 'co-impact-assessment',
        title: 'Evaluación de impacto',
        description:
          'Los desplegadores deberán realizar evaluaciones de impacto antes de desplegar sistemas de IA de alto riesgo que afecten decisiones significativas.',
      },
      {
        id: 'co-disclosure',
        title: 'Divulgación al consumidor',
        description:
          'Los desplegadores deberán informar a los consumidores cuando estén interactuando con un sistema de IA que tome o influya en decisiones significativas.',
      },
      {
        id: 'co-public-statement',
        title: 'Declaración pública',
        description:
          'Los desarrolladores deberán publicar declaraciones públicas sobre los sistemas de IA de alto riesgo que desarrollen y distribuyan.',
      },
      {
        id: 'co-affirmative-defense',
        title: 'Defensa afirmativa — ISO 42001',
        description:
          'El cumplimiento de ISO 42001 constituye una defensa afirmativa frente a alegaciones de incumplimiento de la ley.',
      },
    ],
  },
};

export function createArticleChecklistMap(
  regKey: RegulationType,
  enabled: boolean,
  dueDate: string | null,
): Record<string, ComplianceChecklist> {
  const articles = REGULATIONS[regKey].articles;
  const result: Record<string, ComplianceChecklist> = {};
  for (const article of articles) {
    result[article.id] = {
      assessment: enabled ? 'pending' : 'not_applicable',
      lastAssessedDate: null,
      dueDate: enabled ? dueDate : null,
      notes: '',
    };
  }
  return result;
}
