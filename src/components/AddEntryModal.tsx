import { useMutation } from '@tanstack/react-query'
import { useRef, useState, type FormEvent } from 'react'
import { getErrorMessage } from '../lib/api/errors'
import { createTimeEntry, type TimeEntry } from '../lib/api/timeEntries'
import { resolveServiceId } from '../lib/api/services'
import { parseDurationInput } from '../lib/duration'
import { EMPTY_NOTE, normalizeNoteForSubmit } from '../lib/note'
import { ConfirmDialog } from './ConfirmDialog'
import { EntryFormFields } from './EntryFormFields'
import { Modal } from './Modal'

interface AddEntryModalProps {
  personId: string
  defaultDate: string
  onClose: () => void
  onCreated: (entry: TimeEntry) => void
}

export function AddEntryModal({ personId, defaultDate, onClose, onCreated }: AddEntryModalProps) {
  const durationInputRef = useRef<HTMLInputElement>(null)
  const [durationText, setDurationText] = useState('')
  const [date, setDate] = useState(defaultDate)
  const [note, setNote] = useState(EMPTY_NOTE)
  const [isConfirmingClose, setIsConfirmingClose] = useState(false)

  const parsedDuration = parseDurationInput(durationText)
  const hasChanges = durationText !== '' || date !== defaultDate || note !== EMPTY_NOTE

  function requestClose() {
    if (hasChanges) {
      setIsConfirmingClose(true)
    } else {
      onClose()
    }
  }

  const mutation = useMutation({
    mutationFn: async () => {
      if (parsedDuration.kind !== 'valid') {
        throw new Error('Enter a valid duration.')
      }
      const serviceId = await resolveServiceId(personId, date)
      return createTimeEntry({
        personId,
        serviceId,
        date,
        time: parsedDuration.minutes,
        note: normalizeNoteForSubmit(note),
      })
    },
    onSuccess: onCreated,
  })

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    mutation.mutate()
  }

  return (
    <>
      <Modal title="Add time entry" onClose={requestClose} initialFocusRef={durationInputRef}>
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
              {mutation.isPending ? 'Adding…' : 'Add entry'}
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
          onConfirm={onClose}
          onCancel={() => setIsConfirmingClose(false)}
        />
      )}
    </>
  )
}
