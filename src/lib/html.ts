import { BULLET } from './note'

/** Productive stores descriptions as HTML; this app edits them as plain text, so incoming HTML
 * is normalized here. Uses DOMParser rather than a regex strip - safer, and it won't execute
 * embedded scripts since the parsed result is never attached to the live DOM. */
export function stripHtml(html: string): string {
  const withBullets = html.replace(/<li[^>]*>/gi, '<li>• ')
  const withBreaks = withBullets.replace(/<\/(p|li|div|h[1-6])>/gi, '\n').replace(/<br\s*\/?>/gi, '\n')
  const doc = new DOMParser().parseFromString(withBreaks, 'text/html')
  return (doc.body.textContent ?? '').replace(/\n{2,}/g, '\n').trim()
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/** Inverse of stripHtml: serializes this app's plain-text-with-bullets convention back into the
 * HTML structure Productive's own editor produces. Without this, a note created here would show
 * correctly in this app (which re-parses via stripHtml) but run together on one line in
 * Productive's own UI, since a bare newline has no meaning once rendered as HTML. */
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
