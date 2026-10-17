import { render, screen, waitFor } from '@testing-library/react'
import type { ReactElement } from 'react'

// Sandbox mode loads its sample data asynchronously; wait for it before
// interacting with the builder.
export async function renderSandboxApp(ui: ReactElement) {
  const result = render(ui)
  await waitFor(() => {
    if (screen.queryByText('Loading sample data…')) throw new Error('Sandbox data still loading')
  })
  return result
}
