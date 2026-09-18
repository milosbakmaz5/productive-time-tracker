import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { getErrorMessage } from '../lib/api/errors'
import { timeEntriesWeekQueryKey, updateTimeEntry, type TimeEntry } from '../lib/api/timeEntries'
import { useAuth } from '../lib/auth/useAuth'
import { EMPTY_NOTE, normalizeNoteForSubmit } from '../lib/note'
import { NoteInput } from './NoteInput'

interface EntryNoteEditorProps {
  entry: TimeEntry
  /** Reports whether a save is currently in flight, so a shared parent (EntryRow) can disable
   * the entry's actions menu while either this or the duration editor is saving. */
  onSavingChange?: (isSaving: boolean) => void
}

// The textarea is always mounted, just toggling readOnly - swapping a <p> for it only on click
// would lose the click's cursor position, since the textarea wouldn't exist yet to receive it.
export function EntryNoteEditor({ entry, onSavingChange }: EntryNoteEditorProps) {
  const queryClient = useQueryClient()
  const { credentials } = useAuth()
  const personId = credentials!.personId

  const [isEditing, setIsEditing] = useState(false)
  // Raw value while not editing (not defaulted to EMPTY_NOTE), so an empty note shows the
  // placeholder instead of a stray bullet. Defaults to a bullet only once editing starts.
  const [draft, setDraft] = useState(entry.note)
  const [syncedNote, setSyncedNote] = useState(entry.note)

  // Synced from the prop during render, not an effect, so an external change (e.g. a refetch)
  // doesn't clobber an in-progress edit.
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
      queryClient.invalidateQueries({ queryKey: timeEntriesWeekQueryKey(personId) })
    },
  })

  useEffect(() => {
    onSavingChange?.(mutation.isPending)
  }, [mutation.isPending, onSavingChange])

  function handleBlur() {
    const normalizedDraft = normalizeNoteForSubmit(draft)
    const normalizedOriginal = normalizeNoteForSubmit(entry.note)

    if (normalizedDraft === normalizedOriginal) {
      setIsEditing(false)
      return
    }

    // Stays editable on failure so the edit isn't lost - only exits edit mode once saved.
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
        <p role="alert" className="mt-1 text-xs text-error">
          Couldn't save: {getErrorMessage(mutation.error)}
        </p>
      )}
    </div>
  )
}
