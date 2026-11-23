import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App, { SAMPLE_DATA_URL } from './App'
import { SAVED_REPORT_STORAGE_KEY } from './app/savedReport'
import { installMemoryStorage } from './test/memoryStorage'
import { SAMPLE_RECORDS } from './test/sampleReport'

function serveSample() {
  return vi.spyOn(globalThis, 'fetch').mockImplementation(async () => new Response(JSON.stringify(SAMPLE_RECORDS)))
}

async function renameSheet(user: ReturnType<typeof userEvent.setup>, name: string) {
  const input = screen.getByLabelText('Sheet name')
  await user.clear(input)
  await user.type(input, name)
}

describe('the app', () => {
  beforeEach(() => {
    installMemoryStorage()
    Object.defineProperty(HTMLElement.prototype, 'scrollTo', { value: () => undefined, configurable: true })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('loads the sample endpoint, then offers every field found in it', async () => {
    const fetchSpy = serveSample()
    render(<App initialEditMode />)

    expect(screen.getByRole('status')).toHaveTextContent('Loading report…')
    expect(await screen.findByRole('checkbox', { name: 'client.name' })).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: 'hours' })).toBeInTheDocument()
    expect(String(fetchSpy.mock.calls[0][0])).toBe(new URL(SAMPLE_DATA_URL, document.baseURI).href)
    expect(screen.getByRole('link', { name: 'Download sample JSON' })).toHaveAttribute('href', SAMPLE_DATA_URL)
  })

  it('shows why the sample didn\'t load, and loads it on Try again', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response('', { status: 500 }))
    const user = userEvent.setup()
    render(<App initialEditMode />)

    expect(await screen.findByRole('alert')).toHaveTextContent('The address answered with an error (500).')
    fetchSpy.mockImplementation(async () => new Response(JSON.stringify(SAMPLE_RECORDS)))
    await user.click(screen.getByRole('button', { name: 'Try again' }))

    expect(await screen.findByRole('checkbox', { name: 'hours' })).toBeInTheDocument()
  })

  it('saves the report in this browser only on Save, and reopens it', async () => {
    serveSample()
    const user = userEvent.setup()
    const { unmount } = render(<App initialEditMode />)
    await user.click(await screen.findByRole('checkbox', { name: 'hours' }))
    await renameSheet(user, 'Hours report')
    expect(window.localStorage.getItem(SAVED_REPORT_STORAGE_KEY)).toBeNull()

    await user.click(screen.getByRole('button', { name: 'Save report' }))
    expect(JSON.parse(window.localStorage.getItem(SAVED_REPORT_STORAGE_KEY) ?? '{}')).toMatchObject({ sheetName: 'Hours report' })

    unmount()
    render(<App />)
    expect(await screen.findByRole('heading', { name: 'Hours report' })).toBeInTheDocument()
  })

  it('never saves for a viewer', async () => {
    serveSample()
    const user = userEvent.setup()
    render(<App role="viewer" initialEditMode />)
    await screen.findByLabelText('Sheet name')

    await renameSheet(user, 'Viewer edit')

    expect(screen.queryByRole('button', { name: 'Save report' })).not.toBeInTheDocument()
    expect(window.localStorage).toHaveLength(0)
  })

  it('deletes the saved report and starts again on Reset to sample', async () => {
    serveSample()
    const user = userEvent.setup()
    render(<App initialEditMode />)
    await user.click(await screen.findByRole('checkbox', { name: 'hours' }))
    await renameSheet(user, 'Hours report')
    await user.click(screen.getByRole('button', { name: 'Save report' }))

    await user.click(screen.getByRole('button', { name: 'Reset to sample' }))
    await user.click(screen.getByRole('button', { name: 'Delete and start over' }))

    expect(screen.queryByRole('dialog')).toBeNull()
    await waitFor(() => expect(screen.getByLabelText('Sheet name')).not.toHaveValue('Hours report'))
    expect(window.localStorage.getItem(SAVED_REPORT_STORAGE_KEY)).toBeNull()
    expect(screen.getByRole('checkbox', { name: 'hours' })).not.toBeChecked()
  })

  it('keeps the saved report when Reset to sample is cancelled', async () => {
    serveSample()
    const user = userEvent.setup()
    render(<App initialEditMode />)
    await user.click(await screen.findByRole('checkbox', { name: 'hours' }))
    await renameSheet(user, 'Hours report')
    await user.click(screen.getByRole('button', { name: 'Save report' }))

    await user.click(screen.getByRole('button', { name: 'Reset to sample' }))
    expect(screen.getByRole('dialog', { name: 'Start over with the sample data?' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.getByLabelText('Sheet name')).toHaveValue('Hours report')
    expect(window.localStorage.getItem(SAVED_REPORT_STORAGE_KEY)).not.toBeNull()
  })

  describe('with your own data', () => {
    const OWN_RECORDS = [{ product: 'Cable', qty: 3 }, { product: 'Plug', qty: 5 }]

    async function pasteJson(user: ReturnType<typeof userEvent.setup>, text: string) {
      await user.click(await screen.findByRole('button', { name: 'Paste JSON' }))
      fireEvent.change(screen.getByLabelText(/Paste a list of records/), { target: { value: text } })
      await user.click(screen.getByRole('button', { name: 'Load' }))
    }

    it('replaces the report with pasted records after confirming', async () => {
      serveSample()
      const user = userEvent.setup()
      window.localStorage.setItem(SAVED_REPORT_STORAGE_KEY, JSON.stringify({ sheetName: 'Old report' }))
      render(<App initialEditMode />)

      await pasteJson(user, JSON.stringify(OWN_RECORDS))
      const dialog = screen.getByRole('dialog', { name: 'Replace your report?' })
      await user.click(within(dialog).getByRole('button', { name: 'Replace report' }))

      expect(await screen.findByRole('checkbox', { name: 'product' })).toBeInTheDocument()
      expect(screen.queryByRole('checkbox', { name: 'hours' })).not.toBeInTheDocument()
      // The paste box has closed, so focus goes to Paste JSON, not the page.
      expect(screen.getByRole('button', { name: 'Paste JSON' })).toHaveFocus()
      expect(screen.getByRole('region', { name: 'Report data' })).toHaveTextContent('pasted data · 2 records')
      expect(screen.queryByRole('link', { name: 'Download sample JSON' })).not.toBeInTheDocument()
      expect(window.localStorage.getItem(SAVED_REPORT_STORAGE_KEY)).toBeNull()
    })

    it('keeps the current report when the replace is cancelled', async () => {
      serveSample()
      const user = userEvent.setup()
      render(<App initialEditMode />)

      await pasteJson(user, JSON.stringify(OWN_RECORDS))
      await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancel' }))

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      expect(screen.getByRole('checkbox', { name: 'hours' })).toBeInTheDocument()
      // The pasted text is still there, and focus is back on Load.
      expect(screen.getByLabelText(/Paste a list of records/)).toHaveValue(JSON.stringify(OWN_RECORDS))
      expect(screen.getByRole('button', { name: 'Load' })).toHaveFocus()
    })

    it('explains bad JSON where it was pasted, and changes nothing', async () => {
      serveSample()
      const user = userEvent.setup()
      render(<App initialEditMode />)

      await pasteJson(user, '[{"product": "Cable"},')

      expect(screen.getByRole('alert')).toHaveTextContent('may be cut off')
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      expect(screen.getByLabelText(/Paste a list of records/)).toHaveValue('[{"product": "Cable"},')
      expect(screen.getByRole('checkbox', { name: 'hours' })).toBeInTheDocument()
    })

    it('clears an old error when the paste box closes, whichever way', async () => {
      serveSample()
      const user = userEvent.setup()
      render(<App initialEditMode />)

      await pasteJson(user, 'not json')
      expect(screen.getByRole('alert')).toBeInTheDocument()
      await user.click(screen.getByRole('button', { name: 'Paste JSON' }))

      expect(screen.queryByLabelText(/Paste a list of records/)).not.toBeInTheDocument()
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })

    function serveSampleAnd(address: string, response: () => Response) {
      return vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => (
        String(url) === address ? response() : new Response(JSON.stringify(SAMPLE_RECORDS))
      ))
    }

    async function loadFromAddress(user: ReturnType<typeof userEvent.setup>, address: string) {
      await user.click(await screen.findByRole('button', { name: 'Load from address' }))
      await user.type(screen.getByLabelText('Web address of a JSON list of records'), address)
      await user.click(screen.getByRole('button', { name: 'Load' }))
    }

    it('loads records from a web address after confirming', async () => {
      serveSampleAnd('https://example.com/orders.json', () => new Response(JSON.stringify(OWN_RECORDS)))
      const user = userEvent.setup()
      render(<App initialEditMode />)

      await loadFromAddress(user, 'https://example.com/orders.json')
      await user.click(await screen.findByRole('button', { name: 'Replace report' }))

      expect(await screen.findByRole('checkbox', { name: 'product' })).toBeInTheDocument()
      expect(screen.getByRole('region', { name: 'Report data' })).toHaveTextContent('example.com/orders.json · 2 records')
      expect(screen.getByRole('button', { name: 'Load from address' })).toHaveFocus()
    })

    it('explains an address that can\'t be read, keeping what was typed', async () => {
      serveSampleAnd('https://example.com/private.json', () => {
        throw new TypeError('Failed to fetch')
      })
      const user = userEvent.setup()
      render(<App initialEditMode />)

      await loadFromAddress(user, 'https://example.com/private.json')

      expect(await screen.findByRole('alert')).toHaveTextContent('allows browser access (CORS)')
      expect(screen.getByLabelText('Web address of a JSON list of records')).toHaveValue('https://example.com/private.json')
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      expect(screen.getByRole('checkbox', { name: 'hours' })).toBeInTheDocument()
    })

    it('asks for an address, and refuses one that isn\'t https, before requesting anything', async () => {
      const fetchSpy = serveSample()
      const user = userEvent.setup()
      render(<App initialEditMode />)
      await screen.findByRole('checkbox', { name: 'hours' })
      fetchSpy.mockClear()

      await user.click(screen.getByRole('button', { name: 'Load from address' }))
      await user.click(screen.getByRole('button', { name: 'Load' }))
      expect(screen.getByRole('alert')).toHaveTextContent('Enter a web address.')

      await user.type(screen.getByLabelText('Web address of a JSON list of records'), 'http://example.com/data.json')
      await user.click(screen.getByRole('button', { name: 'Load' }))
      expect(await screen.findByRole('alert')).toHaveTextContent('Use an address that starts with https://.')
      expect(fetchSpy).not.toHaveBeenCalled()
    })

    it('keeps the address and returns focus to Load when the replace is cancelled', async () => {
      serveSampleAnd('https://example.com/orders.json', () => new Response(JSON.stringify(OWN_RECORDS)))
      const user = userEvent.setup()
      render(<App initialEditMode />)

      await loadFromAddress(user, 'https://example.com/orders.json')
      await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Cancel' }))

      expect(screen.getByLabelText('Web address of a JSON list of records')).toHaveValue('https://example.com/orders.json')
      expect(screen.getByRole('button', { name: 'Load' })).toHaveFocus()
      expect(screen.getByRole('checkbox', { name: 'hours' })).toBeInTheDocument()
    })

    it('keeps an opened file in the dialog when an earlier address load finishes late', async () => {
      let finishSlowLoad: () => void = () => undefined
      serveSampleAnd('https://example.com/slow.json', () => new Response(new ReadableStream({
        start(controller) {
          finishSlowLoad = () => {
            controller.enqueue(new TextEncoder().encode(JSON.stringify([{ late: 1 }])))
            controller.close()
          }
        },
      })))
      const user = userEvent.setup()
      render(<App initialEditMode />)

      await loadFromAddress(user, 'https://example.com/slow.json')
      const file = new File([JSON.stringify(OWN_RECORDS)], 'orders.json', { type: 'application/json' })
      fireEvent.change(screen.getByLabelText('JSON file'), { target: { files: [file] } })
      expect(await screen.findByRole('dialog')).toHaveTextContent('orders.json')
      finishSlowLoad()

      await user.click(screen.getByRole('button', { name: 'Replace report' }))
      expect(await screen.findByRole('checkbox', { name: 'qty' })).toBeInTheDocument()
      expect(screen.getByRole('region', { name: 'Report data' })).toHaveTextContent('orders.json · 2 records')
    })

    it('opens a JSON file in the browser, and goes back to the sample on Reset', async () => {
      serveSample()
      const user = userEvent.setup()
      render(<App initialEditMode />)
      await screen.findByRole('checkbox', { name: 'hours' })

      const file = new File([JSON.stringify(OWN_RECORDS)], 'orders.json', { type: 'application/json' })
      fireEvent.change(screen.getByLabelText('JSON file'), { target: { files: [file] } })
      await user.click(await screen.findByRole('button', { name: 'Replace report' }))
      expect(await screen.findByRole('checkbox', { name: 'qty' })).toBeInTheDocument()
      expect(screen.getByRole('region', { name: 'Report data' })).toHaveTextContent('orders.json · 2 records')

      await user.click(screen.getByRole('button', { name: 'Reset to sample' }))
      await user.click(screen.getByRole('button', { name: 'Delete and start over' }))
      expect(await screen.findByRole('checkbox', { name: 'hours' })).toBeInTheDocument()
      expect(screen.getByRole('region', { name: 'Report data' })).toHaveTextContent('sample billing data')
    })
  })
})
