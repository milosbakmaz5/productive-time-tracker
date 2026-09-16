import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { listTimeEntries } from '../lib/api/timeEntries'
import { useAuth } from '../lib/auth/useAuth'
import { formatDuration, today } from '../lib/format'

export function EntriesPage() {
  const { credentials, logout } = useAuth()
  const personId = credentials!.personId
  const [date, setDate] = useState(() => today())

  const {
    data: entries,
    isPending,
    isError,
    error,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['time-entries', personId, date],
    queryFn: () => listTimeEntries(personId, date),
    // We already surface an explicit Retry button - default silent retries would just delay
    // showing a real failure by several seconds behind a loading indicator.
    retry: false,
    // Default 'online' mode pauses the query while the browser reports offline, rather than
    // letting it fail - so a genuinely offline user saw an indefinite spinner with no feedback
    // at all. 'always' lets the real fetch() attempt happen and fail normally into isError,
    // reusing the same error+retry UI as any other failure.
    networkMode: 'always',
  })

  return (
    <div className="min-h-svh bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <h1 className="text-base font-semibold text-neutral-900">Time entries</h1>
          <button
            type="button"
            onClick={logout}
            className="text-sm font-medium text-neutral-500 hover:text-neutral-900"
          >
            Log out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-sm font-medium text-neutral-700">
            Date
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm outline-none focus:border-neutral-500"
            />
          </label>
          {isFetching && !isPending && (
            <span className="text-xs text-neutral-400" aria-live="polite">
              Updating…
            </span>
          )}
        </div>

        <div className="mt-4">
          {isPending && <EntriesLoading />}

          {isError && (
            <EntriesError
              message={error instanceof Error ? error.message : 'Something went wrong.'}
              onRetry={() => refetch()}
            />
          )}

          {!isPending && !isError && entries && entries.length === 0 && <EntriesEmpty />}

          {!isPending && !isError && entries && entries.length > 0 && (
            <ul className="space-y-2">
              {entries.map((entry) => (
                <li key={entry.id} className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm font-semibold text-neutral-900">{formatDuration(entry.time)}</span>
                    <span className="text-xs text-neutral-400">{entry.date}</span>
                  </div>
                  {entry.note && <p className="mt-1 whitespace-pre-wrap text-sm text-neutral-600">{entry.note}</p>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  )
}

function EntriesLoading() {
  return (
    <div className="space-y-2" aria-busy="true" aria-label="Loading time entries">
      {[0, 1, 2].map((key) => (
        <div key={key} className="h-16 animate-pulse rounded-lg border border-neutral-200 bg-neutral-100" />
      ))}
    </div>
  )
}

function EntriesEmpty() {
  return (
    <div className="rounded-lg border border-dashed border-neutral-300 p-8 text-center">
      <p className="text-sm text-neutral-500">No time entries for this date.</p>
    </div>
  )
}

function EntriesError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
      <p className="text-sm text-red-700">Couldn't load time entries: {message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-3 rounded-md bg-red-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-red-700"
      >
        Retry
      </button>
    </div>
  )
}
