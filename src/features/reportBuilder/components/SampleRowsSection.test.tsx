import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { ReportRow } from '../../../services/adapters'
import type { ReportField } from '../../../services/reportDefinition/types'
import SampleRowsSection from './SampleRowsSection'

const fields: ReportField[] = [
  {
    id: 'field1',
    label: 'workDate',
    sourceKey: 'workDate',
    displayType: 'date',
  },
]

const rows: ReportRow[] = [
  {
    id: 'row1',
    workDate: '2024-01-01',
    personName: 'A',
    clientName: 'C',
    task: 'Task',
    hours: 1,
    rate: 100,
    total: 100,
  },
]

describe('SampleRowsSection', () => {
  it('renders section with chart jump target id', () => {
    render(
      <SampleRowsSection
        isTableFullscreen={false}
        isHorizontalTable
        aggregateMode="none"
        showTotals={false}
        fields={fields}
        previewRows={rows}
        verticalColumns={[]}
        tableScrollRef={{ current: null }}
        onAggregateModeChange={() => undefined}
        onToggleOrientation={() => undefined}
        onToggleFullscreen={() => undefined}
        getMappedValue={() => 'value'}
        getAggregatedFieldValue={() => null}
        formatValue={() => ''}
      />,
    )

    const heading = screen.getByRole('heading', { name: 'Sample rows' })
    const section = heading.closest('section')

    expect(section).toBeTruthy()
    expect(section?.id).toBe('report-chart')
  })

  it('forwards aggregate mode changes', () => {
    const onAggregateModeChange = vi.fn()
    render(
      <SampleRowsSection
        isTableFullscreen={false}
        isHorizontalTable
        aggregateMode="none"
        showTotals={false}
        fields={fields}
        previewRows={rows}
        verticalColumns={[]}
        tableScrollRef={{ current: null }}
        onAggregateModeChange={onAggregateModeChange}
        onToggleOrientation={() => undefined}
        onToggleFullscreen={() => undefined}
        getMappedValue={() => 'value'}
        getAggregatedFieldValue={() => null}
        formatValue={() => ''}
      />,
    )

    const select = screen.getByLabelText('Aggregate') as HTMLSelectElement
    fireEvent.change(select, { target: { value: 'sum' } })

    expect(onAggregateModeChange).toHaveBeenCalledWith('sum')
  })
})
