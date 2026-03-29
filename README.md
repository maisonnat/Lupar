# Lupar

[![CI](https://github.com/maisonnat/Lupar/actions/workflows/test.yml/badge.svg)](https://github.com/maisonnat/Lupar/actions/workflows/test.yml)

Chrome Extension (Manifest V3) that detects **Shadow AI** usage in the browser and generates compliance reports for **EU AI Act**, **ISO 42001**, and **Colorado SB 205**.

## Features

- **Shadow AI Detection** — Monitors browsing activity against 113+ AI domains across 10 categories
- **Risk Assessment** — Automatic classification (prohibited / high / limited / minimal) per EU AI Act
- **Compliance Reports** — Self-contained HTML reports for auditors
- **Zero-Cloud Architecture** — No backend, no external APIs. All data stays in `chrome.storage.local`
- **Multi-Regulation** — EU AI Act, ISO 42001, Colorado SB 205 mapping

## Install

```bash
pnpm install
pnpm dev          # Dev server with HMR
pnpm build        # Production build → dist/
```

Load `dist/` as an unpacked extension in `chrome://extensions` (developer mode).

## Test

```bash
pnpm test:unit        # Vitest unit tests
pnpm test:components  # Vitest + jsdom + React Testing Library
pnpm test:e2e         # Playwright E2E (requires build first, local only)
pnpm test:all         # Full suite
```

## Stack

| Layer | Tech |
|-------|------|
| Extension | Chrome Manifest V3 |
| UI | React 19 + TypeScript |
| Build | Vite + @crxjs/vite-plugin |
| Style | Tailwind CSS v4 |
| Tests | Vitest, React Testing Library, Playwright |
| Package Manager | pnpm |

## License

MIT
