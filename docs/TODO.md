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
- [~] (in-pr) Seed DataSource + UI column mapping + formula preview (combined)
  - PR: #3 (base `main`). Former PR #2 closed and folded in.
  - Includes: DataSource factory + `VITE_DATA_SOURCE` toggle, no-eval formula parser, `engines.node` >=22

## POC task list

- [x] (in-main) Scaffold app: latest Vite + React + TypeScript
- [x] (in-pr) Add Vitest setup and seed-backed tests
- [x] (in-pr) Build data adapter + mock billing seed dataset
- [x] (in-pr) Build seed preview page in app (stats, formulas, sample rows)
- [x] (in-pr) Address PR #2 review: DataSource factory + `VITE_DATA_SOURCE` env toggle, no-eval formula parser, `engines.node` >=22
- [ ] (todo) Follow-up (PR #3 review): replace hardcoded `semanticFields`/default mapping in `App.tsx` with a schema-driven, saved report definition (JSON) sourced from `getSchema()`
- [ ] (todo) Follow-up (PR #3 review): move formula application out of the seed data source into the report/formula layer (adapter returns raw rows only)
- [ ] (todo) Follow-up (PR #3 review): replace bespoke `getTotalRevenue` with the pivot/aggregation engine
- [ ] (todo) Build report definition store (localStorage)
- [ ] (todo) Replace prototype localStorage report-definition persistence with host-app backed persistence (DB/service API) for shared, durable report configs
- [ ] (todo) Define persisted `reportData` contract (column names, source attrs, mappings, formulas, permissions)
- [ ] (todo) Add reportData generator flow for host apps (initial target: Rails helper/service)
- [ ] (todo) Build Edit view (Excel-like)
- [ ] (todo) Add edit-mode permission gating (only allowed users see edit controls/button)
- [ ] (todo) Build Report view (clean web page with filters + table + chart)
- [ ] (todo) Add orientation toggle for report display: horizontal (rows) vs vertical (pivoted columns), including people-as-columns use case.
- [ ] (todo) Next PR: add embedded subcolumn pivot layout (Excel-like): first selected column is always the primary header/group, second selected column nests under it (no duplicated primary values), with aggregates/totals applied at subgroup, group, and grand-total levels.
- [ ] (todo) Add customer UI column mapping (semantic field -> source column key)
- [x] (in-pr) Add/remove report columns in edit mode (capped at 15)
- [~] (in-pr) Add per-column `displayType` formatting options (currency, decimal number, percent, date, string, etc.)
- [ ] (todo) Add value-template columns with `{{value_name}}` placeholders
- [ ] (todo) Improve table readability (header styling, alternating row colors)
- [ ] (todo) Design seeded formula authoring UX (how formulas are created/edited/validated)
- [ ] (todo) Add per-component stylesheets (final split by component)
- [ ] (todo) Add CSV export
- [ ] (todo) Add non-enforcing licenseKey seam
- [ ] (todo) Seed demo report for first-load wow factor

## Main branch history

- [x] (in-main) Foundational docs
- [x] (in-main) Plain scaffold (PR #1)
