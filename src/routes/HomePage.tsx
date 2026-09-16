import { useQuery } from '@tanstack/react-query'
import { resolvePersonId } from '../lib/api/organizationMemberships'
import { useAuth } from '../lib/auth/useAuth'

export function HomePage() {
  const { credentials, logout } = useAuth()

  // Temporary: re-validates the session on load so a revoked token logs the user out.
  // Will be superseded by the entries-list fetch, which serves the same purpose for real.
  useQuery({
    queryKey: ['session-check'],
    queryFn: () => resolvePersonId(),
    enabled: !!credentials,
    retry: false,
  })

  return (
    <div className="min-h-svh bg-neutral-50 p-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-500">Signed in as person {credentials?.personId}</p>
        <button
          type="button"
          onClick={logout}
          className="text-sm font-medium text-neutral-600 hover:text-neutral-900"
        >
          Log out
        </button>
      </div>
    </div>
  )
}
