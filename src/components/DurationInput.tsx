import { forwardRef, type FocusEvent } from 'react'
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

export const DurationInput = forwardRef<HTMLInputElement, DurationInputProps>(function DurationInput(
  { value, onChange, variant = 'boxed', readOnly = false, onFocus, onBlur },
  ref,
) {
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

  // Selects the whole value on focus, so typing replaces it. Deferred a frame: doing it
  // synchronously raced the 'plain' variant's readOnly-removal, and the browser cleared the
  // selection once that attribute actually flipped off a moment later.
  function handleFocus(event: FocusEvent<HTMLInputElement>) {
    const el = event.currentTarget
    requestAnimationFrame(() => el.select())
    onFocus?.()
  }

  if (variant === 'plain') {
    return (
      <div>
        <input
          ref={ref}
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
        ref={ref}
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
})
