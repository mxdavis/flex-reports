import { afterEach, describe, expect, it, vi } from 'vitest'
import { downloadFile, toFileName } from './downloadFile'

describe('toFileName', () => {
  it('replaces characters file systems reject and falls back when empty', () => {
    expect(toFileName('Q3: North/South', 'csv')).toBe('Q3- North-South.csv')
    expect(toFileName('  ', 'xlsx')).toBe('Report.xlsx')
  })
})

describe('downloadFile', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('clicks a temporary link to the content, then cleans up', () => {
    vi.useFakeTimers()
    const createUrl = vi.fn(() => 'blob:report')
    const revokeUrl = vi.fn()
    Object.assign(URL, { createObjectURL: createUrl, revokeObjectURL: revokeUrl })
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      expect(this.download).toBe('Report.csv')
      expect(this.href).toBe('blob:report')
    })

    downloadFile('Report.csv', 'a,b', 'text/csv')

    expect(click).toHaveBeenCalledTimes(1)
    expect(document.querySelector('a[download]')).toBeNull()
    vi.runAllTimers()
    expect(revokeUrl).toHaveBeenCalledWith('blob:report')
  })
})
