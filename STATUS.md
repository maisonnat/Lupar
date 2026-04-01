# Lupar — Estado del Proyecto

> Última actualización: 2026-04-01
> Tests: 338 component pasando, 12/12 E2E pasando

---

## ✅ Completado

| Task | Descripción | Fecha |
|------|-------------|-------|
| **1.6** | Multi-Regulación Configurable (activar/desactivar regulaciones, offset por regulación) | 2026-03-30 |
| **1.2** | Re-evaluación Periódica — Phases 1-5 completas | 2026-03-31 |
| **1.1** | Compliance por Artículo Individual (BREAKING CHANGE — un checklist por artículo en vez de por regulación) | 2026-03-31 |
| **1.3** | Audit Mode (modo solo lectura, banner, hash SHA-256 en reporte, toggle con confirmación) | 2026-03-31 |
| **1.4** | Audit Trail por Herramienta (historial de cambios por tool, tab Historial, diff automático en save, sección en reporte) | 2026-03-31 |
| **1.10** | Admin Profile en Settings (nombre, email, rol, departamento; report cover con info de admin; audit trail changedBy populado) | 2026-03-31 |
| **1.11** | Departamento Obligatorio (toggle en Settings, validación en save con error, tests) | 2026-03-31 |
| **1.5** | Snapshots de Compliance (historial temporal, timeline en dashboard, auto-snapshot en reportes, frecuencia configurable) | 2026-04-01 |
| **1.12** | Timezone / Date Format (zona horaria configurable, formato de fecha, utilidad centralizada, 14 reemplazos hardcodeados) | 2026-04-01 |
| **1.7** | Próximos Vencimientos (widget con deadlines por artículo, agrupados por urgencia) | 2026-04-01 |

### Detalle Task 1.12 (5 subtasks completas)

**Modelo nuevo en AppSettings:**
```ts
timezone: string    // default: detectTimezone() → 'America/Argentina/Buenos_Aires'
dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD'  // default: 'DD/MM/YYYY'
```

**Archivos nuevos:**
- `src/shared/utils/date-utils.ts` — 6 funciones: `detectTimezone()`, `formatDate()`, `formatDateTime()`, `formatDateLong()`, `formatDateTimeLong()`, `formatDateShort()`
- `src/options/hooks/useDateConfig.ts` — hook reactivo que lee timezone/dateFormat desde chrome.storage con listener de cambios
- `src/shared/utils/date-utils.test.ts` — 14 tests unit

**Subtasks completadas:**
- **1.12.1** — `DateFormat` type + `timezone` + `dateFormat` en AppSettings con defaults en `createDefaultSettings()`
- **1.12.2** — Utilidad centralizada `date-utils.ts` (6 funciones) + hook `useDateConfig.ts`
- **1.12.3** — UI en Settings: sección "Formato de Fecha y Hora" con select de timezone (21 opciones IANA) y select de formato de fecha (3 opciones con preview)
- **1.12.4** — 12 reemplazos de `'es-AR'` hardcodeado + 2 funciones `formatDate` locales duplicadas eliminadas (ComplianceTimeline, report-generator). AuditBanner recibe timezone como prop.
- **1.12.5** — Tests: 14 unit (date-utils) + 8 Settings (timezone/dateFormat CRUD + reset) = 22 tests nuevos

**Archivos modificados:**
- `src/shared/types/storage.ts` — `DateFormat`, `timezone`, `dateFormat`
- `src/background/storage-service.ts` — defaults con `detectTimezone()`
- `src/options/components/settings/Settings.tsx` — sección Formato de Fecha y Hora + TIMEZONE_OPTIONS + DATE_FORMAT_OPTIONS + handlers
- `src/options/components/inventory/ToolDetailModal.tsx` — 5 fechas reemplazadas
- `src/options/components/dashboard/ComplianceTimeline.tsx` — eliminada formatDate local, usa formatDateShort + useDateConfig
- `src/options/components/layout/AuditBanner.tsx` — timezone prop
- `src/options/components/layout/Layout.tsx` — pasa timezone a AuditBanner
- `src/options/components/dashboard/RecentActivity.tsx` — formatTimestamp con timezone via useDateConfig
- `src/options/components/inventory/ToolRow.tsx` — formatRelativeTime con timezone via useDateConfig
- `src/options/components/reports/Reports.tsx` — usa formatDateTimeLong via useDateConfig
- `src/options/utils/report-generator.ts` — eliminada formatDate local, 6 funciones actualizadas con timezone param
- `e2e/fixtures.ts` — timezone + dateFormat en resetExtension
- `src/options/components/layout/AuditBanner.test.tsx` — timezone prop en todos los renders
- 8 archivos de tests actualizados con `timezone` y `dateFormat` en mock settings

**Decisiones:**
- `detectTimezone()` usa `Intl.DateTimeFormat().resolvedOptions().timeZone` con fallback a Buenos Aires
- Componentes que ya reciben `settings` como prop extraen timezone directamente; los que no usan `useDateConfig()`
- `AuditBanner` no tenía acceso a settings — se le agregó `timezone` como prop obligatoria
- 21 opciones IANA: LATAM (9), EE.UU. (3), Europa (4), Asia (2), Oceanía (1), UTC (1) + Australia

### Detalle Task 1.7 (5 subtasks completadas)

**Tipos nuevos en `risk-calculator.ts`:**
```ts
type DeadlineUrgency = 'overdue' | 'this_week' | 'this_month' | 'upcoming'

interface UpcomingDeadline {
  toolName: string
  toolId: string
  regulationKey: RegulationType
  regulationLabel: string
  articleId: string
  articleTitle: string
  dueDate: string
  daysRemaining: number
  riskLevel: RiskLevel
  urgency: DeadlineUrgency
}
```

**Archivos nuevos:**
- `src/options/components/dashboard/UpcomingDeadlines.tsx` — widget con deadlines agrupados por urgencia (4 grupos)
- `src/options/components/dashboard/UpcomingDeadlines.test.tsx` — 13 tests component

**Subtasks completadas:**
- **1.7.2** — `getUpcomingDeadlines(discoveries, settings, daysAhead=90)` en `risk-calculator.ts` — itera por discovery → regulación habilitada → artículo pendiente/overdue con dueDate. Filtra dismissed, complete, not_applicable, sin dueDate, deshabilitados, y fuera del rango `daysAhead`. Retorna sorted por `daysRemaining` ascending.
- **1.7.1** — Componente `UpcomingDeadlines.tsx` — agrupa por urgencia (Vencidos/Esta semana/Este mes/Próximos) con colores y badges. Muestra toolName, regulationLabel, articleTitle, riskLevel badge, fecha formateada y label de días restantes. Usa `useDateConfig()` para formateo. Empty state incluido.
- **1.7.3** — Muestra: toolName, regulación (shortName), artículo (título completo), fecha formateada, días restantes, nivel de riesgo (badge con color)
- **1.7.4** — Agrupación: Vencidos (rojo, <0d), Esta semana (naranja, 1-7d), Este mes (amarillo, 8-30d), Próximos (gris, >30d)
- **1.7.5** — Integrado en `Dashboard.tsx` debajo de RiskScoreGauge/ComplianceStatus, arriba de ComplianceTimeline. Usa `useMemo` con `settings ? getUpcomingDeadlines(...) : []`.
- **1.7.6** — Tests: 13 unit (getUpcomingDeadlines) + 13 component (UpcomingDeadlines) = 26 tests nuevos

**Archivos modificados:**
- `src/options/utils/risk-calculator.ts` — `DeadlineUrgency`, `UpcomingDeadline`, `classifyUrgency()`, `getUpcomingDeadlines()`, import de `REGULATIONS`
- `src/options/utils/risk-calculator.test.ts` — `makeDefaultSettings()`, `daysFromNow()`, 13 tests nuevos en describe `getUpcomingDeadlines`
- `src/options/components/dashboard/Dashboard.tsx` — import `useMemo`, `getUpcomingDeadlines`, `UpcomingDeadlines`; hook `useMemo` con deadlines; JSX con componente
- `src/options/components/dashboard/Dashboard.test.tsx` — sin cambios (tests existentes pasan intactos)

**Decisiones:**
- `daysAhead` default 90 días (offset estándar del proyecto) — no hay UI para configurarlo, se pasa como parámetro opcional
- Se genera un deadline por cada artículo pendiente/overdue con dueDate (no por herramienta ni por regulación) — granularidad per-article del modelo Task 1.1
- `useDateConfig()` para formateo de fechas en el componente (respetando timezone y dateFormat configurados)
- `settings` es `AppSettings | null` en `useStorage()` — se usa guard: `settings ? getUpcomingDeadlines(...) : []`
- Sorted ascending por `daysRemaining` — lo más urgente primero
- Se filtran herramientas `dismissed` — no tiene sentido mostrar vencimientos de herramientas descartadas

### Detalle Task 1.11 (4 subtasks completas)

**Modelo nuevo en AppSettings:**
```ts
requireDepartment: boolean  // default: false
```

**Subtasks completadas:**
- **1.11.1** — `requireDepartment: boolean` en `AppSettings` + default `false` en `createDefaultSettings()`
- **1.11.2** — Toggle en Settings.tsx (sección Datos de la Organización) con persistencia inmediata
- **1.11.3** — Validación en `ToolDetailModal.handleSave()` — si `requireDepartment` y depto vacío → error inline; error se limpia al seleccionar depto
- **1.11.4** — Tests: 4 Settings (toggle render, load from storage, persist, reset on clear all) + 5 ToolDetailModal (block save, allow save with depto, allow save when disabled, clear error on select, block save with empty custom depto) = 9 tests nuevos

**Archivos modificados:**
- `src/shared/types/storage.ts` — `requireDepartment: boolean` en `AppSettings`
- `src/background/storage-service.ts` — `requireDepartment: false` en defaults
- `src/options/components/settings/Settings.tsx` — toggle + state + handler + reset
- `src/options/components/inventory/ToolDetailModal.tsx` — `saveError` state + validación + error UI
- `e2e/fixtures.ts` — `requireDepartment: false` en `resetExtension()`
- 8 archivos de tests actualizados con `requireDepartment` en mock settings
- `src/options/components/settings/Settings.test.tsx` — 4 tests nuevos
- `src/options/components/inventory/ToolDetailModal.test.tsx` — 5 tests nuevos

**Decisiones:**
- Toggle va en "Datos de la Organización" (junto al badge toggle) — es una política organizacional
- Error se muestra como texto rojo al lado del botón "Guardar cambios" — visible sin importar el tab activo
- Error se limpia tanto al cambiar el select de departamento como al escribir en el campo custom "Otro"
- Los tests de audit mode existentes que usaban `toggles[1]` se actualizaron a `toggles[2]` por el nuevo switch

### Detalle Task 1.5 (7 subtasks completas)

**Modelo nuevo en compliance.ts:**
```ts
type SnapshotTrigger = 'manual' | 'report' | 'scheduled'

interface ComplianceSnapshot {
  id: string
  date: string
  trigger: SnapshotTrigger
  overallScore: number
  totalTools: number
  totalGaps: number
  regulationBreakdown: Record<RegulationType, {
    complete: number
    pending: number
    overdue: number
    notApplicable: number
    total: number
  }>
}
```

**Modelo nuevo en AppSettings:**
```ts
snapshotFrequencyDays: number  // default: 0 (deshabilitado)
```

**Storage key nueva:** `compliance_snapshots` en `STORAGE_KEYS`

**Subtasks completadas:**
- **1.5.1** — `ComplianceSnapshot`, `SnapshotTrigger` types en `compliance.ts`
- **1.5.2** — Storage key `compliance_snapshots` + `snapshotFrequencyDays` en AppSettings + defaults + export/import
- **1.5.3** — `snapshot-service.ts` — `takeSnapshot()`, `getSnapshots()`, `deleteSnapshot()`, `checkAndTakeScheduledSnapshot()` + cap de 50 snapshots
- **1.5.4** — Auto-snapshot en `Reports.tsx` al generar reporte (trigger: `'report'`)
- **1.5.5** — `ComplianceTimeline.tsx` — gráfico SVG de evolución del score, botón manual, lista de snapshots con trigger badge y delta de score
- **1.5.6** — Settings: input numérico "Guardar snapshot cada X días" (0 = deshabilitado) + reset en Limpiar Todo
- **1.5.7** — `checkAndTakeScheduledSnapshot()` en `discovery-engine.ts` — verifica al startup si corresponde tomar snapshot programado
- **1.5.8** — Tests: 16 unit (snapshot-service) + 12 component (ComplianceTimeline) + 4 Settings (snapshotFrequencyDays) = 32 tests nuevos

**Archivos modificados:**
- `src/shared/types/compliance.ts` — `SnapshotTrigger`, `ComplianceSnapshot`
- `src/shared/types/storage.ts` — `compliance_snapshots` en StorageSchema + STORAGE_KEYS, `snapshotFrequencyDays` en AppSettings
- `src/background/storage-service.ts` — defaults, `initializeDefaults`, `exportAll`, `importAll`
- `src/background/discovery-engine.ts` — `checkScheduledSnapshot()` en `initializeEngine()`
- `src/options/utils/snapshot-service.ts` — **NUEVO** — core CRUD + scheduled logic
- `src/options/hooks/useSnapshots.ts` — **NUEVO** — hook reactivo para snapshots
- `src/options/components/dashboard/ComplianceTimeline.tsx` — **NUEVO** — timeline con chart SVG
- `src/options/components/dashboard/Dashboard.tsx` — integra ComplianceTimeline
- `src/options/components/reports/Reports.tsx` — auto-snapshot al generar reporte
- `src/options/components/settings/Settings.tsx` — sección Snapshots + frecuencia + reset
- `e2e/fixtures.ts` — `snapshotFrequencyDays`, `compliance_snapshots` en resetExtension
- 9 archivos de tests actualizados con `snapshotFrequencyDays` en mock settings
- `src/options/components/inventory/ToolDetailModal.test.tsx` — agregado `// @vitest-environment jsdom`
- `src/options/utils/snapshot-service.test.ts` — **NUEVO** — 16 tests unit
- `src/options/components/dashboard/ComplianceTimeline.test.tsx` — **NUEVO** — 12 tests component
- `src/options/components/settings/Settings.test.tsx` — 4 tests nuevos

**Decisiones:**
- `snapshotFrequencyDays` default es `0` (deshabilitado) — opt-in del usuario
- Cap de 50 snapshots (los más viejos se eliminan) — para no crecer infinitamente en chrome.storage.local
- `checkAndTakeScheduledSnapshot()` se ejecuta en `initializeEngine()` (background startup)
- Snapshots se incluyen en export/import backup y en Limpiar Todo
- Timeline usa SVG nativo (sin dependencias externas) — compatible con Chrome Extension
- El score delta se calcula entre el snapshot más reciente y el anterior
- Trigger badges: Manual (azul), Reporte (violeta), Programado (gris)

### Detalle Task 1.1 (BREAKING CHANGE — 9 subtasks completas)

**Modelo anterior:**
```ts
complianceStatus: {
  euAiAct: ComplianceChecklist,    // un solo assessment para TODOS los artículos
}
```

**Modelo nuevo:**
```ts
complianceStatus: {
  euAiAct: Record<string, ComplianceChecklist>,  // key = 'art-4', 'art-6', etc.
}
```

**Subtasks completadas:**
- **1.1.1** — `ComplianceStatusMap` en `discovery.ts` ahora usa `Record<string, ComplianceChecklist>` por regulación
- **1.1.2** — `compliance-mapper.ts` itera artículos individuales con `relevantArticles()` + cuenta por artículo
- **1.1.3** — `useMetrics.ts` — `complianceSummary` ahora cuenta checklists por artículo, no por herramienta
- **1.1.4** — `ToolDetailModal.tsx` — tab Compliance muestra cada artículo con su propio dropdown
- **1.1.5** — `report-generator.ts` — usa `mapCompliance()` actualizado (sin cambios directos)
- **1.1.6** — `discovery-engine.ts` + `storage-service.ts` — inicializan TODOS los artículos como `pending` al detectar
- **1.1.7** — Migration en `storage-service.ts` (`initializeWithMigration()`) — detecta formato viejo y convierte automáticamente. Si assessment era `complete` o `not_applicable`, propaga a todos los artículos. Si era `pending`, deja artículos como `pending`.
- **1.1.8** — TODOS los tests actualizados (unit, component, e2e). Helper `createMockComplianceStatus()` en `src/test-utils/mock-helpers.ts`
- **1.1.9** — `risk-calculator.ts` — `markOverdueAssessments()` y `getOverdueDiscoveries()` iteran artículos individualmente. Nueva función `hasOverdueArticle()`.

**Archivos modificados:**
- `src/shared/types/discovery.ts` — `ArticleChecklistMap`, `ComplianceStatusMap`
- `src/shared/constants/regulations.ts` — `createArticleChecklistMap()`
- `src/options/utils/compliance-mapper.ts` — per-article gap generation + metrics
- `src/options/utils/risk-calculator.ts` — `hasOverdueArticle()`, updated `markOverdueAssessments()`, `getOverdueDiscoveries()`
- `src/options/hooks/useMetrics.ts` — per-article counting
- `src/options/components/inventory/ToolDetailModal.tsx` — per-article dropdowns
- `src/background/storage-service.ts` — migration, per-article `createDiscovery()`
- `src/background/discovery-engine.ts` — `initializeWithMigration()`
- `e2e/fixtures.ts` + `e2e/resilience.spec.ts` — per-article E2E data
- Todos los `.test.ts` / `.test.tsx` — `complianceStatus` actualizado
- Nuevo: `src/test-utils/mock-helpers.ts` — shared test helper

**Bug fix:** `overallPercentComplete` en `compliance-mapper.ts` usaba `s.totalTools - s.notApplicable` que mezclaba count de tools con count de articles. Corregido a `s.complete + s.pending + s.overdue`.

### Detalle Task 1.2 (Phases 1-5 completas)

**Phase 1 — Funciones en `src/options/utils/risk-calculator.ts`:**

```ts
// Calcula fecha de vencimiento basada en regulationConfig
calculateDueDate(regulationKey: RegulationType, settings: AppSettings): string | null

// Determina si un checklist está vencido
isChecklistOverdue(checklist: ComplianceChecklist): boolean

// Filtra discoveries con checklists vencidos
getOverdueDiscoveries(discoveries: DiscoveryRecord[], settings: AppSettings): DiscoveryRecord[]

// Marca automáticamente como 'overdue' los checklists vencidos
markOverdueAssessments(discoveries: DiscoveryRecord[], settings: AppSettings): DiscoveryRecord[]
```

**Phase 2 — `createDiscovery()` con auto dueDate:**
- `storage-service.ts`: `createDiscovery()` ahora acepta `settings` como 5to parámetro
- Helper `createChecklistWithDueDate(settings, regKey)` — retorna `'not_applicable'` si regulación deshabilitada
- Nueva herramienta detectada → `dueDate` calculado automáticamente para cada regulación habilitada

**Phase 3 — Re-evaluación on startup:**
- `discovery-engine.ts`: Agregada función `markOverdueOnStartup()`
- Se ejecuta en `initializeEngine()` — marca automáticamente como `'overdue'` los checklists vencidos
- Importa `markOverdueAssessments` desde `@options/utils/risk-calculator`

**Cambios adicionales:**
- `storage-service.ts`: `createDefaultSettings()` ahora tiene `coSb205.enabled: false` (Colorado SB 205 es regulación específica de EE.UU.)
- Tests actualizados para usar `createMockSettings()` con `regulationConfig`

**Phase 4 — UI editable en `ToolDetailModal.tsx`:**
- Tab Compliance ahora tiene `<select>` para cambiar assessment (`pending` / `complete` / `not_applicable`)
- Assessment `overdue` es sistema-managed → muestra badge rojo, NO dropdown
- Al cambiar a `complete`: `lastAssessedDate = now`, recalcula `dueDate` via `calculateDueDate()`
- Al cambiar a `not_applicable`: `lastAssessedDate = now`, `dueDate = null`
- Al cambiar a `pending`: `lastAssessedDate = null`, recalcula `dueDate`
- Regulaciones deshabilitadas no se muestran en el tab
- `Inventory.tsx` ahora pasa `settings` al modal
- `handleSave()` incluye `complianceStatus` actualizado

**Phase 5 — Tests (8 tests nuevos):**
- `ToolDetailModal.test.tsx` — 8 tests cubriendo: dropdown por regulación, cambio a complete/not_applicable/pending con recálculo de fechas, regulaciones deshabilitadas ocultas, badge overdue en vez de dropdown, save con complianceStatus, preservar otros campos

### Detalle Task 1.3 (8 subtasks completas)

**Modelo nuevo en AppSettings:**
```ts
auditModeConfig: {
  auditMode: boolean
  auditModeActivatedAt: string | null
  auditModeActivatedBy: string | null
}
```

**Subtasks completadas:**
- **1.3.1** — `AuditModeConfig` en `storage.ts` + defaults en `storage-service.ts`
- **1.3.2** — `AuditBanner.tsx` — barra amarilla con ícono shield, fecha y usuario de activación
- **1.3.3** — `ToolDetailModal.tsx` — deshabilita risk buttons, status buttons, department select, compliance dropdowns, notes textarea; oculta botón "Guardar cambios"
- **1.3.4** — `Settings.tsx` — deshabilita "Importar Backup" y "Limpiar Todo"; bloquea edición de dominios con `pointer-events-none`
- **1.3.5** — Toggle en Settings con modal de confirmación (lista de restricciones); desactivar es directo sin confirmación
- **1.3.6** — `generateReport()` incluye placeholder cuando audit mode activo
- **1.3.7** — `generateContentHash()` usando Web Crypto API (SHA-256); `generateReportWithHash()` reemplaza placeholder con badge audit + hash
- **1.3.8** — Tests: 4 unit (generateContentHash + generateReportWithHash) + 4 AuditBanner + 4 ToolDetailModal audit mode + 6 Settings audit mode = 18 tests nuevos

**Archivos modificados:**
- `src/shared/types/storage.ts` — `AuditModeConfig`, `AppSettings.auditModeConfig`
- `src/background/storage-service.ts` — defaults en `createDefaultSettings()`
- `src/options/components/layout/AuditBanner.tsx` — **NUEVO**
- `src/options/components/layout/Layout.tsx` — integra `AuditBanner` + `useStorage`
- `src/options/components/inventory/ToolDetailModal.tsx` — audit mode readonly
- `src/options/components/settings/Settings.tsx` — toggle, modal, botones deshabilitados
- `src/options/components/reports/Reports.tsx` — usa `generateReportWithHash`
- `src/options/utils/report-generator.ts` — `generateContentHash()`, `generateAuditBadge()`, `generateReportWithHash()`
- 8 archivos de tests actualizados con `auditModeConfig`
- `src/options/components/layout/AuditBanner.test.tsx` — **NUEVO**

**Decisiones:**
- `generateReport()` sigue siendo sync (sin breaking change); `generateReportWithHash()` es async wrapper
- Export Backup sigue habilitado en audit mode (el auditor puede querer descargar)
- Desactivar audit mode NO requiere confirmación (operación segura)
- El hash se calcula sobre el HTML completo del reporte (incluye el placeholder, luego se reemplaza)

### Detalle Task 1.4 (8 subtasks completas)

**Modelo nuevo en DiscoveryRecord:**
```ts
auditTrail: AuditEntry[]
```

**Subtasks completadas:**
- **1.4.1** — `AuditEntry` type en `discovery.ts` (`id`, `timestamp`, `field`, `oldValue`, `newValue`, `changedBy`)
- **1.4.2** — `auditTrail: AuditEntry[]` agregado a `DiscoveryRecord`
- **1.4.3** — `createAuditEntries(original, updated)` en `audit-trail.ts` — diff automático de status, riskLevel, department, notes, compliance (per-article)
- **1.4.4** — `appendAuditEntries(existing, new)` con `MAX_AUDIT_ENTRIES_PER_TOOL = 100`
- **1.4.5** — Hook `useAuditTrail(auditTrail)` — sorted entries desc by timestamp
- **1.4.6** — `ToolDetailModal.tsx` — 4to tab "Historial" con empty state, entries con badge de campo, oldValue → newValue
- **1.4.7** — `handleSave()` integra diff — genera audit entries por cada campo cambiado y los appendea al trail
- **1.4.8** — `report-generator.ts` — `generateAuditTrailSection()` con tabla por herramienta (top 20 entries), solo si hay trail

**Archivos modificados:**
- `src/shared/types/discovery.ts` — `AuditEntry`, `AuditField`, `auditTrail` en `DiscoveryRecord`
- `src/options/utils/audit-trail.ts` — **NUEVO** — `createAuditEntries()`, `appendAuditEntries()`, `AUDIT_FIELD_LABELS`
- `src/options/hooks/useAuditTrail.ts` — **NUEVO**
- `src/options/components/inventory/ToolDetailModal.tsx` — tab Historial + diff en handleSave
- `src/options/utils/report-generator.ts` — sección audit trail en reporte
- `src/background/storage-service.ts` — `createDiscovery()` incluye `auditTrail: []`
- `e2e/fixtures.ts` — `FullDiscoveryRecord` incluye `auditTrail`
- 10 archivos de tests existentes actualizados con `auditTrail: []`
- `src/options/utils/audit-trail.test.ts` — **NUEVO** — 14 tests unit
- `src/options/components/inventory/ToolDetailModal.test.tsx` — 11 tests nuevos (History Tab + Audit Trail Generation on Save)

**Decisiones:**
- `changedBy` queda `null` — se populatá con Task 1.10 (Admin Profile)
- Compliance diff genera UNA entry por artículo que cambió (no una por regulación)
- Notes truncadas a 80 chars en audit entries para evitar strings enormes
- Cap de 100 entries por herramienta (los más viejos se eliminan)
- La sección de audit trail en el reporte es condicional — solo aparece si hay entries

### Detalle Task 1.10 (9 subtasks completas)

**Modelo nuevo en AppSettings:**
```ts
adminProfile: {
  adminName: string
  adminEmail: string
  adminRole: 'compliance_officer' | 'it_admin' | 'auditor' | 'executive'
  department: string
}
```

**Subtasks completadas:**
- **1.10.1** — `AdminRole`, `AdminProfile` types en `storage.ts` + `adminProfile` en `AppSettings`
- **1.10.2** — `createDefaultSettings()` en `storage-service.ts` con defaults vacíos + `compliance_officer`
- **1.10.3** — `Settings.tsx` — sección "Perfil del Administrador" con 4 campos (nombre, email, rol select, departamento), blur save para texto, onChange para rol
- **1.10.4** — `report-generator.ts` — `generateCover()` muestra nombre + rol entre paréntesis, email, departamento cuando adminProfile está configurado; fallback a `responsiblePerson`
- **1.10.5** — `audit-trail.ts` — `createAuditEntries()` acepta `changedBy: string | null` como tercer parámetro (optional, default null)
- **1.10.6** — `ToolDetailModal.tsx` — `handleSave()` pasa `settings.adminProfile?.adminName` como changedBy
- **1.10.7** — `Settings.tsx` — `handleAuditToggle` usa `adminProfile.adminName` con fallback a `responsiblePerson`
- **1.10.8** — Tests: 9 tests nuevos en Settings (admin profile CRUD + audit activation + clear all), 4 tests nuevos en report-generator (cover con admin info), 3 tests nuevos en audit-trail (changedBy parameter)

**Archivos modificados:**
- `src/shared/types/storage.ts` — `AdminRole`, `AdminProfile`, `AppSettings.adminProfile`
- `src/background/storage-service.ts` — defaults en `createDefaultSettings()`
- `src/options/components/settings/Settings.tsx` — sección Perfil del Administrador + handleAdminBlur + handleAdminRoleChange + handleClearAll con adminProfile
- `src/options/utils/report-generator.ts` — `ADMIN_ROLE_LABELS`, `generateCover()` con admin info condicional
- `src/options/utils/audit-trail.ts` — `changedBy` parameter en `createEntry`, `createAuditEntries` y todos los diff functions
- `src/options/components/inventory/ToolDetailModal.tsx` — pasa adminName como changedBy
- `e2e/fixtures.ts` — `resetExtension()` con adminProfile en settings
- 8 archivos de tests actualizados con `adminProfile` en mock settings
- `src/options/components/settings/Settings.test.tsx` — 9 tests nuevos
- `src/options/utils/report-generator.test.ts` — 4 tests nuevos
- `src/options/utils/audit-trail.test.ts` — 3 tests nuevos

**Decisiones:**
- `responsiblePerson` se mantiene como campo legacy para backward compatibility — el report cover usa adminProfile si está configurado, sino fallback a responsiblePerson
- `AdminRole` es un string literal union type (no enum) para consistencia con el resto del proyecto
- El rol default es `compliance_officer` (el caso más común)
- El adminProfile se puede editar en audit mode (el admin puede querer completar su perfil antes de activar auditoría)

---

## 🔄 En Progreso

---

## 📋 Backlog

### 🔴 FASE 1 — P0 (Critical Compliance Gaps)

*(Todas las tasks P0 completadas)*

---

### 🟠 FASE 2 — P1 (High Impact Audit Trail)

*(Todas las tasks P1 completadas)*

*(Todas las tasks P1 completadas)*

---

### 🟡 FASE 3 — P2 (Admin & Date Intelligence)

| Task | Descripción | Esfuerzo | Dependencias | Estado |
|------|-------------|----------|--------------|--------|
| **1.7** | Próximos Vencimientos (widget con deadlines agrupados por urgencia) | Bajo | Task 1.2 | ✅ Completada |
| **1.8** | Notificaciones por Umbral (alertas configurables, badge dinámico) | Bajo | Task 1.2 | ❌ Pendiente |
| **1.9** | Mapa de Calor Departamento × Riesgo | Medio | Ninguna | ❌ Pendiente |

---

### 🟢 FASE 4 — P3 (Advanced Features)

Ver `plan.md` lines 336-464 para tasks 1.13-1.20.

---

## 📐 Convenciones del Proyecto

| Aspecto | Convención |
|---------|------------|
| Lenguaje | Español rioplatense para comunicación, inglés para código |
| UI Labels | Español |
| TypeScript | Strict mode, no `any`, usar `unknown` + type guards |
| React | Functional components + hooks, no classes |
| Naming | PascalCase componentes, camelCase utils/hooks |
| Path Aliases | `@/`, `@background/`, `@options/`, `@shared/` |
| Architecture | ZERO-CLOUD (todo en `chrome.storage.local`) |
| Tests | Vitest (unit), Playwright (e2e) |

---

## 🔑 Decisiones Arquitectónicas

1. **Task 1.2 reutilizó `regulationConfig[regKey].customDueDateOffsetDays`** — NO se agregó campo nuevo a AppSettings para periodicidad. El offset por regulación ES la periodicidad de re-evaluación.

2. **`risk-calculator.ts` está en `@options/utils/`** pero el background lo importa. Funciona (Vite resuelve aliases) pero es arquitecturalmente cuestionable. Pendiente decisión de mover a `@shared/utils/`.

3. **Task 1.1 es BREAKING CHANGE** — cambiar el modelo de `ComplianceStatusMap` de un checklist por regulación a un checklist por artículo. Requiere migration de datos existentes.

---

## 📁 Archivos Clave

| Archivo | Propósito |
|---------|-----------|
| `plan.md` | Plan maestro con 20 tasks detallados |
| `AGENTS.md` | Guía para agentes AI (comandos, estructura, convenciones) |
| `STATUS.md` | Este archivo — estado actual del proyecto |
| `.atl/skill-registry.md` | Registry de skills disponibles |

---

## 🚀 Próximos Pasos Recomendados

1. **FASE 3 — P2**: Tasks 1.7 (Vencimientos), 1.8 (Notificaciones), 1.9 (Mapa de Calor)

---

## 📝 Notas para Handoff

Si vas a otra sesión, decile:

> "Leé `STATUS.md` y `plan.md`. FASE 1 P0 COMPLETA (1.6, 1.2, 1.1, 1.3). FASE 2 P1 COMPLETA (1.4, 1.10, 1.11, 1.5). FASE 3 P2: 1.12 COMPLETA. 312 component + 12 E2E tests pasando. Próximo recomendado: Task 1.7 (Vencimientos). Hay contexto guardado en Engram."
