---
name: doc-feature
description: Genera documentación de features de Lupar para compliance officers y compradores del SaaS. Incluye explicación funcional, casos de uso, screenshots placeholders, y wikilinks cruzados.
license: MIT
compatibility: opencode
metadata:
  audience: compliance-officers
  project: lupar-docs
  format: obsidian-markdown
---

## Qué hago

Genero documentación completa de una feature de Lupar orientada a compliance officers y futuros compradores del SaaS.

## Cómo generar una doc de feature

Cuando se te pida documentar una feature de Lupar, seguís SIEMPRE esta estructura:

### Estructura obligatoria

```markdown
---
title: "Nombre de la Feature"
date: YYYY-MM-DD
tags:
  - features
  - nombre-feature
---

## Descripción general

[2-3 oraciones: qué hace y por qué importa para compliance]

## Quién puede usarla

[Disponibilidad: todas las versiones / requiere plan específico]

## Cómo funciona

[Explicación paso a paso de la lógica interna, sin código, orientada al compliance officer]

![Screenshot placeholder descriptivo](assets/screenshots/feature-name-overview.png)

## Pasos para usarla

1. **Paso 1** — Descripción
   ![Screenshot del paso](assets/screenshots/feature-name-step1.png)

2. **Paso 2** — Descripción
   ![Screenshot del paso](assets/screenshots/feature-name-step2.png)

## Configuración

[Si aplica, explicar opciones configurables]

> [!tip] Consejo
> [Tip relevante para compliance officers]

## Preguntas frecuentes

**¿Pregunta?**
Respuesta.

## Relacionado

- [[otra-feature-1]] — Descripción breve
- [[otra-feature-2]] — Descripción breve
- [[guia-relacionada]] — Guía paso a paso
```

### Reglas obligatorias

1. **Lenguaje**: Español (es-AR). Tono profesional pero accesible.
2. **Audiencia**: Compliance officers, CISO, compradores del SaaS. NO son developers.
3. **Wikilinks**: Usar `[[page-name]]` para toda referencia interna. El page-name debe coincidir con el filename SIN .md.
4. **Screenshots**: Incluir placeholder `![Descripción](assets/screenshots/nombre.png)` en cada paso clave.
5. **Callouts**: Usar `> [!tip]`, `> [!warning]`, `> [!note]`, `> [!info]` para destacar información.
6. **Sin código**: No mostrar código fuente. Si es necesario explicar algo técnico, hacerlo en lenguaje natural.
7. **Cross-links**: Siempre vincular con al menos 3 otras páginas de la knowledge base.
8. **Regulaciones**: Cuando sea relevante, mencionar qué artículos de EU AI Act / ISO 42001 / CO SB 205 se relacionan usando wikilinks `[[eu-ai-act]]`, `[[iso-42001]]`, `[[colorado-sb205]]`.
9. **Longitud**: Entre 300 y 600 palabras de contenido sustantivo.

### Contexto de Lupar

- **Producto**: Chrome Extension (Manifest V3) que detecta Shadow AI
- **Stack**: React 19, TypeScript, Tailwind CSS v4, Vite
- **Arquitectura**: Zero-Cloud (sin backend, sin APIs externas, todo en chrome.storage.local)
- **Regulaciones**: EU AI Act, ISO 42001, Colorado SB 205
- **Categorías AI**: 10 categorías (chatbot, code_generation, image_generation, video_audio_generation, analysis_bi, hr_employment, finance_credit, healthcare, education, biometric_surveillance)
- **Niveles de riesgo**: Prohibido, Alto, Limitado, Mínimo
- **Statuses**: Detectado, Confirmado, Descartado, Autorizado
- **Secciones de la UI**: Dashboard, Inventario, Reportes, Configuración

### Destino de los archivos

Los archivos generados van en el repo `lupar-docs` en la carpeta `content/features/`.
