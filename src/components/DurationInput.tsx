import type { FocusEvent } from 'react'
import { formatAsHHMM, parseDurationInput } from '../lib/duration'

interface DurationInputProps {
  value: string
  onChange: (value: string) => void
  /** 'boxed' (default): the bordered field with a side "= Xh Ym" helper, used in the create/edit
   * forms. 'plain': borderless, for editing inline in the list - the HH:MM preview renders below
   * the input instead of beside it, and only while actively editing. */
  variant?: 'boxed' | 'plain'
  readOnly?: boolean
  onFocus?: () => void
  onBlur?: () => void
}

export function DurationInput({
  value,
  onChange,
  variant = 'boxed',
  readOnly = false,
  onFocus,
  onBlur,
}: DurationInputProps) {
  const parsed = parseDurationInput(value)
  const isOverMax = parsed.kind === 'exceeds-max'
  // The 'plain' variant's live HH:MM preview only makes sense while actively editing, and gets
  // replaced by the error tooltip once over the 24h cap.
  const shouldShowPreview = !readOnly && !isOverMax

  function handleBlur() {
    if (parsed.kind === 'valid') {
      onChange(formatAsHHMM(parsed.minutes))
    }
    onBlur?.()
  }

  // Focusing selects the whole value (visibly highlighted), so typing immediately replaces it
  // rather than requiring a manual select-all first - this is a short value people are more
  // likely to retype fresh than edit in place. Deferred to the next frame: when `readOnly` is
  // driven by this same focus event (the inline list variant unlocks editing on focus), the
  // browser resets any selection made while the input was still readOnly once the attribute
  // actually flips off a moment later - selecting only after that settles avoids the reset.
  function handleFocus(event: FocusEvent<HTMLInputElement>) {
    const el = event.currentTarget
    requestAnimationFrame(() => el.select())
    onFocus?.()
  }

  if (variant === 'plain') {
    return (
      <div>
        <input
          type="text"
          inputMode="decimal"
          placeholder="00:00"
          value={value}
          readOnly={readOnly}
          onChange={(event) => onChange(event.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          title={isOverMax ? parsed.message : undefined}
          className={`w-13 rounded-sm border bg-background px-1 text-sm font-semibold outline-none ${
            isOverMax ? 'border-error text-error' : 'border-border text-foreground'
          }`}
        />
        {shouldShowPreview && (
          <p className="mt-0.5 text-xs text-faint-foreground">
            {parsed.kind === 'valid' ? formatAsHHMM(parsed.minutes) : '--:--'}
          </p>
        )}
      </div>
    )
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
        title={isOverMax ? parsed.message : undefined}
        className={`w-20 rounded border px-3 py-2 text-sm outline-none ${
          isOverMax ? 'border-error focus:border-error' : 'border-border focus:border-primary'
        }`}
      />
      {!isOverMax && (
        <span className="text-sm text-faint-foreground">= {parsed.kind === 'valid' ? parsed.display : '--:--'}</span>
      )}
    </div>
  )
}
