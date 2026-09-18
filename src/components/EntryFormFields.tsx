import type { RefObject } from 'react'
import { DurationInput } from './DurationInput'
import { NoteInput } from './NoteInput'

interface EntryFormFieldsProps {
  durationText: string
  onDurationChange: (value: string) => void
  date: string
  onDateChange: (value: string) => void
  note: string
  onNoteChange: (value: string) => void
  /** Forwarded to the duration field so the parent Modal can focus it first when opening -
   * otherwise the modal's own Close button, first in DOM order, would get initial focus. */
  durationInputRef?: RefObject<HTMLInputElement | null>
}

/** Duration/date/note fields shared by the create modal and the edit page. */
export function EntryFormFields({
  durationText,
  onDurationChange,
  date,
  onDateChange,
  note,
  onNoteChange,
  durationInputRef,
}: EntryFormFieldsProps) {
  return (
    <>
      <label className="block text-sm font-medium text-foreground">
        Duration
        <div className="mt-1">
          <DurationInput ref={durationInputRef} value={durationText} onChange={onDurationChange} />
        </div>
      </label>

      <label className="block text-sm font-medium text-foreground">
        Date
        <input
          type="date"
          required
          value={date}
          onChange={(event) => onDateChange(event.target.value)}
          className="mt-1 block w-full rounded border border-border px-3 py-2 text-sm outline-none focus:border-primary"
        />
      </label>

      <label className="block text-sm font-medium text-foreground">
        Description
        <div className="mt-1">
          <NoteInput value={note} onChange={onNoteChange} />
        </div>
      </label>
    </>
  )
}
