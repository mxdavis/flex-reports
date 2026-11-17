import { render, screen, waitFor } from '@testing-library/react'
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

    await waitFor(() => expect(screen.getByLabelText('Sheet name')).not.toHaveValue('Hours report'))
    expect(window.localStorage.getItem(SAVED_REPORT_STORAGE_KEY)).toBeNull()
    expect(screen.getByRole('checkbox', { name: 'hours' })).not.toBeChecked()
  })
})
