import { loadCredentials } from '../auth/storage'
import type { ApiAuth } from './client'
import { apiFetch } from './client'
import { ApiError } from './errors'
import type { JsonApiCollectionDocument } from './types'

interface OrganizationMembershipAttributes {
  updated_at: string
}

/** Resolves the person_id for an organization membership. Pass explicit `auth` at login, before
 * credentials are stored - a failure there means "wrong token," not "session expired," so it
 * skips the session-invalidation flow. Omit `auth` to re-check the stored session instead. */
export async function resolvePersonId(auth?: ApiAuth): Promise<string> {
  const organizationId = auth?.organizationId ?? loadCredentials()?.organizationId
  if (!organizationId) {
    throw new ApiError('Not authenticated', 401)
  }

  const doc = await apiFetch<JsonApiCollectionDocument<OrganizationMembershipAttributes>>(
    '/organization_memberships',
    {
      auth,
      skipSessionInvalidation: !!auth,
      query: {
        'filter[organization_id]': organizationId,
        // Productive omits relationships.person.data entirely unless explicitly included -
        // without this, "person" comes back as just { meta: { included: false } }.
        include: 'person',
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
