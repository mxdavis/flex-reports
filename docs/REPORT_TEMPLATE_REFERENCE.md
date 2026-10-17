# Report Template Reference

Purpose: capture what customers should be able to build without code changes, and the
shape of the saved report.

## Core requirement

Customers configure report columns from the UI, over whatever data the host sends.

- Columns map directly to the host's schema keys.
- Display names are editable in the UI.
- Any data shape works; nothing is tied to particular field names.

## Column types

A report column (`fields[]` entry) points at one `sourceKey`, which is either:

1. **A source column.** A key from the host's `schema`.
   Example: `{ "sourceKey": "warehouse", "label": "Warehouse" }`.

2. **A formula.** The label of an entry in `formulas[]`, evaluated per row.
   Example formula: `{ "label": "lineTotal", "expression": "{{units}} * {{price}}" }`,
   then a column with `"sourceKey": "lineTotal"`.

To use an outside constant such as a quota or target, put it on the rows as a field,
where it can also vary per row.

## Example shape

```json
{
  "version": 1,
  "sheetName": "Inventory",
  "currencySymbol": "$",
  "fields": [
    { "id": "warehouse", "label": "Warehouse", "sourceKey": "warehouse", "displayType": "string", "aggregation": "distinct" },
    { "id": "units", "label": "Units", "sourceKey": "units", "displayType": "number", "aggregation": "sum" },
    { "id": "field-1", "label": "Line total", "sourceKey": "lineTotal", "displayType": "currency", "aggregation": "sum" }
  ],
  "formulas": [
    { "label": "lineTotal", "expression": "{{units}} * {{price}}" }
  ],
  "view": { "orientation": "horizontal", "showTotals": true, "isGroupingEnabled": true, "expandedLevels": null }
}
```

## Persisted reportData

The host persists this definition so users don't re-enter their setup each time.

- Flex Reports hands the full definition to `onSave` when an editor clicks **Save report**.
- The host stores it (DB, service API) and passes it back as `reportDefinition`.
- A host-side generator can create starter definitions for first run, for example a Rails
  service or helper that builds `fields` from the host's own column keys.

## Edit permissions

- The host passes `role="editor"` or `role="viewer"`.
- Viewers can explore everything, including edit mode, but never see Save. A refresh
  resets them to the saved default view.
- `role` is a UI convenience, not security. The host's `onSave` must check the user's
  permissions in its own backend before persisting.
