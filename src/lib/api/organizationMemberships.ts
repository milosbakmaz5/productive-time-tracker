import type { ApiAuth } from './client'
import { apiFetch } from './client'
import { ApiError } from './errors'
import type { JsonApiCollectionDocument } from './types'

interface OrganizationMembershipAttributes {
  updated_at: string
}

/**
 * Resolves the person_id for the current token within the given organization.
 * Called with explicit credentials at login time, before anything is persisted.
 */
export async function resolvePersonId(auth: ApiAuth): Promise<string> {
  const doc = await apiFetch<JsonApiCollectionDocument<OrganizationMembershipAttributes>>(
    '/organization_memberships',
    {
      auth,
      query: {
        'filter[organization_id]': auth.organizationId,
        per_page: '1',
      },
    },
  )

  const membership = doc.data[0]
  if (!membership) {
    throw new ApiError('No organization membership found for this organization ID', 404)
  }

  const person = membership.relationships?.person?.data
  if (!person || Array.isArray(person)) {
    throw new ApiError('Could not resolve a person from this organization membership', 500)
  }

  return person.id
}
