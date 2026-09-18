import { apiFetch } from './client'
import { ApiError } from './errors'
import type { JsonApiCollectionDocument } from './types'

/** Every time entry needs a service_id, but the assignment's form has no service picker. Uses
 * Productive's own service_suggestions default-resolution instead of hardcoding one, falling
 * back to the first bookable service if there's no suggestion. */
export async function resolveServiceId(personId: string, date: string): Promise<string> {
  const suggestions = await apiFetch<JsonApiCollectionDocument<unknown>>('/service_suggestions', {
    query: {
      'filter[person_id]': personId,
      'filter[date][gt_eq]': date,
      'filter[date][lt_eq]': date,
      // Productive omits relationships.<x>.data unless explicitly included - see organizationMemberships.ts.
      include: 'service',
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
