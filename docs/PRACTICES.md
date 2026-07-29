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

## Add your own rules below

<!-- e.g. "prefer named exports", "no default exports", "max 200 lines per file" -->
