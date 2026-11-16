import { render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { PrintModeContext } from '../../../shared/hooks/usePrintMode'
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

  it('draws every row while printing', () => {
    const { container } = render(
      <PrintModeContext.Provider value>
        <table>
          <VirtualTableBody
            rowCount={2000}
            columnCount={1}
            scrollContainerRef={{ current: null }}
            renderRow={(index) => <tr key={index}><td>Row {index}</td></tr>}
          />
        </table>
      </PrintModeContext.Provider>,
    )

    expect(container.querySelectorAll('tbody tr')).toHaveLength(2000)
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
