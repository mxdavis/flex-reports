# TODO — live tracker

Update this file as work moves from idea -> branch -> PR -> main.

Legend:
- `[ ]` not started
- `[~]` in progress
- `[x]` done

Status tags used in each item:
- `(todo)`
- `(wip)`
- `(in-pr)`
- `(in-main)`

## Success definition

- [ ] (todo) Project success milestone: recreate the exact reference spreadsheet in this app using seed-data attributes and UI mappings/formulas, with no hardcoded customer values in code.

## Current status

- [x] (in-main) Foundational docs merged to main
  - PR: docs/project foundations
- [x] (in-main) Plain scaffold merged to main
  - PR: #1 chore: plain scaffold
- [x] (in-main) Seed DataSource + UI column mapping + formula preview (combined)
  - PR: #3 (base `main`). Former PR #2 closed and folded in.
  - Includes: DataSource factory + `VITE_DATA_SOURCE` toggle, no-eval formula parser, `engines.node` >=22

## POC task list

- [x] (in-main) Scaffold app: latest Vite + React + TypeScript
- [x] (in-main) Add Vitest setup and seed-backed tests
- [x] (in-main) Build data adapter + mock billing seed dataset
- [x] (in-main) Build seed preview page in app (stats, formulas, sample rows)
- [x] (in-main) Address PR #2 review: DataSource factory + `VITE_DATA_SOURCE` env toggle, no-eval formula parser, `engines.node` >=22
- [x] (in-main) Follow-up (PR #3 review): replace hardcoded `semanticFields`/default mapping in `App.tsx` with a schema-driven, saved report definition (JSON) sourced from `getSchema()`
- [x] (in-main) Follow-up (PR #3 review): replace hardcoded data summary cards/labels with dynamic, schema-driven cards at the top of the report; labels come from configured fields and aggregation is type-based (string/date -> counts, numeric/decimal/percent -> numeric totals, currency -> currency totals).
- [x] (in-main) Follow-up (PR #3 review): move formula application out of the seed data source into the report/formula layer (adapter returns raw rows only)
- [x] (in-main) Follow-up (PR #3 review): replace bespoke `getTotalRevenue` with the pivot/aggregation engine
- [x] (in-main) Build report definition store (localStorage)
- [x] (in-main) Build Edit view (Excel-like)
- [x] (in-main) Permission model decision: allow editing in UI; enforce authorization in backend persistence service on save.
  - PR #10: implemented as the `role` prop (`editor` | `viewer`); viewers explore but never save.
- [x] (in-main) Build Report view shell baseline (clean page structure + table; filtering tracked in dedicated filter TODOs below)
- [x] (in-main) Scope decision: report view is spreadsheet/table-only (no chart visualization).
- [x] (in-main) Add orientation toggle for report display: horizontal (rows) vs vertical (pivoted columns), including people-as-columns use case.
- [x] (in-main) Make sheet name editable at the top of edit mode, and use that name as the chart/table section heading instead of hardcoded "Sample rows".
- [x] (in-pr) PR #10: embedded subcolumn pivot layout (Excel-like): leading columns nest left-to-right as grouping levels (no duplicated parent values), with aggregates/totals at every subgroup, group, and grand-total level. Groups sort by underlying values.
- [x] (in-pr) PR #10: grouping toggle, count + distinct-count aggregates, fullscreen table mode
- [x] (in-pr) PR #10: grouping stops at the first number column (numbers stay values), with a Tip in Column Mapping
- [x] (in-pr) PR #10: total row for every group (including single-row groups); per-column aggregation drives chips, group totals, and grand total; Totals on/off toggle replaces the aggregate dropdown
- [x] (in-pr) PR #10: collapsible groups + saved outline level (`view.expandedLevels`); hand-toggled groups are session-only
- [ ] (todo) PDF/XLSX export reflects collapsed groups (XLSX via native row outlines); CSV exports every row
- [x] (in-pr) Large data: cache formatting, memoize the table, tree-row layout, and draw only visible rows (50k rows: every interaction under 0.3 s)
- [x] (in-pr) Grouped reports open at the deepest Show rows level under `maxVisibleRows` (default 1,000)
- [x] (in-pr) Vertical view limited to 100 rows, without totals (disabled with an explanation above that)
- [ ] (todo) Beyond ~100k rows: group off the main thread (Web Worker) or accept pre-aggregated data from the host
- [x] (in-pr) Per-instance element IDs (React `useId`) so two builders can share a page
- [x] (in-pr) PR #10: host props API (`schema`, `rows`, `reportDefinition`, `role`, `onSave`); sandbox mode on seed data when `rows` is omitted
- [x] (in-pr) PR #10: explicit "Save report" button + leave-page warning (no autosave)
- [x] (in-pr) PR #10: single versioned `reportDefinition` (fields, formulas, settings, saved default view); localStorage only in sandbox mode
- [x] (in-pr) PR #10: remove billing-specific hardcoding so any row shape works
- [x] (in-main) Scope decision: no separate semantic mapping layer; use direct source-key mapping and editable column naming.
- [x] (in-main) Add/remove report columns in edit mode (capped at 15)
- [x] (in-main) Add per-column `displayType` formatting options (currency, decimal number, percent, date, string, etc.)
- [x] (in-main) Scope decision: no value-template columns; use direct source-key/formula mapping only.
- [ ] (todo) Improve table readability (header styling, alternating row colors)
- [x] (in-main) Design seeded formula authoring UX baseline (formulas can be created, edited, and validated in-app)
- [ ] (todo) Add filtering, sorting, etc. also should be able to filter by date range. add filters would be another thing on the sticky when in the view mode. When in edit mode be able to set the default for the filters created.
- [~] (in-pr) Make filters, columns, and formulas collapsable and expandable when in edit mode
  - PR #10: settings, columns, and formulas collapse. Filters follow when filters exist.
- [ ] (todo) Add per-component stylesheets (final split by component)
- [ ] (todo) Add CSV export
- [ ] (todo) Add non-enforcing licenseKey seam
- [ ] (todo) Seed demo report for first-load wow factor
- [ ] (todo) Sandbox playground: paste schema/rows/definition JSON, switch roles, and try a report before plugging it into a host
- [ ] (todo) Package as an installable npm library (build + exports) instead of importing from source

## Backend integration (when host app is ready)

- [x] (in-pr) Replace prototype localStorage report-definition persistence with host-app backed persistence (PR #10: definition goes out through `onSave`; localStorage is sandbox-only).
- [x] (in-pr) Define persisted `reportData` contract (PR #10: versioned `reportDefinition`; permissions stay host-side via `role` + `onSave`).
- [ ] (todo) Add reportData generator flow for host apps (initial target: Rails helper/service).
- [x] (in-pr) Add host-app persistence integration that sends updated report-definition blobs and handles backend authorization failures (PR #10: `onSave`; a rejected promise shows its message).
- [~] (in-pr) Ensure every configurable value (formulas, columns, currency, sheetName, filters, chips) can be saved/loaded by an external system. PR #10 covers everything except filters, which don't exist yet.
- [x] (in-pr) Document the persistence payload shape and host-app integration contract in README/docs (PR #10).

## Parking lot

Ideas tracked but not being built yet.

- Dedicated edit-mode grid that feels closer to Excel.
- Saved report filters.
- PDF export.
- Charts on the report view (table-only for now).

## Main branch history

- [x] (in-main) Foundational docs
- [x] (in-main) Plain scaffold (PR #1)
