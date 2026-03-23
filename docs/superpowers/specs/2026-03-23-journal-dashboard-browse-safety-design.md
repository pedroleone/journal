# Journal Dashboard Browse Safety Design

## Summary

Remove journal-content previews from the dashboard, replace the archive button with a dedicated browse flow, and split journal navigation into a calendar browse page plus a dedicated entry-reading page. The result should make the dashboard safer to open around other people while keeping writing and history navigation fast.

## Goals

- Stop rendering journal body text directly on the dashboard.
- Keep dashboard journal actions clear for today, empty days, and past-day browsing.
- Replace the old archive affordance with `Browse Entries`.
- Turn `/journal/browse` into a month-based calendar navigator.
- Keep `/journal/entry/[id]` as the dedicated full entry-reading screen.
- Add previous/next navigation on the entry page across chronological existing entries.

## Non-Goals

- No encryption model changes.
- No changes to journal storage format.
- No year-scale browse redesign beyond month switching.
- No broad dashboard redesign outside the journal quadrant.

## Current Problems

- The dashboard currently exposes journal content inline, which is unsafe in a privacy-first product.
- The current journal browse route still centers on the archive-panel model rather than a dedicated calendar browsing experience.
- The archive label no longer matches the intended mental model.
- Entry history navigation is limited once the user lands on a specific entry page.

## Proposed Approach

Use three focused journal surfaces:

1. Dashboard journal quadrant becomes a compact status-and-action surface with no text preview.
2. `/journal/browse` becomes a full calendar page for month-by-month browsing.
3. `/journal/entry/[id]` remains a full reading page with chronological previous/next navigation.

This keeps dashboard exposure low, keeps browsing spatial, and keeps reading/editing focused.

## Dashboard Journal Quadrant

### Today With Entry

- Show a large centered `Continue Writing` button.
- Show compact metadata for:
  - last updated timestamp
  - current word count
- Replace the old archive action with `Browse Entries`.

### Today Without Entry

- Show a large centered `Write` button.
- Show compact metadata for the most recent journal activity:
  - `X days ago` when at least one earlier entry exists
  - `Empty journal` when no journal entries exist at all
- Keep `Browse Entries` available as the secondary action.

### Non-Today Selected Date

- Do not show direct write controls in the dashboard card.
- Show only whether the selected day has an entry:
  - `Entry available`
  - `No entry for this day`
- Keep the main card target browse-oriented so the user can inspect that date safely.
- If an entry exists for that past day, the user can still continue editing after opening it from the dedicated journal flow.

## Browse Page

### Route Role

`/journal/browse` should become a calendar-first browser rather than a read view with an archive side panel.

### Calendar Model

- Show one month at a time.
- Default to the current month.
- If a specific date is present in the query string, initialize to that month.
- Provide previous/next month controls.
- Each day cell should clearly show one of two states:
  - empty
  - has entry

### Day Interaction

- Every day cell is clickable.
- Clicking a populated day opens the dedicated entry route for that day’s entry.
- Clicking an empty day does not navigate away immediately. Instead it shows an inline selected-day empty state on the browse page with:
  - `No entry for this day`
  - `Write for this day`

This avoids a dead-end loop where an empty day click would only send the user back into the same browse page without a meaningful selected state.

## Entry Page

### Route Role

`/journal/entry/[id]` stays the full-screen reading surface for a journal entry.

### Navigation

- Preserve `Back to Browse`.
- Add previous/next controls that move to chronological adjacent existing entries globally.
- The controls should ignore empty dates and only move across real entries.
- At the oldest/newest edge, disable or hide the unavailable direction.

Chronological global navigation is preferred over carrying browse-page context because it is predictable and works regardless of how the user arrived at the entry page.

## Labels And Copy

- Dashboard secondary action: `Browse Entries`
- Dashboard today action with entry: `Continue Writing`
- Dashboard today action without entry: `Write`
- Dashboard non-today with entry: `Entry available`
- Dashboard non-today without entry: `No entry for this day`
- Dashboard no-history fallback: `Empty journal`
- Browse empty-day state: `No entry for this day`
- Browse empty-day CTA: `Write for this day`

## Data And API Impact

- The dashboard selected-day fetch should expose enough data to render:
  - whether an entry exists
  - entry id
  - updated timestamp
  - content for word-count derivation
- The dashboard may also need the latest existing journal date when the selected day is empty.
- `/api/entries/dates` remains the primary source for browse-page calendar marks.
- The entry page will likely need a lightweight previous/next lookup, either by:
  - extending an existing entry response with adjacent ids
  - or adding a narrowly scoped navigation endpoint

Backend work should stay minimal and only serve these UI states.

## Component Scope

- Update `components/dashboard/journal-quadrant.tsx` to render status/action states instead of content previews.
- Update browse-route composition in `app/journal/browse/page.tsx`.
- Add a dedicated month calendar component if the current date-tree abstraction is too archive-oriented to reuse cleanly.
- Update the entry page at `app/journal/entry/[id]/page.tsx` to include previous/next navigation.
- Preserve the existing write route and reuse it from the new dashboard and browse empty-day actions.

## Testing Strategy

Add or update tests for:

- dashboard today-with-entry state
- dashboard today-without-entry state
- dashboard non-today with-entry state
- dashboard non-today without-entry state
- dashboard no-history fallback `Empty journal`
- rename from `Archive` to `Browse Entries`
- browse page month rendering and month navigation
- populated-day click opens the entry page
- empty-day click shows inline empty state and `Write for this day`
- entry page previous/next controls across existing entries only

Manual verification should cover:

- no journal text appears on the dashboard
- today and non-today dashboard states match the new rules
- calendar marks align with stored entry dates
- empty-day behavior remains clear and non-confusing
- previous/next entry navigation follows chronology

## Risks

- Reusing the old archive/date-tree model too literally could leave browse-page structure half-converted.
- If dashboard metadata requires multiple fetches, loading states may feel inconsistent unless combined carefully.
- Previous/next entry lookup can become awkward if bolted onto the current entry page without a clear API contract.

## Acceptance Criteria

- The dashboard never displays journal content preview text.
- The dashboard shows `Continue Writing`, `Write`, or status-only states according to day context.
- `Browse Entries` replaces the old archive action.
- `/journal/browse` is a month-based calendar browser.
- Populated days open dedicated entry pages.
- Empty days show an inline empty state with `Write for this day`.
- `/journal/entry/[id]` supports chronological previous/next navigation across existing entries.
