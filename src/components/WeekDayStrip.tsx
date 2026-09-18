import { formatAsHHMM } from '../lib/duration'
import { today } from '../lib/format'
import { addDays, dayLabel, weekDays, weekRangeLabel } from '../lib/week'

interface WeekDayStripProps {
  weekStart: string
  selectedDate: string
  dailyTotals: Record<string, number>
  onSelectDate: (date: string) => void
  isLoading?: boolean
}

export function WeekDayStrip({ weekStart, selectedDate, dailyTotals, onSelectDate, isLoading }: WeekDayStripProps) {
  const days = weekDays(weekStart)
  const weeklyTotal = days.reduce((sum, day) => sum + (dailyTotals[day] ?? 0), 0)
  const todayDate = today()

  // Navigating to a week lands on today if today falls in that week, otherwise the week's first
  // day - rather than preserving the currently-selected weekday, which would make "today" scroll
  // out of view as soon as you'd navigated away from its week.
  function goToWeek(targetWeekStart: string) {
    const targetDays = weekDays(targetWeekStart)
    onSelectDate(targetDays.includes(todayDate) ? todayDate : targetWeekStart)
  }

  return (
    <div>
      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => goToWeek(addDays(weekStart, -7))}
          aria-label="Previous week"
          className="rounded-md p-1 text-muted-foreground hover:bg-surface-hover hover:text-foreground"
        >
          <ChevronIcon direction="left" />
        </button>
        <span className="w-32 text-center text-sm font-medium text-foreground">{weekRangeLabel(weekStart)}</span>
        <button
          type="button"
          onClick={() => goToWeek(addDays(weekStart, 7))}
          aria-label="Next week"
          className="rounded-md p-1 text-muted-foreground hover:bg-surface-hover hover:text-foreground"
        >
          <ChevronIcon direction="right" />
        </button>
      </div>

      <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1 sm:gap-2" aria-busy={isLoading}>
        {days.map((day) => {
          const { weekday, dayNum } = dayLabel(day)
          const isSelected = day === selectedDate
          const isToday = day === todayDate

          return (
            <button
              key={day}
              type="button"
              onClick={() => onSelectDate(day)}
              aria-current={isSelected ? 'date' : undefined}
              className={`flex min-w-16 shrink-0 flex-col items-center gap-1 rounded-lg border px-2 py-2 transition-colors ${
                isSelected
                  ? 'border-primary bg-primary text-white'
                  : 'border-border bg-surface text-foreground hover:bg-surface-hover'
              }`}
            >
              <span
                className={`text-[11px] tabular-nums ${isSelected ? 'text-white/80' : 'text-faint-foreground'}`}
              >
                {isLoading ? '--:--' : formatAsHHMM(dailyTotals[day] ?? 0)}
              </span>
              <span className="flex items-center gap-1 text-sm font-semibold">
                {weekday} {dayNum}
                {isToday && !isSelected && <span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />}
              </span>
            </button>
          )
        })}

        <div className="flex min-w-20 shrink-0 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border px-2 py-2">
          <span className="text-[11px] tabular-nums text-faint-foreground">
            = {isLoading ? '--:--' : formatAsHHMM(weeklyTotal)}
          </span>
          <span className="text-center text-xs font-medium text-muted-foreground">Weekly total</span>
        </div>
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
