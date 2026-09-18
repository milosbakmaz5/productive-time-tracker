import { describe, expect, it } from 'vitest'
import { addDays, dayLabel, startOfWeek, weekDays, weekRangeLabel } from './week'

// 2026-09-14 is a known Monday - anchors every case below.

describe('addDays', () => {
  it('adds and subtracts days within a month', () => {
    expect(addDays('2026-09-14', 1)).toBe('2026-09-15')
    expect(addDays('2026-09-14', -1)).toBe('2026-09-13')
  })

  it('rolls over month and year boundaries', () => {
    expect(addDays('2026-01-30', 3)).toBe('2026-02-02')
    expect(addDays('2026-12-30', 3)).toBe('2027-01-02')
  })
})

describe('startOfWeek', () => {
  it('returns the same date when it is already Monday', () => {
    expect(startOfWeek('2026-09-14')).toBe('2026-09-14')
  })

  it('returns the preceding Monday for a mid-week date', () => {
    expect(startOfWeek('2026-09-17')).toBe('2026-09-14')
  })

  it('handles Sunday - the getDay() special case (0, not 7)', () => {
    expect(startOfWeek('2026-09-20')).toBe('2026-09-14')
  })
})

describe('weekDays', () => {
  it('returns all seven days of the week starting Monday', () => {
    expect(weekDays('2026-09-14')).toEqual([
      '2026-09-14',
      '2026-09-15',
      '2026-09-16',
      '2026-09-17',
      '2026-09-18',
      '2026-09-19',
      '2026-09-20',
    ])
  })
})

describe('weekRangeLabel', () => {
  it('omits the month twice when the week stays within one month', () => {
    expect(weekRangeLabel('2026-09-14')).toBe('Sep 14 – 20')
  })

  it('names both months when the week crosses a month boundary', () => {
    expect(weekRangeLabel('2026-09-28')).toBe('Sep 28 – Oct 4')
  })
})

describe('dayLabel', () => {
  it('labels Monday and Sunday correctly', () => {
    expect(dayLabel('2026-09-14')).toEqual({ weekday: 'Mon', dayNum: 14 })
    expect(dayLabel('2026-09-20')).toEqual({ weekday: 'Sun', dayNum: 20 })
  })
})
