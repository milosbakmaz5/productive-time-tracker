const MAX_MINUTES = 24 * 60

export type ParsedDuration =
  | { kind: 'empty' }
  | { kind: 'invalid' }
  | { kind: 'exceeds-max'; message: string }
  | { kind: 'valid'; minutes: number; display: string }

const HH_MM_PATTERN = /^(\d{1,2}):(\d{2})$/

/**
 * Accepts two input styles:
 * - "HH:MM" (what the field normalizes to on blur, see formatAsHHMM) - parsed directly.
 * - A single free-form number, interpreted as either hours or minutes depending on its
 *   magnitude and whether it has a fractional part:
 *   - < 10                     -> hours (fractional part becomes minutes, e.g. 1.5 -> 1h 30min)
 *   - >= 10 and a whole number -> minutes
 *   - >= 10 and fractional     -> hours (e.g. 11.37 -> 11h 22min)
 * Total is capped at 24h (1440 min) regardless of which style/branch produced it.
 */
export function parseDurationInput(raw: string): ParsedDuration {
  const trimmed = raw.trim()
  if (trimmed === '') return { kind: 'empty' }

  const hhmm = HH_MM_PATTERN.exec(trimmed)
  if (hhmm) {
    const minutesPart = Number(hhmm[2])
    if (minutesPart > 59) return { kind: 'invalid' }
    return toResult(Number(hhmm[1]) * 60 + minutesPart)
  }

  const value = Number(trimmed.replace(',', '.'))
  if (!Number.isFinite(value) || value < 0) return { kind: 'invalid' }

  const isWhole = Number.isInteger(value)
  return toResult(Math.round(value < 10 || !isWhole ? value * 60 : value))
}

function toResult(totalMinutes: number): ParsedDuration {
  if (totalMinutes > MAX_MINUTES) {
    return { kind: 'exceeds-max', message: 'Max duration is 24h.' }
  }
  return { kind: 'valid', minutes: totalMinutes, display: formatMinutes(totalMinutes) }
}

function formatMinutes(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours === 0) return `${minutes} min`
  if (minutes === 0) return `${hours}h`
  return `${hours}h ${minutes}min`
}

/** Canonical "HH:MM" form the input normalizes to on blur. */
export function formatAsHHMM(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}
