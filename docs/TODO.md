# TODO — live tracker

Temporary working tracker. Legend:
- `[ ]` not started · `[~]` in progress · `[x]` done
- **Status** column: `todo` · `wip` · `in-pr` · `in-main`

Keep this current: what's being worked on, what's in a PR, what's merged to `main`.

## Now / in flight

| Task | Branch | Status |
| --- | --- | --- |
| Foundational docs (README, SPEC, DECISIONS, PRACTICES, TODO) | `docs/project-foundations` | wip |

## Backlog (POC)

- [ ] **Scaffold** — Vite + React + TS + Vitest, folder structure, ESLint/Prettier
- [ ] **Formula engine** — tokenize, `{{ref}}` resolve, `%` handling, dependency graph, evaluate (+ tests)
- [ ] **Pivot engine** — group + aggregate (sum/avg/count/min/max) (+ tests)
- [ ] **Data adapter** — `dataSource` interface + `mockRestAdapter` (Timeslips-shaped sample data)
- [ ] **Persistence** — `reportStore` (localStorage)
- [ ] **Edit view** — Excel-like column builder + formula bar + live preview
- [ ] **Report view** — filters + pivot table + Nivo chart
- [ ] **CSV export**
- [ ] **License seam** — non-enforcing `licenseKey` config
- [ ] **Demo seed** — a ready-made sample report on first load

## Done / merged to main

_(nothing yet)_
