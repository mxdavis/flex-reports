import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReportRow, SchemaField } from '../../services/adapters'
import { generateDefaultReportDefinition } from '../../services/reportDefinition/normalize'
import { SANDBOX_DEFINITION_STORAGE_KEY } from '../../services/reportDefinition/storage'
import type { ReportDefinition } from '../../services/reportDefinition/types'
import { installMemoryStorage } from '../../test/memoryStorage'
import { renderSandboxApp } from '../../test/renderSandboxApp'
import ReportBuilderApp from './ReportBuilderApp'

// A non-billing dataset: the builder must work with whatever the host sends.
const schema: SchemaField[] = [
  { id: 'warehouse', key: 'warehouse', label: 'Warehouse', dataType: 'string' },
  { id: 'units', key: 'units', label: 'Units', dataType: 'number' },
]
const rows: ReportRow[] = [
  { id: 'r1', warehouse: 'Austin', units: 12 },
  { id: 'r2', warehouse: 'Boston', units: 30 },
]
// Region groups, Warehouse names each row, Units is a value.
const groupedSchema: SchemaField[] = [
  { id: 'region', key: 'region', label: 'Region', dataType: 'string' },
  ...schema,
]
const groupedRows: ReportRow[] = [
  { id: 'r1', region: 'East', warehouse: 'Austin', units: 12 },
  { id: 'r2', region: 'East', warehouse: 'Boston', units: 30 },
  { id: 'r3', region: 'West', warehouse: 'Denver', units: 5 },
]
const savedDefinition: ReportDefinition = {
  ...generateDefaultReportDefinition(schema),
  sheetName: 'Inventory',
}

function getSaveButton() {
  return screen.getByRole('button', { name: 'Save report' })
}

async function renameSheet(user: ReturnType<typeof userEvent.setup>, name: string) {
  const input = screen.getByLabelText('Sheet name')
  await user.clear(input)
  await user.type(input, name)
}

describe('ReportBuilderApp host mode', () => {
  beforeEach(() => {
    installMemoryStorage()
    Object.defineProperty(HTMLElement.prototype, 'scrollTo', { value: () => undefined, configurable: true })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders host rows and the passed definition instead of seed data', () => {
    render(<ReportBuilderApp schema={schema} rows={rows} reportDefinition={savedDefinition} onSave={vi.fn()} />)

    const table = screen.getByRole('table')
    expect(screen.getByRole('heading', { name: 'Inventory' })).toBeInTheDocument()
    expect(within(table).getByText('Austin')).toBeInTheDocument()
    expect(within(table).getByRole('columnheader', { name: 'Units' })).toBeInTheDocument()
    expect(screen.queryByText('Work Date')).not.toBeInTheDocument()
  })

  it('calls onSave once with the full definition and never touches localStorage', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    render(<ReportBuilderApp schema={schema} rows={rows} reportDefinition={savedDefinition} onSave={onSave} initialEditMode />)

    expect(getSaveButton()).toBeDisabled()
    await renameSheet(user, 'Stock')
    expect(onSave).not.toHaveBeenCalled()

    await user.click(getSaveButton())

    expect(screen.getByText('Tip:')).toBeInTheDocument()
    expect(onSave).toHaveBeenCalledTimes(1)
    expect(onSave.mock.calls[0][0]).toMatchObject({ version: 1, sheetName: 'Stock', fields: savedDefinition.fields })
    expect(getSaveButton()).toBeDisabled()
    expect(window.localStorage.getItem(SANDBOX_DEFINITION_STORAGE_KEY)).toBeNull()
  })

  it('shows the host error when onSave rejects and keeps changes unsaved', async () => {
    const user = userEvent.setup()
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const onSave = vi.fn().mockRejectedValue(new Error('You do not have permission to edit this report.'))
    render(<ReportBuilderApp schema={schema} rows={rows} reportDefinition={savedDefinition} onSave={onSave} initialEditMode />)

    await renameSheet(user, 'Stock')
    await user.click(getSaveButton())

    expect(await screen.findByRole('alert')).toHaveTextContent('You do not have permission to edit this report.')
    expect(getSaveButton()).toBeEnabled()
  })

  it('lets a viewer explore in edit mode but never shows Save', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    render(<ReportBuilderApp schema={schema} rows={rows} reportDefinition={savedDefinition} role="viewer" onSave={onSave} />)

    await user.click(screen.getByRole('button', { name: 'Edit mode' }))
    await renameSheet(user, 'Just looking')

    expect(screen.getByRole('heading', { name: 'Just looking' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Save report' })).not.toBeInTheDocument()
    expect(screen.queryByText(/Tip:/)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Grouping' }).getAttribute('title')).not.toMatch(/Tip/)
    expect(onSave).not.toHaveBeenCalled()
  })

  it('opens on the saved default view', () => {
    const verticalDefinition: ReportDefinition = {
      ...savedDefinition,
      view: { orientation: 'vertical', showTotals: true, isGroupingEnabled: false, expandedLevels: null },
    }
    render(<ReportBuilderApp schema={schema} rows={rows} reportDefinition={verticalDefinition} role="viewer" />)

    expect(screen.getByRole('button', { name: 'Totals' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Grouping' })).toBeDisabled()
  })

  it('opens collapsed to the saved outline level and lets anyone open a single group', async () => {
    const user = userEvent.setup()
    const outlineDefinition: ReportDefinition = {
      ...generateDefaultReportDefinition(groupedSchema),
      view: { orientation: 'horizontal', showTotals: true, isGroupingEnabled: true, expandedLevels: 0 },
    }
    render(<ReportBuilderApp schema={groupedSchema} rows={groupedRows} reportDefinition={outlineDefinition} role="viewer" />)

    expect(screen.getByRole('combobox', { name: 'Show rows' })).toHaveValue('0')
    expect(screen.queryByText('Austin')).toBeNull()
    expect(screen.getByRole('button', { name: 'East' })).toHaveAttribute('aria-expanded', 'false')

    await user.click(screen.getByRole('button', { name: 'East' }))

    expect(screen.getByText('Austin')).toBeInTheDocument()
    expect(screen.queryByText('Denver')).toBeNull()
  })

  it('saves the outline level but not groups toggled by hand', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    const groupedDefinition: ReportDefinition = {
      ...generateDefaultReportDefinition(groupedSchema),
      view: { orientation: 'horizontal', showTotals: true, isGroupingEnabled: true, expandedLevels: null },
    }
    render(<ReportBuilderApp schema={groupedSchema} rows={groupedRows} reportDefinition={groupedDefinition} onSave={onSave} />)

    await user.click(screen.getByRole('button', { name: 'East' }))
    expect(getSaveButton()).toBeDisabled()

    await user.selectOptions(screen.getByRole('combobox', { name: 'Show rows' }), '0')
    await user.click(getSaveButton())

    expect(onSave.mock.calls[0][0].view).toEqual({
      orientation: 'horizontal',
      showTotals: true,
      isGroupingEnabled: true,
      expandedLevels: 0,
    })
  })

  it('warns before leaving only while there are unsaved changes', async () => {
    const user = userEvent.setup()
    render(<ReportBuilderApp schema={schema} rows={rows} reportDefinition={savedDefinition} onSave={vi.fn()} initialEditMode />)

    const cleanEvent = new Event('beforeunload', { cancelable: true })
    act(() => {
      window.dispatchEvent(cleanEvent)
    })
    expect(cleanEvent.defaultPrevented).toBe(false)

    await renameSheet(user, 'Stock')
    const dirtyEvent = new Event('beforeunload', { cancelable: true })
    act(() => {
      window.dispatchEvent(dirtyEvent)
    })
    expect(dirtyEvent.defaultPrevented).toBe(true)
  })

  it('keeps a column with a missing source in place and warns editors only', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const staleDefinition: ReportDefinition = {
      ...savedDefinition,
      fields: [...savedDefinition.fields, { ...savedDefinition.fields[1], id: 'gone', label: 'Old metric', sourceKey: 'removedField' }],
    }
    const { unmount } = render(<ReportBuilderApp schema={schema} rows={rows} reportDefinition={staleDefinition} onSave={vi.fn()} initialEditMode />)

    expect(screen.getByRole('columnheader', { name: 'Old metric (missing source)' })).toBeInTheDocument()
    expect(screen.getByText(/Source "removedField" isn't in the data or formulas/)).toBeInTheDocument()
    // Not repointed, so nothing changed and there is nothing to save.
    expect(getSaveButton()).toBeDisabled()
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('"Old metric" → "removedField"'))
    unmount()

    render(<ReportBuilderApp schema={schema} rows={rows} reportDefinition={staleDefinition} role="viewer" initialEditMode />)
    expect(screen.getByRole('columnheader', { name: 'Old metric' })).toBeInTheDocument()
    expect(screen.queryByText(/isn't in the data or formulas/)).not.toBeInTheDocument()
  })

  it('shows new type defaults in the column form when the source type changes', async () => {
    const user = userEvent.setup()
    const textSchema: SchemaField[] = [
      ...schema,
      { id: 'city', key: 'city', label: 'City', dataType: 'string' },
    ]
    const definition: ReportDefinition = {
      ...generateDefaultReportDefinition(textSchema),
      fields: generateDefaultReportDefinition(textSchema).fields.map((field) => (
        field.sourceKey === 'warehouse' ? { ...field, aggregation: 'none' } : field
      )),
    }
    const onSave = vi.fn()
    render(<ReportBuilderApp schema={textSchema} rows={rows} reportDefinition={definition} onSave={onSave} initialEditMode />)

    await user.click(screen.getByRole('button', { name: 'Edit COLUMN 1' }))
    // Same type (text → text): the customized Total type stays.
    fireEvent.change(screen.getByLabelText('COLUMN 1'), { target: { value: 'city' } })
    expect(screen.getByLabelText('Total type')).toHaveValue('none')

    // Different type (text → number): the form switches to number defaults.
    fireEvent.change(screen.getByLabelText('COLUMN 1'), { target: { value: 'units' } })
    expect(screen.getByLabelText('Display type')).toHaveValue('decimal')
    expect(screen.getByLabelText('Total type')).toHaveValue('sum')

    await user.click(screen.getByRole('button', { name: 'Save COLUMN 1' }))
    await user.click(getSaveButton())
    expect(onSave.mock.calls[0][0].fields[0]).toMatchObject({ sourceKey: 'units', displayType: 'decimal', aggregation: 'sum' })
  })

  it('infers columns and logs when rows come without a schema', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    render(<ReportBuilderApp rows={rows} role="viewer" />)

    expect(within(screen.getByRole('table')).getByRole('columnheader', { name: 'warehouse' })).toBeInTheDocument()
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('without `schema`'))
  })

  it('logs and hides Save when an editor has no onSave', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    render(<ReportBuilderApp schema={schema} rows={rows} />)

    expect(screen.queryByRole('button', { name: 'Save report' })).not.toBeInTheDocument()
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('without `onSave`'))
  })
})

describe('ReportBuilderApp sandbox mode', () => {
  beforeEach(() => {
    installMemoryStorage()
    Object.defineProperty(HTMLElement.prototype, 'scrollTo', { value: () => undefined, configurable: true })
  })

  it('shows a loading state until the sample data arrives', async () => {
    render(<ReportBuilderApp />)

    expect(screen.getByRole('status')).toHaveTextContent('Loading sample data…')
    expect(await screen.findByRole('table')).toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('does not autosave; Save writes the definition to localStorage', async () => {
    const user = userEvent.setup()
    await renderSandboxApp(<ReportBuilderApp initialEditMode />)

    await renameSheet(user, 'Sandbox report')
    expect(window.localStorage.getItem(SANDBOX_DEFINITION_STORAGE_KEY)).toBeNull()

    await user.click(getSaveButton())

    const stored = JSON.parse(window.localStorage.getItem(SANDBOX_DEFINITION_STORAGE_KEY) ?? '{}')
    expect(stored).toMatchObject({ version: 1, sheetName: 'Sandbox report' })
  })

  it('never writes to localStorage for a sandbox viewer', async () => {
    const user = userEvent.setup()
    await renderSandboxApp(<ReportBuilderApp role="viewer" initialEditMode />)

    await renameSheet(user, 'Viewer edit')

    expect(screen.queryByRole('button', { name: 'Save report' })).not.toBeInTheDocument()
    expect(window.localStorage.getItem(SANDBOX_DEFINITION_STORAGE_KEY)).toBeNull()
  })
})
