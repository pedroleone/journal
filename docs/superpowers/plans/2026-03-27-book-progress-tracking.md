# Book Progress Tracking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let library books track current reading progress by format, preserve every progress update for later stats, and present the feature through a dedicated progress card on the book detail page.

**Architecture:** Keep the current book snapshot in `media_items.metadata` so existing list/detail reads stay simple, and add a new append-only `media_item_progress_updates` table for history. Extend the shared `LibraryDetail` component to support book-format setup and the visual progress card, and add a dedicated `POST /api/library/[id]/progress` route so progress logging stays separate from general item editing.

**Tech Stack:** Next.js App Router, React, TypeScript, Vitest, Drizzle ORM, Turso/libSQL

---

### Task 1: Add failing coverage for metadata and progress rules

**Files:**
- Modify: `tests/lib/library.test.ts`
- Modify: `tests/api/library.test.ts`
- Create: `tests/api/library-progress.test.ts`

- [ ] **Step 1: Write the failing helper tests**

Add unit tests in `tests/lib/library.test.ts` for the book-progress helper functions that will normalize metadata, clear incompatible snapshot values when format changes, and compute end-of-book state for ebook and physical-book progress.

- [ ] **Step 2: Write the failing API tests for create and update validation**

Extend `tests/api/library.test.ts` to cover:
- creating a book with `metadata.bookFormat = "ebook"`
- creating a book with `metadata.bookFormat = "physical"` and `metadata.totalPages`
- rejecting invalid book metadata such as unsupported format or invalid total page count
- preserving legacy non-book create behavior

- [ ] **Step 3: Write the failing progress-route tests**

Create `tests/api/library-progress.test.ts` to cover:
- logging ebook progress successfully
- logging physical-book progress successfully
- rejecting progress for non-book items
- rejecting progress for `finished` items
- rejecting mismatched payloads for the saved format
- rejecting percentages outside `0-100`
- rejecting page values above `totalPages`
- confirming the route both inserts a history row and updates `media_items.metadata`

- [ ] **Step 4: Run targeted tests to verify they fail for the intended reasons**

Run:
```bash
pnpm test tests/lib/library.test.ts
pnpm test tests/api/library.test.ts
pnpm test tests/api/library-progress.test.ts
```

Expected:
- helper tests fail because the new book-progress helpers do not exist yet
- API tests fail because the create/update validation and progress route behavior do not exist yet

### Task 2: Add schema and helper support for book progress

**Files:**
- Modify: `lib/schema.ts`
- Modify: `lib/library.ts`
- Create: `drizzle/0005_book_progress_tracking.sql`
- Modify: `drizzle/meta/_journal.json`
- Create or modify: `drizzle/meta/0005_snapshot.json`

- [ ] **Step 1: Add the new history table to the schema**

Define `mediaItemProgressUpdates` in `lib/schema.ts` with:
- `id`
- `mediaItemId`
- `userId`
- `progress_kind`
- `progress_value`
- `max_value`
- `created_at`

Use the same naming and foreign-key conventions as the rest of the library tables.

- [ ] **Step 2: Add focused helpers for book metadata and progress**

In `lib/library.ts`, add minimal helpers for:
- validating and normalizing book metadata shape
- clearing incompatible snapshot fields when the format changes
- deriving percent display from page progress plus `totalPages`
- deciding whether a completion cue should be shown

Keep these helpers small and pure so the API routes and UI can reuse them.

- [ ] **Step 3: Add the Drizzle migration**

Create the SQL migration for the new table and update the Drizzle metadata snapshot files so the schema and migration history stay consistent with the rest of the repo.

- [ ] **Step 4: Re-run helper tests**

Run:
```bash
pnpm test tests/lib/library.test.ts
```

Expected: PASS

### Task 3: Extend validation and create/update routes for book setup

**Files:**
- Modify: `lib/validators.ts`
- Modify: `app/api/library/route.ts`
- Modify: `app/api/library/[id]/route.ts`

- [ ] **Step 1: Add precise validator support for book metadata**

Add a focused Zod schema for book metadata and progress payloads. Validate:
- `bookFormat` as `ebook | physical`
- `totalPages` as a positive integer when provided
- route-specific progress payloads for percent or page updates

Avoid turning `metadata` into a fully rigid schema for all media types; only tighten the book-specific portion needed for this feature.

- [ ] **Step 2: Update create behavior for books**

In `POST /api/library`, normalize book metadata before insert so new books store:
- `bookFormat`
- `totalPages`
- null current-progress snapshot fields
- null `progressUpdatedAt`

Leave non-book items unchanged.

- [ ] **Step 3: Update general item edits for books**

In `PUT /api/library/[id]`, normalize incoming book metadata changes so:
- format changes clear incompatible snapshot fields
- lowering `totalPages` below current page progress clears the page snapshot
- non-book updates remain unchanged

- [ ] **Step 4: Re-run targeted API tests**

Run:
```bash
pnpm test tests/api/library.test.ts
```

Expected: PASS

### Task 4: Add the dedicated progress logging route

**Files:**
- Create: `app/api/library/[id]/progress/route.ts`
- Modify: `lib/validators.ts`
- Modify: `app/api/library/[id]/route.ts`

- [ ] **Step 1: Implement the new route with ownership and status checks**

Add `POST /api/library/[id]/progress` that:
- loads the owned media item
- rejects missing items
- rejects non-book items
- rejects `finished` items
- validates the payload against the saved book format

- [ ] **Step 2: Persist both history and current snapshot**

On a valid update:
- insert a row into `media_item_progress_updates`
- update `media_items.metadata` with the latest snapshot fields
- update `media_items.updated_at`

Keep the implementation minimal and aligned with the existing route patterns.

- [ ] **Step 3: Keep detail reads stable**

Only adjust `GET /api/library/[id]` if needed to ensure the returned item shape continues to expose the current snapshot cleanly. Do not add history to the response in this iteration.

- [ ] **Step 4: Re-run targeted progress-route tests**

Run:
```bash
pnpm test tests/api/library-progress.test.ts
```

Expected: PASS

### Task 5: Add failing UI coverage for book setup and progress card states

**Files:**
- Modify: `tests/components/library/library-detail-layout.test.tsx`
- Modify: `tests/app/library/new-page.test.tsx`
- Modify: `tests/app/library/detail-page.test.tsx`

- [ ] **Step 1: Write failing `LibraryDetail` tests for book setup**

Add component tests that verify:
- new book items show the format selection UI
- `totalPages` input appears only when the selected format is `physical`
- the dedicated progress card is not shown for unsaved new items

- [ ] **Step 2: Write failing `LibraryDetail` tests for existing book progress**

Add component tests that verify:
- ebook items show the visual progress card with percent input
- physical-book items show the visual progress card with page input
- view mode shows current progress and last-updated text
- near-completion state surfaces the subtle finish cue

- [ ] **Step 3: Write failing page wiring tests**

Extend the library detail and new-page tests to verify:
- the new page passes the expected draft metadata for books
- the detail page wires a progress submit handler into `LibraryDetail`

- [ ] **Step 4: Run targeted UI tests to verify they fail**

Run:
```bash
pnpm test tests/components/library/library-detail-layout.test.tsx
pnpm test tests/app/library/new-page.test.tsx
pnpm test tests/app/library/detail-page.test.tsx
```

Expected: FAIL because the new book-format controls and progress card do not exist yet

### Task 6: Implement book-format setup in the shared detail editor

**Files:**
- Modify: `components/library/library-detail.tsx`
- Modify: `app/library/new/page.tsx`
- Modify: `app/library/[id]/page.tsx`
- Modify: `lib/i18n.ts`

- [ ] **Step 1: Extend the detail component data shape and local draft state**

Update `LibraryDetailData` consumption and local state to handle:
- `bookFormat`
- `totalPages`
- current progress snapshot fields
- `progressUpdatedAt`

Keep the data extraction centered on `item.metadata` so the rest of the library model stays stable.

- [ ] **Step 2: Add format selection and conditional total-pages editing**

In `LibraryDetail`, when `item.type === "book"` and the surface is editable:
- show a format control
- show `totalPages` only for `physical`
- keep the rest of the editor unchanged for other media types

- [ ] **Step 3: Add the dedicated visual progress card**

For existing books with a defined format:
- render the dedicated card in the main content area
- show the primary progress number
- show a progress bar
- show the correct input (`percent` for ebook, `page` for physical)
- show the last update timestamp
- show a subtle completion cue when the snapshot is at the end state

Do not show the card for unsaved items.

- [ ] **Step 4: Wire the new page and detail page handlers**

Update:
- `app/library/new/page.tsx` so new-book drafts persist book-format metadata
- `app/library/[id]/page.tsx` so the detail page can submit progress to the new route and refresh the item afterward

- [ ] **Step 5: Add translation strings**

Extend `lib/i18n.ts` with the new library labels needed for:
- book format
- ebook
- physical
- total pages
- reading progress
- update percent / update page
- log
- updated date text
- finish cue text

- [ ] **Step 6: Re-run targeted UI tests**

Run:
```bash
pnpm test tests/components/library/library-detail-layout.test.tsx
pnpm test tests/app/library/new-page.test.tsx
pnpm test tests/app/library/detail-page.test.tsx
```

Expected: PASS

### Task 7: Verify integrated behavior

**Files:**
- Modify: none

- [ ] **Step 1: Run all touched library tests together**

Run:
```bash
pnpm test tests/lib/library.test.ts tests/api/library.test.ts tests/api/library-progress.test.ts tests/components/library/library-detail-layout.test.tsx tests/app/library/new-page.test.tsx tests/app/library/detail-page.test.tsx
```

Expected: PASS

- [ ] **Step 2: Run full verification**

Run:
```bash
pnpm test
```

Expected: PASS

- [ ] **Step 3: Commit**

Skip commit unless requested.
