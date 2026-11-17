import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createRecordsDataSource } from '../../services/adapters/recordsDataSource'
import type { ReportDefinition } from '../../services/reportDefinition/types'
import { installMemoryStorage } from '../../test/memoryStorage'
import { reportWithColumns } from '../../test/reportWithColumns'
import ReportBuilderApp from './ReportBuilderApp'

const rows = [{ client: { name: 'Acme' }, task: 'Draft', hours: 4 }, { client: { name: 'Beta' }, task: 'Review', hours: 2 }]

function headers(): string[] {
  return within(screen.getByRole('table')).getAllByRole('columnheader').map((header) => header.textContent ?? '')
}

describe('Getting started on a blank report', () => {
  beforeEach(() => {
    installMemoryStorage()
    Object.defineProperty(HTMLElement.prototype, 'scrollTo', { value: () => undefined, configurable: true })
  })

  it('starts blank, adds ticked fields as columns in order, and removes unticked ones', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    render(<ReportBuilderApp rows={rows} onSave={onSave} initialEditMode />)
    expect(screen.getByText('This report has no columns yet.')).toBeInTheDocument()
    expect(screen.getByText(/2 rows loaded/)).toBeInTheDocument()

    await user.click(screen.getByRole('checkbox', { name: 'task' }))
    await user.click(screen.getByRole('checkbox', { name: 'client.name' }))
    expect(headers()).toEqual(['task', 'client.name'])

    await user.click(screen.getByRole('checkbox', { name: 'task' }))
    expect(headers()).toEqual(['client.name'])

    await user.click(screen.getByRole('button', { name: 'Save report' }))
    expect((onSave.mock.calls[0][0] as ReportDefinition).fields.map((field) => field.sourceKey)).toEqual(['client.name'])
  })

  it('stays until the report is saved with columns, and then for good', async () => {
    const user = userEvent.setup()
    render(<ReportBuilderApp rows={rows} onSave={vi.fn()} initialEditMode />)
    await user.click(screen.getByRole('checkbox', { name: 'task' }))
    expect(screen.getByRole('heading', { name: 'Getting started' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Save report' }))
    expect(screen.queryByRole('heading', { name: 'Getting started' })).toBeNull()

    await user.click(screen.getByRole('button', { name: 'Remove' }))
    expect(screen.queryByRole('heading', { name: 'Getting started' })).toBeNull()
    expect(screen.getByRole('status')).toHaveTextContent('This report has no columns yet. Add one with Add column.')
  })

  it('stays after saving a report that still has no columns', async () => {
    const user = userEvent.setup()
    render(<ReportBuilderApp rows={rows} onSave={vi.fn()} initialEditMode />)
    await user.type(screen.getByLabelText('Sheet name'), ' 2026')
    await user.click(screen.getByRole('button', { name: 'Save report' }))
    expect(screen.getByRole('heading', { name: 'Getting started' })).toBeInTheDocument()
  })

  it('stays hidden when a saved report with columns opens', () => {
    const definition = reportWithColumns(createRecordsDataSource(rows).getSchema())
    render(<ReportBuilderApp rows={rows} reportDefinition={definition} onSave={vi.fn()} initialEditMode />)
    expect(screen.queryByRole('heading', { name: 'Getting started' })).toBeNull()
  })

  it('shows only the no-columns message when there are no rows either', () => {
    render(<ReportBuilderApp rows={[]} onSave={vi.fn()} initialEditMode />)
    expect(screen.getByText('This report has no columns yet.')).toBeInTheDocument()
    expect(screen.queryByText('No rows')).toBeNull()
  })

  it('tells someone outside edit mode to open it', () => {
    render(<ReportBuilderApp rows={rows} role="viewer" />)
    expect(screen.getByRole('status')).toHaveTextContent('This report has no columns yet. Open Edit mode to choose its columns.')
    expect(screen.queryByRole('table')).toBeNull()
  })
})
