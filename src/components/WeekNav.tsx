import { useRef } from 'react'
import { today } from '../lib/format'
import { addDays, startOfWeek, weekDays, weekRangeLabel } from '../lib/week'

interface WeekNavProps {
  weekStart: string
  selectedDate: string
  onSelectDate: (date: string) => void
}

/** Lives in the page header: prev/next week arrows, a "jump to this week" dot between them, and
 * the week-range label (opens a native date picker to jump to any date). */
export function WeekNav({ weekStart, selectedDate, onSelectDate }: WeekNavProps) {
  const todayDate = today()
  const dateInputRef = useRef<HTMLInputElement>(null)

  // Navigating to a week lands on today if today falls in that week, otherwise the week's first
  // day - rather than preserving the currently-selected weekday, which would make "today" scroll
  // out of view as soon as you'd navigated away from its week.
  function goToWeek(targetWeekStart: string) {
    const targetDays = weekDays(targetWeekStart)
    onSelectDate(targetDays.includes(todayDate) ? todayDate : targetWeekStart)
  }

  // The week range label opens a native date picker rather than a hand-built calendar - a
  // hidden date input (synced to the selected date, so the picker opens where you'd expect)
  // sits behind the visible label/chevron button and is triggered programmatically.
  function openDatePicker() {
    try {
      dateInputRef.current?.showPicker?.()
    } catch {
      dateInputRef.current?.focus()
    }
  }

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => goToWeek(addDays(weekStart, -7))}
        aria-label="Previous week"
        title="Previous week"
        className="rounded-md p-1 text-muted-foreground hover:bg-surface-hover hover:text-foreground"
      >
        <ChevronIcon direction="left" />
      </button>

      <button
        type="button"
        onClick={() => goToWeek(startOfWeek(todayDate))}
        aria-label="Go to this week"
        title="Go to this week"
        className="flex size-6 shrink-0 items-center justify-center rounded-md hover:bg-surface-hover"
      >
        <span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />
      </button>

      <button
        type="button"
        onClick={() => goToWeek(addDays(weekStart, 7))}
        aria-label="Next week"
        title="Next week"
        className="rounded-md p-1 text-muted-foreground hover:bg-surface-hover hover:text-foreground"
      >
        <ChevronIcon direction="right" />
      </button>

      <div className="relative ml-1">
        <button
          type="button"
          onClick={openDatePicker}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-foreground hover:bg-surface-hover"
        >
          {weekRangeLabel(weekStart)}
          <ChevronDownIcon />
        </button>
        <input
          ref={dateInputRef}
          type="date"
          value={selectedDate}
          onChange={(event) => onSelectDate(event.target.value)}
          tabIndex={-1}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full opacity-0"
        />
      </div>
    </div>
  )
}

function ChevronIcon({ direction }: { direction: 'left' | 'right' }) {
  const d = direction === 'left' ? 'M10 3L5 8l5 5' : 'M6 3l5 5-5 5'
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d={d} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ChevronDownIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3 6l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
