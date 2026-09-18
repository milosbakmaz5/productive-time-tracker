import { describe, expect, it } from 'vitest'
import { noteToHtml, stripHtml } from './html'

describe('stripHtml', () => {
  it('extracts plain text from a paragraph', () => {
    expect(stripHtml('<p>Hello world</p>')).toBe('Hello world')
  })

  it('prefixes list items with a bullet', () => {
    expect(stripHtml('<ul><li><p>Test entry</p></li></ul>')).toBe('• Test entry')
  })

  it('puts each paragraph on its own line', () => {
    expect(stripHtml('<p>Line one</p><p>Line two</p>')).toBe('Line one\nLine two')
  })

  it('decodes HTML entities via the DOM parser', () => {
    expect(stripHtml('<p>Fish &amp; chips</p>')).toBe('Fish & chips')
  })

  it('never executes embedded scripts, since parseFromString results are detached', () => {
    stripHtml('<p>hi</p><script>document.title = "pwned"</script>')
    expect(document.title).not.toBe('pwned')
  })

  it('collapses blank lines left by empty elements', () => {
    expect(stripHtml('<p>One</p><p></p><p>Two</p>')).toBe('One\nTwo')
  })
})

describe('noteToHtml', () => {
  it('returns empty string for empty or whitespace-only input', () => {
    expect(noteToHtml('')).toBe('')
    expect(noteToHtml('   ')).toBe('')
  })

  it('wraps a plain line in a paragraph', () => {
    expect(noteToHtml('Hello world')).toBe('<p>Hello world</p>')
  })

  it('wraps consecutive bullet lines in one shared <ul>, not one per line', () => {
    expect(noteToHtml('• Item one\n• Item two')).toBe('<ul><li><p>Item one</p></li><li><p>Item two</p></li></ul>')
  })

  it('mixes plain paragraphs and bullet lists in document order', () => {
    expect(noteToHtml('Plain line\n• Bullet line')).toBe('<p>Plain line</p><ul><li><p>Bullet line</p></li></ul>')
  })

  it('skips blank lines instead of emitting empty paragraphs', () => {
    expect(noteToHtml('Line one\n\nLine two')).toBe('<p>Line one</p><p>Line two</p>')
  })

  it('escapes HTML-significant characters', () => {
    expect(noteToHtml('<script>alert(1)</script>')).toBe('<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>')
  })
})

describe('round-trip (the actual bug this pair fixes)', () => {
  it('recovers a bulleted note exactly after going through noteToHtml then stripHtml', () => {
    const original = '• Item one\n• Item two'
    expect(stripHtml(noteToHtml(original))).toBe(original)
  })

  it('recovers a plain note exactly', () => {
    const original = 'Just a plain description'
    expect(stripHtml(noteToHtml(original))).toBe(original)
  })
})
