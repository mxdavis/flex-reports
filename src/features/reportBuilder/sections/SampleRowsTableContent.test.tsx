import { render, screen } from '@testing-library/react'
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

describe('SampleRowsTableContent', () => {
  it('renders horizontal headers and total row', () => {
    render(
      <table>
        <SampleRowsTableContent
          isHorizontalTable
          showTotals
          aggregateMode="sum"
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
})
