import type { ChangeEvent, KeyboardEvent } from 'react'

const BULLET = '• '

interface NoteInputProps {
  value: string
  onChange: (value: string) => void
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
export function NoteInput({ value, onChange }: NoteInputProps) {
  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
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

  return (
    <textarea
      rows={4}
      value={value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      className="w-full resize-none rounded-md border border-neutral-300 px-3 pt-2 pb-5 text-sm outline-none focus:border-neutral-500"
    />
  )
}
