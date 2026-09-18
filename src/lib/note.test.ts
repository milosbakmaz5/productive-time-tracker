import { describe, expect, it } from 'vitest'
import { EMPTY_NOTE, hasNoteContent, normalizeNoteForSubmit } from './note'

describe('hasNoteContent', () => {
  it('is false for an empty string', () => {
    expect(hasNoteContent('')).toBe(false)
  })

  it('is false for just the default empty-bullet state', () => {
    expect(hasNoteContent(EMPTY_NOTE)).toBe(false)
  })

  it('is false for multiple empty bullet lines', () => {
    expect(hasNoteContent('• \n• ')).toBe(false)
  })

  it('is true once there is real content after the bullet', () => {
    expect(hasNoteContent('• Hello')).toBe(true)
  })

  it('is true for plain text with no bullet at all', () => {
    expect(hasNoteContent('Hello')).toBe(true)
  })
})

describe('normalizeNoteForSubmit', () => {
  it('submits an empty-bullet-only note as an empty string, not a stray marker', () => {
    expect(normalizeNoteForSubmit(EMPTY_NOTE)).toBe('')
  })

  it('trims surrounding whitespace from real content', () => {
    expect(normalizeNoteForSubmit('  Hello  ')).toBe('Hello')
  })

  it('leaves a real bulleted note otherwise unchanged', () => {
    expect(normalizeNoteForSubmit('• Item one\n• Item two')).toBe('• Item one\n• Item two')
  })
})
