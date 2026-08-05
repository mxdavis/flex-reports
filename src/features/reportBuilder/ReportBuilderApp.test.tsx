import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ReportBuilderApp from './ReportBuilderApp'

function createMemoryStorage(): Storage {
  const store = new Map<string, string>()

  return {
    get length() {
      return store.size
    },
    clear() {
      store.clear()
    },
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null
    },
    removeItem(key: string) {
      store.delete(key)
    },
    setItem(key: string, value: string) {
      store.set(key, value)
    },
  }
}

describe('ReportBuilderApp', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'localStorage', {
      value: createMemoryStorage(),
      configurable: true,
    })

    Object.defineProperty(HTMLElement.prototype, 'scrollTo', {
      value: () => undefined,
      configurable: true,
    })

    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      value: () => undefined,
      configurable: true,
    })

    window.localStorage.clear()
  })

  it('renders sample rows section', () => {
    render(<ReportBuilderApp />)

    expect(screen.getByRole('heading', { name: 'Sample rows' })).toBeInTheDocument()
  })

  it('shows summary chips above chart in view mode', () => {
    const { container } = render(<ReportBuilderApp />)

    expect(screen.getByRole('heading', { name: 'Rate (sum)' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Hours (sum)' })).toBeInTheDocument()

    const stats = container.querySelector('.seed-stats')
    const chart = container.querySelector('#report-chart')
    expect(stats).toBeTruthy()
    expect(chart).toBeTruthy()
    if (!stats || !chart) {
      return
    }

    const position = stats.compareDocumentPosition(chart)
    expect((position & Node.DOCUMENT_POSITION_FOLLOWING) !== 0).toBe(true)
  })

  it('updates chart/table heading when sheet name changes in header', async () => {
    const user = userEvent.setup()
    render(<ReportBuilderApp initialEditMode />)

    const sheetNameInput = screen.getByLabelText('Sheet name') as HTMLInputElement
    await user.clear(sheetNameInput)
    await user.type(sheetNameInput, 'Client Utilization')

    expect(screen.getByRole('heading', { name: 'Client Utilization' })).toBeInTheDocument()
  })

  it('shows aggregate modes without count', () => {
    render(<ReportBuilderApp />)

    const aggregateSelect = screen.getByLabelText('Aggregate')
    const options = Array.from((aggregateSelect as HTMLSelectElement).options).map((option) => option.text)

    expect(options).toEqual(['None', 'Sum', 'Average'])
  })

  it('syncs mapped column source when a formula label is renamed', async () => {
    const user = userEvent.setup()
    render(<ReportBuilderApp initialEditMode />)

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
    render(<ReportBuilderApp initialEditMode />)

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
    render(<ReportBuilderApp initialEditMode />)

    await user.click(screen.getByRole('button', { name: 'Edit COLUMN 1' }))
    await user.click(screen.getByTitle('Show options'))

    const suggestions = within(screen.getByRole('listbox', { name: 'Suggestions' }))
      .getAllByRole('button')
      .map((button) => button.textContent ?? '')
    const sortedSuggestions = [...suggestions]
      .sort((left, right) => left.localeCompare(right, undefined, { sensitivity: 'base' }))

    expect(suggestions).toEqual(sortedSuggestions)
  })

  it('re-sorts formulas alphabetically after saving an edited label', async () => {
    const user = userEvent.setup()
    render(<ReportBuilderApp initialEditMode />)

    const formulasSection = screen.getByRole('heading', { name: 'Seeded formulas' }).closest('section')
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

    const labels = Array.from(formulasSection.querySelectorAll('.formula-card-list .editable-card-summary strong'))
      .map((node) => node.textContent?.trim() ?? '')
      .filter(Boolean)

    expect(labels[0]).toBe('AaaFormula')
    expect(labels).toEqual([...labels].sort((left, right) => left.localeCompare(right, undefined, { sensitivity: 'base' })))
  })

  it('inserts a new column at selected position and shifts following columns', async () => {
    const user = userEvent.setup()
    render(<ReportBuilderApp initialEditMode />)

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

  it('shows sticky jump links in edit mode and scrolls to anchor sections', async () => {
    const user = userEvent.setup()
    render(<ReportBuilderApp initialEditMode />)

    const formulasSection = document.getElementById('report-formulas')
    expect(formulasSection).toBeTruthy()
    if (!formulasSection) {
      return
    }

    const scrollSpy = vi.spyOn(HTMLElement.prototype, 'scrollIntoView').mockImplementation(() => undefined)

    await user.click(screen.getByRole('button', { name: 'Formulas' }))

    expect(scrollSpy).toHaveBeenCalled()
    expect(window.location.hash).toBe('#report-formulas')
    scrollSpy.mockRestore()
  })

  it('prevents switching column edit when unsaved changes are not confirmed', async () => {
    const user = userEvent.setup()
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)
    render(<ReportBuilderApp initialEditMode />)

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
    render(<ReportBuilderApp initialEditMode />)

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
