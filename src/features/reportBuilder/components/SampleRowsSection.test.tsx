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
    chipAggregation: 'count',
    currencySymbol: '',
  },
]

const rows: ReportRow[] = [
  {
    id: 'row1',
    workDate: '2024-01-01',
    personId: 'person1',
    personName: 'A',
    clientId: 'client1',
    clientName: 'C',
    originatingPersonId: 'person1',
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
        sheetName="Finance Sheet"
        isTableFullscreen={false}
        isHorizontalTable
        aggregateMode="none"
        isGroupingEnabled={false}
        showTotals={false}
        fields={fields}
        previewRows={rows}
        verticalColumns={[]}
        tableScrollRef={{ current: null }}
        onAggregateModeChange={() => undefined}
        onToggleGrouping={() => undefined}
        onToggleOrientation={() => undefined}
        onToggleFullscreen={() => undefined}
        getMappedValue={() => 'value'}
        getAggregatedFieldValue={() => null}
        formatValue={() => ''}
      />,
    )

    const heading = screen.getByRole('heading', { name: 'Finance Sheet' })
    const section = heading.closest('section')

    expect(section).toBeTruthy()
    expect(section?.id).toBe('report-chart')
  })

  it('forwards aggregate mode changes', () => {
    const onAggregateModeChange = vi.fn()
    render(
      <SampleRowsSection
        sheetName="Finance Sheet"
        isTableFullscreen={false}
        isHorizontalTable
        aggregateMode="none"
        isGroupingEnabled={false}
        showTotals={false}
        fields={fields}
        previewRows={rows}
        verticalColumns={[]}
        tableScrollRef={{ current: null }}
        onAggregateModeChange={onAggregateModeChange}
        onToggleGrouping={() => undefined}
        onToggleOrientation={() => undefined}
        onToggleFullscreen={() => undefined}
        getMappedValue={() => 'value'}
        getAggregatedFieldValue={() => null}
        formatValue={() => ''}
      />,
    )

    const select = screen.getByLabelText('Aggregate mode') as HTMLSelectElement
    fireEvent.change(select, { target: { value: 'sum' } })

    expect(onAggregateModeChange).toHaveBeenCalledWith('sum')
  })

  it('toggles grouping when the grouping button is clicked', () => {
    const onToggleGrouping = vi.fn()
    render(
      <SampleRowsSection
        sheetName="Finance Sheet"
        isTableFullscreen={false}
        isHorizontalTable
        aggregateMode="none"
        isGroupingEnabled={false}
        showTotals={false}
        fields={fields}
        previewRows={rows}
        verticalColumns={[]}
        tableScrollRef={{ current: null }}
        onAggregateModeChange={() => undefined}
        onToggleGrouping={onToggleGrouping}
        onToggleOrientation={() => undefined}
        onToggleFullscreen={() => undefined}
        getMappedValue={() => 'value'}
        getAggregatedFieldValue={() => null}
        formatValue={() => ''}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Grouping' }))
    expect(onToggleGrouping).toHaveBeenCalled()
  })

  it('locks body scroll while fullscreen is active', () => {
    const { rerender } = render(
      <SampleRowsSection
        sheetName="Finance Sheet"
        isTableFullscreen={false}
        isHorizontalTable
        aggregateMode="none"
        isGroupingEnabled={false}
        showTotals={false}
        fields={fields}
        previewRows={rows}
        verticalColumns={[]}
        tableScrollRef={{ current: null }}
        onAggregateModeChange={() => undefined}
        onToggleGrouping={() => undefined}
        onToggleOrientation={() => undefined}
        onToggleFullscreen={() => undefined}
        getMappedValue={() => 'value'}
        getAggregatedFieldValue={() => null}
        formatValue={() => ''}
      />,
    )

    expect(document.body.classList.contains('seed-table-fullscreen-lock')).toBe(false)

    rerender(
      <SampleRowsSection
        sheetName="Finance Sheet"
        isTableFullscreen
        isHorizontalTable
        aggregateMode="none"
        isGroupingEnabled={false}
        showTotals={false}
        fields={fields}
        previewRows={rows}
        verticalColumns={[]}
        tableScrollRef={{ current: null }}
        onAggregateModeChange={() => undefined}
        onToggleGrouping={() => undefined}
        onToggleOrientation={() => undefined}
        onToggleFullscreen={() => undefined}
        getMappedValue={() => 'value'}
        getAggregatedFieldValue={() => null}
        formatValue={() => ''}
      />,
    )

    expect(document.body.classList.contains('seed-table-fullscreen-lock')).toBe(true)
  })

  it('removes fullscreen body lock class on unmount', () => {
    const { unmount } = render(
      <SampleRowsSection
        sheetName="Finance Sheet"
        isTableFullscreen
        isHorizontalTable
        aggregateMode="none"
        isGroupingEnabled={false}
        showTotals={false}
        fields={fields}
        previewRows={rows}
        verticalColumns={[]}
        tableScrollRef={{ current: null }}
        onAggregateModeChange={() => undefined}
        onToggleGrouping={() => undefined}
        onToggleOrientation={() => undefined}
        onToggleFullscreen={() => undefined}
        getMappedValue={() => 'value'}
        getAggregatedFieldValue={() => null}
        formatValue={() => ''}
      />,
    )

    expect(document.body.classList.contains('seed-table-fullscreen-lock')).toBe(true)
    unmount()
    expect(document.body.classList.contains('seed-table-fullscreen-lock')).toBe(false)
  })
})
