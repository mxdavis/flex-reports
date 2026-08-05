import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { ReportRow } from '../../../services/adapters'
import type { ReportField } from '../../../services/reportDefinition/types'
import SampleRowsTableContent from './SampleRowsTableContent'

const fields: ReportField[] = [
  {
    id: 'field-workDate',
    label: 'Date',
    sourceKey: 'workDate',
    displayType: 'date',
    chipAggregation: 'count',
    currencySymbol: '',
  },
  {
    id: 'field-hours',
    label: 'Hours',
    sourceKey: 'hours',
    displayType: 'number',
    chipAggregation: 'sum',
    currencySymbol: '',
  },
]

const row: ReportRow = {
  id: 'row1',
  workDate: '2024-01-01',
  personId: 'person1',
  personName: 'Alice',
  clientId: 'client1',
  clientName: 'Client',
  originatingPersonId: 'person1',
  task: 'Task',
  hours: 2,
  rate: 100,
  total: 200,
}

const pivotFields: ReportField[] = [
  {
    id: 'field-person',
    label: 'Person',
    sourceKey: 'personName',
    displayType: 'string',
    chipAggregation: 'count',
    currencySymbol: '',
  },
  {
    id: 'field-client',
    label: 'Client',
    sourceKey: 'clientName',
    displayType: 'string',
    chipAggregation: 'count',
    currencySymbol: '',
  },
  {
    id: 'field-hours-pivot',
    label: 'Hours',
    sourceKey: 'hours',
    displayType: 'number',
    chipAggregation: 'sum',
    currencySymbol: '',
  },
]

const pivotRows: ReportRow[] = [
  {
    ...row,
    id: 'row-a-1',
    personName: 'Alice',
    clientName: 'Client A',
    hours: 2,
  },
  {
    ...row,
    id: 'row-a-2',
    personName: 'Alice',
    clientName: 'Client A',
    hours: 3,
  },
  {
    ...row,
    id: 'row-a-3',
    personName: 'Alice',
    clientName: 'Client B',
    hours: 5,
  },
  {
    ...row,
    id: 'row-b-1',
    personName: 'Bob',
    clientName: 'Client C',
    hours: 4,
  },
]

describe('SampleRowsTableContent', () => {
  it('renders horizontal headers and total row', () => {
    render(
      <table>
        <SampleRowsTableContent
          isHorizontalTable
          showTotals
          aggregateMode="sum"
          isGroupingEnabled={false}
          fields={fields}
          previewRows={[row]}
          verticalColumns={[]}
          getMappedValue={() => 'value'}
          getAggregatedFieldValue={() => 2}
          formatValue={() => '2'}
        />
      </table>,
    )

    expect(screen.getByRole('columnheader', { name: 'Date' })).toBeInTheDocument()
    expect(screen.getByText('Total')).toBeInTheDocument()
  })

  it('renders vertical row headers', () => {
    render(
      <table>
        <SampleRowsTableContent
          isHorizontalTable={false}
          showTotals={false}
          aggregateMode="none"
          isGroupingEnabled={false}
          fields={fields}
          previewRows={[row]}
          verticalColumns={[{ key: 'row1', headerValue: '2024-01-01', rows: [row] }]}
          getMappedValue={() => 'value'}
          getAggregatedFieldValue={() => null}
          formatValue={() => ''}
        />
      </table>,
    )

    expect(screen.getByRole('columnheader', { name: '2024-01-01' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Hours' })).toBeInTheDocument()
  })

  it('renders embedded subcolumn pivot layout with subgroup, group, and grand totals', () => {
    render(
      <table>
        <SampleRowsTableContent
          isHorizontalTable
          showTotals
          aggregateMode="sum"
          isGroupingEnabled
          fields={pivotFields}
          previewRows={pivotRows}
          verticalColumns={[]}
          getMappedValue={(mappedRow, sourceKey) => String(mappedRow[sourceKey as keyof ReportRow] ?? '')}
          getAggregatedFieldValue={(rowsToAggregate, sourceKey) => {
            return rowsToAggregate.reduce((total, mappedRow) => {
              const value = mappedRow[sourceKey as keyof ReportRow]
              return typeof value === 'number' ? total + value : total
            }, 0)
          }}
          formatValue={(value) => (value === null ? '' : String(value))}
        />
      </table>,
    )

    expect(screen.getByRole('rowheader', { name: 'Alice' })).toBeInTheDocument()
    expect(screen.queryByRole('columnheader', { name: '' })).toBeNull()

    // Detail rows are expanded: Client A has two rows (hours 2 and 3) shown
    // individually rather than collapsed into a single summed cell.
    const clientARow = screen.getByText('Client A').closest('tr')
    expect(clientARow).toBeTruthy()
    if (!clientARow) {
      return
    }
    expect(within(clientARow).getByText('2')).toBeInTheDocument()

    // Client B is a single-row subgroup showing its raw value.
    const clientBRow = screen.getByText('Client B').closest('tr')
    expect(clientBRow).toBeTruthy()
    if (!clientBRow) {
      return
    }
    expect(within(clientBRow).getByText('5')).toBeInTheDocument()

    const groupTotalRow = screen.getByRole('rowheader', { name: 'Alice Total' }).closest('tr')
    expect(groupTotalRow).toBeTruthy()
    if (!groupTotalRow) {
      return
    }
    expect(within(groupTotalRow).getByText('10')).toBeInTheDocument()

    // Subtotals hit every subgroup: Client A (hours 2 + 3) has its own subtotal.
    const clientASubtotalRow = screen.getByRole('rowheader', { name: 'Client A Total' }).closest('tr')
    expect(clientASubtotalRow).toBeTruthy()
    if (!clientASubtotalRow) {
      return
    }
    expect(within(clientASubtotalRow).getByText('5')).toBeInTheDocument()

    // Single-row subgroups (Client B) are not duplicated with a redundant subtotal.
    expect(screen.queryByRole('rowheader', { name: 'Client B Total' })).toBeNull()

    const grandTotalRow = screen.getByRole('rowheader', { name: 'Grand total' }).closest('tr')
    expect(grandTotalRow).toBeTruthy()
    if (!grandTotalRow) {
      return
    }
    expect(within(grandTotalRow).getByText('14')).toBeInTheDocument()
  })

  it('renders plain horizontal rows when grouping is off', () => {
    render(
      <table>
        <SampleRowsTableContent
          isHorizontalTable
          showTotals={false}
          aggregateMode="none"
          isGroupingEnabled={false}
          fields={pivotFields}
          previewRows={pivotRows}
          verticalColumns={[]}
          getMappedValue={(mappedRow, sourceKey) => String(mappedRow[sourceKey as keyof ReportRow] ?? '')}
          getAggregatedFieldValue={() => null}
          formatValue={(value) => (value === null ? '' : String(value))}
        />
      </table>,
    )

    expect(screen.getAllByRole('cell', { name: 'Alice' }).length).toBeGreaterThan(0)
    expect(screen.queryByRole('rowheader', { name: 'Alice Total' })).toBeNull()
  })

  it('preserves raw values for single-row grouped subgroups when aggregate mode is count', () => {
    render(
      <table>
        <SampleRowsTableContent
          isHorizontalTable
          showTotals
          aggregateMode="count"
          isGroupingEnabled
          fields={pivotFields}
          previewRows={pivotRows}
          verticalColumns={[]}
          getMappedValue={(mappedRow, sourceKey) => String(mappedRow[sourceKey as keyof ReportRow] ?? '')}
          getAggregatedFieldValue={(rowsToAggregate) => rowsToAggregate.length}
          formatValue={(value) => (value === null ? '' : String(value))}
        />
      </table>,
    )

    const bobRow = screen.getByRole('rowheader', { name: 'Bob' }).closest('tr')
    expect(bobRow).toBeTruthy()
    if (!bobRow) {
      return
    }

    expect(within(bobRow).getByText('Client C')).toBeInTheDocument()
    expect(within(bobRow).getByText('4')).toBeInTheDocument()
  })

  it('shows data (not counts) in multi-row grouped subgroup rows while totals show counts', () => {
    // Regression: previously count mode replaced every metric cell in a
    // multi-row subgroup with the row count (e.g. "3 3 3"), hiding the data.
    // Detail rows must show data; only the total rows should show counts.
    const countBugFields: ReportField[] = [
      {
        id: 'field-person',
        label: 'Person',
        sourceKey: 'personName',
        displayType: 'string',
        chipAggregation: 'count',
        currencySymbol: '',
      },
      {
        id: 'field-client',
        label: 'Client',
        sourceKey: 'clientName',
        displayType: 'string',
        chipAggregation: 'count',
        currencySymbol: '',
      },
      {
        id: 'field-hours',
        label: 'Hours',
        sourceKey: 'hours',
        displayType: 'number',
        chipAggregation: 'sum',
        currencySymbol: '',
      },
    ]

    // Alex / ClientX has 3 rows: count = 3, but the representative value is 10.
    const countBugRows: ReportRow[] = [
      { ...row, id: 'alex-1', personName: 'Alex', clientName: 'ClientX', hours: 10 },
      { ...row, id: 'alex-2', personName: 'Alex', clientName: 'ClientX', hours: 20 },
      { ...row, id: 'alex-3', personName: 'Alex', clientName: 'ClientX', hours: 30 },
    ]

    render(
      <table>
        <SampleRowsTableContent
          isHorizontalTable
          showTotals
          aggregateMode="count"
          isGroupingEnabled
          fields={countBugFields}
          previewRows={countBugRows}
          verticalColumns={[]}
          getMappedValue={(mappedRow, sourceKey) => String(mappedRow[sourceKey as keyof ReportRow] ?? '')}
          getAggregatedFieldValue={(rowsToAggregate) => rowsToAggregate.length}
          formatValue={(value) => (value === null ? '' : String(value))}
        />
      </table>,
    )

    // Detail subgroup row must show the underlying data (10), not the count (3).
    const subgroupRow = screen.getByText('ClientX').closest('tr')
    expect(subgroupRow).toBeTruthy()
    if (!subgroupRow) {
      return
    }
    expect(within(subgroupRow).getByText('10')).toBeInTheDocument()
    expect(within(subgroupRow).queryByText('3')).toBeNull()

    // The group total row is where the count belongs, labelled once with the
    // plain row count for the group.
    const totalRow = screen.getByRole('rowheader', { name: 'Alex Count Total 3' }).closest('tr')
    expect(totalRow).toBeTruthy()
    if (!totalRow) {
      return
    }
    expect(totalRow).toHaveTextContent('Alex Count Total 3')
    expect(within(totalRow).queryByText('10')).toBeNull()
    const totalCells = Array.from(totalRow.querySelectorAll('td')).map((cell) => cell.textContent?.trim() ?? '')
    expect(totalCells.every((value) => value === '')).toBe(true)
  })

  it('renders subgroup subtotal labels for sum, avg, count, and distinct modes', () => {
    const modeFields: ReportField[] = [
      {
        id: 'field-person',
        label: 'Person',
        sourceKey: 'personName',
        displayType: 'string',
        chipAggregation: 'count',
        currencySymbol: '',
      },
      {
        id: 'field-rate',
        label: 'Rate',
        sourceKey: 'rate',
        displayType: 'number',
        chipAggregation: 'sum',
        currencySymbol: '',
      },
      {
        id: 'field-client',
        label: 'Client',
        sourceKey: 'clientName',
        displayType: 'string',
        chipAggregation: 'count',
        currencySymbol: '',
      },
      {
        id: 'field-gross',
        label: 'Gross',
        sourceKey: 'total',
        displayType: 'number',
        chipAggregation: 'sum',
        currencySymbol: '',
      },
    ]

    const modeRows: ReportRow[] = [
      { ...row, id: 'alex-1', personName: 'Alex Rivera', rate: 240, clientName: 'Delta Freight', total: 780 },
      { ...row, id: 'alex-2', personName: 'Alex Rivera', rate: 240, clientName: 'Delta Freight', total: 300 },
      { ...row, id: 'alex-3', personName: 'Alex Rivera', rate: 240, clientName: 'Delta Freight', total: 540 },
      { ...row, id: 'alex-4', personName: 'Alex Rivera', rate: 240, clientName: 'Northwind Manufacturing', total: 600 },
      { ...row, id: 'alex-5', personName: 'Alex Rivera', rate: 240, clientName: 'Northwind Manufacturing', total: 360 },
      { ...row, id: 'alex-6', personName: 'Alex Rivera', rate: 240, clientName: 'ACME Legal', total: 1080 },
      { ...row, id: 'alex-7', personName: 'Alex Rivera', rate: 240, clientName: 'Summit Health', total: 540 },
    ]

    const getAggregatedFieldValue = (rowsToAggregate: ReportRow[], sourceKey: string, mode: 'none' | 'sum' | 'avg' | 'count' | 'distinct') => {
      if (mode === 'none') return null
      if (mode === 'count') return rowsToAggregate.length
      if (mode === 'distinct') {
        const distinctValues = new Set(rowsToAggregate.map((mappedRow) => String(mappedRow[sourceKey as keyof ReportRow] ?? '')))
        return distinctValues.size
      }
      const values = rowsToAggregate.map((mappedRow) => Number(mappedRow[sourceKey as keyof ReportRow] ?? Number.NaN)).filter((value) => Number.isFinite(value))
      if (values.length === 0) return null
      const sum = values.reduce((total, value) => total + value, 0)
      return mode === 'avg' ? sum / values.length : sum
    }

    const expectations: Array<{
      mode: 'sum' | 'avg' | 'count' | 'distinct'
      subgroupLabel: string
      midGroupLabel: string
      topGroupLabel: string
    }> = [
      {
        mode: 'sum',
        subgroupLabel: 'Delta Freight Total',
        midGroupLabel: '240 Total',
        topGroupLabel: 'Alex Rivera Total',
      },
      {
        mode: 'avg',
        subgroupLabel: 'Delta Freight Average',
        midGroupLabel: '240 Average',
        topGroupLabel: 'Alex Rivera Average',
      },
      {
        mode: 'count',
        subgroupLabel: 'Delta Freight Count Total 3',
        midGroupLabel: '240 Count Total 7',
        topGroupLabel: 'Alex Rivera Count Total 7',
      },
      {
        mode: 'distinct',
        subgroupLabel: 'Delta Freight DISTINCT COUNT',
        midGroupLabel: '240 DISTINCT COUNT',
        topGroupLabel: 'Alex Rivera DISTINCT COUNT',
      },
    ]

    for (const expectation of expectations) {
      const { unmount } = render(
        <table>
          <SampleRowsTableContent
            isHorizontalTable
            showTotals
            aggregateMode={expectation.mode}
            isGroupingEnabled
            fields={modeFields}
            previewRows={modeRows}
            verticalColumns={[]}
            getMappedValue={(mappedRow, sourceKey) => String(mappedRow[sourceKey as keyof ReportRow] ?? '')}
            getAggregatedFieldValue={getAggregatedFieldValue}
            formatValue={(value) => (value === null ? '' : String(value))}
          />
        </table>,
      )

      expect(screen.getByRole('rowheader', { name: expectation.subgroupLabel })).toBeInTheDocument()
      expect(screen.getByRole('rowheader', { name: expectation.midGroupLabel })).toBeInTheDocument()
      expect(screen.getByRole('rowheader', { name: expectation.topGroupLabel })).toBeInTheDocument()

      unmount()
    }
  })
})
