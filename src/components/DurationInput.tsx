import type { FocusEvent } from 'react'
import { formatAsHHMM, parseDurationInput } from '../lib/duration'

interface DurationInputProps {
  value: string
  onChange: (value: string) => void
}

export function DurationInput({ value, onChange }: DurationInputProps) {
  const parsed = parseDurationInput(value)

  function handleBlur() {
    if (parsed.kind === 'valid') {
      onChange(formatAsHHMM(parsed.minutes))
    }
  }

  // Focusing selects the whole value (visibly highlighted), so typing immediately replaces it
  // rather than requiring a manual select-all first - this is a short value people are more
  // likely to retype fresh than edit in place.
  function handleFocus(event: FocusEvent<HTMLInputElement>) {
    event.currentTarget.select()
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="text"
        inputMode="decimal"
        placeholder="00:00"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className="w-28 rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500"
      />
      {parsed.kind === 'exceeds-max' ? (
        <span role="alert" className="text-sm text-red-600">
          {parsed.message}
        </span>
      ) : (
        <span className="text-sm text-neutral-400">= {parsed.kind === 'valid' ? parsed.display : '--:--'}</span>
      )}
    </div>
  )
}
