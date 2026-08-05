import { beforeEach, describe, expect, it } from 'vitest'
import type { SeedFormula } from '../adapters'
import {
  FORMULA_DATA_STORAGE_KEY,
  loadFormulaData,
  saveFormulaData,
} from './formulaStorage'

const fallbackFormulas: SeedFormula[] = [
  { label: 'Gross', expression: '{{hours}} * {{rate}}' },
  { label: 'Write Down', expression: '{{grossFees}} * 10%' },
]

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

describe('formula storage', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'localStorage', {
      value: createMemoryStorage(),
      configurable: true,
    })

    window.localStorage.clear()
  })

  it('loads fallback formulas when nothing is saved', () => {
    const loaded = loadFormulaData(fallbackFormulas)

    expect(loaded).toEqual(fallbackFormulas)
  })

  it('saves formulas and reloads them', () => {
    const updated: SeedFormula[] = [
      ...fallbackFormulas,
      { label: 'Margin %', expression: '{{netFees}} / {{grossFees}}' },
    ]

    saveFormulaData(updated)
    const loaded = loadFormulaData(fallbackFormulas)

    expect(loaded).toEqual(updated)
  })

  it('falls back when stored value is invalid', () => {
    window.localStorage.setItem(FORMULA_DATA_STORAGE_KEY, JSON.stringify({ bad: true }))

    const loaded = loadFormulaData(fallbackFormulas)
    expect(loaded).toEqual(fallbackFormulas)
  })

  it('keeps explicitly saved empty formula list', () => {
    window.localStorage.setItem(FORMULA_DATA_STORAGE_KEY, JSON.stringify([]))

    const loaded = loadFormulaData(fallbackFormulas)
    expect(loaded).toEqual([])
  })
})