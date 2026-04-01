---
name: doc-regulation
description: Genera resúmenes ejecutivos de regulaciones de IA (EU AI Act, ISO 42001, Colorado SB 205) orientados a compliance officers, con mapeo a las funcionalidades de Lupar.
license: MIT
compatibility: opencode
metadata:
  audience: compliance-officers
  project: lupar-docs
  format: obsidian-markdown
---

## Qué hago

Genero documentación de regulaciones de IA orientada a compliance officers: qué dice la regulación, qué obliga, y cómo Lupar ayuda a cumplirla.

## Cómo generar una doc de regulación

### Estructura obligatoria

```markdown
---
title: "Nombre de la Regulación"
date: YYYY-MM-DD
tags:
  - regulations
  - tag-regulación
---

## Resumen ejecutivo

[3-4 oraciones: qué es, quién la aplica, desde cuándo, a quién afecta]

## Contexto

[Por qué existe esta regulación. El problema que resuelve. Timeline de implementación.]

## Obligaciones clave

### Obligación 1 — [Título]

**Qué exige**: [Explicación en lenguaje claro]
**A quién aplica**: [Desplegadores / Proveedores / Ambos]
**Plazo**: [Si aplica]

> [!warning] Importante
> [Por qué esto es crítico para el compliance officer]

### Obligación 2 — [Título]
...

## Cómo Lupar ayuda

[Tabla o lista que mapea cada obligación a una feature de Lupar]

| Obligación | Feature de Lupar | Estado |
|-----------|-----------------|--------|
| Obligación 1 | [[feature-1]] | ✅ Disponible |
| Obligación 2 | [[feature-2]] | 🔜 Próximo |

## Artículos relevantes

[Lista de artículos/secciones específicas con descripción de 1-2 líneas]

## Preparación para auditoría

> [!tip] Checklist rápido
> - [ ] Paso 1 con [[guia-relacionada]]
> - [ ] Paso 2
> - [ ] Paso 3

## Comparativa con otras regulaciones

[Breve tabla comparativa con [[eu-ai-act]], [[iso-42001]], [[colorado-sb205]]]

## Relacionado

- [[compliance-tracking]] — Seguimiento de compliance
- [[reports]] — Reportes para auditores
- [[how-to-prepare-for-audit]] — Guía de preparación
```

### Reglas obligatorias

1. **Lenguaje**: Español (es-AR). Legal pero accesible. Explicar términos complejos.
2. **Sin copiar texto legal**: NO copiar artículos textualmente. Parafrasear en lenguaje claro.
3. **Mapeo a Lupar**: SIEMPRE incluir la sección "Cómo Lupar ayuda" con tabla de mapeo.
4. **Wikilinks**: Mínimo 5 wikilinks. Siempre link a las otras 2 regulaciones, a compliance-tracking, y a reports.
5. **Tabla comparativa**: Siempre incluir sección de comparativa con las otras regulaciones.
6. **Checklist**: Siempre incluir sección de preparación para auditoría con checklist práctico.
7. **Callouts**: Usar `> [!warning]` para obligaciones críticas, `> [!tip]` para recomendaciones prácticas, `> [!info]` para contexto adicional.
8. **Longitud**: 600-1000 palabras. Las regulaciones merecen más detalle que las features.

### Contexto de las regulaciones

**EU AI Act (Reglamento UE 2024/1689)**:
- Artículos relevantes en Lupar: Art.4 (Alfabetización), Art.6 (Clasificación alto riesgo), Art.9 (Gestión riesgos), Art.11 (Documentación), Art.12 (Logs), Art.26 (Obligaciones desplegador), Art.27 (Evaluación impacto), Art.50 (Transparencia)
- Fecha aplicación: Gradual 2024-2027

**ISO 42001:2023**:
- Controles relevantes: Inventario sistemas IA, Evaluación riesgos, Documentación AIMS, Monitoreo rendimiento, Responsabilidad gobernanza
- Es un estándar voluntario pero funciona como defensa afirmativa en CO SB 205

**Colorado SB 24-205**:
- Requisitos: Política gestión riesgos, Evaluación impacto, Divulgación consumidor, Declaración pública, Defensa afirmativa ISO 42001
- Efectiva desde febrero 2026

### Destino de los archivos

Los archivos generados van en el repo `lupar-docs` en la carpeta `content/regulations/`.
