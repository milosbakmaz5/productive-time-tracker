import { useEffect, type RefObject } from 'react'

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Standard modal focus behavior, missing before this: moves focus into the dialog when it opens
 * (`initialFocusRef`'s element if given and present, otherwise the first focusable element, or
 * the container itself if it has none), keeps Tab/Shift+Tab cycling within it instead of
 * escaping to the page behind, and restores focus to whatever triggered the dialog once it
 * closes - the element itself, not just "somewhere sensible", since `document.activeElement` at
 * mount time *is* the trigger.
 */
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
    // Both refs (the objects from useRef) never change identity across re-renders, so this
    // still only runs once on mount/unmount despite listing them here.
  }, [containerRef, initialFocusRef])
}
