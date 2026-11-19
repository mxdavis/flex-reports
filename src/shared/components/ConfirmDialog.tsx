import { useEffect, useRef, type ReactNode } from 'react'
import { useElementId } from '../hooks/useElementId'
import './ConfirmDialog.css'

type ConfirmDialogProps = {
  isOpen: boolean
  title: string
  message: ReactNode
  confirmLabel: string
  // Styles the confirm button as a warning, for actions that delete or can't be undone.
  isDestructive?: boolean
  onConfirm: () => void
  onCancel: () => void
}

// An "are you sure?" step before an action. A native modal dialog, so the page
// behind it can't be used, focus stays inside, and Escape cancels.
function ConfirmDialog({ isOpen, ...props }: ConfirmDialogProps) {
  return isOpen ? <OpenConfirmDialog {...props} /> : null
}

function OpenConfirmDialog({ title, message, confirmLabel, isDestructive, onConfirm, onCancel }: Omit<ConfirmDialogProps, 'isOpen'>) {
  const dialogRef = useRef<HTMLDialogElement | null>(null)
  const titleId = useElementId('confirm-dialog-title')
  const messageId = useElementId('confirm-dialog-message')

  useEffect(() => {
    dialogRef.current?.showModal()
  }, [])

  return (
    <dialog
      ref={dialogRef}
      className="fr-confirm-dialog"
      aria-labelledby={titleId}
      aria-describedby={messageId}
      onCancel={(event) => {
        // Escape: the parent decides when the dialog closes.
        event.preventDefault()
        onCancel()
      }}
    >
      <h2 id={titleId}>{title}</h2>
      <div id={messageId} className="fr-confirm-dialog-message">{message}</div>
      <div className="fr-confirm-dialog-actions">
        {/* Cancel comes first, so it has focus when the dialog opens. */}
        <button type="button" onClick={onCancel}>Cancel</button>
        <button
          type="button"
          className={isDestructive ? 'fr-confirm-dialog-destructive' : undefined}
          onClick={onConfirm}
        >
          {confirmLabel}
        </button>
      </div>
    </dialog>
  )
}

export default ConfirmDialog
