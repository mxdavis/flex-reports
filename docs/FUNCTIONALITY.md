# How Flex Reports works

A guide to everything a report can do, for the people building and reading reports.
For running and integrating the package, see the [README](../README.md).

- [The report table](#the-report-table)
- [Totals](#totals)
- [Grouping](#grouping)
- [Collapsing groups](#collapsing-groups)
- [Vertical view and full screen](#vertical-view-and-full-screen)
- [Exporting](#exporting)
- [Summary chips](#summary-chips)
- [Edit mode](#edit-mode)
- [Formulas](#formulas)
- [Saving](#saving)
- [Editors and viewers](#editors-and-viewers)
- [How data is handled](#how-data-is-handled)

---

## The report table

The table shows one row per data row, with the columns set up in [edit mode](#edit-mode).
It scrolls inside its own box, with the column headers pinned at the top and the total
pinned at the bottom. Only the rows in view are drawn, so large reports stay fast.
The toolbar above it has:

| Control | What it does |
|---|---|
| **Totals** | Shows a total row, plus each group's totals on its group row when grouping is on. Horizontal view only. |
| **Grouping** | Nests rows into groups. Horizontal view only. |
| **Show rows** | Appears while grouping is on. Picks how far groups open. |
| **Vertical view** / **Horizontal view** | Switches the table's orientation. Vertical view is for reports of up to 100 rows. |
| **Export** | Prints or downloads the report. See [Exporting](#exporting). |
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
plain numbers. If a formula can't be calculated, its cells and totals show *Invalid formula*.

## Grouping

Turn on **Grouping** to nest rows. Grouping uses your leading text columns, left to
right, up to the first number column:

- The **last** of those text columns **names each row**.
- The text columns before it are **groups**, nested from broadest to most detailed.
- The number column and everything after it are **values**.
- If the report has no number columns, the last column names each row and the others
  are groups.

The group columns and the row-naming column share one nested column, headed with their
names joined (for example *Person › Client › Task*). Each group gets its own row with an
arrow and the group's totals; the rows under it are indented.

Example with the columns `Person | Client | Task | Hours | Rate | Total`:

```
PERSON › CLIENT › TASK          HOURS   RATE      TOTAL
▾ Alex Rivera                   17.50   $240.00   $4,200.00
   ▾ Delta Freight               6.75   $240.00   $1,620.00
       Conference                1.25   $240.00     $300.00
       Research                  3.25   $240.00     $780.00
       Review                    2.25   $240.00     $540.00
   ▸ Northwind Manufacturing     4.00   $240.00     $960.00
▸ Jordan Lee                    12.75   $218.57   $2,737.50
GRAND TOTAL                     62.50   $239.63  $15,000.00
```

Here Person and Client are groups, Task names each row, and Hours, Rate, and Total are
values. Rate's Total type is *Average*; the others are *Sum*. Northwind Manufacturing
and Jordan Lee are collapsed.

**Column order matters.** Put the columns you group by first, from broadest to most
detailed, then the column that names each row, then your numbers. A text column placed
after a number column is shown as a value.

Group rows show their totals when **Totals** is on. Groups are sorted by their
underlying values, so `$240` comes before `$1,000` and dates sort by date.

## Collapsing groups

Each group value has an arrow:

- **▾ expanded:** click to hide the rows under it.
- **▸ collapsed:** click to show them again.

A collapsed group always shows its totals, even when **Totals** is off.

**Show rows** sets how far every group opens at once, like an outline:

| Option | Shows |
|---|---|
| *Person* | One row per person, with their totals. |
| *Person › Client* | People expanded, with one row per client. |
| *All rows* | Everything expanded, down to each task row. |

The options are named after your own group columns. Changing **Show rows** resets any
groups you opened or closed by hand.

**Large reports open summarized.** If a level would show more than 1,000 rows, it's
marked *(over 1,000 rows)* and can't be picked, and the report opens at the deepest level
that fits, with a note saying so. You can still open any single group to see its rows.
This only changes what's shown: the saved **Show rows** level is kept, so the report
opens fully again if the data gets smaller. The host app can change the limit with the
`maxVisibleRows` prop. Ungrouped tables show every row.

## Vertical view and full screen

**Vertical view** turns the table on its side. Each data row becomes a column headed by
its first-column value, and each remaining column becomes a row. It's for reading a few
rows side by side, so:

- It's available for reports of up to 100 rows. Past that, the button is disabled and
  explains why, and a report saved in vertical view opens horizontally (the saved
  setting is kept for when the data is smaller again).
- Totals and grouping aren't available. Switching back to horizontal view restores them.

**Full screen** expands the table to fill the window and hides the rest of the page,
keeping the toolbar, column headers, and total. Press `Esc` or click **Exit full screen** to
return.

## Exporting

**Export** in the table toolbar prints or downloads the report. It's available to
viewers and editors, and the host app can limit the formats or turn it off.

| Format | What you get |
|---|---|
| **Print…** | The report as it looks on screen (grouping, collapsed groups, totals, vertical view), with every row, the title, and the print date. Toolbars and edit panels are left out, column headers repeat on each page, and only the report prints, not the rest of the page. |
| **Save as PDF…** | The same layout, through the browser's print dialog: choose **Save as PDF** as the destination. The file is named after the report. |
| **Excel (.xlsx)** | A real workbook: numbers and dates stay numbers and dates, with currency, percent, and date formats; the header row is frozen. A grouped report uses Excel's own row outline: group rows (with their totals) sit above their rows, and groups collapsed on screen arrive collapsed, ready to expand in Excel. Includes the total row when Totals is on. |
| **CSV** | Every data row, with the report's columns and headers, values formatted as on screen. No group or total rows. Opens correctly in Excel, including symbols like €. |

Text that would run as a spreadsheet formula (starting with `=`, `+`, `-`, or `@`) is
saved with a leading `'`, so opening the file never runs anything from your data.

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

When you change a column's source to one of a **different type** (for example text to
currency), Display type and Total type switch to that type's defaults right away in the
form. A source of the **same type** keeps the column's current settings. Nothing changes
until you click **Save** on the column.

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

A formula label must start with a letter and use only letters, numbers, spaces, and `_`.
It can't match a data field's name or another formula's (ignoring case), and an
expression can be up to 500 characters.

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

If a report was saved by a newer version of Flex Reports than the one you're using,
it opens read-only: Save is turned off and editors see a note saying why, so the newer
report can't be overwritten.

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
- Date-only values like `2026-07-01` show as that calendar day for every viewer,
  whatever their timezone. Values with a time (`2026-07-01T23:30:00Z`) are shown in
  the viewer's local time.
- If a column's source isn't in the data or formulas (for example a removed field or a
  deleted formula), the column stays where it is and shows blank values. Editors see
  ⚠ on its header and a warning on its column card, so they can pick another source.
  A warning is also logged to the browser console.
- An invalid saved report doesn't crash the page. The bad parts fall back to defaults and
  an error is logged to the browser console.
