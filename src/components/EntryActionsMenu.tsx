import { Loader2, MoreVertical, Pencil, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

interface EntryActionsMenuProps {
  entryId: string
  onDelete: () => void
  /** True while an inline note/duration edit for this entry is saving - closes the menu (a save
   * kicked off by blurring one of those fields can fire in the same click that opens this menu),
   * disables opening it again, and swaps the trigger icon for a spinner until the save settles. */
  isSaving?: boolean
}

export function EntryActionsMenu({ entryId, onDelete, isSaving }: EntryActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const location = useLocation()

  useEffect(() => {
    if (!isOpen) return

    function handlePointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  // A save starting (e.g. from blurring a field this same click also opened the menu from)
  // closes the menu - adjusted during render, same pattern as the note/duration editors' sync
  // logic, rather than an effect that would trigger an extra render.
  if (isSaving && isOpen) {
    setIsOpen(false)
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        disabled={isSaving}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={isSaving ? 'Saving entry…' : 'Entry actions'}
        className="rounded-md p-1 text-faint-foreground hover:bg-surface-hover hover:text-foreground disabled:pointer-events-none disabled:opacity-70"
      >
        {isSaving ? (
          <Loader2 size={16} className="animate-spin" aria-hidden="true" />
        ) : (
          <MoreVertical size={16} aria-hidden="true" />
        )}
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 z-10 mt-1 w-32 overflow-hidden rounded-md border border-border bg-surface py-1 shadow-lg"
        >
          <Link
            to={`/entries/${entryId}/edit`}
            state={{ backgroundLocation: location }}
            role="menuitem"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-foreground hover:bg-surface-hover"
          >
            <Pencil size={14} aria-hidden="true" />
            Edit
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setIsOpen(false)
              onDelete()
            }}
            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-error hover:bg-error-surface"
          >
            <Trash2 size={14} aria-hidden="true" />
            Delete
          </button>
        </div>
      )}
    </div>
  )
}
