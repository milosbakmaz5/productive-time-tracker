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
