import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

interface EntryActionsMenuProps {
  entryId: string
  onDelete: () => void
}

export function EntryActionsMenu({ entryId, onDelete }: EntryActionsMenuProps) {
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

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label="Entry actions"
        className="rounded-md p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
          <circle cx="8" cy="2.5" r="1.4" />
          <circle cx="8" cy="8" r="1.4" />
          <circle cx="8" cy="13.5" r="1.4" />
        </svg>
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 z-10 mt-1 w-32 overflow-hidden rounded-md border border-neutral-200 bg-white py-1 shadow-lg"
        >
          <Link
            to={`/entries/${entryId}/edit`}
            state={{ backgroundLocation: location }}
            role="menuitem"
            onClick={() => setIsOpen(false)}
            className="block px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-50"
          >
            Edit
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setIsOpen(false)
              onDelete()
            }}
            className="block w-full px-3 py-1.5 text-left text-sm text-red-600 hover:bg-red-50"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  )
}
