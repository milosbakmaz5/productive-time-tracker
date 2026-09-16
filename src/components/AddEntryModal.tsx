import { useMutation } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { createTimeEntry, type TimeEntry } from '../lib/api/timeEntries'
import { resolveServiceId } from '../lib/api/services'
import { parseDurationInput } from '../lib/duration'
import { ConfirmDialog } from './ConfirmDialog'
import { DurationInput } from './DurationInput'
import { Modal } from './Modal'
import { NoteInput } from './NoteInput'

const EMPTY_NOTE = '• '

interface AddEntryModalProps {
  personId: string
  defaultDate: string
  onClose: () => void
  onCreated: (entry: TimeEntry) => void
}

export function AddEntryModal({ personId, defaultDate, onClose, onCreated }: AddEntryModalProps) {
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
      // A note left as just the default bullet with nothing typed isn't a real note.
      const hasRealContent = note.replace(/•/g, '').trim() !== ''
      return createTimeEntry({
        personId,
        serviceId,
        date,
        time: parsedDuration.minutes,
        note: hasRealContent ? note.trim() : '',
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
      <Modal title="Add time entry" onClose={requestClose}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm font-medium text-neutral-700">
            Duration
            <div className="mt-1">
              <DurationInput value={durationText} onChange={setDurationText} />
            </div>
          </label>

          <label className="block text-sm font-medium text-neutral-700">
            Date
            <input
              type="date"
              required
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500"
            />
          </label>

          <label className="block text-sm font-medium text-neutral-700">
            Description
            <div className="mt-1">
              <NoteInput value={note} onChange={setNote} />
            </div>
          </label>

          {mutation.isError && (
            <p role="alert" className="text-sm text-red-600">
              {mutation.error instanceof Error ? mutation.error.message : 'Something went wrong.'}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={requestClose}
              disabled={mutation.isPending}
              className="rounded-md px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={parsedDuration.kind !== 'valid' || mutation.isPending}
              className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50"
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
