# How Flex Reports works

A guide to everything a report can do, for the people building and reading reports.
For running and integrating the package, see the [README](../README.md).

- [The report table](#the-report-table)
- [Totals](#totals)
- [Grouping](#grouping)
- [Collapsing groups](#collapsing-groups)
- [Vertical view and full screen](#vertical-view-and-full-screen)
- [Summary chips](#summary-chips)
- [Edit mode](#edit-mode)
- [Formulas](#formulas)
- [Saving](#saving)
- [Editors and viewers](#editors-and-viewers)
- [How data is handled](#how-data-is-handled)

---

## The report table

The table shows one row per data row, with the columns set up in [edit mode](#edit-mode).
The toolbar above it has:

| Control | What it does |
|---|---|
| **Totals** | Shows total rows: a grand total, plus a total under every group when grouping is on. |
| **Grouping** | Nests rows into groups. Horizontal view only. |
| **Show rows** | Appears while grouping is on. Picks how far groups open. |
| **Vertical view** / **Horizontal view** | Switches the table's orientation. |
| **Full screen** | Expands the table to fill the window. Press `Esc` to exit. |

## Totals

Every column decides how it adds up with its own **Total type**, set when you edit the
column:

| Total type | Result |
|---|---|
| **Sum** | Adds the values. |
| **Average** | Averages the values. |
| **Count** | Counts the rows. |
| **Distinct count** | Counts the unique values. |
| **None** | Leaves the column blank in totals. |

So one report can sum hours, average a rate, and count clients at the same time.
The same setting is used everywhere a total appears: group totals, the grand total,
and the [summary chips](#summary-chips).

Sums and averages keep the column's format (for example `$1,620.00`), while counts are
plain numbers. If a formula can't be calculated, its total shows *Invalid formula*.

## Grouping

Turn on **Grouping** to nest rows, spreadsheet-style. Grouping goes left to right
through your columns and **stops at the first number column**:

- The columns before it are **groups**. Each value shows once, spanning its rows.
- The number column and everything after it are **values**, shown on every row.
- If the report has no number columns, every column except the last is a group.

Example with the columns `Person | Client | Task | Hours | Rate | Total`:

```
PERSON          CLIENT           TASK          HOURS   RATE      TOTAL
▾ Alex Rivera   ▾ Delta Freight  ▾ Research    3.25    $240.00   $780.00
                                 RESEARCH TOTAL 3.25   $240.00   $780.00
                                 ▾ Review      2.25    $240.00   $540.00
                                 REVIEW TOTAL  2.25    $240.00   $540.00
                DELTA FREIGHT TOTAL            5.50    $240.00   $1,320.00
                ▸ Northwind Manufacturing      4.00    $240.00   $960.00
                …
ALEX RIVERA TOTAL                              17.50   $240.00   $4,200.00
…
```

Here Person › Client › Task are groups, and Hours, Rate, and Total are values. Rate's
Total type is *Average*; the others are *Sum*. Northwind Manufacturing is collapsed.

**Column order matters.** Put the columns you group by first, from broadest to most
detailed, then your numbers. A text column placed after a number column is shown as a
value, not a group.

When **Totals** is on, every group gets a total row, even a group with a single row.
Groups are sorted by their underlying values, so `$240` comes before `$1,000` and dates
sort by date.

## Collapsing groups

Each group value has an arrow:

- **▾ expanded:** click to collapse the group into a single row showing its totals.
- **▸ collapsed:** click to expand it again.

A collapsed row always shows the group's totals, even when **Totals** is off.

**Show rows** sets how far every group opens at once, like an outline:

| Option | Shows |
|---|---|
| *Person* | One row per person, with their totals. |
| *Person › Client* | People expanded, with one row per client. |
| *Person › Client › Task* | Expanded down to one row per task. |
| *All rows* | Everything expanded. |

The options are named after your own group columns. Changing **Show rows** resets any
groups you opened or closed by hand.

## Vertical view and full screen

**Vertical view** turns the table on its side. Each data row becomes a column headed by
its first-column value, and each remaining column becomes a row. With **Totals** on, a
**Total** column is added on the right. Grouping isn't available in vertical view.

**Full screen** expands the table to fill the window and hides the rest of the page,
keeping the toolbar and column headers. Press `Esc` or click **Exit full screen** to
return.

## Summary chips

Chips above the table show one total per column, such as `Hours (sum) 62.50`. They use
each column's **Total type**. Columns set to **None** don't get a chip.

## Edit mode

Click **Edit mode** in the toolbar. The toolbar can jump to **Columns**, **Formulas**,
and **Table**, and each section collapses with its chevron.

### Report settings

- **Sheet name:** the heading shown above the table.
- **Currency symbol:** used for every currency column.

### Column mapping

Reports have 1 to 15 columns. You can:

- **Add** a column at any position.
- **Remove** a column.
- **Drag** cards to reorder columns. Order controls [grouping](#grouping).
- **Edit** a column to set:
  - **Source:** a data field, or a formula's label.
  - **Label:** the header users see.
  - **Display type:** currency, number, decimal number, percent, date, or string.
  - **Total type:** sum, average, count, distinct count, or none (see [Totals](#totals)).

Editors also see a **Tip** here explaining how column order drives grouping.

## Formulas

A formula computes a new value for every row, which you can then show as a column.
You can have up to 25.

| Syntax | Meaning |
|---|---|
| `{{units}}` | The `units` field of the row. |
| `{{%Line total}}` | The result of the formula labelled *Line total*. |
| `+ - * /` | Add, subtract, multiply, divide. |
| `( )` | Grouping, as in `({{a}} + {{b}}) * 2`. |
| `%` | *Percent of*, not modulo: `{{total}} * 10%` is 10% of total. |

Type `{{` to get suggestions for fields and formulas. A formula that refers to itself,
directly or through other formulas, can't be calculated.

To show a formula, add a column and set its **Source** to the formula's label.
Example: a formula labelled `lineTotal` with `{{units}} * {{price}}`, shown in a column
labelled *Line total* with display type *Currency*.

## Saving

Editors see **Save report**. It stays disabled until something changes, then saves the
whole report:

- Columns, formulas, sheet name, and currency symbol.
- The default view: orientation, **Totals**, **Grouping**, and **Show rows**.

Everyone who opens the report starts from that saved view. Groups opened or closed by
hand aren't saved.

Nothing saves automatically. If you try to leave the page with unsaved changes, the
browser asks you to confirm. If saving fails, the error appears next to the button and
your changes stay, so you can try again.

## Editors and viewers

| | Editor | Viewer |
|---|---|---|
| Explore the table, grouping, and edit mode | Yes | Yes |
| See authoring tips | Yes | No |
| Save the report | Yes | No |

Viewers can change anything on screen to explore the data, but nothing they do is saved.
Refreshing the page puts them back on the saved default view.

## How data is handled

- Flex Reports only displays the data passed to it. It never stores rows.
- Rows can be any shape, as long as each has a unique `id`.
- Without a schema, columns are worked out from the first row.
- Default display types come from each field's data type:
  - currency → currency
  - number → decimal number
  - date → date
  - text → string
- Default total types: sum for number columns, distinct count for text and date columns.
- If a column's source isn't in the data or formulas (for example a removed field or a
  deleted formula), the column stays where it is and shows blank values. Editors see
  ⚠ on its header and a warning on its column card, so they can pick another source.
  A warning is also logged to the browser console.
- An invalid saved report doesn't crash the page. The bad parts fall back to defaults and
  an error is logged to the browser console.
