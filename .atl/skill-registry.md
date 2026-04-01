# Skill Registry — Lupar

**Generated**: 2026-03-30
**Mode**: engram

---

## Project Conventions

| File | Type | Description |
|------|------|-------------|
| `AGENTS.md` | Agent Guide | Project overview, commands, architecture, conventions, E2E testing notes |

---

## Project Skills

| Skill | Trigger | Location |
|-------|---------|----------|
| `doc-feature` | Generar documentación de features de Lupar | `.opencode/skills/doc-feature/` |
| `doc-guide` | Generar guías paso a paso para Lupar | `.opencode/skills/doc-guide/` |
| `doc-regulation` | Generar resúmenes de regulaciones de IA | `.opencode/skills/doc-regulation/` |
| `doc-security` | Generar documentación de seguridad y trust | `.opencode/skills/doc-security/` |

---

## User Skills

| Skill | Trigger | Location |
|-------|---------|----------|
| `agent-browser` | Browser automation, navigate pages, fill forms, take screenshots | `~/.config/opencode/skills/agent-browser/` |
| `branch-pr` | Create pull request, prepare changes for review | `~/.config/opencode/skills/branch-pr/` |
| `find-skills` | How do I do X, find a skill for X, is there a skill | `~/.config/opencode/skills/find-skills/` |
| `frontend-design` | Build web components, pages, landing pages, dashboards | `~/.config/opencode/skills/frontend-design/` |
| `go-testing` | Write Go tests, teatest, Bubbletea TUI testing | `~/.config/opencode/skills/go-testing/` |
| `issue-creation` | Create GitHub issue, report bug, request feature | `~/.config/opencode/skills/issue-creation/` |
| `judgment-day` | Judgment day, dual review, adversarial review | `~/.config/opencode/skills/judgment-day/` |
| `playwright-best-practices` | Write Playwright tests, fix flaky tests, POM, CI/CD | `~/.config/opencode/skills/playwright-best-practices/` |
| `playwright-cli` | Automate browser interactions, test web pages | `~/.config/opencode/skills/playwright-cli/` |
| `skill-creator` | Create new skill, add agent instructions | `~/.config/opencode/skills/skill-creator/` |
| `supabase-postgres-best-practices` | Optimize Postgres queries, schema design | `~/.config/opencode/skills/supabase-postgres-best-practices/` |
| `typescript-advanced-types` | Complex type logic, generics, conditional types | `~/.config/opencode/skills/typescript-advanced-types/` |
| `vercel-react-best-practices` | React/Next.js performance optimization | `~/.config/opencode/skills/vercel-react-best-practices/` |
| `vite` | Vite config, plugins, SSR, Rolldown migration | `~/.config/opencode/skills/vite/` |

---

## SDD Skills (Auto-loaded by orchestrator)

| Skill | Phase | Description |
|-------|-------|-------------|
| `sdd-init` | Init | Bootstrap SDD context in project |
| `sdd-explore` | Explore | Investigate ideas before committing to change |
| `sdd-propose` | Propose | Create change proposal with intent/scope |
| `sdd-spec` | Spec | Write specifications with requirements/scenarios |
| `sdd-design` | Design | Create technical design document |
| `sdd-tasks` | Tasks | Break down change into implementation tasks |
| `sdd-apply` | Apply | Implement tasks from change |
| `sdd-verify` | Verify | Validate implementation against specs |
| `sdd-archive` | Archive | Sync deltas and archive completed change |

---

## Recommended Skills for Lupar Stack

Based on detected stack (React, TypeScript, Vite, Chrome Extension, Playwright):

1. **`vercel-react-best-practices`** — React performance patterns
2. **`typescript-advanced-types`** — Complex type logic for compliance domain
3. **`playwright-best-practices`** — E2E testing for Chrome Extension
4. **`vite`** — Build configuration and optimization
5. **`frontend-design`** — UI components and dashboard design
