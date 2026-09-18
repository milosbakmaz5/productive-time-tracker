import { LogOut, Moon, Settings } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTheme } from '../lib/theme'

interface SettingsMenuProps {
  onLogout: () => void
}

export function SettingsMenu({ onLogout }: SettingsMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const { theme, setTheme } = useTheme()
  const isDark = theme === 'dark'

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
        aria-label="Settings"
        title="Settings"
        className="rounded p-1.5 text-muted-foreground hover:bg-surface-hover hover:text-foreground"
      >
        <Settings size={16} aria-hidden="true" />
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 z-10 mt-1 w-44 overflow-hidden rounded border border-border bg-surface py-1 shadow-lg"
        >
          {/* A toggle stays open on click (unlike Log out) so it can be flipped back and forth
           * without reopening the menu each time. */}
          <button
            type="button"
            role="menuitemcheckbox"
            aria-checked={isDark}
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="flex w-full items-center justify-between px-3 py-2 text-sm text-foreground hover:bg-surface-hover"
          >
            <span className="flex items-center gap-2">
              <Moon size={14} aria-hidden="true" />
              Dark mode
            </span>
            <span
              aria-hidden="true"
              className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
                isDark ? 'bg-primary' : 'bg-border'
              }`}
            >
              <span
                className={`inline-block size-3.5 transform rounded-full bg-white shadow transition-transform ${
                  isDark ? 'translate-x-4' : 'translate-x-1'
                }`}
              />
            </span>
          </button>

          <div className="my-1 border-t border-border" />

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setIsOpen(false)
              onLogout()
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-error hover:bg-error-surface"
          >
            <LogOut size={14} aria-hidden="true" />
            Log out
          </button>
        </div>
      )}
    </div>
  )
}
