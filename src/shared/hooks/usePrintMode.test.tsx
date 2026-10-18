import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { usePrintMode } from './usePrintMode'

describe('usePrintMode', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    document.title = ''
  })

  it('switches to print mode for any print, and back afterwards', () => {
    const root = document.createElement('div')
    const { result } = renderHook(() => usePrintMode({ current: root }, 'Report'))

    act(() => {
      window.dispatchEvent(new Event('beforeprint'))
    })
    expect(result.current.isPrinting).toBe(true)

    act(() => {
      window.dispatchEvent(new Event('afterprint'))
    })
    expect(result.current.isPrinting).toBe(false)
  })

  it('prints only the report, titled for Save as PDF, then restores the page', () => {
    document.title = 'Host app'
    const root = document.createElement('div')
    document.body.appendChild(root)
    const print = vi.spyOn(window, 'print').mockImplementation(() => {
      expect(document.body).toHaveClass('fr-print-isolate')
      expect(root).toHaveClass('fr-print-target')
      expect(document.title).toBe('Q3 Sales')
    })
    const { result } = renderHook(() => usePrintMode({ current: root }, 'Q3 Sales'))

    act(() => result.current.print())
    act(() => {
      window.dispatchEvent(new Event('afterprint'))
    })

    expect(print).toHaveBeenCalledTimes(1)
    expect(document.body).not.toHaveClass('fr-print-isolate')
    expect(root).not.toHaveClass('fr-print-target')
    expect(document.title).toBe('Host app')
    root.remove()
  })
})
