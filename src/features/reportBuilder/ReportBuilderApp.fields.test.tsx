import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createRecordsDataSource } from '../../services/adapters/recordsDataSource'
import { generateDefaultReportDefinition, normalizeReportDefinition } from '../../services/reportDefinition/normalize'
import type { ReportDefinition } from '../../services/reportDefinition/types'
import { installMemoryStorage } from '../../test/memoryStorage'
import ReportBuilderApp from './ReportBuilderApp'

describe('nested fields in the existing report editor', () => {
  beforeEach(() => {
    installMemoryStorage()
    Object.defineProperty(HTMLElement.prototype, 'scrollTo', { value: () => undefined, configurable: true })
  })

  it('renames a nested column twice, saves its path separately, and reads fresh host data', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    const { rerender, unmount } = render(
      <ReportBuilderApp rows={[{ client: { name: 'Acme' }, hours: '4' }]} onSave={onSave} initialEditMode />,
    )
    const table = screen.getByRole('table')
    expect(within(table).getByRole('columnheader', { name: 'client.name' })).toBeInTheDocument()

    for (const label of ['Client', 'Customer']) {
      await user.click(screen.getByRole('button', { name: 'Edit COLUMN 1' }))
      expect(screen.getByLabelText('COLUMN 1')).toHaveValue('client.name')
      await user.clear(screen.getByLabelText('Display label'))
      await user.type(screen.getByLabelText('Display label'), label)
      await user.click(screen.getByRole('button', { name: 'Save COLUMN 1' }))
      expect(within(table).getByRole('columnheader', { name: label })).toBeInTheDocument()
      expect(within(table).getByText('Acme')).toBeInTheDocument()
    }
    await user.click(screen.getByRole('button', { name: 'Save report' }))
    const saved = onSave.mock.calls[0][0] as ReportDefinition
    expect(saved.fields[0]).toMatchObject({ label: 'Customer', sourceKey: 'client.name', sourcePath: ['client', 'name'] })

    rerender(<ReportBuilderApp rows={[{ client: { name: 'Beta' }, hours: '9' }]} onSave={onSave} initialEditMode />)
    expect(within(table).getByRole('columnheader', { name: 'Customer' })).toBeInTheDocument()
    expect(within(table).getByText('Beta')).toBeInTheDocument()
    expect(within(table).queryByText('Acme')).toBeNull()

    unmount()
    render(<ReportBuilderApp rows={[{ client: { name: 'Reloaded' } }]} reportDefinition={JSON.parse(JSON.stringify(saved))} role="viewer" />)
    expect(screen.getByRole('columnheader', { name: 'Customer' })).toBeInTheDocument()
    expect(screen.getByText('Reloaded')).toBeInTheDocument()
  })

  it('distinguishes nested, literal dotted, case-sensitive, and empty keys in the picker', async () => {
    const user = userEvent.setup()
    render(<ReportBuilderApp rows={[{
      client: { name: 'Nested' }, 'client.name': 'Literal', Name: 'Upper', name: 'Lower', '': 'Empty key',
    }]} onSave={vi.fn()} initialEditMode />)
    const table = screen.getByRole('table')
    for (const label of ['client.name', '["client.name"]', 'Name', 'name', '[""]']) {
      expect(within(table).getByRole('columnheader', { name: label })).toBeInTheDocument()
    }
    await user.click(screen.getByRole('button', { name: 'Edit COLUMN 1' }))
    await user.clear(screen.getByLabelText('COLUMN 1'))
    await user.click(screen.getByRole('button', { name: '["client.name"]' }))
    await user.click(screen.getByRole('button', { name: 'Save COLUMN 1' }))
    expect(within(table).queryByText('Nested')).toBeNull()
    expect(within(table).getAllByText('Literal')).toHaveLength(2)
  })

  it('uses nested fields and quoted formula references in group totals without joining IDs', () => {
    const rows = [
      { client: { name: 'Acme' }, task: 'Draft', metrics: { hours: '4', rate: '250' }, 'metrics.hours': '2', 'a}}b': '3' },
      { client: { name: 'Acme' }, task: 'Review', metrics: { hours: '2', rate: '50' }, 'metrics.hours': '2', 'a}}b': '1' },
    ]
    const schema = createRecordsDataSource(rows).getSchema()
    const definition = generateDefaultReportDefinition(schema, [{
      label: 'fee', expression: '{{metrics.hours}} * {{["metrics","rate"]}} + {{["metrics.hours"]}} + {{["a}}b"]}}',
    }])
    definition.fields = [
      ...definition.fields.filter((field) => ['client.name', 'task'].includes(field.sourceKey)),
      { id: 'hours', label: 'Hours', sourceKey: 'metrics.hours', displayType: 'number', aggregation: 'sum' },
      { id: 'fee', label: 'Fee', sourceKey: '%fee', displayType: 'currency', aggregation: 'sum' },
    ]
    definition.view = { ...definition.view, isGroupingEnabled: true, expandedLevels: 0, showTotals: true }
    render(<ReportBuilderApp rows={rows} reportDefinition={definition} role="viewer" />)
    const group = screen.getByRole('button', { name: 'Acme' }).closest('tr')!
    expect(within(group).getByText('6')).toBeInTheDocument()
    expect(within(group).getByText('$1,108.00')).toBeInTheDocument()
    expect(screen.queryByText('Draft')).toBeNull()
    expect(normalizeReportDefinition(JSON.parse(JSON.stringify(definition)), schema).fields[0].sourcePath).toEqual(['client', 'name'])
  })

  it('tells editors which fields have several entries per row, and keeps the rest usable', () => {
    const rows = [{ clientId: 'c1', hours: 4, entries: [{ client: { name: 'Not joined' } }] }]
    const { unmount } = render(<ReportBuilderApp rows={rows} onSave={vi.fn()} initialEditMode />)
    expect(screen.getByRole('note')).toHaveTextContent('Not available as a column: entries.')
    expect(screen.queryByRole('alert')).toBeNull()
    unmount()

    render(<ReportBuilderApp rows={rows} role="viewer" />)
    expect(screen.queryByRole('note')).toBeNull()
    expect(screen.queryByRole('alert')).toBeNull()
    expect(screen.getByRole('columnheader', { name: 'clientId' })).toBeInTheDocument()
    expect(screen.queryByRole('columnheader', { name: 'entries' })).toBeNull()
    expect(screen.queryByText('Not joined')).toBeNull()
  })

  it('keeps a saved formula working when new data gains a field with the same name', () => {
    const definition = generateDefaultReportDefinition(createRecordsDataSource([{ hours: 2 }]).getSchema(), [
      { label: 'Fee', expression: '{{hours}} * 10' },
      { label: 'Both', expression: '{{%Fee}} + {{Fee}}' },
    ])
    definition.fields = [
      { id: 'formula', label: 'Formula fee', sourceKey: '%Fee', displayType: 'number', aggregation: 'none' },
      { id: 'data', label: 'Data fee', sourceKey: 'Fee', displayType: 'number', aggregation: 'none' },
      { id: 'both', label: 'Both', sourceKey: '%Both', displayType: 'number', aggregation: 'none' },
    ]
    const saved = JSON.parse(JSON.stringify(definition))
    const rows = [{ hours: 2, Fee: 7 }]
    const { unmount } = render(<ReportBuilderApp rows={rows} reportDefinition={saved} onSave={vi.fn()} initialEditMode />)
    const cells = within(screen.getByRole('table')).getAllByRole('cell').map((cell) => cell.textContent)
    expect(cells).toEqual(['20', '7', '27'])
    expect(screen.getByRole('note')).toHaveTextContent('Your data now has a field called Fee, the same name as your formula.')
    unmount()

    render(<ReportBuilderApp rows={rows} reportDefinition={saved} role="viewer" />)
    expect(screen.queryByRole('note')).toBeNull()
  })

  it('keeps saved formulas the editor would reject and tells editors what to fix', () => {
    const definition = generateDefaultReportDefinition(createRecordsDataSource([{ hours: 2 }]).getSchema(), [
      { label: '9 Fees', expression: '{{hours}} * 10' },
      { label: 'Blank', expression: '' },
    ])
    definition.fields = [{ id: 'fees', label: 'Fees', sourceKey: '%9 Fees', displayType: 'number', aggregation: 'none' }]
    const saved = JSON.parse(JSON.stringify(definition))
    const { unmount } = render(<ReportBuilderApp rows={[{ hours: 2 }]} reportDefinition={saved} onSave={vi.fn()} initialEditMode />)
    expect(within(screen.getByRole('table')).getByRole('cell')).toHaveTextContent('20')
    expect(screen.getAllByRole('note').map((note) => note.textContent)).toEqual([
      'Formula "9 Fees": Label must start with a letter and use only letters, numbers, spaces, and _.',
      'Formula "Blank": Label and expression are required.',
    ])
    unmount()

    render(<ReportBuilderApp rows={[{ hours: 2 }]} reportDefinition={saved} role="viewer" />)
    expect(screen.queryByRole('note')).toBeNull()
  })

  it('shows everyone a warning when a host passes two formulas with the same name, using the first', () => {
    const definition = generateDefaultReportDefinition(createRecordsDataSource([{ hours: 2 }]).getSchema(), [])
    definition.formulas = [{ label: 'Fee', expression: '{{hours}} * 10' }, { label: 'fee', expression: '1' }]
    definition.fields = [{ id: 'fee', label: 'Fee', sourceKey: '%Fee', displayType: 'number', aggregation: 'none' }]
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    render(<ReportBuilderApp rows={[{ hours: 2 }]} reportDefinition={definition} role="viewer" />)
    expect(screen.getByRole('alert')).toHaveTextContent('Can\'t have two formulas with the same name: "fee".')
    expect(within(screen.getByRole('table')).getByRole('cell')).toHaveTextContent('20')
  })

  it('renames a flat client field to Client (flat billing equivalent)', async () => {
    const user = userEvent.setup()
    render(<ReportBuilderApp rows={[{ clientId: 'c1', client: 'Acme', hours: 4, rate: 250 }]} onSave={vi.fn()} initialEditMode />)
    const table = screen.getByRole('table')
    await user.click(screen.getByRole('button', { name: 'Edit COLUMN 2' }))
    expect(screen.getByLabelText('COLUMN 2')).toHaveValue('client')
    await user.clear(screen.getByLabelText('Display label'))
    await user.type(screen.getByLabelText('Display label'), 'Client')
    await user.click(screen.getByRole('button', { name: 'Save COLUMN 2' }))
    expect(within(table).getByRole('columnheader', { name: 'Client' })).toBeInTheDocument()
    expect(within(table).getByText('Acme')).toBeInTheDocument()
  })

  it('offers only clientId and hours for timeEntries, with no client name lookup', () => {
    const timeEntries = [{ clientId: 'c1', hours: 4 }, { clientId: 'c1', hours: 2 }, { clientId: 'c2', hours: 3 }]
    expect(createRecordsDataSource(timeEntries).getSchema().map((field) => field.key)).toEqual(['clientId', 'hours'])
    render(<ReportBuilderApp rows={timeEntries} role="viewer" />)
    expect(screen.getAllByRole('columnheader').map((header) => header.textContent)).toEqual(['clientId', 'hours'])
    expect(screen.queryByText('Acme')).toBeNull()
  })
})
