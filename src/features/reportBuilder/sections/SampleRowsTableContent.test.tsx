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

    expect(screen.getByRole('columnheader', { name: 'Alice' })).toBeInTheDocument()

    const subgroupRow = screen.getByText('Client A').closest('tr')
    expect(subgroupRow).toBeTruthy()
    if (!subgroupRow) {
      return
    }
    expect(within(subgroupRow).getByText('5')).toBeInTheDocument()

    const groupTotalRow = screen.getByRole('columnheader', { name: 'Alice Total' }).closest('tr')
    expect(groupTotalRow).toBeTruthy()
    if (!groupTotalRow) {
      return
    }
    expect(within(groupTotalRow).getByText('10')).toBeInTheDocument()

    const grandTotalRow = screen.getByRole('columnheader', { name: 'Grand total' }).closest('tr')
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
})
