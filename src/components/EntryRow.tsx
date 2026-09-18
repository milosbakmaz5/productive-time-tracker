import { useState } from 'react'
import type { TimeEntry } from '../lib/api/timeEntries'
import { EntryActionsMenu } from './EntryActionsMenu'
import { EntryDurationEditor } from './EntryDurationEditor'
import { EntryNoteEditor } from './EntryNoteEditor'

interface EntryRowProps {
  entry: TimeEntry
  onDelete: () => void
}

/** Owns the combined "is a save in flight" state for one entry, so EntryActionsMenu can react to
 * either its note or duration editor saving - see their onSavingChange props. */
export function EntryRow({ entry, onDelete }: EntryRowProps) {
  const [isNoteSaving, setIsNoteSaving] = useState(false)
  const [isDurationSaving, setIsDurationSaving] = useState(false)

  return (
    <li className="rounded-lg border border-border bg-surface p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <EntryNoteEditor entry={entry} onSavingChange={setIsNoteSaving} />
        <div className="flex shrink-0 items-start gap-2">
          <EntryDurationEditor entry={entry} onSavingChange={setIsDurationSaving} />
          <EntryActionsMenu entryId={entry.id} onDelete={onDelete} isSaving={isNoteSaving || isDurationSaving} />
        </div>
      </div>
    </li>
  )
}
