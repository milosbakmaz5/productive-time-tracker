interface JsonApiErrorObject {
  code?: string
  title?: string
  detail?: string
  source?: { pointer?: string }
}

// Overrides for specific Productive error codes where the raw `detail` reads too tersely
// (e.g. "has no salary defined") to make sense to someone who didn't write the API.
const FRIENDLY_ERROR_MESSAGES: Record<string, string> = {
  time_entry_salary_not_defined:
    "This date is before your cost rate was set up in Productive, so time can't be tracked for it.",
}

function extractFirstError(body: unknown): JsonApiErrorObject | undefined {
  if (body && typeof body === 'object' && 'errors' in body) {
    const errors = (body as { errors?: unknown }).errors
    if (Array.isArray(errors) && errors.length > 0 && typeof errors[0] === 'object' && errors[0] !== null) {
      return errors[0] as JsonApiErrorObject
    }
  }
  return undefined
}

export class ApiError extends Error {
  status: number
  details?: unknown

  constructor(message: string, status: number, details?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }

  /**
   * Builds an ApiError from a failed response, preferring Productive's own JSON:API error detail
   * over a generic "Productive API error (422)" message wherever the body has one to offer.
   */
  static fromResponse(status: number, body: unknown): ApiError {
    const first = extractFirstError(body)
    if (first) {
      if (first.code && FRIENDLY_ERROR_MESSAGES[first.code]) {
        return new ApiError(FRIENDLY_ERROR_MESSAGES[first.code], status, body)
      }
      const detail = first.detail ?? first.title
      if (detail) {
        const field = first.source?.pointer?.split('/').pop()
        return new ApiError(field ? `${field}: ${detail}` : detail, status, body)
      }
    }
    return new ApiError(`Productive API error (${status})`, status, body)
  }
}
