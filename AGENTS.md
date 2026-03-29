# Lupar — Agent Guide

## Project Overview

Chrome Extension (Manifest V3) that detects Shadow AI usage in the browser and generates compliance reports for EU AI Act, ISO 42001, and Colorado SB 205.

**Core Principles**: ZERO-CLOUD (no backend, no cloud, no external APIs), PRIVACY-FIRST (all data stays in `chrome.storage.local`), COMPLIANCE-BY-DESIGN.

**Language**: Spanish for all UI labels, constants, and docs. English for code identifiers.

## Commands

```bash
pnpm dev              # Vite dev server with HMR
pnpm build            # TypeScript check + Vite production build → dist/
pnpm test:unit        # Vitest unit tests
pnpm test:components  # Vitest + jsdom + React Testing Library
pnpm test:e2e         # Playwright E2E tests (requires build first)
pnpm test:all         # Full test suite (unit + E2E)
node scripts/generate-icons.js  # Regenerate extension icons from scripts/icon-source.svg
```

**Windows note**: E2E tests require `set "EXTENSION_PATH=./dist" && pnpm test:e2e`.

## Project Structure

```
src/
├── background/              # Service Worker (runs in background)
│   ├── index.ts             # Entry point — listeners for webNavigation + onInstalled
│   ├── discovery-engine.ts  # Core detection pipeline (handleNavigation, updateBadge)
│   ├── domain-registry.ts   # 113 AI domains across 10 categories
│   └── storage-service.ts   # CRUD for discoveries, settings, activity log
├── options/                 # Options Page (React SPA)
│   ├── App.tsx              # State-based routing (dashboard/inventory/reports/settings)
│   ├── main.tsx             # React entry point
│   ├── components/
│   │   ├── dashboard/       # MetricCard, RiskScoreGauge, ComplianceStatus, RecentActivity
│   │   ├── inventory/       # InventoryTable, ToolRow, ToolDetailModal, FilterBar
│   │   ├── reports/         # Reports (generate/download HTML report)
│   │   ├── settings/        # Settings (org config, domains, backup)
│   │   └── layout/          # Layout, Sidebar, Header
│   ├── hooks/               # useStorage, useMetrics, useInventory
│   └── utils/               # risk-calculator, report-generator, compliance-mapper
├── shared/                  # Shared types and constants
│   ├── types/               # domain.ts, discovery.ts, storage.ts, compliance.ts
│   └── constants/           # categories.ts, risk-levels.ts, regulations.ts
└── assets/                  # Extension icons (16/32/48/128 px)

e2e/                         # Playwright E2E tests
├── fixtures.ts              # Custom fixtures: extensionContext, extensionId, serviceWorker, page
├── detection.spec.ts        # Tests 11.2–11.4, 11.8–11.9
├── options.spec.ts          # Tests 11.5–11.7
├── resilience.spec.ts       # Tests 11.10–11.11
└── compliance.spec.ts       # Tests 11.12–11.13 (static analysis)
```

## Architecture

**Data Flow**: Employee browses → `webNavigation.onCompleted` fires → `handleNavigation()` checks domain registry → creates/updates `DiscoveryRecord` in storage → badge updates.

**Options Page**: React SPA with 4 views (Dashboard, Inventario, Reportes, Configuración). Uses `chrome.storage.local` directly via custom hooks. No state management library.

**Storage Keys**: `ai_discoveries` (FullDiscoveryRecord[]), `app_settings` (AppSettings), `activity_log` (ActivityLogEntry[]).

## Code Conventions

- TypeScript strict mode (`strict: true`) — no `any`, use `unknown` with type guards
- No code comments unless explicitly requested
- React functional components with hooks (no class components)
- PascalCase for components, camelCase for utilities/hooks
- Path aliases: `@background/`, `@options/`, `@shared/`
- ESM (`"type": "module"`) — use `import.meta.url` + `fileURLToPath`, NOT `__dirname`

## Key Technical Details

- **Discovery engine throttle**: 5 seconds per domain (`THROTTLE_MS = 5000`)
- **Badge**: Always red (`#ef4444`), shows count of `status === 'detected'` only
- **Report**: Self-contained HTML file, filename `ai-compliance-report-YYYY-MM-DD.html`
- **Status values**: `detected`, `confirmed`, `dismissed`, `authorized` (lowercase)
- **Risk levels**: `prohibited`, `high`, `limited`, `minimal`
- **Assessment values**: `pending`, `complete`, `not_applicable`, `overdue`

## E2E Testing Notes

- Uses `launchPersistentContext` with `--load-extension` + `--disable-extensions-except`
- Must run `headless: false` (Chrome doesn't load extensions in headless)
- `page` fixture is overridden to come from `extensionContext`, NOT default browser
- Options page opened via `extensionContext.newPage()` (separate from navigation page)
- `chrome.runtime.reload()` kills the extension entirely in this context — avoid in tests
- `compliance.spec.ts` tests are static analysis (no browser needed)
- Suite: 12 tests, ~40 seconds total
