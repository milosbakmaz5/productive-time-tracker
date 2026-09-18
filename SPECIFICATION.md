# Technical Specification

Living document — updated alongside each feature as it's built, not written after the fact.

## 1. Overview

Productive Time Tracker is a client-side-only web app (no backend) for managing a single person's time entries for a given day, against the real [Productive API](https://developer.productive.io). Users log in with a Productive API token + organization ID, and can list, create, edit, and delete their own time entries for a selected date.

## 2. Architecture

- **Stack**: React 19 + TypeScript, built with Vite.
- **Routing**: React Router — the edit screen is a dedicated route (`/entries/:id/edit`), not a modal, per the assignment's requirement that editing "exist in its own route."
- **Server state**: TanStack Query for all Productive API calls — handles caching, loading/error states, and cache invalidation after mutations, rather than hand-rolled fetch + `useState`/`useEffect` bookkeeping.
- **Styling**: Tailwind CSS.
- **Icons**: [`lucide-react`](https://lucide.dev) — tree-shakeable per-icon imports (only the ~9 icons actually used end up in the bundle) and MIT-licensed, so no attribution requirement the way an icon marketplace like Flaticon's free tier has. Every icon in the app started as a hand-drawn inline SVG; migrated wholesale to Lucide once more than a couple were needed, both to stop hand-approximating icon shapes from memory and so the whole set shares one consistent line weight instead of each hand-drawn icon being an independent guess at "looks about right."
- **No global client-state library** (Redux etc.) — the app's state is either server state (via TanStack Query) or local UI state, which doesn't justify the overhead at this scope.

### Design tokens

Colors are defined as semantic CSS custom properties in `src/index.css` (`--background`, `--foreground`, `--primary`, `--secondary`, `--accent`, `--error`), mapped into Tailwind v4's `@theme` so components use `bg-primary`/`text-foreground`/etc. instead of raw palette utilities (`bg-neutral-900`, `text-red-600`) scattered across files — changing the brand color or error shade is now a one-line edit in `index.css` rather than a find-and-replace.

Only six colors are hand-picked (generated via [realtimecolors.com](https://www.realtimecolors.com) — one hue per role, saturation held constant at ~44%, lightness varies per role and per mode). Everything else - `surface`, `surface-hover`, `border`, `border-strong`, `muted-foreground`, `faint-foreground`, and the `primary`/`error` hover and surface variants - is derived from those six via CSS `color-mix()` rather than picked by hand, so the derived set can't drift out of sync with the base palette. `secondary`/`accent` are defined but not yet consumed by any component - reserved for future UI (e.g. a badge or highlight) rather than force-fit somewhere for the sake of using them.

Dark mode is wired via `@media (prefers-color-scheme: dark)` re-defining the same six custom properties, so it follows the OS-level setting by default. A toggle inside the header's settings menu (see below) lets the user override this explicitly: `useTheme` (`src/lib/theme.ts`) persists the choice to `localStorage` and sets `data-theme="dark"|"light"` on `<html>`, which `index.css` gives priority over the media query (`:root[data-theme="dark"]` for an explicit dark choice; `:root:not([data-theme="light"])` inside the media query, so an explicit light choice opts out even when the OS is dark). Once a user makes an explicit choice, the app stops following further OS-level changes - overriding was the point. A small inline script in `index.html` applies any stored override before React mounts, so there's no flash of the wrong theme on load.

## 3. Authentication

- Login screen collects a Productive **API token** and **organization ID**.
- On submit, the app calls `GET /organization_memberships?filter[organization_id]=<id>` with the token to validate credentials and resolve the current person (`organization_membership.person`).
- Token, organization ID, and the resolved `person_id` are persisted to `localStorage` so a refresh keeps the user logged in. Logout clears all three.
- **Known trade-off**: storing the API token in `localStorage` is inherently exposed to XSS, since there is no backend available to hold it server-side or issue a scoped session cookie. This is an accepted limitation of the "client-side only, no server" constraint, not an oversight — documented here rather than worked around with a fake solution.

## 4. API integration

Base URL: `https://api.productive.io/api/v2`

Required headers on every request: `X-Auth-Token`, `X-Organization-Id`, `Content-Type: application/vnd.api+json`, `Accept: application/vnd.api+json`.

| Purpose | Request |
|---|---|
| Resolve person from org | `GET /organization_memberships?filter[organization_id]=<orgId>` |
| List entries for a date | `GET /time_entries?filter[person_id]=<id>&filter[date]=<YYYY-MM-DD>` |
| Resolve a default service for create | `GET /service_suggestions?filter[person_id]=<id>&filter[date][gt_eq]=<date>&filter[date][lt_eq]=<date>` (fallback: `GET /services?filter[time_tracking_enabled]=true&filter[bookable_date]=<date>&filter[person_id]=<id>`) |
| Create an entry | `POST /time_entries` |
| Edit an entry | `PATCH /time_entries/:id` |
| Delete an entry | `DELETE /time_entries/:id` |

### The `service_id` decision

The assignment's create/edit form only exposes duration, date, and description — but Productive's API requires every `time_entry` to reference a `service_id` (time entries sit under a `Service → Task → TimeEntry` hierarchy). Rather than inventing a fake default, the app calls the same `service_suggestions` endpoint Productive's own UI uses to default the service for a person on a given date, and uses that result silently. This was confirmed by capturing a real `POST /time_entries` request from the Productive web app during a create action against the test account.

### Minimal `POST /time_entries` body (verified against the real API)

```json
{
  "data": {
    "type": "time_entries",
    "attributes": {
      "date": "2026-09-14",
      "time": 180,
      "note": "plain text description"
    },
    "relationships": {
      "person": { "data": { "type": "people", "id": "<personId>" } },
      "service": { "data": { "type": "services", "id": "<resolvedServiceId>" } }
    }
  }
}
```

### Duration format

The API stores `time` as an integer number of minutes. The UI form will collect duration in _(TBD as the form is built — documenting the exact input format and conversion here once implemented)_.

### Description format

Productive's own UI stores `note` as HTML (its editor is rich-text). The API does not require HTML — this app uses a plain `<textarea>` and sends plain text, which is a deliberate simplification given the assignment's 10-hour scope, not an API constraint.

### Client code layout

- `src/lib/auth/storage.ts` — localStorage get/set/clear for `{ apiToken, organizationId, personId }`.
- `src/lib/api/client.ts` — the single `apiFetch` wrapper: injects auth headers, sets the JSON:API content type, and normalizes non-2xx responses into a typed `ApiError`. Every other API module goes through this rather than calling `fetch` directly.
- `src/lib/api/organizationMemberships.ts` — resolves `person_id` from a token + organization ID (used at login, before credentials are persisted).
- `src/lib/api/services.ts` — the `service_id` auto-resolution described above.
- `src/lib/api/timeEntries.ts` — list/create/update/delete.

**Open item to verify empirically**: `POST`/`PATCH` bodies use `"type": "time-entries"` (hyphenated), confirmed from a captured real create request. `service_suggestions`' actual response shape wasn't captured directly — `resolveServiceId` handles two plausible shapes (a `service` relationship, or the suggestion resource being a `services` resource itself) with a fallback to `/services` if neither matches. This will get exercised for real once the create flow is wired up and tested end-to-end against the test account.

### Platform quirk: relationships require explicit `include`

Unlike typical JSON:API implementations, Productive does **not** return a relationship's `data` (the related resource's type/id) unless that relationship is explicitly named in the `include` query param — without it, you get `"relationships": { "person": { "meta": { "included": false } } }` with no `data` at all, not even just the identifier. Discovered by testing `GET /organization_memberships` directly: `resolvePersonId` initially failed because it read `relationships.person.data` without requesting `include=person`. Fixed by adding `include=person` (and `include=service` in `resolveServiceId`'s `service_suggestions` call) — confirmed working end-to-end through the login screen against the real test account.

This matters generally: **any** relationship this app ever needs to read off a Productive response must be named in that request's `include` param, even if only the id is needed and the full related resource isn't used.

## 5. CORS

Verified empirically: `api.productive.io` returns permissive CORS headers and accepts authenticated requests from arbitrary third-party origins (tested from an unrelated localhost origin), which is what makes the "client-side only, no backend" architecture viable at all.

## 6. Screens / components

- **`LoginPage`** (`/login`) — API token + organization ID form.
- **`EntriesPage`** (`/`) — lists time entries for a selected date, **held in the URL** (`?date=YYYY-MM-DD` via `useSearchParams`, defaulting to today when absent) rather than local component state. This isn't just cosmetic: `EditEntryPage` can change an entry's date, and since it navigates back to `/` on save, the selected date has to survive that navigation (a fresh `useState` would just reset to today on remount) - landing on `/?date=<the-entry's-new-date>` shows the change immediately without EntriesPage needing any special-cased awareness of where the navigation came from. States:
  - **Loading**: skeleton placeholders shown on *every* fetch that changes what's on screen - including switching weeks, not just the very first load. An earlier version used `placeholderData: keepPreviousData` to avoid a skeleton flash when changing dates, but that meant a different date's stale content (sometimes "no entries") stayed on screen with no indication it was stale, which read as wrong rather than smooth. Removed in favor of always showing the skeleton for a genuinely new query. A background refetch of the *same* week (e.g. on window refocus) doesn't get a loading indicator at all - the data on screen is still valid, and a small "Updating…" label tried earlier for this case read as more distracting than useful for something that typically resolves in well under a second.
  - **Empty**: explicit "No time entries for this date" message, distinct from the error state.
  - **Error**: shows the failure message with an explicit **Retry** button that re-runs the query.
    - `retry: false` deliberately disables TanStack Query's default silent retries (3 attempts with exponential backoff) — with an explicit retry control already in the UI, silent auto-retries only added several seconds of delay before a real failure became visible, caught during testing.
    - `networkMode: 'always'` overrides the default behavior of *pausing* (not failing) queries while the browser reports offline. The default seemed reasonable until testing it directly (via DevTools' offline throttle): no error, no network request, no feedback at all beyond an indefinitely-stuck loading state - only resolving silently once connectivity returned. Since the assignment explicitly wants "an appropriate error" on load failure, and offline is a real way loading can fail for a user, `'always'` forces the real `fetch()` attempt so a genuine connectivity failure surfaces through the same error+retry UI as any other failure, rather than being a special silent case.
  - Duration is rendered as `Xh Ym` (`src/lib/format.ts`) rather than raw minutes.
  - `note` is normalized to plain text at the API layer (`stripHtml` in `src/lib/html.ts`, applied in `timeEntries.ts`'s response mapping), not just at display time - Productive's own rich-text editor stores descriptions as HTML (e.g. `<ul><li><p>text</p></li></ul>`), which rendered as literal tag characters before this fix. Normalizing at the API boundary means every consumer (this list, and the edit form's pre-filled textarea) gets clean text automatically. Each `<li>` is prefixed with `• ` before the HTML is stripped, so list structure survives as plain-text bullets rather than disappearing into unmarked lines.
  - The **reverse** direction matters just as much: `noteToHtml` (`src/lib/html.ts`, applied in `timeEntries.ts` on create/update) serializes this app's plain-text-with-`• `-prefixed-lines back into `<ul><li><p>...</p></li></ul>` / `<p>...</p>` before sending. Missed initially - a bulleted note created in this app displayed correctly here (since reads go through `stripHtml` regardless of what's stored), but rendered as one run-on line in Productive's own UI, because a plain newline has no visual meaning once Productive renders `note` as HTML. Sending real HTML fixes both sides at once without needing a rich-text editor in this app - the plain textarea's bullet convention just gets translated at the API boundary in both directions.
- **`AddEntryModal`** (`src/components/AddEntryModal.tsx`) — opened via a "+ Add time entry" button in the header, next to the settings menu (collapsing to just "+" below the `sm` breakpoint, via a `hidden`/`sm:inline` span pair rather than swapping the button's rendered content, so the accessible name stays "Add time entry" - set explicitly via `aria-label` - regardless of which span is visually shown); a modal rather than its own route, since only *editing* has the explicit "own route" requirement from the assignment. Defaults its date field to whichever date is currently selected on the list. On success, the list's selected date switches to match the created entry's actual date (from the server response, not the form's local state) and that date's query is invalidated - so the new entry is immediately visible even if it was created for a date other than the one currently being viewed.

  `Modal` (`src/components/Modal.tsx`, shared with `EditEntryPage`) is a centered card only from Tailwind's `sm` breakpoint up. Below it, it fills the entire viewport edge-to-edge instead - a small dialog on a phone-sized screen leaves little room for the duration/date/description fields and an on-screen keyboard at once, so a full-screen sheet is the better fit there; the desktop layout is untouched above `sm`.

  **Duration input** (`src/components/DurationInput.tsx` + `src/lib/duration.ts`) - a free-form text field accepting either a single magnitude-interpreted number, or literal `HH:MM`:
  - `< 10` → hours (e.g. `1` → `1h`; `1.5` → `1h 30min`)
  - `>= 10` and a whole number → minutes (e.g. `11` → `11 min`)
  - `>= 10` and fractional → hours (e.g. `11.37` → `11h 22min`)
  - Capped at 24h (1440 min) total regardless of which branch produced it, shown as a distinct red error rather than folded into the neutral `--:--` empty/unparseable state.
  - Empty or unparseable input shows `--:--` in neutral styling - not treated as an error, since it's the natural state before/while typing.
  - **On blur**, a valid value is rewritten in place to zero-padded `HH:MM` (e.g. `1.5` → `01:30`, `11` → `00:11`) - this is what the `00:00` placeholder was actually hinting at. Invalid or over-24h values are left untouched so the error/`--:--` state stays visible and editable. Since the reformatted value feeds back through the same field, `parseDurationInput` has to understand `HH:MM` as a first-class input style too (checked before the magnitude rules), not just produce it - otherwise blurring would leave the field showing a string its own parser couldn't read back.

  **Note input** (`src/components/NoteInput.tsx`) - a plain `<textarea>` (matching the app's plain-text description decision, see above) with lightweight bullet-list editing layered on top via keyboard handling, since real bullet characters typed into plain text don't need a rich-text editor to look and behave like a list:
  - Starts pre-filled with `• ` (cursor after it) - a new note defaults to list mode.
  - Enter on a bullet line with content continues the list (`\n• `).
  - Enter on an *empty* bullet line strips the bullet instead of adding another blank one - two consecutive Enters exits list mode, matching common note-app conventions (Notion, etc.).
  - Typing `- ` at the start of an empty line converts it into a bullet, re-entering list mode.
  - On submit, a note that's still just the default empty bullet (nothing ever typed) is sent as an empty string, not as a stray `•` character.

  **Unsaved-changes guard**: closing the modal (X, Cancel, backdrop click, or Escape - all funnel through one `requestClose`) is immediate if nothing was edited from the initial state (empty duration, default date, empty bullet note), but prompts a `ConfirmDialog` ("Discard changes?" / "Continue editing" / "Discard changes") if any field was touched. `ConfirmDialog` (`src/components/ConfirmDialog.tsx`) is a small generic component, reused as-is by `EditEntryPage` below, not one-off inline JSX.

  The three form fields (duration/date/note) are shared with `EditEntryPage` via `EntryFormFields` (`src/components/EntryFormFields.tsx`) rather than duplicated - the two forms differ only in their submit/close logic (create vs. update), not in what fields they show. The bullet constant and the "still just an empty bullet -> submit as empty string" logic live in `src/lib/note.ts` for the same reason (both forms need it).

- **`EditEntryPage`** (`/entries/:id/edit`) — visually a modal identical to `AddEntryModal` (matching the app's established UI, per explicit user preference), but genuinely mounted at its own route rather than local component state, satisfying User Story 3's literal "should exist in its own route" acceptance criteria: the URL changes on open, and the route is directly bookmarkable/refreshable - visiting it fresh (no list underneath) shows the same modal standalone rather than 404ing.

  Implemented as a **routed modal** using React Router's background-location pattern (`App.tsx`): the entry's "Edit" menu item (see `EntryActionsMenu` below) passes `state: { backgroundLocation: location }`, so the app's primary `<Routes>` continues rendering `EntriesPage` at that background location (list stays visible, dimmed, underneath) while a second, unconditional `<Routes>` matches the *actual* URL and renders `EditEntryPage` as an overlay on top. Without `backgroundLocation` (direct navigation or a refresh), the primary `<Routes>` matches the edit URL directly instead, and it renders the same way, just with nothing behind it.

  Fetches the entry by ID (`GET /time_entries/:id`, added as `getTimeEntry` in `timeEntries.ts`) rather than trusting router state or an already-cached list entry, since - per the above - this route is genuinely reachable standalone. Loading and error states (Retry + "Back to list") render inside their own simpler `Modal` instance with a direct close, since there's nothing to lose yet; only once the entry loads does `EditEntryForm` take over with its own `Modal` instance carrying the unsaved-changes guard - the guard's `hasChanges` state has to live in the same component that owns the `Modal`'s `onClose`, otherwise the backdrop/X/Escape paths could bypass it entirely (a real bug caught before the first attempt at wiring this up ever ran).

  Duration is pre-filled via `formatAsHHMM`, so it round-trips through the same `HH:MM` parsing `DurationInput` already needed for its own blur-reformat (see above) - no separate "initial value" format was needed.

  On successful save, the list stays on whatever date the user was reviewing - it does **not** follow the entry to its new date. An earlier version navigated to `/?date=<the updated entry's date>` on the reasoning that "the list reflects the changes" meant showing where the entry ended up; in practice that yanked the user away from the day they were looking at over one edit, which reads as more disorienting than helpful for someone oriented around a day rather than around a single entry. Both the entry's original date and its new one (if changed) get their list queries invalidated - so the entry correctly disappears from the original day and is fresh whenever the new day is visited - while the navigation itself just goes back to wherever the user came from (the same path `Cancel` uses).

- **`EntryActionsMenu`** (`src/components/EntryActionsMenu.tsx`) — the per-entry "⋮" (`MoreVertical`) trigger on `EntriesPage`, opening a small dropdown with **Edit** (`Pencil` icon, the `Link` carrying `backgroundLocation` state described above) and **Delete** (`Trash2` icon). Closes on an outside click or Escape, via a `mousedown`/`keydown` listener attached only while open. A single-purpose component rather than a generic reusable dropdown primitive - this app has exactly one menu, so building a configurable abstraction for it would be speculative.

- **Delete** — confirmed via `ConfirmDialog`, reused a third time but now genuinely async (create/edit's "discard changes" confirmations are instant local state changes that can't fail). Extended `ConfirmDialog` with two optional props rather than building a separate dialog: `isConfirming` (disables both buttons and blocks backdrop-dismiss while the request is in flight) and `error` (shown inline, dialog stays open so the user can retry or cancel instead of the failure being lost). `EntriesPage` calls `deleteMutation.reset()` when opening the dialog for a *different* entry, so a previous failed attempt's error doesn't leak into an unrelated delete confirmation.

### Entry card: layout and inline note editing

Each list card shows the description top-left and duration (`HH:MM`, via `formatAsHHMM` - not the earlier `Xh Ym` `formatDuration`, now removed as dead code) + the "⋮" menu top-right; the date is not shown per-card, since the whole list is already scoped to one selected date.

The description is editable directly in the list - click it, edit, and it saves on blur - rather than only through the edit modal. `EntryNoteEditor` (`src/components/EntryNoteEditor.tsx`) owns this:

- `NoteInput` gained a `variant` prop (`'boxed'` for the create/edit forms, `'plain'` for this borderless, auto-growing inline use) plus `readOnly`/`onFocus`/`onBlur`/`placeholder`. The underlying `<textarea>` is **always mounted** - entering edit mode only flips `readOnly` off, rather than swapping a `<p>` for a `<textarea>` on click. Swapping elements would put the textarea in the DOM only *after* the click that was supposed to focus it, losing the cursor position the click intended to set; toggling `readOnly` on an already-mounted, already-clicked element preserves it. Verified directly: clicking mid-word placed the cursor at that exact character offset.
- The draft deliberately stays the *raw* server value (not defaulted to the empty bullet) while not editing, so a genuinely empty note shows the `placeholder` text instead of a stray lone `•` with nothing after it - the default-to-bullet behavior only applies once editing actually starts (`onFocus`), matching how a fresh note in the create modal defaults to list mode.
- Sync-from-server logic (reset the draft when `entry.note` changes externally, e.g. after a refetch, but never while actively editing) is written as a conditional `setState` call during render rather than in a `useEffect` - React's documented pattern for "adjust state when a prop changes," which avoids triggering a second, unnecessary render pass (an initial `useEffect` version tripped exactly this lint rule).
- On blur: if the (bullet-normalized) draft matches the (bullet-normalized) original, nothing is sent - no pointless request for an unchanged field. On failure, the field is deliberately **not** reset to read-only - the draft (and its edits) stay visible and editable so the user can see what failed and retry, instead of the edit silently reappearing lost the next time the entry refetches.
- Saving submits the entry's existing `date`/`time` unchanged alongside the new `note`, since `PATCH` always sends the full attribute set (see §4) - there's no partial-field update on the API.

### Week view: day strip and navigation

Mirrors a pattern from Productive's own web app, split across two components:

- **`WeekNav`** (`src/components/WeekNav.tsx`) - lives in the page header (which replaced its "Time entries" title with this nav, kept as an `sr-only` `<h1>` for the accessibility tree rather than dropped outright): prev/next-week arrows with a small "jump to this week" dot between them, then the week-range label (e.g. "Oct 5 – 11"). All three get a `title` tooltip. The arrows (and the dot, which is just `goToWeek` targeting the week containing today) land on **today** if it falls within the target week, otherwise on that week's **Monday** - not on the same weekday that was clicked from, which would let today silently scroll out of view as soon as you navigated away from its week. The label itself is a button that opens a native date picker - replacing what used to be a separate always-visible `<input type="date">` row - by triggering `showPicker()` on a hidden date input kept in sync with the selected date, rather than a hand-built calendar widget: a real calendar UI for free, at the cost of the picker's exact appearance being up to the browser rather than styleable.
- **`WeekDayStrip`** (`src/components/WeekDayStrip.tsx`) - the seven day cells (each showing that day's total, e.g. `01:30`) plus a weekly-total cell, directly below the header rather than inside the page's centered content column. Clicking a cell selects that day (the same `date` URL param `EntriesPage` already drives everything from). Each cell is `flex-1` with a `min-w-16` floor - they share the full viewport width evenly when it fits, and only the ones past the floor overflow into horizontal scroll on narrow screens (scrollbar hidden via a small `.scrollbar-none` utility in `index.css`, scrolling itself untouched - `scrollbar-width: none` plus the `::-webkit-scrollbar` equivalent). Cells are separated by a left border on every cell but the first (`index > 0 ? 'border-l' : ''`) rather than Tailwind's `divide-x` - `divide-x` looked right in isolation but silently lost its width on `<button>` elements, because Preflight's browser-button-reset (`border-width: 0`) and `divide-x`'s sibling-selector rule have equal specificity, and Preflight happened to win; explicit per-item classes sidestep the collision entirely. Each cell shows the day (`Mon 14`, small/muted) above its duration (`text-sm font-semibold`) - the opposite emphasis from a plain date label, since the number people actually scan this row for is the duration. The weekly-total cell mirrors that same two-line shape for visual consistency, with a background one step off the strip's (`bg-surface-hover`, the same `color-mix()`-derived token used for hover states elsewhere - already "slightly darker in light mode, slightly lighter in dark mode" by construction, so it didn't need a new one).

Selection is a `border-b-2` underline rather than a filled background - every cell reserves the same 2px of bottom border space (`border-b-transparent` by default) so switching which day is selected only changes a color, never the cell's height. Today gets its own independent marker regardless of selection: a small dome (`rounded-b-full`, flat edge flush with the cell's top border) centered horizontally and absolutely positioned relative to the cell (`relative` on the button), rather than the inline dot next to the date text used before - the two indicators (today's dome at the top, selection's border at the bottom) no longer compete for the same visual space, so both can be shown on the same cell at once.

The header itself is `bg-surface-hover`, distinct from the strip's `bg-surface` sitting directly below it - a deliberate two-tone split between the two rows of the sticky block, rather than one flat background across both.

`EntriesPage` wraps the header and `WeekDayStrip` together in one `sticky top-0 z-20` container - above the entry actions dropdown (`z-10`, so an open dropdown never covers it) but below modals (`z-50`/`z-60`, so Add/Edit still overlays it) - rather than giving each its own independent sticky positioning, which would need the day strip's `top` offset to exactly match the header's rendered height (fragile - it'd silently drift if either one's content ever changed height). Sharing one sticky ancestor means they move as a single unit with no offset math at all.

The header's other side is `SettingsMenu` (`src/components/SettingsMenu.tsx`) - a single gear-icon trigger opening a dropdown with a "Dark mode" toggle and Log out, replacing what used to be two separate always-visible controls. The toggle is one interactive element (`role="menuitemcheckbox"`, `aria-checked`) rather than a nested switch-inside-a-button, with the pill/thumb rendered as decorative `aria-hidden` spans - clicking it calls the same `useTheme` hook `ThemeToggle` used before (now deleted, folded in here) and deliberately leaves the menu open, since flipping a toggle a couple of times to compare themes shouldn't require reopening the menu each time. Log out, by contrast, closes the menu and signs out immediately - it's a one-shot action, not something to reconsider mid-menu.

**Data**: `EntriesPage` fetches the *whole week* in one call (`listTimeEntriesForRange`, using `filter[date][gt_eq]`/`[lt_eq]`, added alongside the existing single-day `filter[date]` usage elsewhere in the API layer) rather than one request per visible day. The selected day's entry list and every day cell's total are both derived from this single result client-side (`Array.filter`/reduce over the week's entries), so switching the selected day within an already-loaded week is instant with no refetch - only crossing a week boundary triggers a new request.

**Cache invalidation** simplified alongside this: every mutation (create/edit/delete/inline note or duration edit) now invalidates `timeEntriesWeekQueryKey(personId)` - a query key *prefix* (`['time-entries-week', personId]`, no week attached) - rather than the specific date-scoped key(s) each call site used to compute individually. TanStack Query matches by prefix by default, so this invalidates every cached week for that person in one call. Simpler than the previous per-date approach, and incidentally more correct: an edit that moves an entry across a week boundary now reliably refreshes both the old and new week's totals without EditEntryPage needing to reason about which week(s) that spans.

### Entry card: inline duration editing

Duration is editable in place the same way, via `EntryDurationEditor` (`src/components/EntryDurationEditor.tsx`) - architecturally identical to `EntryNoteEditor` (always-mounted input toggling `readOnly`, render-time sync from the server value while not editing, save-on-blur-only-if-changed, stay-editable-on-failure). It reuses `DurationInput` itself rather than a separate input, so the parsing rules (free-form number or `HH:MM`, `<10` → hours, `>=10` whole → minutes, 24h cap) are identical to the create/edit forms.

`DurationInput` gained the same `variant`/`readOnly`/`onFocus`/`onBlur` props as `NoteInput`. The `'plain'` variant is narrower (`w-14`/`w-20` vs the boxed forms' wider fields) and shows a live `HH:MM` preview below the input while editing (e.g. typing `1111` shows `18:31` underneath), instead of the boxed variant's side `= Xh Ym` helper.

Invalid/over-24h input does not show inline text - it adds a red border to the input itself and a native `title` tooltip ("Must be less than 24 hours") shown on hover, keeping the compact list row from growing to fit an error line. One real bug surfaced building this: the boxed variant's `focus:border-neutral-500` utility has higher CSS specificity than a plain `border-red-500` class, so the red border was invisible while the field was actually focused (only appearing after blur) until the focus variant was made conditional too (`focus:border-red-500` when over max).

Selecting the full value on focus (`.select()`) is deferred one frame via `requestAnimationFrame` - calling it synchronously raced the browser's own selection reset that happens when the `readOnly` attribute flips off a moment later (as a result of the same focus event), so the selection was silently cleared before the user saw it.

### Entry actions menu: disabled while a save is in flight

Clicking the "⋮" trigger while a note or duration field is still focused blurs that field first - which, per the above, can kick off a save - before the click's own handler runs. Left alone, that meant the dropdown would open right as an edit started saving, letting Edit or Delete be clicked mid-save. `EntryRow` (`src/components/EntryRow.tsx`) now owns a per-entry `isSaving` flag, fed by an `onSavingChange` callback prop added to both `EntryNoteEditor` and `EntryDurationEditor` (reporting their mutation's `isPending`), and passed down to `EntryActionsMenu`: while true, the menu force-closes itself (adjusted during render, same pattern as the editors' own sync logic, rather than an effect), the trigger button is disabled, and its icon swaps to Lucide's `Loader2` with an `animate-spin` class. Scoped to just the inline note/duration saves - delete and the edit-modal's save already have their own dedicated loading UI (`ConfirmDialog`'s `isConfirming`, the modal's "Saving…" button text).

### API error messages

`ApiError.fromResponse` (`src/lib/api/errors.ts`) parses Productive's JSON:API error body instead of always falling back to a generic `Productive API error (422)` string: it uses `errors[0].detail`/`.title` (prefixed with the offending field, read from `source.pointer`) when present, with a small override map for specific error codes whose raw `detail` reads too tersely out of context. Currently one entry: `time_entry_salary_not_defined` (Productive rejects time entries dated before a person's salary/cost-rate record starts) becomes "This date is before your cost rate was set up in Productive, so time can't be tracked for it." instead of just the field name and "has no salary defined."

This is reactive (shown on a failed submit) rather than proactive. Productive's own UI proactively restricts the date picker using a `GET /api/v2/salaries?filter[person_id]=<id>` lookup (the `started_on` of the person's active salary/cost-rate record - not exposed anywhere on the Person resource itself). Deliberately not implemented here: it's an extra API call and extra UI state for a case the assignment's acceptance criteria already consider handled ("Validation and API errors are shown if creation fails") - the reactive error message satisfies that without the added scope.

## 7. What's tested / not tested

_(To be filled in — given the time budget, expect light coverage: API layer unit tests, not full e2e.)_

## 8. Known limitations / out of scope

- API token stored in `localStorage` (see §3).
- No rich-text description editor (see §4).
- No pagination UI for a single day's entries (Productive's own per-day entry count is small; `per_page` is set generously and not paged in the UI).
- Only the current user's own time entries are manageable — no team/approval features, matching the assignment's explicit scope.
