import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRef, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { EntryFormFields } from '../components/EntryFormFields'
import { Modal } from '../components/Modal'
import { getErrorMessage } from '../lib/api/errors'
import { getTimeEntry, timeEntriesWeekQueryKey, updateTimeEntry, type TimeEntry } from '../lib/api/timeEntries'
import { useAuth } from '../lib/auth/useAuth'
import { formatAsHHMM, parseDurationInput } from '../lib/duration'
import { EMPTY_NOTE, normalizeNoteForSubmit } from '../lib/note'

export function EditEntryPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const entryQuery = useQuery({
    queryKey: ['time-entry', id],
    queryFn: () => getTimeEntry(id!),
    enabled: !!id,
    retry: false,
    networkMode: 'always',
  })

  function goBack() {
    navigate(-1)
  }

  // Nothing rendered while pending - a skeleton Modal here resolves fast enough that it just
  // flashed into the real one (and yanked focus twice). The error state keeps its own Modal
  // since it isn't fleeting - the user may sit on it and needs Retry/Back reachable.
  if (entryQuery.isPending) {
    return null
  }

  if (entryQuery.isError) {
    return (
      <Modal title="Edit time entry" onClose={goBack}>
        <div role="alert" className="rounded-md border border-error-border bg-error-surface p-6 text-center">
          <p className="text-sm text-error">
            Couldn't load this entry:{' '}
            {getErrorMessage(entryQuery.error)}
          </p>
          <div className="mt-3 flex justify-center gap-2">
            <button
              type="button"
              onClick={() => entryQuery.refetch()}
              className="rounded bg-error px-4 py-1.5 text-sm font-medium text-white hover:bg-error-hover"
            >
              Retry
            </button>
            <button
              type="button"
              onClick={goBack}
              className="rounded px-4 py-1.5 text-sm font-medium text-muted-foreground hover:bg-surface-hover"
            >
              Back to list
            </button>
          </div>
        </div>
      </Modal>
    )
  }

  return <EditEntryForm entry={entryQuery.data} onBack={goBack} />
}

function EditEntryForm({ entry, onBack }: { entry: TimeEntry; onBack: () => void }) {
  const queryClient = useQueryClient()
  const { credentials } = useAuth()
  const personId = credentials!.personId
  const durationInputRef = useRef<HTMLInputElement>(null)

  const initialDuration = formatAsHHMM(entry.time)
  const initialNote = entry.note || EMPTY_NOTE

  const [durationText, setDurationText] = useState(initialDuration)
  const [date, setDate] = useState(entry.date)
  const [note, setNote] = useState(initialNote)
  const [isConfirmingClose, setIsConfirmingClose] = useState(false)

  const parsedDuration = parseDurationInput(durationText)
  const hasChanges = durationText !== initialDuration || date !== entry.date || note !== initialNote

  function requestClose() {
    if (hasChanges) {
      setIsConfirmingClose(true)
    } else {
      onBack()
    }
  }

  const mutation = useMutation({
    mutationFn: async () => {
      if (parsedDuration.kind !== 'valid') {
        throw new Error('Enter a valid duration.')
      }
      return updateTimeEntry(entry.id, {
        date,
        time: parsedDuration.minutes,
        note: normalizeNoteForSubmit(note),
      })
    },
    onSuccess: () => {
      // Invalidates every cached week for this person, covering old/new date and week in one go.
      // Returns to wherever the user was, rather than jumping to follow the edited entry.
      queryClient.invalidateQueries({ queryKey: timeEntriesWeekQueryKey(personId) })
      onBack()
    },
  })

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    mutation.mutate()
  }

  return (
    <>
      <Modal title="Edit time entry" onClose={requestClose} initialFocusRef={durationInputRef}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <EntryFormFields
            durationText={durationText}
            onDurationChange={setDurationText}
            date={date}
            onDateChange={setDate}
            note={note}
            onNoteChange={setNote}
            durationInputRef={durationInputRef}
          />

          {mutation.isError && (
            <p role="alert" className="text-sm text-error">
              {getErrorMessage(mutation.error)}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={requestClose}
              disabled={mutation.isPending}
              className="rounded px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-surface-hover disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={parsedDuration.kind !== 'valid' || mutation.isPending}
              className="rounded bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
            >
              {mutation.isPending ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </Modal>

      {isConfirmingClose && (
        <ConfirmDialog
          title="Discard changes?"
          message="You have unsaved changes. Closing now will discard them."
          confirmLabel="Discard changes"
          cancelLabel="Continue editing"
          onConfirm={onBack}
          onCancel={() => setIsConfirmingClose(false)}
        />
      )}
    </>
  )
}
