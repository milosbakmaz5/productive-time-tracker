import { BULLET } from './note'

/**
 * Productive's own rich-text editor stores descriptions as HTML (e.g. "<ul><li><p>note</p></li></ul>").
 * This app displays and edits descriptions as plain text, so incoming HTML is normalized to plain text
 * at the API boundary. Uses DOMParser rather than a regex strip - regex HTML parsing is unreliable, and
 * DOMParser.parseFromString never executes embedded scripts since the result isn't attached to the live DOM.
 */
export function stripHtml(html: string): string {
  const withBullets = html.replace(/<li[^>]*>/gi, '<li>• ')
  const withBreaks = withBullets.replace(/<\/(p|li|div|h[1-6])>/gi, '\n').replace(/<br\s*\/?>/gi, '\n')
  const doc = new DOMParser().parseFromString(withBreaks, 'text/html')
  return (doc.body.textContent ?? '').replace(/\n{2,}/g, '\n').trim()
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/**
 * Inverse of stripHtml's bullet handling: serializes this app's plain-text-with-"• "-prefixed-lines
 * convention into the <ul><li><p>...</p></li></ul> / <p>...</p> structure Productive's own rich-text
 * editor produces. Without this, an entry created here has literal newlines in its `note` - which
 * Productive's UI renders as HTML, where a bare newline has no visual meaning, so every bulleted line
 * runs together on one row there even though it displays correctly in this app's own list (which
 * re-parses the note through stripHtml rather than rendering it as HTML).
 */
export function noteToHtml(note: string): string {
  if (!note.trim()) return ''

  const parts: string[] = []
  let bulletItems: string[] = []

  function flushBullets() {
    if (bulletItems.length > 0) {
      parts.push(`<ul>${bulletItems.join('')}</ul>`)
      bulletItems = []
    }
  }

  for (const line of note.split('\n')) {
    if (line.startsWith(BULLET)) {
      bulletItems.push(`<li><p>${escapeHtml(line.slice(BULLET.length))}</p></li>`)
    } else {
      flushBullets()
      if (line.trim() !== '') {
        parts.push(`<p>${escapeHtml(line)}</p>`)
      }
    }
  }
  flushBullets()

  return parts.join('')
}
