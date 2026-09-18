import { DurationInput } from './DurationInput'
import { NoteInput } from './NoteInput'

interface EntryFormFieldsProps {
  durationText: string
  onDurationChange: (value: string) => void
  date: string
  onDateChange: (value: string) => void
  note: string
  onNoteChange: (value: string) => void
}

/** Duration/date/note fields shared by the create modal and the edit page. */
export function EntryFormFields({
  durationText,
  onDurationChange,
  date,
  onDateChange,
  note,
  onNoteChange,
}: EntryFormFieldsProps) {
  return (
    <>
      <label className="block text-sm font-medium text-foreground">
        Duration
        <div className="mt-1">
          <DurationInput value={durationText} onChange={onDurationChange} />
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
