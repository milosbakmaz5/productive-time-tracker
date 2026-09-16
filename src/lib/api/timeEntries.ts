import type { ApiAuth } from './client'
import { apiFetch } from './client'
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
    note: resource.attributes.note ?? '',
  }
}

export async function listTimeEntries(auth: ApiAuth, personId: string, date: string): Promise<TimeEntry[]> {
  const doc = await apiFetch<JsonApiCollectionDocument<TimeEntryAttributes>>('/time_entries', {
    auth,
    query: {
      'filter[person_id]': personId,
      'filter[date]': date,
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

export async function createTimeEntry(auth: ApiAuth, input: CreateTimeEntryInput): Promise<TimeEntry> {
  const doc = await apiFetch<JsonApiDocument<TimeEntryAttributes>>('/time_entries', {
    auth,
    method: 'POST',
    body: {
      data: {
        // Hyphenated type confirmed against the real API from a captured create request.
        type: 'time-entries',
        attributes: {
          date: input.date,
          time: input.time,
          note: input.note,
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

export async function updateTimeEntry(
  auth: ApiAuth,
  id: string,
  input: UpdateTimeEntryInput,
): Promise<TimeEntry> {
  const doc = await apiFetch<JsonApiDocument<TimeEntryAttributes>>(`/time_entries/${id}`, {
    auth,
    method: 'PATCH',
    body: {
      data: {
        type: 'time-entries',
        id,
        attributes: {
          date: input.date,
          time: input.time,
          note: input.note,
        },
      },
    },
  })

  return toTimeEntry(doc.data)
}

export async function deleteTimeEntry(auth: ApiAuth, id: string): Promise<void> {
  await apiFetch<void>(`/time_entries/${id}`, {
    auth,
    method: 'DELETE',
  })
}
