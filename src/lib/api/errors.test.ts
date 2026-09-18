import { describe, expect, it } from 'vitest'
import { ApiError, getErrorMessage } from './errors'

describe('ApiError.fromResponse', () => {
  it('falls back to a generic message when the body has no parseable error', () => {
    expect(ApiError.fromResponse(422, undefined).message).toBe('Productive API error (422)')
    expect(ApiError.fromResponse(500, { errors: [] }).message).toBe('Productive API error (500)')
    expect(ApiError.fromResponse(500, { errors: ['not an object'] }).message).toBe('Productive API error (500)')
  })

  it('uses the friendly override for a known error code, ignoring the raw detail', () => {
    const body = {
      errors: [{ code: 'time_entry_salary_not_defined', detail: 'has no salary defined' }],
    }
    expect(ApiError.fromResponse(422, body).message).toBe(
      "This date is before your cost rate was set up in Productive, so time can't be tracked for it.",
    )
  })

  it('prefixes the detail with the field name from the JSON:API pointer', () => {
    const body = { errors: [{ detail: 'is invalid', source: { pointer: '/data/attributes/date' } }] }
    expect(ApiError.fromResponse(422, body).message).toBe('date: is invalid')
  })

  it('falls back to title when detail is missing, with no field prefix if there is no pointer', () => {
    const body = { errors: [{ title: 'Bad Request' }] }
    expect(ApiError.fromResponse(400, body).message).toBe('Bad Request')
  })

  it('sets status and preserves the original body on the resulting error', () => {
    const body = { errors: [{ detail: 'boom' }] }
    const error = ApiError.fromResponse(422, body)
    expect(error.status).toBe(422)
    expect(error.details).toBe(body)
    expect(error.name).toBe('ApiError')
  })
})

describe('getErrorMessage', () => {
  it('reads the message off a real Error', () => {
    expect(getErrorMessage(new Error('boom'))).toBe('boom')
  })

  it('reads the message off an ApiError, since it extends Error', () => {
    const error = ApiError.fromResponse(422, { errors: [{ detail: 'invalid' }] })
    expect(getErrorMessage(error)).toBe('invalid')
  })

  it('uses the default fallback for a non-Error value', () => {
    expect(getErrorMessage('just a string')).toBe('Something went wrong.')
  })

  it('uses a custom fallback when given one', () => {
    expect(getErrorMessage(null, 'Custom fallback.')).toBe('Custom fallback.')
  })
})
