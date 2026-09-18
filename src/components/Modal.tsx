import { useEffect, useRef, type ReactNode, type RefObject } from 'react'
import { useFocusTrap } from '../lib/useFocusTrap'

interface ModalProps {
  title: string
  onClose: () => void
  children: ReactNode
  /** Focuses this element when the modal opens instead of the first focusable element in DOM
   * order (which would otherwise always be the Close button). */
  initialFocusRef?: RefObject<HTMLElement | null>
}

export function Modal({ title, onClose, children, initialFocusRef }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  useFocusTrap(dialogRef, initialFocusRef)

  useEffect(() => {
    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 sm:flex sm:items-center sm:justify-center sm:bg-black/40 sm:px-4" onClick={onClose}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
        className="h-full w-full overflow-y-auto bg-surface p-6 outline-none sm:h-auto sm:max-h-[90vh] sm:max-w-md sm:rounded-lg sm:shadow-xl"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-faint-foreground hover:text-foreground"
          >
            ✕
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  )
}
