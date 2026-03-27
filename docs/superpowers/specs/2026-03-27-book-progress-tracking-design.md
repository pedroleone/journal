# Book Progress Tracking Design

## Summary

Add book-specific progress tracking to the library so users can:

- choose whether a book is an `ebook` or `physical` book when creating or editing it
- optionally store total pages for physical books
- log reading progress as a percentage for ebooks or current page for physical books
- preserve every progress update as historical data for future stats

The design keeps the current book snapshot in `media_items.metadata` for simple reads and adds a dedicated append-only history table for progress events.

## Goals

- Let users define a book format: `ebook` or `physical`.
- Let users store total pages for physical books.
- Let users update reading progress from the book detail page.
- Support progress updates for any non-`finished` book status.
- Preserve all progress updates for later analytics and history-based features.
- Fit the existing library architecture, which already stores type-specific fields in `media_items.metadata`.

## Non-Goals

- No stats UI in this iteration.
- No history timeline UI in this iteration.
- No automatic status change to `finished` when a user reaches the end of a book.
- No backfill for older books that do not yet have a format set.
- No encryption changes for book metadata or progress values in this iteration.

## Current Problem

The library supports generic media metadata and book page counts, but it does not distinguish ebook vs physical reading, cannot record current reading progress, and does not persist a history of progress updates.

Because the app may later generate reading stats, storing only the latest progress value would lose important historical information.

## Proposed Approach

Use a dual model for books:

1. Store the current book progress snapshot in `media_items.metadata` for simple item reads and detail-page rendering.
2. Store every progress update in a new `media_item_progress_updates` table for historical analysis.

This preserves the project’s current pattern of type-specific metadata inside `media_items`, while introducing a normalized history table only where append-only tracking is needed.

## Data Model

### `media_items.metadata`

For `type === "book"`, extend the metadata shape with:

- `bookFormat: "ebook" | "physical" | null`
- `totalPages: number | null`
- `currentProgressPercent: number | null`
- `currentProgressPage: number | null`
- `progressUpdatedAt: string | null`

Rules:

- `bookFormat` is required for new books in the UI, but may be null for legacy items.
- `totalPages` is only relevant for `physical` books.
- `currentProgressPercent` is only used for `ebook` books.
- `currentProgressPage` is only used for `physical` books.
- `progressUpdatedAt` reflects the timestamp of the most recent successful progress update.

### New Table: `media_item_progress_updates`

Create a new table to capture every progress event:

- `id`
- `media_item_id`
- `user_id`
- `progress_kind: "percent" | "page"`
- `progress_value: number`
- `max_value: number | null`
- `created_at`

Notes:

- `max_value` stores the total page count for physical-book updates when available, so later stats can interpret progress rows relative to the book state at that time.
- The table is append-only. Existing rows are never rewritten when a book’s format or page count changes later.

## API Design

### `POST /api/library`

Continue using the existing create route. For books, `metadata` may now include:

- `bookFormat`
- `totalPages`

Validation rules:

- Non-book items ignore book-specific metadata.
- New book items must provide `bookFormat`.
- `ebook` books must not require `totalPages`.
- `physical` books may provide `totalPages`.

### `PUT /api/library/[id]`

Continue using the existing update route for normal item edits, including book setup fields in `metadata`.

This route is responsible for:

- setting or changing `bookFormat`
- setting or changing `totalPages`
- clearing incompatible current snapshot values when format changes
- clearing invalid page-based snapshot values if `totalPages` is lowered below the current page progress

### New Route: `POST /api/library/[id]/progress`

Add a dedicated route for logging progress updates.

Request payload:

- ebook: `{ progressPercent: number }`
- physical: `{ currentPage: number }`

Behavior:

- verify the item exists and belongs to the user
- reject non-book items
- reject items whose status is `finished`
- validate the payload against the book’s current format
- insert a new `media_item_progress_updates` row
- update the current snapshot fields in `media_items.metadata`
- update `media_items.updated_at`

`GET /api/library/[id]` continues returning only the current snapshot for now. History remains server-side until a later stats or timeline feature needs it.

## Validation Rules

### Book Setup

- `bookFormat` must be either `ebook` or `physical` when provided.
- `totalPages` must be a positive integer when provided.
- `ebook` books clear `totalPages`, `currentProgressPage`, and any page-only UI state from the current snapshot.
- `physical` books clear `currentProgressPercent` from the current snapshot.

### Progress Updates

- Only `book` items may receive progress updates.
- Only non-`finished` items may receive progress updates.
- `ebook` books accept only percent-based updates.
- `physical` books accept only page-based updates.
- percent values must be between `0` and `100`, inclusive.
- page values must be greater than or equal to `0`.
- if `totalPages` exists, `currentPage` cannot exceed it.

## UI Design

### New Book Flow

When the selected library item type is `book`:

- show a required format choice: `ebook` or `physical`
- if `physical`, show `total pages`
- if `ebook`, hide `total pages`

The rest of the create flow remains unchanged. The page continues using the full detail editor rather than a separate book-specific form.

### Book Detail View

For existing book items in view mode, show:

- book format
- total pages for physical books
- current progress as either `NN%` or `page X`
- last progress update date when available

Legacy books with no format remain viewable and editable. They simply do not show a progress input until the user selects a format.

### Book Detail Progress Controls

For existing book items with a defined format and a non-`finished` status:

- render progress in a dedicated card rather than inline in the metadata rail
- use a visual progress bar and a prominent current-progress headline
- ebook: show a numeric percent input with an update action
- physical: show a current-page input with an update action and derive the displayed percentage from `totalPages` when available
- show the last update date in the card

Submitting progress does not automatically mark the item as finished. A later UI enhancement may suggest a separate finish action when the user reaches `100%` or the final page.

### Progress Card Direction

The selected UX direction is a dedicated visual-progress card in the main content area.

The card should emphasize:

- current progress as the primary number
- a progress bar
- a single compact input for the next update
- a clear `Log` action
- lightweight secondary context such as format, page totals, and last-updated timestamp

This card is preferred over:

- embedding progress inside the left metadata column
- making the first version history-first

### Completion Cue

When a logged value reaches the end state:

- ebook: `100%`
- physical: current page equals `totalPages`

the card should surface a subtle, separate completion affordance such as `Mark finished` or `Finish`.

Rules:

- do not change status automatically
- keep the completion cue secondary to the main progress update action
- only show the cue contextually when the end has been reached

### Edit Behavior

Format and total pages remain editable through the existing detail editor.

When format changes:

- `physical -> ebook` clears page-based current snapshot fields
- `ebook -> physical` clears percent-based current snapshot fields

When `totalPages` is lowered below the current saved page progress:

- clear the current page snapshot
- keep historical rows untouched

## Component Changes

### `components/library/library-detail.tsx`

- Add book-format controls in edit/new mode.
- Rename the book-specific page-count field from a generic `pages` metadata key to `totalPages`.
- Add a progress section for existing books.
- Show current progress and last-updated information in view mode.

### `app/library/new/page.tsx`

- Ensure draft book items can carry the extended metadata fields.
- Include book format and total page values when creating a new item.

### `app/library/[id]/page.tsx`

- Add a handler for the new progress route.
- Refresh the item after successful progress updates.

## Schema and Migration Changes

### `lib/schema.ts`

- Add `mediaItemProgressUpdates` table definition.

### Drizzle Migration

- Create a migration for the new progress table.
- No data backfill is required.

## Testing Strategy

Add unit tests for helper logic covering:

- book metadata normalization
- format-change cleanup behavior
- progress payload validation rules

Add API tests covering:

- creating books with `ebook` metadata
- creating books with `physical` metadata and `totalPages`
- rejecting invalid create/update payloads for book setup fields
- posting ebook progress successfully
- posting physical-book progress successfully
- rejecting progress for:
  - non-book items
  - `finished` items
  - mismatched format/payload combinations
  - out-of-range percentages
  - page values above `totalPages`
- confirming the progress route both inserts a history row and updates the item snapshot metadata

Add component and page tests covering:

- new-book flow shows format selection
- total-pages field appears only for physical books
- detail page shows ebook percent controls for ebooks
- detail page shows current-page controls for physical books
- view mode renders current progress and last-updated snapshot correctly

## Risks

- Book metadata already lives in a loosely typed JSON field, so inconsistent key usage would create drift unless helper functions centralize the shape.
- Allowing legacy books with null format preserves compatibility, but creates a mixed state the UI must handle explicitly.
- Duplicating current progress in `metadata` and history in a table requires the progress route to update both atomically.

## Acceptance Criteria

- New books require a format selection when type is `book`.
- Physical books may store total pages.
- Existing books can log progress from the detail page.
- Ebook progress is stored as a percentage.
- Physical-book progress is stored as a page number.
- Progress updates are allowed for any non-`finished` book status.
- Every progress update creates a historical row.
- The latest progress remains visible directly on the item detail page.
