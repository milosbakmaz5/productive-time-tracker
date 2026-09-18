import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { getErrorMessage } from '../lib/api/errors'
import { timeEntriesWeekQueryKey, updateTimeEntry, type TimeEntry } from '../lib/api/timeEntries'
import { useAuth } from '../lib/auth/useAuth'
import { formatAsHHMM, parseDurationInput } from '../lib/duration'
import { DurationInput } from './DurationInput'

interface EntryDurationEditorProps {
  entry: TimeEntry
  /** Reports whether a save is currently in flight, so a shared parent (EntryRow) can disable
   * the entry's actions menu while either this or the note editor is saving. */
  onSavingChange?: (isSaving: boolean) => void
}

/** Click the duration in the list to edit it in place - reuses DurationInput's 'plain' variant,
 * same parsing rules as the create/edit forms. Saves on blur, mirroring EntryNoteEditor. */
export function EntryDurationEditor({ entry, onSavingChange }: EntryDurationEditorProps) {
  const queryClient = useQueryClient()
  const { credentials } = useAuth()
  const personId = credentials!.personId

  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(() => formatAsHHMM(entry.time))
  const [syncedTime, setSyncedTime] = useState(entry.time)

  // Synced from the prop during render, not an effect - see EntryNoteEditor for why.
  if (!isEditing && entry.time !== syncedTime) {
    setSyncedTime(entry.time)
    setDraft(formatAsHHMM(entry.time))
  }

  const mutation = useMutation({
    mutationFn: (minutes: number) => updateTimeEntry(entry.id, { date: entry.date, time: minutes, note: entry.note }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: timeEntriesWeekQueryKey(personId) })
    },
  })

  useEffect(() => {
    onSavingChange?.(mutation.isPending)
  }, [mutation.isPending, onSavingChange])

  function handleBlur() {
    const parsed = parseDurationInput(draft)

    // Invalid or over-24h: don't save, and stay editable so the warning stays visible.
    if (parsed.kind !== 'valid') return

    if (parsed.minutes === entry.time) {
      setIsEditing(false)
      return
    }

    mutation.mutate(parsed.minutes, { onSuccess: () => setIsEditing(false) })
  }

  return (
    <div>
      <DurationInput
        value={draft}
        onChange={setDraft}
        variant="plain"
        readOnly={!isEditing}
        onFocus={() => setIsEditing(true)}
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
