import { within } from '@testing-library/react'
import type { UserEvent } from '@testing-library/user-event'

// Picks an option in a Combobox the way a user would: clear the box, which
// opens the full list, then click the option.
export async function pickField(user: UserEvent, input: HTMLElement, option: string): Promise<void> {
  await user.clear(input)
  const list = document.getElementById(input.getAttribute('aria-controls') ?? '')
  if (!list) throw new Error('The combobox has no list.')
  await user.click(within(list).getByRole('option', { name: option }))
}
