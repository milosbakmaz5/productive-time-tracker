import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AddEntryModal } from '../components/AddEntryModal'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { EntryRow } from '../components/EntryRow'
import { ThemeToggle } from '../components/ThemeToggle'
import { WeekDayStrip } from '../components/WeekDayStrip'
import { WeekNav } from '../components/WeekNav'
import { deleteTimeEntry, listTimeEntriesForRange, timeEntriesWeekQueryKey } from '../lib/api/timeEntries'
import { useAuth } from '../lib/auth/useAuth'
import { today } from '../lib/format'
import { addDays, startOfWeek } from '../lib/week'

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

  const weekStart = useMemo(() => startOfWeek(date), [date])
  const weekEnd = useMemo(() => addDays(weekStart, 6), [weekStart])

  const {
    data: weekEntries,
    isPending,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: [...timeEntriesWeekQueryKey(personId), weekStart],
    queryFn: () => listTimeEntriesForRange(personId, weekStart, weekEnd),
    // We already surface an explicit Retry button - default silent retries would just delay
    // showing a real failure by several seconds behind a loading indicator.
    retry: false,
    // Default 'online' mode pauses the query while the browser reports offline, rather than
    // letting it fail - so a genuinely offline user saw an indefinite spinner with no feedback
    // at all. 'always' lets the real fetch() attempt happen and fail normally into isError,
    // reusing the same error+retry UI as any other failure.
    networkMode: 'always',
  })

  const entries = useMemo(() => weekEntries?.filter((entry) => entry.date === date), [weekEntries, date])

  const dailyTotals = useMemo(() => {
    const totals: Record<string, number> = {}
    for (const entry of weekEntries ?? []) {
      totals[entry.date] = (totals[entry.date] ?? 0) + entry.time
    }
    return totals
  }, [weekEntries])

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteTimeEntry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: timeEntriesWeekQueryKey(personId) })
      setDeletingId(null)
    },
  })

  function requestDelete(id: string) {
    deleteMutation.reset()
    setDeletingId(id)
  }

  return (
    <div className="min-h-svh bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-surface px-4 py-4 sm:px-6">
        <h1 className="sr-only">Time entries</h1>
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <WeekNav weekStart={weekStart} selectedDate={date} onSelectDate={setDate} />
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
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setIsAddOpen(true)}
            className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-hover"
          >
            + Add time entry
          </button>
        </div>

        <div className="mt-4">
          <WeekDayStrip
            weekStart={weekStart}
            selectedDate={date}
            dailyTotals={dailyTotals}
            onSelectDate={setDate}
            isLoading={isPending}
          />
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
                <EntryRow key={entry.id} entry={entry} onDelete={() => requestDelete(entry.id)} />
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
            queryClient.invalidateQueries({ queryKey: timeEntriesWeekQueryKey(personId) })
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
