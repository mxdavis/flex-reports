# Report Template Reference

Purpose: capture examples of what customers should be able to build without code changes.

## Core requirement

Customers must configure report columns from the UI.

- Semantic fields (People, Client, Hours, Rate, etc.) are mapped to customer source columns.
- Display names are editable in the UI.
- No hardcoded business column names in code for customer-specific reports.

## Column types

A report column definition can be one of these:

1. Source mapped column
- Reads from a selected source column key.
- Example: semantic field `people` mapped to `column1`.

2. Formula column
- Expression using other report columns.
- Example: `hours * rate`.

3. Value template column
- Literal template text with placeholders.
- Placeholder format: `{{value_name}}`.
- Example: `{{target_utilization}}` or `{{region_multiplier}}`.

## Example shape

```json
{
  "columns": [
    {
      "id": "people",
      "label": "People",
      "kind": "source",
      "sourceKey": "column1"
    },
    {
      "id": "gross_fees",
      "label": "Gross Fees",
      "kind": "formula",
      "expression": "hours * rate"
    },
    {
      "id": "quota",
      "label": "Quarter Quota",
      "kind": "value_template",
      "template": "{{quarter_quota}}"
    }
  ]
}
```

## Package implications

- The package ships generic semantics and a mapping UI.
- Customer onboarding includes mapping source columns to semantics.
- Saved mappings and report definitions are stored in app data, not code.

## Persisted reportData

The host app must persist report configuration so users do not re-enter mappings
every time.

- Store reportData with at least: column labels, semantic-to-source mappings,
  formula definitions, and view/edit permission metadata.
- A host-side generator can create starter reportData for first run
  (for example a Rails service/helper).

## Edit mode permissions

- Not every user can edit report definitions.
- UI must show edit controls only for users with edit permission.

## Notes

When a concrete sample file is provided, add it here or in a sibling file under `docs/` as a canonical reference example.
