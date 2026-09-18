import { formatAsHHMM } from '../lib/duration'
import { today } from '../lib/format'
import { dayLabel, weekDays } from '../lib/week'

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

  return (
    <div
      className="scrollbar-none flex w-full overflow-x-auto border-b border-border bg-surface px-4 sm:px-6"
      aria-busy={isLoading}
    >
      {days.map((day, index) => {
        const { weekday, dayNum } = dayLabel(day)
        const isSelected = day === selectedDate
        const isToday = day === todayDate

        return (
          <button
            key={day}
            type="button"
            onClick={() => onSelectDate(day)}
            aria-current={isSelected ? 'date' : undefined}
            className={`relative flex min-w-16 flex-1 shrink-0 flex-col items-center gap-1 border-b-2 py-2 text-foreground transition-colors hover:bg-surface-hover ${
              index > 0 ? 'border-l border-l-border' : ''
            } ${isSelected ? 'border-b-primary' : 'border-b-transparent'}`}
          >
            {isToday && (
              <span
                className="absolute top-0 left-1/2 h-1.5 w-3 -translate-x-1/2 rounded-b-full bg-primary"
                aria-hidden="true"
              />
            )}
            <span className="text-[11px] tabular-nums text-faint-foreground">
              {weekday} {dayNum}
            </span>
            <span className="text-sm font-semibold">
              {isLoading ? '--:--' : formatAsHHMM(dailyTotals[day] ?? 0)}
            </span>
          </button>
        )
      })}

      <div className="flex min-w-20 flex-1 shrink-0 flex-col items-center justify-center gap-1 border-l border-border bg-surface-hover py-2">
        <span className="text-[11px] text-muted-foreground">Weekly total</span>
        <span className="text-sm font-semibold tabular-nums text-foreground">
          {isLoading ? '--:--' : `= ${formatAsHHMM(weeklyTotal)}`}
        </span>
      </div>
    </div>
  )
}
