export const BULLET = '• '
export const EMPTY_NOTE = BULLET

/** True if the note has any real typed content beyond bullet markers/whitespace. */
export function hasNoteContent(note: string): boolean {
  return note.replace(/•/g, '').trim() !== ''
}

/** A note that's still just empty bullets should be submitted as empty, not as stray markers. */
export function normalizeNoteForSubmit(note: string): string {
  return hasNoteContent(note) ? note.trim() : ''
}
