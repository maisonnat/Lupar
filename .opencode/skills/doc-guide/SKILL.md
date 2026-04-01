---
name: doc-guide
description: Genera guías paso a paso para Lupar orientadas a compliance officers. Incluye screenshots placeholders, callouts de advertencia, y wikilinks a features y regulaciones.
license: MIT
compatibility: opencode
metadata:
  audience: compliance-officers
  project: lupar-docs
  format: obsidian-markdown
---

## Qué hago

Genero guías paso a paso ("how-to") para que un compliance officer pueda usar Lupar sin ayuda técnica.

## Cómo generar una guía

Cuando se te pida documentar un proceso de Lupar, seguís SIEMPRE esta estructura:

### Estructura obligatoria

```markdown
---
title: "Cómo [verbo + objeto]"
date: YYYY-MM-DD
tags:
  - guides
  - how-to
  - tag-específico
---

## Resumen

[1-2 oraciones: qué vas a lograr con esta guía y cuánto tiempo toma]

## Antes de empezar

> [!warning] Requisitos previos
> - [Requisito 1]
> - [Requisito 2]

[Si hay algo que necesitan configurar antes, explicarlo con links]

## Paso a paso

### Paso 1 — [Título descriptivo]

[Explicación de qué hacer y por qué]

![Screenshot del paso 1](assets/screenshots/guide-name-step1.png)

> [!tip] Consejo
> [Tip que hace la tarea más fácil]

### Paso 2 — [Título descriptivo]

[Explicación]

![Screenshot del paso 2](assets/screenshots/guide-name-step2.png)

### Paso 3 — [Título descriptivo]

...

## Resultado esperado

[Descripción de cómo se ve el resultado final. Screenshot placeholder del resultado.]

> [!info] ¿Qué sigue?
> [Sugerencia de próxima acción con wikilink]

## Solución de problemas

**¿Problema común?**
Solución.

**¿Otro problema?**
Solución.

## Relacionado

- [[feature-relacionada]] — Feature usada en esta guía
- [[otra-guia]] — Otra guía relacionada
- [[regulacion]] — Regulación relevante
```

### Reglas obligatorias

1. **Lenguaje**: Español (es-AR). Directo, sin jerga técnica.
2. **Verbo inicial**: El title SIEMPRE empieza con "Cómo " + verbo en infinitivo. Ej: "Cómo generar un reporte de compliance".
3. **Screenshots en CADA paso**: Un screenshot placeholder por paso mínimo. El filename debe ser descriptivo.
4. **Requisitos previos**: Siempre incluir sección "Antes de empezar" con callout `[!warning]`.
5. **Wikilinks**: Mínimo 3 wikilinks a features, regulaciones u otras guías.
6. **Sin pasos técnicos**: Si algo requiere dev tools o consola, no es una guía para esta audiencia.
7. **Resultado esperado**: Siempre mostrar qué obtiene el usuario al final.
8. **Troubleshooting**: Incluir sección con al menos 2 problemas comunes y soluciones.
9. **Callouts**: Usar `> [!warning]` para requisitos, `> [!tip]` para atajos, `> [!info]` para "qué sigue".
10. **Longitud**: 400-700 palabras.

### Contexto de Lupar

- **Audiencia**: Compliance officers, CISO, auditores internos. NO son developers.
- **Producto**: Chrome Extension que detecta Shadow AI en el navegador
- **4 secciones**: Dashboard, Inventario, Reportes, Configuración
- **Zero-Cloud**: No hay servidor, no hay login, no hay API. Todo local en el browser.
- **Regulaciones**: EU AI Act, ISO 42001, Colorado SB 205

### Destino de los archivos

Los archivos generados van en el repo `lupar-docs` en la carpeta `content/guides/`.
