import { useEffect, type RefObject } from 'react'

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

/** Standard modal focus behavior: moves focus into the dialog on open (`initialFocusRef` if
 * given, else the first focusable element), traps Tab/Shift+Tab within it, and restores focus
 * to the trigger on close. */
export function useFocusTrap(
  containerRef: RefObject<HTMLElement | null>,
  initialFocusRef?: RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const previouslyFocused = document.activeElement as HTMLElement | null
    const initial =
      initialFocusRef?.current ?? container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)[0] ?? container
    initial.focus()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Tab' || !container) return

      const focusable = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      previouslyFocused?.focus()
    }
    // Both are stable ref objects, so this still only runs once on mount/unmount.
  }, [containerRef, initialFocusRef])
}
