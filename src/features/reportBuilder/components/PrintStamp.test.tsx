import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PrintModeContext } from '../../../shared/hooks/usePrintMode'
import PrintStamp from './PrintStamp'

describe('PrintStamp', () => {
  it('shows nothing on screen', () => {
    const { container } = render(<PrintStamp />)

    expect(container).toBeEmptyDOMElement()
  })

  it('shows when the report was printed, while printing', () => {
    render(<PrintModeContext.Provider value><PrintStamp /></PrintModeContext.Provider>)

    expect(screen.getByText(/^Printed /)).toBeInTheDocument()
  })
})
