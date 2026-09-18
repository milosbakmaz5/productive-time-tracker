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
    <div className="flex gap-1.5 overflow-x-auto pb-1 sm:gap-2" aria-busy={isLoading}>
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
            <span className={`text-[11px] tabular-nums ${isSelected ? 'text-white/80' : 'text-faint-foreground'}`}>
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
  )
}
