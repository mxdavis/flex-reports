import { fireEvent, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { installMemoryStorage } from '../../test/memoryStorage'
import ReportBuilderApp from './ReportBuilderApp'
import { renderSandboxApp } from '../../test/renderSandboxApp'

describe('ReportBuilderApp', () => {
  beforeEach(() => {
    installMemoryStorage()

    Object.defineProperty(HTMLElement.prototype, 'scrollTo', {
      value: () => undefined,
      configurable: true,
    })

    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      value: () => undefined,
      configurable: true,
    })
  })

  it('renders the report table section', async () => {
    await renderSandboxApp(<ReportBuilderApp sandbox />)

    expect(screen.getByRole('heading', { name: 'Report' })).toBeInTheDocument()
  })

  it('shows summary chips above table in view mode', async () => {
    const { container } = await renderSandboxApp(<ReportBuilderApp sandbox />)

    expect(screen.getByRole('heading', { name: 'Rate (sum)' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Hours (sum)' })).toBeInTheDocument()

    const stats = container.querySelector('.fr-summary-chips')
    const table = container.querySelector('.fr-report-table')
    expect(stats).toBeTruthy()
    expect(table).toBeTruthy()
    if (!stats || !table) {
      return
    }

    const position = stats.compareDocumentPosition(table)
    expect((position & Node.DOCUMENT_POSITION_FOLLOWING) !== 0).toBe(true)
  })

  it('updates table heading when sheet name changes in header', async () => {
    const user = userEvent.setup()
    await renderSandboxApp(<ReportBuilderApp sandbox initialEditMode />)

    const sheetNameInput = screen.getByLabelText('Sheet name') as HTMLInputElement
    await user.clear(sheetNameInput)
    await user.type(sheetNameInput, 'Client Utilization')

    expect(screen.getByRole('heading', { name: 'Client Utilization' })).toBeInTheDocument()
  })

  it('turns table totals on and off with the Totals toggle', async () => {
    const user = userEvent.setup()
    await renderSandboxApp(<ReportBuilderApp sandbox />)

    expect(screen.queryByRole('rowheader', { name: 'Total' })).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Totals' }))
    expect(screen.getByRole('rowheader', { name: 'Total' })).toBeInTheDocument()
  })

  it('syncs mapped column source when a formula label is renamed', async () => {
    const user = userEvent.setup()
    await renderSandboxApp(<ReportBuilderApp sandbox initialEditMode />)

    await user.click(screen.getByRole('button', { name: 'Edit COLUMN 1' }))
    let columnOneSource = screen.getByLabelText('COLUMN 1') as HTMLInputElement
    fireEvent.change(columnOneSource, { target: { value: 'grossFees' } })
    expect(columnOneSource.value).toBe('grossFees')
    await user.click(screen.getByRole('button', { name: 'Save COLUMN 1' }))

    await user.click(screen.getAllByRole('button', { name: 'Edit' })[0])

    const formulaLabelInput = screen.getByLabelText('Label') as HTMLInputElement
    await user.clear(formulaLabelInput)
    await user.type(formulaLabelInput, 'Gross Renamed')

    await user.click(screen.getByRole('button', { name: 'Save' }))
    await user.click(screen.getByRole('button', { name: 'Edit COLUMN 1' }))
    columnOneSource = screen.getByLabelText('COLUMN 1') as HTMLInputElement
    expect(columnOneSource.value).toBe('Gross Renamed')
  })

  it('reverts blank column edits on save', async () => {
    const user = userEvent.setup()
    await renderSandboxApp(<ReportBuilderApp sandbox initialEditMode />)

    await user.click(screen.getByRole('button', { name: 'Edit COLUMN 1' }))
    const sourceInput = screen.getByLabelText('COLUMN 1') as HTMLInputElement
    const labelInput = screen.getByLabelText('Display label') as HTMLInputElement

    fireEvent.change(sourceInput, { target: { value: '' } })
    fireEvent.change(labelInput, { target: { value: '' } })

    await user.click(screen.getByRole('button', { name: 'Save COLUMN 1' }))
    await user.click(screen.getByRole('button', { name: 'Edit COLUMN 1' }))

    expect((screen.getByLabelText('COLUMN 1') as HTMLInputElement).value).toBe('workDate')
    expect((screen.getByLabelText('Display label') as HTMLInputElement).value).toBe('Work Date')
  })

  it('sorts autocomplete suggestions alphabetically', async () => {
    const user = userEvent.setup()
    await renderSandboxApp(<ReportBuilderApp sandbox initialEditMode />)

    await user.click(screen.getByRole('button', { name: 'Edit COLUMN 1' }))
    await user.click(screen.getByTitle('Show options'))

    const suggestions = within(screen.getByRole('listbox', { name: 'Suggestions' }))
      .getAllByRole('option')
      .map((button) => button.textContent ?? '')
    const sortedSuggestions = [...suggestions]
      .sort((left, right) => left.localeCompare(right, undefined, { sensitivity: 'base' }))

    expect(suggestions).toEqual(sortedSuggestions)
  })

  it('re-sorts formulas alphabetically after saving an edited label', async () => {
    const user = userEvent.setup()
    await renderSandboxApp(<ReportBuilderApp sandbox initialEditMode />)

    const formulasSection = screen.getByRole('heading', { name: 'Formulas' }).closest('section')
    expect(formulasSection).toBeTruthy()
    if (!formulasSection) {
      return
    }

    const writeDownCard = within(formulasSection).getByText('writeDown').closest('article')
    expect(writeDownCard).toBeTruthy()
    if (!writeDownCard) {
      return
    }

    await user.click(within(writeDownCard).getByRole('button', { name: 'Edit' }))

    const formulaLabelInput = screen.getByDisplayValue('writeDown') as HTMLInputElement
    await user.clear(formulaLabelInput)
    await user.type(formulaLabelInput, 'AaaFormula')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    const labels = Array.from(formulasSection.querySelectorAll('.fr-formula-card-list .fr-editable-card-summary strong'))
      .map((node) => node.textContent?.trim() ?? '')
      .filter(Boolean)

    expect(labels[0]).toBe('AaaFormula')
    expect(labels).toEqual([...labels].sort((left, right) => left.localeCompare(right, undefined, { sensitivity: 'base' })))
  })

  it('inserts a new column at selected position and shifts following columns', async () => {
    const user = userEvent.setup()
    await renderSandboxApp(<ReportBuilderApp sandbox initialEditMode />)

    await user.click(screen.getByRole('button', { name: 'Edit COLUMN 2' }))
    const columnTwoSource = screen.getByLabelText('COLUMN 2') as HTMLInputElement
    const originalColumnTwoSource = columnTwoSource.value
    await user.click(screen.getByRole('button', { name: 'Cancel COLUMN 2' }))

    await user.click(screen.getByRole('button', { name: 'Add column' }))
    await user.selectOptions(screen.getByLabelText('Column number'), '2')
    await user.click(screen.getByRole('button', { name: 'Save column' }))

    await user.click(screen.getByRole('button', { name: 'Edit COLUMN 3' }))
    const columnThreeSource = screen.getByLabelText('COLUMN 3') as HTMLInputElement
    expect(columnThreeSource.value).toBe(originalColumnTwoSource)
  })

  it('shows sticky jump links in edit mode and scrolls to sections without touching the URL', async () => {
    const user = userEvent.setup()
    await renderSandboxApp(<ReportBuilderApp sandbox initialEditMode />)
    const urlBefore = window.location.href

    const formulasSection = screen.getByRole('heading', { name: 'Formulas' }).closest('section')
    expect(formulasSection).toBeTruthy()
    if (!formulasSection) {
      return
    }

    const scrollSpy = vi.spyOn(HTMLElement.prototype, 'scrollIntoView').mockImplementation(() => undefined)

    await user.click(screen.getByRole('button', { name: 'Formulas' }))

    expect(scrollSpy.mock.contexts).toContain(formulasSection)
    // The URL belongs to the host app.
    expect(window.location.href).toBe(urlBefore)
    scrollSpy.mockRestore()
  })

  it('collapses and expands settings, columns, and formulas in edit mode', async () => {
    const user = userEvent.setup()
    await renderSandboxApp(<ReportBuilderApp sandbox initialEditMode />)

    await user.click(screen.getByRole('button', { name: 'Collapse settings' }))
    expect(screen.queryByLabelText('Sheet name')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Expand settings' }))
    expect(screen.getByLabelText('Sheet name')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Collapse columns' }))
    expect(screen.queryByRole('button', { name: 'Add column' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Expand columns' }))
    expect(screen.getByRole('button', { name: 'Add column' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Collapse formulas' }))
    expect(screen.queryByRole('button', { name: 'Add formula' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Expand formulas' }))
    expect(screen.getByRole('button', { name: 'Add formula' })).toBeInTheDocument()
  })

  it('disables grouping in vertical view and restores it in horizontal, without marking the report unsaved', async () => {
    const user = userEvent.setup()
    await renderSandboxApp(<ReportBuilderApp sandbox initialEditMode />)

    const groupingButton = screen.getByRole('button', { name: 'Grouping' })
    await user.click(groupingButton)
    expect(groupingButton).toHaveAttribute('aria-pressed', 'true')

    await user.click(screen.getByRole('button', { name: 'Vertical view' }))
    const groupingButtonInVertical = screen.getByRole('button', { name: 'Grouping' })
    expect(groupingButtonInVertical).toBeDisabled()
    expect(groupingButtonInVertical).toHaveAttribute('aria-pressed', 'false')

    await user.click(screen.getByRole('button', { name: 'Horizontal view' }))
    expect(screen.getByRole('button', { name: 'Grouping' })).toHaveAttribute('aria-pressed', 'true')

    // Grouping on, then a round trip through vertical: only the grouping change is unsaved.
    await user.click(screen.getByRole('button', { name: 'Grouping' }))
    expect(screen.getByRole('button', { name: 'Save report' })).toBeDisabled()
  })

  it('prevents switching column edit when unsaved changes are not confirmed', async () => {
    const user = userEvent.setup()
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)
    await renderSandboxApp(<ReportBuilderApp sandbox initialEditMode />)

    await user.click(screen.getByRole('button', { name: 'Edit COLUMN 1' }))
    fireEvent.change(screen.getByLabelText('Display label'), { target: { value: 'Changed Label' } })

    await user.click(screen.getByRole('button', { name: 'Edit COLUMN 2' }))

    expect(confirmSpy).toHaveBeenCalled()
    expect(screen.getByLabelText('Display label')).toHaveValue('Changed Label')
    expect(screen.queryByRole('button', { name: 'Save COLUMN 2' })).not.toBeInTheDocument()

    confirmSpy.mockRestore()
  })

  it('saves current column before switching when confirm is accepted', async () => {
    const user = userEvent.setup()
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    await renderSandboxApp(<ReportBuilderApp sandbox initialEditMode />)

    await user.click(screen.getByRole('button', { name: 'Edit COLUMN 1' }))
    fireEvent.change(screen.getByLabelText('Display label'), { target: { value: 'Saved Label' } })

    await user.click(screen.getByRole('button', { name: 'Edit COLUMN 2' }))

    expect(confirmSpy).toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Save COLUMN 2' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Cancel COLUMN 2' }))
    await user.click(screen.getByRole('button', { name: 'Edit COLUMN 1' }))
    expect(screen.getByLabelText('Display label')).toHaveValue('Saved Label')

    confirmSpy.mockRestore()
  })
})
