import { act, renderHook } from '@testing-library/react'
import type { KeyboardEvent } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { filterOptions, useOptionsList } from './useOptionsList'

function key(name: string) {
  return { key: name, preventDefault: vi.fn() } as unknown as KeyboardEvent<HTMLInputElement>
}

describe('filterOptions', () => {
  it('keeps unique options containing the query, ignoring case and order', () => {
    expect(filterOptions(['Units', 'price', 'units', 'Unit cost'], ' UNIT ')).toEqual(['Units', 'units', 'Unit cost'])
    expect(filterOptions(['b', 'a', 'b'], '')).toEqual(['b', 'a'])
  })
})

describe('useOptionsList', () => {
  it('moves the highlight with arrow keys, within bounds, and selects with Enter', () => {
    const onSelect = vi.fn()
    const { result } = renderHook(() => useOptionsList(['a', 'b', 'c'], onSelect))
    act(() => result.current.setIsOpen(true))

    act(() => result.current.handleKeyDown(key('ArrowDown')))
    act(() => result.current.handleKeyDown(key('ArrowDown')))
    act(() => result.current.handleKeyDown(key('ArrowDown')))
    expect(result.current.highlightedIndex).toBe(2)
    act(() => result.current.handleKeyDown(key('ArrowUp')))
    act(() => result.current.handleKeyDown(key('Enter')))

    expect(onSelect).toHaveBeenCalledWith('b')
  })

  it('ignores keys while closed and closes on Escape', () => {
    const onSelect = vi.fn()
    const { result } = renderHook(() => useOptionsList(['a'], onSelect))

    act(() => result.current.handleKeyDown(key('Enter')))
    expect(onSelect).not.toHaveBeenCalled()

    act(() => result.current.setIsOpen(true))
    act(() => result.current.handleKeyDown(key('Escape')))
    expect(result.current.isOpen).toBe(false)
  })

  it('falls back to the first option when the list shrinks below the highlight', () => {
    const { result, rerender } = renderHook(({ options }) => useOptionsList(options, vi.fn()), { initialProps: { options: ['a', 'b', 'c'] } })
    act(() => result.current.setIsOpen(true))
    act(() => result.current.handleKeyDown(key('ArrowDown')))
    act(() => result.current.handleKeyDown(key('ArrowDown')))

    rerender({ options: ['a'] })

    expect(result.current.highlightedIndex).toBe(0)
  })

  it('closes on a click outside its container', () => {
    const { result } = renderHook(() => useOptionsList(['a'], vi.fn()))
    const inside = document.createElement('div')
    document.body.appendChild(inside)
    result.current.containerRef.current = inside
    act(() => result.current.setIsOpen(true))

    act(() => inside.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })))
    expect(result.current.isOpen).toBe(true)
    act(() => document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })))
    expect(result.current.isOpen).toBe(false)
  })
})
