import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import App from './App'

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

describe('App table/formula interactions', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'localStorage', {
      value: createMemoryStorage(),
      configurable: true,
    })

    Object.defineProperty(HTMLElement.prototype, 'scrollTo', {
      value: () => undefined,
      configurable: true,
    })

    window.localStorage.clear()
  })

  it('shows aggregate modes without count', () => {
    render(<App />)

    const aggregateSelect = screen.getByLabelText('Aggregate')
    const options = Array.from((aggregateSelect as HTMLSelectElement).options).map((option) => option.text)

    expect(options).toEqual(['None', 'Sum', 'Average'])
  })

  it('syncs mapped column source when a formula label is renamed', async () => {
    const user = userEvent.setup()
    render(<App />)

    const columnOneSource = screen.getByLabelText('column1') as HTMLInputElement
    fireEvent.change(columnOneSource, { target: { value: 'grossFees' } })
    expect(columnOneSource.value).toBe('grossFees')

    await user.click(screen.getAllByRole('button', { name: 'Edit' })[0])

    const formulaLabelInput = screen.getByLabelText('Label') as HTMLInputElement
    await user.clear(formulaLabelInput)
    await user.type(formulaLabelInput, 'Gross Renamed')

    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(columnOneSource.value).toBe('Gross Renamed')
  })
})
