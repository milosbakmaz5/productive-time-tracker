import { useMutation } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth/useAuth'
import { getErrorMessage } from '../lib/api/errors'
import { resolvePersonId } from '../lib/api/organizationMemberships'

export function LoginPage() {
  const { credentials, login } = useAuth()
  const navigate = useNavigate()
  const [apiToken, setApiToken] = useState('')
  const [organizationId, setOrganizationId] = useState('')

  const mutation = useMutation({
    mutationFn: () => resolvePersonId({ apiToken, organizationId }),
    onSuccess: (personId) => {
      login({ apiToken, organizationId, personId })
      navigate('/', { replace: true })
    },
  })

  if (credentials) {
    return <Navigate to="/" replace />
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    mutation.mutate()
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-background px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-lg border border-border bg-surface p-6 shadow-sm"
      >
        <h1 className="text-lg font-semibold text-foreground">Sign in to Productive</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter your API token and organization ID from Settings → API integrations.
        </p>

        <label className="mt-6 block text-sm font-medium text-foreground">
          API token
          <input
            type="password"
            required
            autoComplete="off"
            value={apiToken}
            onChange={(event) => setApiToken(event.target.value)}
            className="mt-1 block w-full rounded border border-border px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </label>

        <label className="mt-4 block text-sm font-medium text-foreground">
          Organization ID
          <input
            type="text"
            required
            autoComplete="off"
            value={organizationId}
            onChange={(event) => setOrganizationId(event.target.value)}
            className="mt-1 block w-full rounded border border-border px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </label>

        {mutation.isError && (
          <p role="alert" className="mt-4 text-sm text-error">
            {getErrorMessage(mutation.error, 'Could not sign in. Check your token and organization ID.')}
          </p>
        )}

        <button
          type="submit"
          disabled={mutation.isPending}
          className="mt-6 w-full rounded bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
        >
          {mutation.isPending ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}
