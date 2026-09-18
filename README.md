# Productive Time Tracker

A client-side web app for managing daily time entries against the [Productive](https://productive.io) API. No backend — the browser talks to the Productive API directly.

See [SPECIFICATION.md](./SPECIFICATION.md) for architecture, API integration details, and implementation decisions.

## Setup

```bash
npm install
```

## Run

```bash
npm run dev
```

Opens at `http://localhost:5173`.

On first load you'll be asked for a Productive API token and organization ID (Settings → API integrations in your Productive account).

## Build

```bash
npm run build
```

## Test

```bash
npm run test
```

Unit tests for the pure logic modules (duration parsing, week/date math, HTML note serialization, error-message extraction) - see SPECIFICATION.md §7 for what is and isn't covered.
