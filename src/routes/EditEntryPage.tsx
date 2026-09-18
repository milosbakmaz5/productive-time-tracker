import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { EntryFormFields } from '../components/EntryFormFields'
import { Modal } from '../components/Modal'
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

  // Loading/error states have nothing to lose yet, so their Modal can close directly - only the
  // loaded form (below) needs the unsaved-changes guard, and it owns that state itself.
  if (entryQuery.isPending) {
    return (
      <Modal title="Edit time entry" onClose={goBack}>
        <div className="h-56 animate-pulse rounded-lg bg-surface-hover" aria-busy="true" />
      </Modal>
    )
  }

  if (entryQuery.isError) {
    return (
      <Modal title="Edit time entry" onClose={goBack}>
        <div role="alert" className="rounded-lg border border-error-border bg-error-surface p-6 text-center">
          <p className="text-sm text-error">
            Couldn't load this entry:{' '}
            {entryQuery.error instanceof Error ? entryQuery.error.message : 'Something went wrong.'}
          </p>
          <div className="mt-3 flex justify-center gap-2">
            <button
              type="button"
              onClick={() => entryQuery.refetch()}
              className="rounded-md bg-error px-4 py-1.5 text-sm font-medium text-white hover:bg-error-hover"
            >
              Retry
            </button>
            <button
              type="button"
              onClick={goBack}
              className="rounded-md px-4 py-1.5 text-sm font-medium text-muted-foreground hover:bg-surface-hover"
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
      // Prefix-invalidates every cached week for this person - covers the entry's old and new
      // date (and old/new week, if the edit moved it across a week boundary) without having to
      // work out which weeks are actually affected. Returns to wherever the user was reviewing
      // rather than jumping the list to follow the edited entry - they're oriented around a day,
      // not around this one entry.
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
      <Modal title="Edit time entry" onClose={requestClose}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <EntryFormFields
            durationText={durationText}
            onDurationChange={setDurationText}
            date={date}
            onDateChange={setDate}
            note={note}
            onNoteChange={setNote}
          />

          {mutation.isError && (
            <p role="alert" className="text-sm text-error">
              {mutation.error instanceof Error ? mutation.error.message : 'Something went wrong.'}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={requestClose}
              disabled={mutation.isPending}
              className="rounded-md px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-surface-hover disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={parsedDuration.kind !== 'valid' || mutation.isPending}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
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
