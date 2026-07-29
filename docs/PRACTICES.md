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

## Tests

- Write tests for engine/logic (formulas, pivot, services).
- Prefer small, focused unit tests with clear names.

## UI

- One stylesheet per component. Clean, uncluttered look.
- Edit view resembles a spreadsheet (Excel-like). Saved view resembles a polished web page.

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

## Data sources

- Flex Reports never owns data. Access it through a `DataSource` seam
  (`src/services/adapters/`), selected by a factory + `VITE_DATA_SOURCE` env toggle.
- Seed data is just mock data that mimics a host app plugging in rows, so we can
  build and test the flow. It must never leak hardcoded customer values into code.

## Toolchain

- Node >=22 required (declared in `engines.node`). Run `nvm use` (reads
  `.nvmrc`) before `npm run test` / `lint` / `build`.

## Add your own rules below

<!-- e.g. "prefer named exports", "no default exports", "max 200 lines per file" -->
