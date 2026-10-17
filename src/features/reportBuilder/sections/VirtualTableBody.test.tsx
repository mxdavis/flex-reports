import { render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import VirtualTableBody from './VirtualTableBody'

function renderBody(rowCount: number) {
  return render(
    <table>
      <VirtualTableBody
        rowCount={rowCount}
        columnCount={2}
        scrollContainerRef={{ current: null }}
        renderRow={(index, measureRef) => <tr key={index} ref={measureRef}><td>Row {index}</td><td>{index}</td></tr>}
      />
    </table>,
  )
}

describe('VirtualTableBody', () => {
  it('renders every row when they all fit', () => {
    const { container } = renderBody(10)

    expect(container.querySelectorAll('tbody tr')).toHaveLength(10)
    expect(container.querySelector('.fr-spacer-row')).toBeNull()
  })

  it('renders only the first window and a spacer for the rest', () => {
    const { container, getByText, queryByText } = renderBody(10000)

    expect(getByText('Row 0')).toBeInTheDocument()
    expect(queryByText('Row 9999')).toBeNull()
    const spacer = container.querySelector('.fr-spacer-row') as HTMLTableRowElement
    expect(spacer).toHaveAttribute('aria-hidden', 'true')
    expect(parseFloat(spacer.style.height)).toBeGreaterThan(100000)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('measures the row height once, so rows of slightly different heights cannot loop', () => {
    // Alternate heights on every measurement, like group vs detail rows.
    let call = 0
    const measure = vi.spyOn(HTMLTableRowElement.prototype, 'getBoundingClientRect').mockImplementation(() => {
      call += 1
      return { height: call % 2 ? 37 : 39 } as DOMRect
    })

    const { container, rerender } = renderBody(10000)
    rerender(
      <table>
        <VirtualTableBody
          rowCount={9000}
          columnCount={2}
          scrollContainerRef={{ current: null }}
          renderRow={(index, measureRef) => <tr key={index} ref={measureRef}><td>Row {index}</td><td>{index}</td></tr>}
        />
      </table>,
    )

    expect(measure).toHaveBeenCalledTimes(1)
    expect(container.querySelectorAll('tbody tr:not(.fr-spacer-row)').length).toBeLessThan(100)
  })
})
