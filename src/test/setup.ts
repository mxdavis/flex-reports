import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// jsdom has no modal dialogs: open and close them by the `open` attribute.
HTMLDialogElement.prototype.showModal ??= function showModal(this: HTMLDialogElement) {
  this.open = true
}
HTMLDialogElement.prototype.close ??= function close(this: HTMLDialogElement) {
  this.open = false
}

afterEach(() => {
	cleanup()
})
