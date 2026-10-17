# Decisions Log

Newest at top. Each entry: what we decided and why.

## Host integration & scope (PR #10)

- **Plain data props, not an adapter.** The host renders
  `<ReportBuilderApp schema rows reportDefinition role onSave />` and does its own
  fetching. Simpler for hosts than implementing an async adapter; revisit only if large
  datasets need server-side filtering. Replaces the `DataSource` factory and
  `VITE_DATA_SOURCE` toggle.
- **Sandbox mode = no `rows` prop.** The builder loads the seed data and keeps the
  definition in `localStorage`. localStorage exists only for sandbox; it is never used
  in host mode.
- **Generic data, no domain layer.** Rows are `{ id, ...anything }` and columns map
  straight to the host's schema keys, with editable labels. No semantic-field mapping
  layer. Hosts that want starter reports generate a `reportDefinition` with their own keys.
- **No value-template columns.** Columns are source keys or formulas. Outside constants
  (quotas, targets) belong on the rows, where they can vary per row.
- **Table-only report view; no chart library.** Nivo is dropped. Charts are parked as a
  future idea.
- **Roles: `editor` | `viewer`, passed as a prop.** Viewers can explore everything
  (including edit mode) but never save; a refresh resets them to the saved default view.
  The prop is a convenience, not security: the host's `onSave` must check the user's
  permissions in its own backend.
- **Explicit Save, not autosave.** A saved report is the default view everyone sees, so
  half-finished edits must not go live. Save is disabled until something changes; the
  browser's leave-page warning fires while changes are unsaved. Timed autosave was
  rejected: it publishes partial edits and still leaves users unsure what was saved.
- **One versioned `reportDefinition` object** (`version`, `sheetName`, `currencySymbol`,
  `fields`, `formulas`, `view`). The saved default view (orientation, totals on/off,
  grouping, outline level) is part of it. Invalid input is repaired to schema defaults with a console
  error, never silently.
- **No data migrations yet.** The product has never shipped, so stored shapes change
  freely. The `version` field is there for when that stops being true.
- **Grouping uses the leading text columns, up to the first number column.** The last of
  them names each row and the ones before it nest as groups. Number columns are measures,
  so they stay values; grouping by them produced a total row for every distinct rate or
  hour value. A **Tip** in Column Mapping and the Grouping tooltip explain that column
  order matters (editors only; viewers never see authoring tips). Groups sort by
  underlying values (numbers, dates), not formatted text.
- **Tree rows instead of merged cells.** Each group is its own row carrying its totals,
  with indented rows under it (Excel's compact pivot form). Merged cells can't be split
  across a windowed table, and separate "X Total" rows multiplied the row count on deep
  groupings (10k data rows became 22k table rows).
- **Grouped reports cap expanded rows at 1,000 (`maxVisibleRows`).** A report view is for
  summaries, not reading tens of thousands of rows, so a large grouped report opens at the
  deepest outline level that fits, and deeper levels are disabled. Opening a single group
  is still allowed. The cap is display-only (the saved level isn't changed, so the report
  isn't marked unsaved), and ungrouped tables aren't capped. Windowing stays underneath.
- **Vertical view is for small reports, without totals.** One column per row stops being
  readable past about 100 rows, so the button is disabled above `MAX_VERTICAL_VIEW_ROWS`
  (100) and a report saved vertical opens horizontally (display-only). Totals and
  grouping are disabled there; their saved settings come back in horizontal view.
- **Only visible rows are drawn.** The table scrolls in its own box with pinned headers
  and total, and draws the rows in view plus a buffer. Measured in Chromium on a
  production build: 50k rows went from 5–9.5 s to render (11.5 s to toggle grouping) to
  under 0.3 s for every interaction. A hand-rolled windowing hook (rows are fixed height)
  avoids a new dependency.
- **One currency symbol per report.** Columns used to store their own symbol, but the
  report-wide symbol always won, so the per-column one was dead weight and was removed.
- **Namespaced CSS classes and IDs (`fr-`).** The builder renders inside host pages, so
  unprefixed names like `.mapping-panel` or `#report-table` could collide with the host's
  CSS or IDs. `check:practices` fails on any unprefixed class in the builder's CSS.
  CSS modules were the alternative; the prefix keeps plain CSS and readable class names.
- **Untouched default columns follow the schema.** Columns were built once at mount, so a
  host that mounted with empty rows (or an empty schema) while loading was stuck with zero
  columns. Without a saved definition, the defaults are rebuilt when the schema changes,
  if nobody has edited them, and that becomes the "nothing to save" state. The schema is
  compared by content, so an inline `schema={[...]}` doesn't recompute on every render.
- **Reports from a newer version open read-only.** Resetting an unknown version to
  defaults let an editor on an older deploy click Save and overwrite the newer report
  (and normalizing drops fields it doesn't know). Now a higher `version` is read best
  effort with Save turned off and a note for editors; only an unreadable version falls
  back to defaults. Real upgrades will be a migration chain in `normalize`.
- **One set of definition rules for the editor and for loading** (`reportDefinition/rules.ts`).
  Hosts can build definitions on their servers, so `normalizeReportDefinition` repairs
  anything the editor would reject (too many columns or formulas, repeated column ids,
  bad or colliding formula labels, over-long expressions) instead of trusting it. A
  formula can't share a data field's name: the field would always win, hiding it.
- **The builder doesn't touch the host page's URL or global IDs.** Jump links only scroll
  (writing a `#hash` with `replaceState` wiped the host router's state), and every element
  ID is prefixed per builder via `useId()` (`useElementId`), so two builders can share a page.
- **Sandbox mode is an explicit `sandbox` prop.** It used to switch on whenever `rows` was
  undefined, which is also how hosts look while loading (`rows={data?.rows}`): the builder
  then built its report from the sample data and kept it after the real rows arrived, so
  the next Save could overwrite the host's report. Now undefined rows show "Loading report…".
- **Sandbox seeds load lazily.** A dynamic `import()` keeps the sample data in its own
  chunk, fetched only when no `rows` are passed, so host bundles don't include it.
  Sandbox mode shows a short loading state while it arrives.
- **Builder state lives in React context**, not props threaded through builder
  functions. React Query was considered and rejected: it manages server fetching and
  caching, and the host owns fetching here. Section components stay presentational.
- **Columns with a missing source stay put.** They render blank, with a warning for
  editors and in the console, instead of being silently pointed at another field (which
  changed the report behind the user's back and made it look unsaved on open).
- **Each column totals by its own aggregation** (the column's "Total type", which also
  drives its summary chip). The old table-wide Sum/Avg/Count dropdown is now a Totals
  on/off toggle, because one mode for every column gave meaningless totals (summed rates).
- **Collapsible groups with a saved outline level.** Like Excel's 1/2/3 outline buttons,
  `view.expandedLevels` saves how far groups open by default. It survives data changes,
  unlike saving individual groups by value. Groups opened or closed by hand are
  session-only. The collapse state lives in report state so future PDF/XLSX exports can
  reflect what's on screen (XLSX can use native row outlines); CSV will always export
  every row.

## Product & architecture

- **Reporting-only layer, not a data store.** Flex Reports connects to the host's schema and
  fetches data at run time; it persists only report definitions (JSON). Avoids re-importing
  data into spreadsheets and keeps the host as the source of truth.
- ~~**Pluggable data-source adapter** (`getSchema` + `fetchRows`).~~ Superseded by plain
  data props (see Host integration & scope).
- **Column-defined, row-evaluated formulas.** One formula per column, applied to every row.
  Simpler than free-form Excel and matches the "goes all the way down" mental model. No
  per-cell overrides in the POC.
- **Operators limited to `+ - / * % ( )`.** `%` means percent-of (÷100), not modulo. Keeps
  the formula engine tiny and avoids a heavyweight/GPL formula library.
- **Custom lightweight pivot**, not react-pivottable (stale/buggy) or WebDataRocks
  (proprietary + bulky). ~~Nivo chart~~ dropped (see Host integration & scope).

## Licensing & distribution

- **All third-party deps must be MIT/Apache/BSD.** Enables commercial redistribution and a
  "works forever" self-hosted product. Rules out HyperFormula (GPL/paid), Handsontable,
  Jspreadsheet Pro, Flexmonster, AG Grid Enterprise, WebDataRocks.
- **Our own code is proprietary**, distributed via private registry / build artifacts. This
  is separate from (and compatible with) using permissive dependencies.
- **No hosted service, no usage metering.** True enforcement is impossible on self-hosted
  client code, so licensing is legal + a light technical seam.
- **Signed offline license keys (future).** Verified locally with an embedded public key;
  no phone-home. "Free-for-life" = perpetual signed key. If a client stops paying, software
  keeps working; they just lose updates/support.
- **`licenseKey` seam added from day one but non-enforcing** for the POC.
- **npm package + adapter** is the integration model (host is React/JS). Standalone repo now.

## Tooling

- **Node latest via nvm** (v26.5.1 at setup), **Vite + React latest + TypeScript**, **Vitest**.
- **Per-component stylesheets.** Edit view = Excel-like; saved view = clean web page.
- **MVC-flavored structure** (models/services/controllers/views) to match a Rails mindset.

## Process

- Work on branches, open PRs; nothing hits `main` without review.
- Stop and ask whenever any question or clarification comes up.
- Keep docs (SPEC, DECISIONS, PRACTICES, TODO) current as we go.
