# Book Progress List Surfaces Design

## Summary

Show book progress percentages in the dashboard library quadrant and the library browse grid.

The percentage should appear only for books whose status is `in_progress`. Ebook items use their saved percentage directly. Physical books derive the displayed percentage from current page and total pages.

## Goals

- Surface reading progress outside the detail page.
- Show a single percentage representation for both ebooks and physical books.
- Keep the change display-only, without expanding the API unnecessarily.
- Preserve current non-book behavior.

## Non-Goals

- No additional progress editing controls outside the detail page.
- No API shape expansion solely for this display.
- No progress display for `backlog`, `finished`, or `dropped` books.
- No stats or timeline UI in this iteration.

## Proposed Approach

Compute progress in the UI from the existing library item `metadata`:

- ebook: use `currentProgressPercent`
- physical: derive percent from `currentProgressPage / totalPages`

Reuse the existing book-progress helper logic from `lib/library.ts` rather than duplicating the calculation in each component.

## Dashboard Surface

In `components/dashboard/library-quadrant.tsx`:

- add a small percentage label for `in_progress` books only
- place it near the status pill so it reads as current progress, not as another metadata field
- hide it when progress cannot be derived

## Library Browse Surface

In `components/library/library-card.tsx`:

- add a compact percentage label for `in_progress` books only
- keep the card visually light; this should be a secondary line, not a dominant badge
- hide it when progress cannot be derived

No changes are needed in `components/library/library-browse.tsx` beyond passing through the existing item shape if required.

## Data Rules

- Show progress only when:
  - `item.type === "book"`
  - `item.status === "in_progress"`
- Hide progress when:
  - the item is not a book
  - the status is not `in_progress`
  - ebook progress is null
  - physical progress cannot be converted to a valid percent because current page or total pages is missing

## Testing Strategy

Add or update tests for:

- dashboard quadrant renders percent for an `in_progress` ebook
- dashboard quadrant renders derived percent for an `in_progress` physical book
- dashboard quadrant does not render percent for non-book items or books outside `in_progress`
- library card/browse renders percent for an `in_progress` ebook
- library card/browse renders derived percent for an `in_progress` physical book
- library card/browse hides progress for non-book items or books outside `in_progress`

## Acceptance Criteria

- Dashboard shows a percentage for `in_progress` books with valid progress.
- Library browse cards show a percentage for `in_progress` books with valid progress.
- Physical books display derived percentage rather than page numbers.
- Non-book items and non-`in_progress` books do not show progress percentages.
