---
name: doc-security
description: Genera documentación de seguridad y trust para Lupar orientada a compradores del SaaS y compliance officers. Cubre arquitectura zero-cloud, privacidad, y almacenamiento de datos.
license: MIT
compatibility: opencode
metadata:
  audience: compliance-officers
  project: lupar-docs
  format: obsidian-markdown
---

## Qué hago

Genero documentación técnica-accessible sobre la seguridad y privacidad de Lupar. El objetivo es TRANSMITIR CONFIANZA al comprador del SaaS.

## Cómo generar una doc de seguridad

### Estructura obligatoria

```markdown
---
title: "Título de Seguridad"
date: YYYY-MM-DD
tags:
  - security
  - tag-específico
---

## Resumen

[2-3 oraciones: qué aspecto de seguridad se cubre y por qué importa]

## El problema

[Qué riesgo existe en el mercado. Por qué las soluciones cloud son insuficientes.]

## Cómo Lupar lo resuelve

[Explicación de la arquitectura o enfoque. Sin código, pero con suficiente detalle técnico para generar confianza.]

> [!info] Para auditores
> [Información específica que un auditor querría verificar]

## Beneficios para compliance

[Lista de cómo esta característica de seguridad beneficia el cumplimiento de regulaciones]

| Regulación | Beneficio | Artículo/Control |
|-----------|----------|-----------------|
| [[eu-ai-act]] | [Beneficio] | Art.X |
| [[iso-42001]] | [Beneficio] | Control Y |

## Preguntas frecuentes

**¿Pregunta del buyer?**
Respuesta clara y directa.

**¿Pregunta del compliance officer?**
Respuesta.

## Comparativa

[Tabla comparativa con alternativas cloud. Sin nombrar competidores específicos, pero sí patrones de arquitectura.]

## Relacionado

- [[otra-page-seguridad]] — Descripción
- [[feature-relacionada]] — Feature que usa esto
- [[regulacion]] — Regulación que beneficia
```

### Reglas obligatorias

1. **Lenguaje**: Español (es-AR). Profesional, que transmita TRUST. Ni muy técnico ni muy superficial.
2. **TONO DE CONFIANZA**: Esta sección es para COMPRADORES. El objetivo es que lean y digan "esto es seguro, lo quiero".
3. **Sin revelar vulnerabilidades**: No describir posibles vectores de ataque. Solo las protecciones.
4. **Tablas comparativas**: Siempre comparar el enfoque zero-cloud con alternativas cloud (sin nombrar productos).
5. **Wikilinks**: Mínimo 4 wikilinks. Siempre link a las 3 regulaciones donde aplique.
6. **Sección "Para auditores"**: Siempre incluir un callout `[!info]` con info específica para auditores.
7. **Sin código**: No mostrar implementación técnica. Explicar QUÉ hace, no CÓMO lo hace (salvo en data-storage.md que es para technical buyers).
8. **Longitud**: 400-600 palabras.

### Puntos clave de Lupar

- **Zero-Cloud**: No hay backend, no hay APIs externas, no hay servidor. Todo corre en el browser del usuario.
- **Storage**: `chrome.storage.local` con permiso `unlimitedStorage`. Las keys son: `ai_discoveries`, `app_settings`, `activity_log`.
- **Sin telemetría**: No hay analytics, no hay tracking, no hay cookies, no hay llamadas a servidores externos.
- **Código abierto**: El código está en GitHub (`maisonnat/Lupar`), auditable por cualquiera.
- **Reportes self-contained**: Los reportes HTML son archivos independientes que no requieren conexión.

### Destino de los archivos

Los archivos generados van en el repo `lupar-docs` en la carpeta `content/security/`.
