# Flex Reports — Specification

## 1. Goal

Give non-technical users a self-serve way to build custom reports over data that lives in
a host application (first target: a billing app replacing Sage Timeslips). Users work in a
familiar spreadsheet-style editor, then save a clean table "report view" they can
filter and group. The tool is sold as a self-hosted, one-time-fee package with optional support.

Secondary goal: the engine is reusable enough to become a standalone product later
(free/paid tiers), so it is kept decoupled from any single host app and works with any
data shape.

## 2. Core principles

- **Reporting-only.** Flex Reports never owns the data. The host passes its schema and
  rows in at run time. Its only output is the **report definition** (JSON), which the host
  persists.
- **No hosted service.** No phone-home, no license server. Whoever installs it hosts it.
  A self-hosted install keeps working forever with no recurring cost.
- **Permissive dependencies only.** Every third-party dependency must be MIT/Apache/BSD so
  the product can be redistributed commercially and run forever. Our own code is proprietary.

## 3. Architecture

Four layers, kept small and testable.

### 3.1 Host data (props)
The host passes plain data to the component. Flex Reports does no fetching:
- `schema` → columns with types (drives `{{field}}` autocomplete and default formatting).
  Optional; inferred from the first row when omitted (with a console warning).
- `rows` → array of `{ id, ...anything }`. Any shape works; nothing is domain-specific.
- **Sandbox mode:** with the `sandbox` prop, the builder loads mock seed data so local
  development and repro never depend on a host. Without it, `rows` being undefined means
  the host is still loading, and the builder shows "Loading report…".

### 3.2 Report definition (the only persisted artifact, JSON)
One versioned object, passed in as `reportDefinition` and returned through `onSave`:
- `version`, `sheetName`, `currencySymbol` (one for the whole report)
- `fields[]` — each column points at a schema key **or** a formula label, with a display
  label, display type, and aggregation (how it totals in chips, group totals, and the
  grand total)
- `formulas[]` — `{ label, expression }`
- `view` — the saved default view: `orientation`, `showTotals`, `isGroupingEnabled`,
  `expandedLevels` (outline level; `null` = fully expanded)

Invalid or partial definitions are repaired to schema-driven defaults with a console
error. See README → "Report definition".

### 3.3 Formula layer (headless)
- Refs: `{{field}}` (source field) and `{{%Formula Label}}` (another formula).
- Operators: `+  -  /  *  %  ( )`. `%` means **percent-of** (÷100), not modulo.
- **Column-defined, row-evaluated:** one formula per column, computed for every row.
- Dependency resolution with cycle detection (cycles evaluate to NaN).
- Evaluated with a tiny safe expression evaluator (no `eval`).

### 3.4 Aggregation / grouping (headless)
- Aggregates: sum, average, count, distinct count, or none, set **per column**, so a rate
  can average while hours sum.
- Grouping uses the leading text columns up to the first number column: the last of them
  names each row, the ones before it nest as groups, and number columns are values.
  With no number columns, the last column names each row.
- The grouped table is a flat list of tree rows (group rows carrying their totals, then
  indented detail rows), so it can be windowed. Groups sort by underlying values.
- Groups collapse to their group row. The outline level ("Person / Person › Client /
  All rows") is saved; groups toggled by hand are session-only.
- Only the rows in the table's scroll box are drawn (fixed-height row windowing).
- Pure functions, unit-tested.

## 4. UI

- **View mode** — a clean table with summary chips, a totals toggle, grouping with
  collapsible groups and an outline level,
  horizontal/vertical orientation, and fullscreen. Table-only; no chart.
- **Edit mode** — report settings (sheet name, currency), column mapping (add, remove,
  reorder, relabel, display type), and formula authoring with `{{` autocomplete.
  Values fill down automatically from the live rows.
- **Save** — explicit "Save report" button for editors, disabled until something changes,
  plus the browser's leave-page warning while changes are unsaved. No autosave.
- **Roles** — `editor` can save; `viewer` can explore everything (including edit mode)
  but never saves, and a refresh resets them to the saved default view.

Each component has its own stylesheet. Edit view = spreadsheet aesthetic; saved view =
polished web page.

## 5. Distribution & integration

- The host renders `<ReportBuilderApp schema rows reportDefinition role onSave />`.
- The host stores the definition JSON however it likes (DB, service API) and **enforces
  permissions inside `onSave`**. The `role` prop only controls the UI.
- Nothing about the package changes per customer; only the props do.
- Packaging as an npm library is not set up yet (see TODO).

## 6. Licensing (seam now, enforcement later)

- A `licenseKey` config is planned as **non-enforcing** (no-op / console warning).
- Future model: **signed offline keys** verified locally with an embedded public key; works
  offline forever. "Free-for-life" = a perpetual signed key. No metering, no hosting.
- Deferred: payments, key-issuing tool, seat enforcement.

## 7. POC scope

Included:
- Sandbox mode on seed data (demo needs no backend).
- Host mode via props: schema, rows, report definition, role, onSave.
- Edit mode: field/formula columns with live preview.
- Formula engine: `+ - / * % ( )`, `{{refs}}`, per-row, cycle detection.
- View mode: aggregates, grouping with group totals, orientation toggle, filters (todo).
- Explicit save; localStorage only in sandbox mode.
- CSV export (todo).
- Tests for formula, aggregation, definition, and UI behavior.
- `licenseKey` no-op seam (todo).

Deferred (not in POC): auth, payments/license issuer, PDF export, charts, per-cell
formula overrides, full Excel function library, real-time collab, sandbox playground
(paste JSON data and switch roles).

## 8. Tech stack

- Node (latest via nvm), Vite + React (latest) + TypeScript
- Vitest + Testing Library for unit tests, Playwright for e2e
- oxlint
- Per-component CSS stylesheets; every class and element ID is prefixed `fr-` so the
  builder can't clash with a host page (enforced by `npm run check:practices`)

## 9. Project structure

```
src/
  features/reportBuilder/
    ReportBuilderApp.tsx  # public component (props API)
    types.ts              # ReportBuilderAppProps, ReportRole
    report/               # ReportBuilderProvider + useReportBuilder (context), core hook,
                          # per-section props hooks (model/use*Props), state, save, computed values
    components/           # toolbar, settings, mapping, formulas, table section
    sections/             # table bodies (horizontal/grouped, vertical)
    state/                # UI reducer
  services/
    adapters/             # row/schema types + sandbox data access
    formula/              # safe expression evaluator
    reportDefinition/     # definition types, defaults/normalization, sandbox storage
  seeds/                  # sandbox-only mock data
  shared/                 # reusable components + icons
  components/             # shared editors (column, formula, card)
  utils/                  # formatting + formula helpers
```

Builder state is shared through React context: `ReportBuilderProvider` runs
`useReportBuilderCore` once (state and derived data), and each section's props hook
(`model/use*Props`) reads what it needs with `useReportBuilder()` and holds that
section's actions. Section components stay presentational (props in), so they're tested
without the provider. UI state lives in one reducer (`state/uiState.ts`): plain values go
through `set`/`toggle`, and named actions cover changes that update several fields at once.
