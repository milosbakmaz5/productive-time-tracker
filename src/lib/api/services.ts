import type { ApiAuth } from './client'
import { apiFetch } from './client'
import { ApiError } from './errors'
import type { JsonApiCollectionDocument } from './types'

/**
 * Every Productive time entry requires a service_id, but this app's create/edit form
 * (per the assignment) only exposes duration, date, and description. Rather than hardcode
 * a service, we replicate Productive's own default-resolution: service_suggestions returns
 * the service that person would suggest for that date, matching their own "quick add" flow.
 * Falls back to the first bookable service for that person/date if there's no suggestion.
 */
export async function resolveServiceId(auth: ApiAuth, personId: string, date: string): Promise<string> {
  const suggestions = await apiFetch<JsonApiCollectionDocument<unknown>>('/service_suggestions', {
    auth,
    query: {
      'filter[person_id]': personId,
      'filter[date][gt_eq]': date,
      'filter[date][lt_eq]': date,
      per_page: '1',
    },
  })

  const suggested = suggestions.data[0]
  if (suggested) {
    const serviceRelationship = suggested.relationships?.service?.data
    if (serviceRelationship && !Array.isArray(serviceRelationship)) {
      return serviceRelationship.id
    }
    // service_suggestions may return service resources directly rather than a relationship.
    if (suggested.type === 'services') {
      return suggested.id
    }
  }

  const services = await apiFetch<JsonApiCollectionDocument<unknown>>('/services', {
    auth,
    query: {
      'filter[time_tracking_enabled]': 'true',
      'filter[bookable_date]': date,
      'filter[person_id]': personId,
      per_page: '1',
    },
  })

  const fallback = services.data[0]
  if (!fallback) {
    throw new ApiError('No bookable service found for this person on this date', 404)
  }

  return fallback.id
}
