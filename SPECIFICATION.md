# Technical Specification

Living document — updated alongside each feature as it's built, not written after the fact.

## 1. Overview

Productive Time Tracker is a client-side-only web app (no backend) for managing a single person's time entries for a given day, against the real [Productive API](https://developer.productive.io). Users log in with a Productive API token + organization ID, and can list, create, edit, and delete their own time entries for a selected date.

## 2. Architecture

- **Stack**: React 19 + TypeScript, built with Vite.
- **Routing**: React Router — the edit screen is a dedicated route (`/entries/:id/edit`), not a modal, per the assignment's requirement that editing "exist in its own route."
- **Server state**: TanStack Query for all Productive API calls — handles caching, loading/error states, and cache invalidation after mutations, rather than hand-rolled fetch + `useState`/`useEffect` bookkeeping.
- **Styling**: Tailwind CSS.
- **No global client-state library** (Redux etc.) — the app's state is either server state (via TanStack Query) or local UI state, which doesn't justify the overhead at this scope.

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

_(To be filled in as built.)_

## 7. What's tested / not tested

_(To be filled in — given the time budget, expect light coverage: API layer unit tests, not full e2e.)_

## 8. Known limitations / out of scope

- API token stored in `localStorage` (see §3).
- No rich-text description editor (see §4).
- No pagination UI for a single day's entries (Productive's own per-day entry count is small; `per_page` is set generously and not paged in the UI).
- Only the current user's own time entries are manageable — no team/approval features, matching the assignment's explicit scope.
