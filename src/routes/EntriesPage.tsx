import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AddEntryModal } from '../components/AddEntryModal'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { EntryActionsMenu } from '../components/EntryActionsMenu'
import { EntryDurationEditor } from '../components/EntryDurationEditor'
import { EntryNoteEditor } from '../components/EntryNoteEditor'
import { ThemeToggle } from '../components/ThemeToggle'
import { deleteTimeEntry, listTimeEntries } from '../lib/api/timeEntries'
import { useAuth } from '../lib/auth/useAuth'
import { today } from '../lib/format'

export function EntriesPage() {
  const { credentials, logout } = useAuth()
  const personId = credentials!.personId
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const date = searchParams.get('date') ?? today()
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  function setDate(next: string) {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev)
      params.set('date', next)
      return params
    })
  }

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

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteTimeEntry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-entries', personId, date] })
      setDeletingId(null)
    },
  })

  function requestDelete(id: string) {
    deleteMutation.reset()
    setDeletingId(id)
  }

  return (
    <div className="min-h-svh bg-background">
      <header className="border-b border-border bg-surface px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <h1 className="text-base font-semibold text-foreground">Time entries</h1>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button
              type="button"
              onClick={logout}
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-sm font-medium text-foreground">
            Date
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="rounded-md border border-border px-3 py-1.5 text-sm outline-none focus:border-primary"
            />
          </label>
          <div className="flex items-center gap-3">
            {isFetching && !isPending && (
              <span className="text-xs text-faint-foreground" aria-live="polite">
                Updating…
              </span>
            )}
            <button
              type="button"
              onClick={() => setIsAddOpen(true)}
              className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-hover"
            >
              + Add time entry
            </button>
          </div>
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
                <li key={entry.id} className="rounded-lg border border-border bg-surface p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <EntryNoteEditor entry={entry} />
                    <div className="flex shrink-0 items-start gap-2">
                      <EntryDurationEditor entry={entry} />
                      <EntryActionsMenu entryId={entry.id} onDelete={() => requestDelete(entry.id)} />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>

      {isAddOpen && (
        <AddEntryModal
          personId={personId}
          defaultDate={date}
          onClose={() => setIsAddOpen(false)}
          onCreated={(created) => {
            setDate(created.date)
            queryClient.invalidateQueries({ queryKey: ['time-entries', personId, created.date] })
            setIsAddOpen(false)
          }}
        />
      )}

      {deletingId && (
        <ConfirmDialog
          title="Delete time entry?"
          message="This can't be undone."
          confirmLabel={deleteMutation.isPending ? 'Deleting…' : 'Delete'}
          cancelLabel="Cancel"
          isConfirming={deleteMutation.isPending}
          error={
            deleteMutation.isError
              ? deleteMutation.error instanceof Error
                ? deleteMutation.error.message
                : 'Something went wrong.'
              : null
          }
          onConfirm={() => deleteMutation.mutate(deletingId)}
          onCancel={() => setDeletingId(null)}
        />
      )}
    </div>
  )
}

function EntriesLoading() {
  return (
    <div className="space-y-2" aria-busy="true" aria-label="Loading time entries">
      {[0, 1, 2].map((key) => (
        <div key={key} className="h-16 animate-pulse rounded-lg border border-border bg-surface-hover" />
      ))}
    </div>
  )
}

function EntriesEmpty() {
  return (
    <div className="rounded-lg border border-dashed border-border p-8 text-center">
      <p className="text-sm text-muted-foreground">No time entries for this date.</p>
    </div>
  )
}

function EntriesError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="rounded-lg border border-error-border bg-error-surface p-6 text-center">
      <p className="text-sm text-error">Couldn't load time entries: {message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-3 rounded-md bg-error px-4 py-1.5 text-sm font-medium text-white hover:bg-error-hover"
      >
        Retry
      </button>
    </div>
  )
}
