# Flex Reports — Specification

## 1. Goal

Give non-technical users a self-serve way to build custom reports over data that lives in
a host application (first target: a billing app replacing Sage Timeslips). Users work in a
familiar spreadsheet-style editor, then save a clean pivot + chart "report view" they can
filter. The tool is sold as a self-hosted, one-time-fee package with optional support.

Secondary goal: the engine is reusable enough to become a standalone product later
(free/paid tiers), so it is kept decoupled from any single host app.

## 2. Core principles

- **Reporting-only.** Flex Reports never owns the data. It connects to a host schema and
  fetches rows at report-run time. It persists only **report definitions** (JSON).
- **No hosted service.** No phone-home, no license server. Whoever installs it hosts it.
  A self-hosted install keeps working forever with no recurring cost.
- **Permissive dependencies only.** Every third-party dependency must be MIT/Apache/BSD so
  the product can be redistributed commercially and run forever. Our own code is proprietary.

## 3. Architecture

Four layers, kept small and testable.

### 3.1 Data-source adapter (pluggable)
A small interface the host implements once:
- `getSchema()` → entities/fields with types (drives `{{data.attribute}}` autocomplete).
- `fetchRows(query)` → array of row objects.

REST, GraphQL, and SQL are all just adapters. Direct DB/SQL adapters must run server-side
(never ship DB credentials to the browser); REST/GraphQL adapters may run in the browser
with an auth token.

### 3.2 Report definition (the only persisted artifact, JSON)
- source dataset
- `columns[]` — each is either a **field** ref or a **formula**
- `pivot` — row dimensions, column dimensions, measures (+ aggregator)
- `filters[]` — e.g. date range, person in [...]
- `chart` — type + axes/series

### 3.3 Formula layer (headless)
- Refs: `{{data.attr}}` (source field) and `{{colId}}` (another column).
- Operators: `+  -  /  *  %  ( )`. `%` means **percent-of** (÷100), not modulo.
- **Column-defined, row-evaluated:** one formula per column, computed for every row.
- Column dependency graph → topological order → cycle detection.
- Evaluated with a tiny safe expression evaluator (no `eval`).

### 3.4 Pivot / aggregation engine (headless)
- Group rows by dimensions; aggregate measures (sum/avg/count/min/max).
- Pure functions, unit-tested against known pivots.

## 4. UI

- **Edit view** — looks like Excel. Columns A/B/C…, click a column header to bind it to a
  schema field or enter a formula (`={{col C}}*40%`), with autocomplete. Values fill down
  automatically. Live preview from a sample fetch.
- **Report (saved) view** — looks like a clean web page: filters (date range, multi-select),
  a pivot table, and a chart (Nivo). Export to CSV / print.

Each component has its own stylesheet. Edit view = spreadsheet aesthetic; saved view =
polished web page.

## 5. Distribution & integration

- Shipped as an **npm package** the host app imports (`<ReportBuilder adapter={...} />`).
- The host implements the adapter + provides two small endpoints to save/load definition
  JSON. Nothing about the package changes per customer — only the adapter does.
- Standalone repo now; integrate with the billing app later.

## 6. Licensing (seam now, enforcement later)

- A `licenseKey` config exists from day one but is **non-enforcing** (no-op / console warning).
- Future model: **signed offline keys** verified locally with an embedded public key — works
  offline forever. "Free-for-life" = a perpetual signed key. No metering, no hosting.
- Deferred: payments, key-issuing tool, seat enforcement.

## 7. POC scope

Included:
- Mock REST adapter with Timeslips-shaped sample data (demo needs no backend).
- Edit view: define field/formula columns with live preview.
- Formula engine: `+ - / * % ( )`, `{{refs}}`, per-row, cycle detection.
- Report view: dimensions/measures, filters, one Nivo chart + pivot table.
- Persistence to localStorage (same seam as a future save/load API).
- CSV export.
- Tests for the formula and pivot engines.
- `licenseKey` no-op seam.

Deferred (not in POC): real billing adapter, auth, backend persistence, payments/license
issuer, PDF export, per-cell formula overrides, full Excel function library, real-time collab.

## 8. Tech stack

- Node (latest via nvm), Vite + React (latest) + TypeScript
- Vitest for tests
- Nivo for charts (swappable)
- Per-component CSS stylesheets

## 9. Project structure (MVC-flavored)

```
src/
  models/        # domain types + pure logic (like Rails models)
  services/      # engine + IO
    formula/     # tokenize, dependencyGraph, evaluate, formulaService
    pivot/       # aggregate, pivotService
    adapters/    # dataSource interface + mockRestAdapter
    persistence/ # reportStore (localStorage for POC)
    export/      # csv
    license/     # licenseKey (no-op)
  controllers/   # hooks orchestrating model <-> view
  views/         # React components (EditView, ReportView, shared)
```
