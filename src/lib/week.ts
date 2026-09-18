import { formatDateForInput } from './format'

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** Parses a "YYYY-MM-DD" string as local-midnight, matching formatDateForInput's local (not
 * UTC) convention - `new Date("YYYY-MM-DD")` parses as UTC and can land on the wrong local day. */
function parseDateInput(date: string): Date {
  const [year, month, day] = date.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function addDays(date: string, days: number): string {
  const d = parseDateInput(date)
  d.setDate(d.getDate() + days)
  return formatDateForInput(d)
}

/** The Monday on or before `date`. Date.getDay() is Sun=0..Sat=6, so Monday needs its own offset. */
export function startOfWeek(date: string): string {
  const day = parseDateInput(date).getDay()
  const diffToMonday = day === 0 ? -6 : 1 - day
  return addDays(date, diffToMonday)
}

export function weekDays(weekStart: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
}

export function weekRangeLabel(weekStart: string): string {
  const start = parseDateInput(weekStart)
  const end = parseDateInput(addDays(weekStart, 6))
  const startLabel = `${MONTH_LABELS[start.getMonth()]} ${start.getDate()}`
  const endLabel =
    start.getMonth() === end.getMonth() ? `${end.getDate()}` : `${MONTH_LABELS[end.getMonth()]} ${end.getDate()}`
  return `${startLabel} – ${endLabel}`
}

export function dayLabel(date: string): { weekday: string; dayNum: number } {
  const d = parseDateInput(date)
  return { weekday: WEEKDAY_LABELS[(d.getDay() + 6) % 7], dayNum: d.getDate() }
}
