# Working on Flex Reports

Instructions changing this repo. Follow them before writing code; if a request conflicts with them, ask first.

## Code style

- **DRY** — no copy-paste logic; factor shared behavior into helpers/services.
- **KISS** — simplest thing that works; no speculative abstraction or over-engineering.
- **Clean & readable** — clear intent over cleverness.
- **Well-named** variables and functions; names describe what/why.
- **Short functions and files** — each does one thing; split when they grow.
- **Helpers and services** for reusable logic; keep components/controllers thin.
- **MVC mindset** models = domain/data, controllers = orchestration,
  views = presentation.
- **Use a package for standard tasks** — when logic is outside what this product does
  (parsing or validating JSON, accessible comboboxes, drag and drop, virtual scrolling)
  and a secure, reliable, simple package exists, use it instead of writing our own. Pick
  one that's well maintained, widely used, and from a known publisher (for example
  `jsonc-parser` from Microsoft). Pin its exact version.

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
- Don't run e2e locally by default; CI is the gate. Run it locally when debugging a
  failing e2e test or changing what the e2e tests drive.

## UI

- One stylesheet per component. Clean, uncluttered look.
- Edit view resembles a spreadsheet (Excel-like). Saved view resembles a polished web page.
- Prefer small, shareable/reusable UI components whenever possible.

## Process

- Work on branches; open PRs; never push to `main` without review.
- Docs by reader: `README.md` for setup and integrating the component,
  `FUNCTIONALITY.md` for people using reports, `AGENTS.md` for working on the code. Update
  the README only for setup, integration, or architecture changes.
- **Stop and ask** whenever any question or clarification comes up, at any point in
  the work. Don't guess or pick a default on the user's behalf.
- Use latest Node / React / Vite (and keep deps permissively licensed).
- When PR feedback reveals coding-style preferences, record them here before continuing.
- Every PR with UI changes includes localhost preview steps in its description: the run
  command (`npm run dev`) and the URL (`http://localhost:6060`).
- Merge only when the practices, lint, test, build, and e2e CI checks are green. Skipping
  local checks while iterating is fine.

## Data sources

- Flex Reports never owns data. The host passes `schema`, `rows`, `reportDefinition`,
  `role`, and `onSave` as props (see README → "Add it to your app").
- **Generic first:** code must work with any row shape the host sends. Column names,
  keys, and types come from the data itself. Never hardcode domain keys, labels, or
  formulas (hours, rate, client, etc.) in the package or the app; only tests may describe
  a report on the sample data.
- **Package vs app:** the package is the `ReportBuilderApp` component. The app
  (`src/App.tsx` and `src/app/`) is the browser app around it: it loads records from an
  endpoint and saves reports in the browser. The package never knows about sample data,
  endpoints, or browser storage, and never imports from `src/app/`.
- The sample data is `public/sample-data.json`, served next to the app like any other
  endpoint. Tests read the same file (`src/test/sampleReport.ts`). It must never leak
  hardcoded customer values into code.
- The app on localhost must always stay runnable on the sample endpoint for debugging and
  repro workflows, independent of host-app integrations.
- The package never writes to the browser: the definition goes out through `onSave`, and
  the host persists it and enforces permissions. Only the app uses `localStorage`.

## Toolchain

- Node >=22 required (declared in `engines.node`). Run `nvm use` (reads
  `.nvmrc`) before `npm run test` / `lint` / `build`.

## Checked in CI

`npm run check:practices` runs on every PR and push:

- UI components in `src/components/`, `src/features/reportBuilder/components/`,
  `src/features/reportBuilder/sections/`, and `src/shared/components/` each have a sibling
  `<Component>.css` and `<Component>.test.tsx`, and stay at or under 220 lines.
- `src/features/reportBuilder/ReportBuilderApp.tsx` stays at or under 1,000 lines.
- No source file (tests excluded) repeats a block of 20 consecutive non-empty lines.
- Every CSS class is prefixed `fr-`, so it can't clash with a host page. (Element IDs
  are prefixed per builder by `useElementId`; that isn't checked.)
