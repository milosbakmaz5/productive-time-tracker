import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { updateTimeEntry, type TimeEntry } from '../lib/api/timeEntries'
import { useAuth } from '../lib/auth/useAuth'
import { formatAsHHMM, parseDurationInput } from '../lib/duration'
import { DurationInput } from './DurationInput'

interface EntryDurationEditorProps {
  entry: TimeEntry
}

/** Click the duration in the list to edit it in place, same parsing/blur-reformat/select-on-focus
 * logic as the create/edit forms' DurationInput - just the 'plain' variant, with the live HH:MM
 * preview below the input instead of beside it. Saves on blur, mirroring EntryNoteEditor. */
export function EntryDurationEditor({ entry }: EntryDurationEditorProps) {
  const queryClient = useQueryClient()
  const { credentials } = useAuth()
  const personId = credentials!.personId

  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(() => formatAsHHMM(entry.time))
  const [syncedTime, setSyncedTime] = useState(entry.time)

  // Keep the draft in sync with the server value when it changes from outside (e.g. a refetch),
  // but not while actively editing. Adjusted during render rather than in an effect, same
  // reasoning as EntryNoteEditor.
  if (!isEditing && entry.time !== syncedTime) {
    setSyncedTime(entry.time)
    setDraft(formatAsHHMM(entry.time))
  }

  const mutation = useMutation({
    mutationFn: (minutes: number) => updateTimeEntry(entry.id, { date: entry.date, time: minutes, note: entry.note }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-entries', personId, entry.date] })
    },
  })

  function handleBlur() {
    const parsed = parseDurationInput(draft)

    // Invalid or over-24h: don't save, and don't snap back to read-only either - stay editable
    // (with the warning still visible below) so the user can see what's wrong and fix it, rather
    // than silently discarding what they typed.
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
          Couldn't save: {mutation.error instanceof Error ? mutation.error.message : 'Something went wrong.'}
        </p>
      )}
    </div>
  )
}
