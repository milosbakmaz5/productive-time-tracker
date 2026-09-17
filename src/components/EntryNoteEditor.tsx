import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { updateTimeEntry, type TimeEntry } from '../lib/api/timeEntries'
import { useAuth } from '../lib/auth/useAuth'
import { EMPTY_NOTE, normalizeNoteForSubmit } from '../lib/note'
import { NoteInput } from './NoteInput'

interface EntryNoteEditorProps {
  entry: TimeEntry
}

/**
 * Click the description in the list to edit it in place - the underlying textarea is always
 * rendered (just toggling its `readOnly` attribute) rather than swapping a <p> for a <textarea>
 * on click, so the browser's native click-to-position-cursor behavior lands correctly; swapping
 * elements on click would put the textarea in the DOM only after the click already happened,
 * losing the cursor position the click was meant to set.
 */
export function EntryNoteEditor({ entry }: EntryNoteEditorProps) {
  const queryClient = useQueryClient()
  const { credentials } = useAuth()
  const personId = credentials!.personId

  const [isEditing, setIsEditing] = useState(false)
  // Deliberately the raw value (not defaulted to EMPTY_NOTE) while not editing, so a genuinely
  // empty note is actually empty - showing the placeholder - rather than displaying a lone bullet
  // with nothing after it. The default-to-bullet behavior only kicks in once editing starts.
  const [draft, setDraft] = useState(entry.note)
  const [syncedNote, setSyncedNote] = useState(entry.note)

  // Keep the draft in sync with the server value when it changes from outside (e.g. a refetch),
  // but not while actively editing, which would clobber what's being typed. Adjusted during
  // render - React's documented pattern for "reset state when a prop changes" - rather than in
  // an effect, which would trigger an extra, unnecessary render pass.
  if (!isEditing && entry.note !== syncedNote) {
    setSyncedNote(entry.note)
    setDraft(entry.note)
  }

  function handleFocus() {
    setIsEditing(true)
    if (draft === '') {
      setDraft(EMPTY_NOTE)
    }
  }

  const mutation = useMutation({
    mutationFn: (note: string) => updateTimeEntry(entry.id, { date: entry.date, time: entry.time, note }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-entries', personId, entry.date] })
    },
  })

  function handleBlur() {
    const normalizedDraft = normalizeNoteForSubmit(draft)
    const normalizedOriginal = normalizeNoteForSubmit(entry.note)

    if (normalizedDraft === normalizedOriginal) {
      setIsEditing(false)
      return
    }

    // Stay in editing mode on failure rather than snapping back to read-only - the user's edit
    // is still visible in the draft and they can fix/retry, instead of it silently vanishing on
    // the next refetch of the (still unsaved) server value.
    mutation.mutate(normalizedDraft, { onSuccess: () => setIsEditing(false) })
  }

  return (
    <div className="w-full">
      <NoteInput
        value={draft}
        onChange={setDraft}
        variant="plain"
        placeholder="Add a description"
        readOnly={!isEditing}
        onFocus={handleFocus}
        onBlur={handleBlur}
      />
      {mutation.isError && (
        <p role="alert" className="mt-1 text-xs text-red-600">
          Couldn't save: {mutation.error instanceof Error ? mutation.error.message : 'Something went wrong.'}
        </p>
      )}
    </div>
  )
}
