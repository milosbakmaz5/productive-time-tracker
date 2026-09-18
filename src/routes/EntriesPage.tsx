import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AddEntryModal } from '../components/AddEntryModal'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { EntryRow } from '../components/EntryRow'
import { SettingsMenu } from '../components/SettingsMenu'
import { WeekDayStrip } from '../components/WeekDayStrip'
import { WeekNav } from '../components/WeekNav'
import { getErrorMessage } from '../lib/api/errors'
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
    retry: false, // We already have an explicit Retry button - silent retries just delay the error.
    networkMode: 'always', // Default 'online' mode leaves an offline user stuck on a silent spinner.
  })

  // Defaults to [] rather than undefined, so isPending/isError alone gate what it means below.
  const entries = useMemo(() => weekEntries?.filter((entry) => entry.date === date) ?? [], [weekEntries, date])
  const hasLoaded = !isPending && !isError
  const shouldShowEmptyState = hasLoaded && entries.length === 0
  const shouldShowEntries = hasLoaded && entries.length > 0

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
      <div className="sticky top-0 z-20">
        <header className="border-b border-border bg-surface-hover px-4 py-4 sm:px-6">
          <h1 className="sr-only">Time entries</h1>
          <div className="mx-auto flex items-center justify-between">
            <WeekNav weekStart={weekStart} selectedDate={date} onSelectDate={setDate} />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsAddOpen(true)}
                aria-label="Add time entry"
                className="rounded bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-hover"
              >
                <span className="hidden sm:inline">+ Add time entry</span>
                <span className="sm:hidden" aria-hidden="true">
                  +
                </span>
              </button>
              <SettingsMenu onLogout={logout} />
            </div>
          </div>
        </header>

        <WeekDayStrip
          weekStart={weekStart}
          selectedDate={date}
          dailyTotals={dailyTotals}
          onSelectDate={setDate}
          isLoading={isPending}
        />
      </div>

      <main className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
        {isPending && <EntriesLoading />}

        {isError && <EntriesError message={getErrorMessage(error)} onRetry={() => refetch()} />}

        {shouldShowEmptyState && <EntriesEmpty />}

        {shouldShowEntries && (
          <ul className="space-y-2">
            {entries.map((entry) => (
              <EntryRow key={entry.id} entry={entry} onDelete={() => requestDelete(entry.id)} />
            ))}
          </ul>
        )}
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
          error={deleteMutation.isError ? getErrorMessage(deleteMutation.error) : null}
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
        <div key={key} className="h-16 animate-pulse rounded-md border border-border bg-surface-hover" />
      ))}
    </div>
  )
}

function EntriesEmpty() {
  return (
    <div className="rounded-md border border-dashed border-border p-8 text-center">
      <p className="text-sm text-muted-foreground">No time entries for this date.</p>
    </div>
  )
}

function EntriesError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="rounded-md border border-error-border bg-error-surface p-6 text-center">
      <p className="text-sm text-error">Couldn't load time entries: {message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-3 rounded bg-error px-4 py-1.5 text-sm font-medium text-white hover:bg-error-hover"
      >
        Retry
      </button>
    </div>
  )
}
