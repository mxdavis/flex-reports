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
- [~] (in-pr) Billing seed data + seed-backed tests ready for PR
  - Branch: feat/billing-seed-data

## POC task list

- [x] (in-main) Scaffold app: latest Vite + React + TypeScript
- [x] (in-pr) Add Vitest setup and seed-backed tests
- [x] (in-pr) Build data adapter + mock billing seed dataset
- [x] (in-pr) Build seed preview page in app (stats, formulas, sample rows)
- [ ] (todo) Build report definition store (localStorage)
- [ ] (todo) Build Edit view (Excel-like)
- [ ] (todo) Build Report view (clean web page with filters + table + chart)
- [ ] (todo) Add customer UI column mapping (semantic field -> source column key)
- [ ] (todo) Add value-template columns with `{{value_name}}` placeholders
- [ ] (todo) Add per-component stylesheets (final split by component)
- [ ] (todo) Add CSV export
- [ ] (todo) Add non-enforcing licenseKey seam
- [ ] (todo) Seed demo report for first-load wow factor

## Main branch history

- [x] (in-main) Foundational docs
- [x] (in-main) Plain scaffold (PR #1)
