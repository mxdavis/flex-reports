# Flex Reports

An embeddable reporting component for React apps. Pass in your rows, and your users get
a spreadsheet-style report builder: pick and rename columns, add per-row formulas, group
and total the data, then save a default view that everyone else opens.

Flex Reports never stores your data. Your app passes rows in, and Flex Reports hands back
a small JSON **report definition** for your app to save.

**[See a demo →](https://mxdavis.github.io/flex-reports/)**: the latest release, published
with GitHub Pages and running on the [sample data](#the-app).

**[How it works →](FUNCTIONALITY.md)**: a full guide to grouping, totals,
collapsing, formulas, saving, and roles.

Large reports stay fast: only the rows in view are drawn, and a report shows at most
1,000 rows (grouped reports open at a summary level that fits), while totals and formulas
use every row.

---

## Run it locally

Requires **Node 22+**.

```bash
npm install
npm run dev
```

Open **http://localhost:6060**. The local app loads the sample data from
`public/sample-data.json`, the same way it would load any endpoint (see [The app](#the-app)),
so you can try every feature right away.

---

## Add it to your app

Render `ReportBuilderApp` and pass your data in as props. Styles are included with the
component, and you can put more than one builder on a page. It never changes your page's
URL.

> Flex Reports isn't published to npm yet. For now, copy or link the `src/` folder into
> your project and import the component from there.

```tsx
import ReportBuilderApp from './flex-reports/features/reportBuilder/ReportBuilderApp'
import type { ReportDefinition } from './flex-reports/services/reportDefinition/types'

function SalesReport({ report, rows, currentUser }) {
  return (
    <ReportBuilderApp
      schema={[
        { id: 'region', key: 'region', label: 'Region', dataType: 'string' },
        { id: 'soldOn', key: 'soldOn', label: 'Sold On', dataType: 'date' },
        { id: 'units', key: 'units', label: 'Units', dataType: 'number' },
        { id: 'price', key: 'price', label: 'Price', dataType: 'currency' },
      ]}
      rows={rows}
      reportDefinition={report.definition} // omit for a new report; editors pick its columns
      role={currentUser.canEditReports ? 'editor' : 'viewer'}
      onSave={async (definition: ReportDefinition) => {
        const response = await fetch(`/api/reports/${report.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(definition),
        })
        if (!response.ok) throw new Error('You do not have permission to save this report.')
      }}
    />
  )
}
```

### 1. Pass your data

`rows` is an array of plain objects in any shape. An `id` is optional; render keys are managed internally:

```ts
const rows = [
  { id: 'r1', region: 'North', soldOn: '2026-07-01', units: 3, price: 20 },
  { id: 'r2', region: 'South', soldOn: '2026-07-02', units: 5, price: 18 },
]
```

`schema` lists the fields on those rows, which your users can then choose as columns:

| Key | Meaning |
|---|---|
| `id` | Unique id for the field. |
| `key` | The property name on each row. |
| `label` | The default column header. |
| `dataType` | `'string'`, `'number'`, `'date'`, or `'currency'`. Sets the default format and total type. |

If you leave `schema` out, every field found across all rows (including nested ones like
`client.name`) becomes a text field. Passing a schema gives you explicit labels and formats.

`rows` and `schema` can change at any time, for example after a refetch, and the table
updates. Passing `schema` inline is fine: it's compared by content. If you don't pass a
`reportDefinition`, the report starts with no columns, and editors pick them under
**Getting started** in edit mode.

### 2. Save the report

When an editor clicks **Save report**, `onSave` receives the full report definition.
Store it as JSON however you like, then pass it back as `reportDefinition` next time.

- Called once per click. Nothing saves automatically.
- Throw or reject with an `Error` to show its message next to the button. The changes
  stay unsaved so the user can retry.
- `reportDefinition` is read when the component mounts. To switch to a different report,
  give the component a new `key`.

### 3. Set the role

| Role | Can explore and edit on screen | Sees **Save report** |
|---|---|---|
| `'editor'` (default) | Yes | Yes |
| `'viewer'` | Yes | No. Refreshing resets them to the saved default view. |

Viewers can try anything without risk, and they don't see authoring tips.

> **Always check permissions in `onSave`.** `role` only controls what's shown on screen.
> Anyone can change props in their browser, so your backend must confirm the user may
> edit the report before saving it.

### Props

| Prop | Type | Default | Notes |
|---|---|---|---|
| `rows` | `Array<Record<string, unknown>>` | — | Your data. While it's `undefined` (still loading), the builder shows "Loading report…". Once rows have arrived, a refetch that briefly clears them keeps the current report and edits. |
| `schema` | `Array<{ id, key, label, dataType }>` | Discovered | The fields available on `rows`. Without it, every field in the rows is offered as text. |
| `reportDefinition` | `ReportDefinition` | Generated | The saved report to open. |
| `role` | `'editor' \| 'viewer'` | `'editor'` | Controls the Save button and tips. |
| `onSave` | `(definition) => void \| Promise<void>` | — | Required for editors. Without it the Save button is hidden and an error is logged. |
| `initialEditMode` | `boolean` | `false` | Open straight into edit mode. |
| `exports` | `boolean \| ('print' \| 'pdf' \| 'xlsx' \| 'csv')[]` | all | Which export formats appear in the **Export** menu, for viewers and editors alike. `false` hides the menu. |
| `maxVisibleRows` | `number` | `1000` | Maximum displayed/printed report rows (1–1,000). Grouped reports open at the deepest **Show rows** level that fits. All incoming rows still contribute to formulas and totals. |

### Report definition

This is the only thing you store. Save it as-is:

```json
{
  "version": 1,
  "sheetName": "Sales",
  "currencySymbol": "$",
  "fields": [
    { "id": "region", "label": "Region", "sourceKey": "region", "displayType": "string", "aggregation": "none" },
    { "id": "units", "label": "Units", "sourceKey": "units", "displayType": "number", "aggregation": "sum" },
    { "id": "field-1", "label": "Revenue", "sourceKey": "%revenue", "displayType": "currency", "aggregation": "sum" }
  ],
  "formulas": [
    { "label": "revenue", "expression": "{{units}} * {{price}}" }
  ],
  "view": { "orientation": "horizontal", "showTotals": true, "isGroupingEnabled": true, "expandedLevels": null }
}
```

| Key | Meaning |
|---|---|
| `fields` | The report's columns, in order. `sourceKey` is a schema `key`, or `%` plus a formula `label` (for example `%lineTotal`). |
| `fields[].displayType` | `'currency' \| 'number' \| 'decimal' \| 'percent' \| 'date' \| 'string'` |
| `fields[].aggregation` | How the column totals: `'none' \| 'sum' \| 'avg' \| 'count' \| 'distinct'` |
| `formulas` | Per-row calculations. See [Formulas](FUNCTIONALITY.md#formulas). |
| `view` | The default view everyone opens. |
| `version` | The format version (currently `1`). A definition from a newer version of Flex Reports opens read-only, with Save turned off, so an older copy of the component can't overwrite it. An unreadable version falls back to defaults. |
| `view.expandedLevels` | How many grouping levels start open: `0` shows only the first column's groups, `null` opens everything. |

If a column's `sourceKey` is no longer in your schema, the column renders blank, editors
see a warning, and a `[flex-reports]` warning is logged to the console.

You can also build a starter definition on your server, for example to ship a default
report. Invalid or partial definitions don't crash the page: the bad parts fall back to
defaults and a `[flex-reports]` error is logged to the console. The same rules the editor enforces are
applied when a definition loads: at most 15 columns (repeated column ids get a fresh id)
and 25 formulas. Saved formulas are kept even when the editor wouldn't accept them (an
invalid or empty label, an empty expression, an expression over 500 characters, or a label
that matches a data field): editors see a note in the Formulas panel and fix them there.
Two formulas with the same name (ignoring case) can't be saved from the editor; if a
definition you pass in has them, the first is used and a warning shows on the page.

To use an outside constant such as a quota or target, put it on the rows as a field,
where it can also vary per row.

---

## The app

This repo also runs as a small browser app around the component (`src/App.tsx` and
`src/app/`), which is what the [demo](https://mxdavis.github.io/flex-reports/) shows. It's
a host like any other: it loads records from an endpoint, passes them in as `rows` with no
`schema` (so every column name and key comes from the data), and saves the report in this
browser's `localStorage`. None of this is part of the component, which never touches
browser storage.

- The sample records are `public/sample-data.json`, published next to the app, so the
  demo reads them from `https://mxdavis.github.io/flex-reports/sample-data.json`. Any site
  can read that address too.
- **Reset to sample** deletes the saved report and starts again.
- Try the viewer role by changing `<App />` in `src/main.tsx` to `<App role="viewer" />`.

---

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server on http://localhost:6060 |
| `npm test` | Unit tests (Vitest) |
| `npm run test:e2e` | End-to-end tests (Playwright). First run `npx playwright install chromium`. |
| `npm run lint` | Lint (oxlint) |
| `npm run check:practices` | Repo rules: component size, sibling CSS and test files, duplication |
| `npm run build` | Type-check and production build |

---

## Releases

Releases are made by hand from `main`, once its CI checks are green:

1. Open **Actions → Release → Run workflow**.
2. Pick **patch** (fixes), **minor** (new features) or **major** (big or breaking changes).
3. Click **Run workflow**.

The workflow tags the next version (for example `v1.0.0` → `v1.1.0`), publishes a
[GitHub release](https://github.com/mxdavis/flex-reports/releases) listing every PR merged
since the last one, and deploys that version as the [demo](https://mxdavis.github.io/flex-reports/).

To roll the demo back, open **Actions → Deploy demo → Run workflow** and enter an earlier
tag, such as `v1.0.0`.

---

## Documentation

- **[FUNCTIONALITY.md](FUNCTIONALITY.md)**: how every feature works, for the people
  building and reading reports.
