import { describe, expect, it } from 'vitest'
import { formatAsHHMM, parseDurationInput } from './duration'

describe('parseDurationInput', () => {
  it('treats empty input as empty, not invalid', () => {
    expect(parseDurationInput('')).toEqual({ kind: 'empty' })
    expect(parseDurationInput('   ')).toEqual({ kind: 'empty' })
  })

  it('rejects non-numeric and negative input', () => {
    expect(parseDurationInput('abc')).toEqual({ kind: 'invalid' })
    expect(parseDurationInput('-1')).toEqual({ kind: 'invalid' })
  })

  describe('magnitude-based interpretation (no colon)', () => {
    it('treats whole numbers under 10 as hours', () => {
      expect(parseDurationInput('1')).toMatchObject({ kind: 'valid', minutes: 60 })
      expect(parseDurationInput('9')).toMatchObject({ kind: 'valid', minutes: 540 })
    })

    it('treats fractional numbers under 10 as hours, with the fraction as minutes', () => {
      expect(parseDurationInput('1.5')).toMatchObject({ kind: 'valid', minutes: 90 })
      // Comma is accepted as a decimal separator too.
      expect(parseDurationInput('1,5')).toMatchObject({ kind: 'valid', minutes: 90 })
    })

    it('treats whole numbers >= 10 as minutes', () => {
      expect(parseDurationInput('10')).toMatchObject({ kind: 'valid', minutes: 10 })
      expect(parseDurationInput('90')).toMatchObject({ kind: 'valid', minutes: 90 })
    })

    it('treats fractional numbers >= 10 as hours, not minutes', () => {
      // 11.37h -> 11h 22.2min, rounded to the nearest minute.
      expect(parseDurationInput('11.37')).toMatchObject({ kind: 'valid', minutes: 682 })
    })
  })

  describe('HH:MM input', () => {
    it('parses hours and minutes directly', () => {
      expect(parseDurationInput('01:30')).toMatchObject({ kind: 'valid', minutes: 90 })
      expect(parseDurationInput('00:11')).toMatchObject({ kind: 'valid', minutes: 11 })
    })

    it('rejects a minutes part over 59', () => {
      expect(parseDurationInput('01:60')).toEqual({ kind: 'invalid' })
    })
  })

  describe('the 24h cap', () => {
    it('accepts exactly 24h', () => {
      expect(parseDurationInput('24:00')).toMatchObject({ kind: 'valid', minutes: 1440 })
    })

    it('rejects anything over 24h regardless of which input style produced it', () => {
      expect(parseDurationInput('24:01')).toMatchObject({ kind: 'exceeds-max' })
      expect(parseDurationInput('1500')).toMatchObject({ kind: 'exceeds-max' })
    })
  })
})

describe('formatAsHHMM', () => {
  it('zero-pads hours and minutes', () => {
    expect(formatAsHHMM(90)).toBe('01:30')
    expect(formatAsHHMM(11)).toBe('00:11')
  })

  it('round-trips through parseDurationInput', () => {
    const formatted = formatAsHHMM(682)
    expect(parseDurationInput(formatted)).toMatchObject({ kind: 'valid', minutes: 682 })
  })
})
