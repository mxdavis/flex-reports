# Sample Report Extract

- Workbook: sample report with hardcoded and formulas.xlsx
- Sheets: 3
- Total formulas: 750

## Outputs

- sample-report.schema.json (sheet layout and headers)
- sample-report.formulas.csv (all formulas by sheet/cell)
- <sheet>.preview.csv files (first 200 rows per sheet)

## Import Notes

- Formula expressions are captured exactly as stored in workbook cells.
- Preview CSV files are capped at 200 rows per sheet to keep repo size reasonable.
