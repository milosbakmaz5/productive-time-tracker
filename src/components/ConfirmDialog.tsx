interface ConfirmDialogProps {
  title: string
  message: string
  confirmLabel: string
  cancelLabel: string
  onConfirm: () => void
  onCancel: () => void
  /** For async confirmations (e.g. delete) - disables both buttons and blocks backdrop-dismiss
   * while a request is in flight. Unused by purely-local confirmations like "discard changes". */
  isConfirming?: boolean
  error?: string | null
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  isConfirming,
  error,
}: ConfirmDialogProps) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4"
      onClick={isConfirming ? undefined : onCancel}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl"
      >
        <h2 className="text-base font-semibold text-neutral-900">{title}</h2>
        <p className="mt-2 text-sm text-neutral-600">{message}</p>
        {error && (
          <p role="alert" className="mt-2 text-sm text-red-600">
            {error}
          </p>
        )}
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isConfirming}
            className="rounded-md px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isConfirming}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
