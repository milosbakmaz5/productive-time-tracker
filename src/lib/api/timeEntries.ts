import { apiFetch } from './client'
import { noteToHtml, stripHtml } from '../html'
import type { JsonApiCollectionDocument, JsonApiDocument } from './types'

interface TimeEntryAttributes {
  date: string
  time: number
  note: string | null
}

export interface TimeEntry {
  id: string
  date: string
  /** Duration in minutes. */
  time: number
  note: string
}

function toTimeEntry(resource: { id: string; attributes: TimeEntryAttributes }): TimeEntry {
  return {
    id: resource.id,
    date: resource.attributes.date,
    time: resource.attributes.time,
    note: stripHtml(resource.attributes.note ?? ''),
  }
}

export async function getTimeEntry(id: string): Promise<TimeEntry> {
  const doc = await apiFetch<JsonApiDocument<TimeEntryAttributes>>(`/time_entries/${id}`)
  return toTimeEntry(doc.data)
}

/** Prefix-matches every cached week query for this person regardless of which week, so callers
 * that change one entry don't need to work out exactly which week(s) it falls into (including
 * the edge case of an edit moving an entry across a week boundary). */
export function timeEntriesWeekQueryKey(personId: string) {
  return ['time-entries-week', personId] as const
}

/** Fetches every entry in a date range (inclusive) in one call, so a week view can show
 * per-day totals without a separate request per day. */
export async function listTimeEntriesForRange(personId: string, from: string, to: string): Promise<TimeEntry[]> {
  const doc = await apiFetch<JsonApiCollectionDocument<TimeEntryAttributes>>('/time_entries', {
    query: {
      'filter[person_id]': personId,
      'filter[date][gt_eq]': from,
      'filter[date][lt_eq]': to,
      per_page: '200',
    },
  })

  return doc.data.map(toTimeEntry)
}

export interface CreateTimeEntryInput {
  personId: string
  serviceId: string
  date: string
  time: number
  note: string
}

export async function createTimeEntry(input: CreateTimeEntryInput): Promise<TimeEntry> {
  const doc = await apiFetch<JsonApiDocument<TimeEntryAttributes>>('/time_entries', {
    method: 'POST',
    body: {
      data: {
        // Hyphenated type confirmed against the real API from a captured create request.
        type: 'time-entries',
        attributes: {
          date: input.date,
          time: input.time,
          note: noteToHtml(input.note),
        },
        relationships: {
          person: { data: { type: 'people', id: input.personId } },
          service: { data: { type: 'services', id: input.serviceId } },
        },
      },
    },
  })

  return toTimeEntry(doc.data)
}

export interface UpdateTimeEntryInput {
  date: string
  time: number
  note: string
}

export async function updateTimeEntry(id: string, input: UpdateTimeEntryInput): Promise<TimeEntry> {
  const doc = await apiFetch<JsonApiDocument<TimeEntryAttributes>>(`/time_entries/${id}`, {
    method: 'PATCH',
    body: {
      data: {
        type: 'time-entries',
        id,
        attributes: {
          date: input.date,
          time: input.time,
          note: noteToHtml(input.note),
        },
      },
    },
  })

  return toTimeEntry(doc.data)
}

export async function deleteTimeEntry(id: string): Promise<void> {
  await apiFetch<void>(`/time_entries/${id}`, {
    method: 'DELETE',
  })
}
