# Flex Reports

An embeddable reporting component for React apps. Pass in your rows, and your users get
a spreadsheet-style report builder: pick and rename columns, add per-row formulas, group
and total the data, then save a default view that everyone else opens.

Flex Reports never stores your data. Your app passes rows in, and Flex Reports hands back
a small JSON **report definition** for your app to save.

**[How it works →](docs/FUNCTIONALITY.md)**: a full guide to grouping, totals,
collapsing, formulas, saving, and roles.

Large reports stay fast: only the rows in view are drawn, and grouped reports open at a
summary level when fully expanding them would show more than 1,000 rows.

---

## Run it locally

Requires **Node 22+**.

```bash
npm install
npm run dev
```

Open **http://localhost:6060**. With no data passed in, the app runs in
[sandbox mode](#sandbox-mode) on built-in sample data, so you can try every feature right away.

---

## Add it to your app

Render `ReportBuilderApp` and pass your data in as props. Styles are included with the
component.

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
      reportDefinition={report.definition} // omit the first time to start from defaults
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

`rows` is an array of plain objects in any shape. Each row needs a unique `id`:

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

If you leave `schema` out, fields are worked out from the first row, and a warning is
logged to the console. Passing a schema gives you proper labels and formats.

`rows` and `schema` can change at any time, for example after a refetch, and the table
updates.

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
| `rows` | `Array<{ id: string, [key: string]: unknown }>` | — | Your data. Omit to run in [sandbox mode](#sandbox-mode). |
| `schema` | `Array<{ id, key, label, dataType }>` | Inferred | The fields available on `rows`. |
| `reportDefinition` | `ReportDefinition` | Generated | The saved report to open. |
| `role` | `'editor' \| 'viewer'` | `'editor'` | Controls the Save button and tips. |
| `onSave` | `(definition) => void \| Promise<void>` | — | Required for editors. Without it the Save button is hidden and an error is logged. |
| `initialEditMode` | `boolean` | `false` | Open straight into edit mode. |
| `maxVisibleRows` | `number` | `1000` | Grouped reports that would show more rows than this fully expanded open at the deepest **Show rows** level that fits. Ungrouped tables aren't capped. |

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
    { "id": "field-1", "label": "Revenue", "sourceKey": "revenue", "displayType": "currency", "aggregation": "sum" }
  ],
  "formulas": [
    { "label": "revenue", "expression": "{{units}} * {{price}}" }
  ],
  "view": { "orientation": "horizontal", "showTotals": true, "isGroupingEnabled": true, "expandedLevels": null }
}
```

| Key | Meaning |
|---|---|
| `fields` | The report's columns, in order. `sourceKey` is a schema `key` or a formula `label`. |
| `fields[].displayType` | `'currency' \| 'number' \| 'decimal' \| 'percent' \| 'date' \| 'string'` |
| `fields[].aggregation` | How the column totals: `'none' \| 'sum' \| 'avg' \| 'count' \| 'distinct'` |
| `formulas` | Per-row calculations. See [Formulas](docs/FUNCTIONALITY.md#formulas). |
| `view` | The default view everyone opens. |
| `view.expandedLevels` | How many grouping levels start open: `0` shows only the first column's groups, `null` opens everything. |

If a column's `sourceKey` is no longer in your schema, the column renders blank, editors
see a warning, and a `[flex-reports]` warning is logged to the console.

You can also build a starter definition on your server, for example to ship a default
report. Invalid or partial definitions don't crash the page: the bad parts fall back to
defaults and a `[flex-reports]` error is logged to the console.

More examples: [docs/REPORT_TEMPLATE_REFERENCE.md](docs/REPORT_TEMPLATE_REFERENCE.md).

---

## Sandbox mode

If you don't pass `rows`, Flex Reports loads sample data from `src/seeds/`, and **Save
report** stores the definition in your browser's `localStorage`. Use it for local
development and demos. When you pass `rows`, nothing is written to the browser.

The sample data is a separate file that's only downloaded in sandbox mode, so apps that
pass their own `rows` don't carry it.

- Try the viewer role by changing `src/App.tsx` to `<ReportBuilderApp role="viewer" />`.
- Start fresh by clearing the `flex-reports.sandbox.reportDefinition.v1` key in
  localStorage.

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

## Documentation

- **[docs/FUNCTIONALITY.md](docs/FUNCTIONALITY.md)**: how every feature works.
- **[docs/REPORT_TEMPLATE_REFERENCE.md](docs/REPORT_TEMPLATE_REFERENCE.md)**: column types
  and report definition examples.

Contributing:

- **[docs/PRACTICES.md](docs/PRACTICES.md)**: coding practices. Read before writing code.
- **[docs/SPEC.md](docs/SPEC.md)**: product spec and architecture.
- **[docs/DECISIONS.md](docs/DECISIONS.md)**: decisions log.
- **[docs/TODO.md](docs/TODO.md)**: task tracker and parking lot.
