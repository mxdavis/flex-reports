import { beforeEach, describe, expect, it, vi } from 'vitest'
import { installMemoryStorage } from '../../test/memoryStorage'
import { generateDefaultReportDefinition } from './normalize'
import { loadSandboxDefinition, SANDBOX_DEFINITION_STORAGE_KEY, saveSandboxDefinition } from './storage'
import type { SourceColumn } from './types'

const sourceColumns: SourceColumn[] = [
  { id: 'name', key: 'name', label: 'Name', dataType: 'string' },
  { id: 'score', key: 'score', label: 'Score', dataType: 'number' },
]
const seedFormulas = [{ label: 'double', expression: '{{score}} * 2' }]

describe('sandbox definition storage', () => {
  beforeEach(() => {
    installMemoryStorage()
  })

  it('returns defaults with seed formulas when nothing is saved', () => {
    expect(loadSandboxDefinition(sourceColumns, seedFormulas))
      .toEqual(generateDefaultReportDefinition(sourceColumns, seedFormulas))
  })

  it('saves and reloads a definition', () => {
    const definition = { ...generateDefaultReportDefinition(sourceColumns, []), sheetName: 'Scores' }

    saveSandboxDefinition(definition)

    expect(window.localStorage.getItem(SANDBOX_DEFINITION_STORAGE_KEY)).toBeTruthy()
    expect(loadSandboxDefinition(sourceColumns, seedFormulas)).toEqual(definition)
  })

  it('falls back to defaults and logs when stored JSON is corrupt', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    window.localStorage.setItem(SANDBOX_DEFINITION_STORAGE_KEY, '{not json')

    expect(loadSandboxDefinition(sourceColumns, seedFormulas))
      .toEqual(generateDefaultReportDefinition(sourceColumns, seedFormulas))
    expect(errorSpy).toHaveBeenCalled()
    errorSpy.mockRestore()
  })
})
