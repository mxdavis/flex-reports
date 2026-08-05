# Software Development Practices

> **This file is yours.** Edit it anytime to change how I work. I read it before writing
> code and follow it. If anything here conflicts with a request, I'll ask.

## Code style

- **DRY** — no copy-paste logic; factor shared behavior into helpers/services.
- **KISS** — simplest thing that works; no speculative abstraction or over-engineering.
- **Clean & readable** — clear intent over cleverness.
- **Well-named** variables and functions; names describe what/why.
- **Short functions and files** — each does one thing; split when they grow.
- **Helpers and services** for reusable logic; keep components/controllers thin.
- **MVC mindset** (Rails-style): models = domain/data, controllers = orchestration,
  views = presentation.

## Comments

- Only comment when it adds real value (the "why", not the "what").
- No convoluted or redundant comments.

## Error handling

- **Silence is bad.** Never swallow errors or failures without a trace.
- Always log a clear, actionable error when something goes wrong (what failed,
  where, and why), even when we recover with a fallback value.
- Prefer surfacing errors to the user where they can act on them (e.g. invalid
  formula in the authoring UI) over silently returning a default.
- Crash-safe is not the same as silent: stay non-throwing at runtime, but make
  the failure visible.

## Tests

- Write tests for engine/logic (formulas, pivot, services).
- Prefer small, focused unit tests with clear names.
- Default workflow: do not run local e2e routinely; rely on CI e2e as the
  enforcement gate. Run local e2e only when actively debugging a failing e2e
  scenario.

## UI

- One stylesheet per component. Clean, uncluttered look.
- Edit view resembles a spreadsheet (Excel-like). Saved view resembles a polished web page.
- Prefer small, shareable/reusable UI components whenever possible.

## Process

- Work on branches; open PRs; never push to `main` without review.
- Stop and ask when unsure rather than guessing.
- Use latest Node / React / Vite (and keep deps permissively licensed).
- When PR feedback reveals coding-style preferences, record them in this file
    before continuing so future work follows the updated style.
- `docs/TODO.md` is the source of truth for status/progress.
    Keep it current as tasks move through `todo` -> `wip` -> `in-pr` -> `in-main`.
- Every PR that includes frontend/UI changes must include localhost preview
    instructions in the PR description:
    - run command (for example `npm run dev`)
    - local URL (for example `http://localhost:5173`)
- Merge rule: lint + test + build CI checks must be green before merging.
- skip local lint/test/practices checks while iterating on functionality until MVP behavior is approved.

## Data sources

- Flex Reports never owns data. Access it through a `DataSource` seam
  (`src/services/adapters/`), selected by a factory + `VITE_DATA_SOURCE` env toggle.
- Seed data is just mock data that mimics a host app plugging in rows, so we can
  build and test the flow. It must never leak hardcoded customer values into code.
- Seed/test mode must always stay runnable for debugging and repro workflows,
  independent of host-app integrations, so local development can validate report behavior quickly.
- Local browser storage (`localStorage`) is prototype-only for report definition drafts;
  production persistence must be host-app backed (for example DB/service API),
  shared across users, and auditable.

## Toolchain

- Node >=22 required (declared in `engines.node`). Run `nvm use` (reads
  `.nvmrc`) before `npm run test` / `lint` / `build`.

## Add your own rules below

<!-- e.g. "prefer named exports", "no default exports", "max 200 lines per file" -->

## CI-enforced subset

- `npm run check:practices` runs in CI on every PR/push.
- UI component files in `src/components/`, `src/features/reportBuilder/components/`, `src/features/reportBuilder/sections/`, and `src/shared/components/` must have matching sibling files:
  - `<Component>.css`
  - `<Component>.test.tsx`
- UI component `.tsx` files (excluding tests) must stay at or below 220 lines.
- `src/features/reportBuilder/ReportBuilderApp.tsx` must stay at or below 1000 lines until further split milestones lower the cap.
- Source files in `src/**/*.ts` and `src/**/*.tsx` (excluding `*.test.ts` and `*.test.tsx`) must not contain duplicated normalized blocks of 20 consecutive non-empty lines.
