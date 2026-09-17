import { useEffect, useRef, type ChangeEvent, type FocusEvent, type KeyboardEvent } from 'react'
import { BULLET } from '../lib/note'

interface NoteInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  /** 'boxed' (default): the bordered field used in the create/edit forms. 'plain': borderless,
   * auto-growing, blends into surrounding text - for editing a note inline in place. */
  variant?: 'boxed' | 'plain'
  readOnly?: boolean
  onFocus?: (event: FocusEvent<HTMLTextAreaElement>) => void
  onBlur?: (event: FocusEvent<HTMLTextAreaElement>) => void
}

function lineStartAt(text: string, pos: number): number {
  const idx = text.lastIndexOf('\n', pos - 1)
  return idx === -1 ? 0 : idx + 1
}

function lineEndAt(text: string, pos: number): number {
  const idx = text.indexOf('\n', pos)
  return idx === -1 ? text.length : idx
}

/**
 * Plain-textarea note field with lightweight bullet-list editing, matching common note-app
 * conventions: Enter continues the current bullet; Enter on an empty bullet removes it
 * (exits list mode) instead of adding another blank bullet; typing "- " at the start of a
 * line converts it back into a bullet.
 */
export function NoteInput({
  value,
  onChange,
  placeholder,
  variant = 'boxed',
  readOnly = false,
  onFocus,
  onBlur,
}: NoteInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // 'plain' is rendered inline among other content (no fixed box to scroll within), so it has to
  // grow to fit its own content rather than clip it - recalculated whenever the value changes,
  // including the very first render, so a note that arrives already multi-line isn't clipped.
  useEffect(() => {
    if (variant !== 'plain') return
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [variant, value])

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (readOnly) return
    if (event.key !== 'Enter') return
    const el = event.currentTarget
    if (el.selectionStart !== el.selectionEnd) return

    const cursor = el.selectionStart
    const lineStart = lineStartAt(value, cursor)
    const lineEnd = lineEndAt(value, cursor)
    const line = value.slice(lineStart, lineEnd)

    if (!line.startsWith(BULLET)) return
    event.preventDefault()

    const contentAfterBullet = line.slice(BULLET.length)

    if (contentAfterBullet.trim() === '') {
      // Enter on an empty bullet line: strip the bullet, stay on the same (now plain) line.
      const next = value.slice(0, lineStart) + value.slice(lineStart + BULLET.length)
      onChange(next)
      requestAnimationFrame(() => el.setSelectionRange(lineStart, lineStart))
    } else {
      const next = value.slice(0, cursor) + '\n' + BULLET + value.slice(cursor)
      const newCursor = cursor + 1 + BULLET.length
      onChange(next)
      requestAnimationFrame(() => el.setSelectionRange(newCursor, newCursor))
    }
  }

  function handleChange(event: ChangeEvent<HTMLTextAreaElement>) {
    if (readOnly) return
    const el = event.currentTarget
    const nextValue = el.value
    const cursor = el.selectionStart
    const lineStart = lineStartAt(nextValue, cursor)
    const beforeCursor = nextValue.slice(lineStart, cursor)

    if (beforeCursor === '- ') {
      const converted = nextValue.slice(0, lineStart) + BULLET + nextValue.slice(cursor)
      const newCursor = lineStart + BULLET.length
      onChange(converted)
      requestAnimationFrame(() => el.setSelectionRange(newCursor, newCursor))
      return
    }

    onChange(nextValue)
  }

  const boxedClassName =
    'w-full resize-none rounded-md border border-neutral-300 px-3 pt-2 pb-5 text-sm outline-none focus:border-neutral-500'
  const plainClassName =
    'w-full resize-none overflow-hidden bg-transparent text-sm text-neutral-600 outline-none placeholder:text-neutral-400'

  return (
    <textarea
      ref={textareaRef}
      rows={variant === 'boxed' ? 4 : 1}
      value={value}
      placeholder={placeholder}
      readOnly={readOnly}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onFocus={onFocus}
      onBlur={onBlur}
      className={variant === 'boxed' ? boxedClassName : plainClassName}
    />
  )
}
