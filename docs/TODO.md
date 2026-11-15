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

## Story 1 — generic records

- [~] (wip) Refactor existing report input/state/calculations to accept host records, update live, and interpret numeric text without billing assumptions. Branch: `feat/generic-report-records`. File/API loading and stories 2–6 remain separate.
  - Ready for local review: 105 tests, lint, build, and practice checks pass. No PR or deployment yet.
  - Preview: `npm run dev` → `http://localhost:6060`; original sandbox only. Generic records, live updates, empty data, and numeric conversion are checked in automated tests; no sample-category UI or extra runtime seeds.

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
- [x] (in-main) Build Report view shell baseline (clean page structure + table; filtering tracked in dedicated filter TODOs below)
- [x] (in-main) Scope decision: report view is spreadsheet/table-only (no chart visualization).
- [x] (in-main) Add orientation toggle for report display: horizontal (rows) vs vertical (pivoted columns), including people-as-columns use case.
- [x] (in-main) Make sheet name editable at the top of edit mode, and use that name as the chart/table section heading instead of hardcoded "Sample rows".
- [x] (in-pr) Next PR: add embedded subcolumn pivot layout (Excel-like): first selected column is always the primary header/group, second selected column nests under it (no duplicated primary values), with aggregates/totals applied at subgroup, group, and grand-total levels.
- [x] (in-main) Scope decision: no separate semantic mapping layer; use direct source-key mapping and editable column naming.
- [x] (in-main) Add/remove report columns in edit mode (capped at 15)
- [x] (in-main) Add per-column `displayType` formatting options (currency, decimal number, percent, date, string, etc.)
- [x] (in-main) Scope decision: no value-template columns; use direct source-key/formula mapping only.
- [ ] (todo) Improve table readability (header styling, alternating row colors)
- [x] (in-main) Design seeded formula authoring UX baseline (formulas can be created, edited, and validated in-app)
- [ ] when its grouped (which means it shows subtotals) each group can be expanded or minimized. so if its minizmed you just the total row of that group but if its expanded we see what we see now. can we try to implement that? we can use the icons we have for up and down, but instead have it for left anf right
- [ ] make the seed one step further to see how much we can do with our reporting. add matters which belong to clients and have a matter_category which is category: id, name (litigation, employment, corporate, 3 examples). now move the billing time to a matter and attorney. now lets see if we can group by client than matter, or even group by category, so col 1 person, col 2 category, col 3 time. lets see what kind of nested data we can handle or if it will need to be handled before being passed in.
- [ ] Add percentage to a grouping total
- [ ] (todo) Add filtering, sorting, etc. also should be able to filter by date range. add filters would be another thing on the sticky when in the view mode. When in edit mode be able to set the default for the filters created.
- [ ] (todo) Make filters, columns, and formulas collapsable and expandable when in edit mode
- [ ] (todo) Add per-component stylesheets (final split by component)
- [ ] (todo) Add CSV export
- [ ] (todo) Add non-enforcing licenseKey seam
- [ ] (todo) Seed demo report for first-load wow factor

## Backend integration (when host app is ready)

- [ ] (todo) Replace prototype localStorage report-definition persistence with host-app backed persistence (DB/service API) for shared, durable report configs.
- [ ] (todo) Define persisted `reportData` contract (column names, source attrs, mappings, formulas, permissions).
- [ ] (todo) Add reportData generator flow for host apps (initial target: Rails helper/service).
- [ ] (todo) Add host-app persistence API integration that sends updated report-definition blobs and handles backend authorization failures.
- [ ] (todo) Ensure every configurable value (formulas, columns, currency, sheetName, filters, chips) can be saved/loaded by an external system.
- [ ] (todo) Document the persistence payload shape and host-app integration contract in README/docs.

## Main branch history

- [x] (in-main) Foundational docs
- [x] (in-main) Plain scaffold (PR #1)
