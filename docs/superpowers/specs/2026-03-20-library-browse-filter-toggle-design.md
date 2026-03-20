# Library Browse Browse-First Controls Design

## Summary

Adjust the `library/browse` layout so the browsing canvas is clean by default. Compact page actions move into the shared breadcrumb bar, while search and filtering live inside a hidden panel that opens only when requested.

## Goals

- Keep the library grid visually clean by default.
- Remove page-local action clutter from the browse content area.
- Let users browse without always seeing search or filter controls.
- Establish a reusable top-navbar actions pattern for other sections.
- Improve mobile browsing by avoiding persistent page-level toolbars.

## Non-Goals

- No changes to library filtering semantics or URL parameter names.
- No persistence of the filter panel open/closed state.
- No modal, drawer, or sheet implementation for filters in this iteration.
- No shared-navbar search input in this iteration.

## Current Problem

`library/browse` currently uses page-local controls for actions and refinement:

- Action placement is split between shared chrome and page content.
- Browse controls still occupy part of the layout instead of keeping the grid clean.
- There is no reusable way for a page to put compact actions into the breadcrumb bar.

## Proposed Approach

Use a shell-plus-panel layout:

1. The shared breadcrumb bar gains an optional right-side actions slot.
2. `library/browse` registers two actions in that slot:
   - `Filters`
   - `+`
3. The page body starts directly with library content.
4. Opening `Filters` reveals a panel above the content grid containing:
   - search
   - type pills
   - status pills
   - metadata filters
   - active filter chips

This gives the page a browse-first default state while keeping refinement and creation one tap away.

## Component Changes

### `components/dashboard/breadcrumb-bar.tsx`

- Add an optional right-side actions area.
- Preserve current breadcrumb behavior when no actions are supplied.
- Keep the actions API generic rather than library-specific.

### `components/dashboard/dashboard-shell.tsx`

- Provide a way for routed pages to supply breadcrumb-bar actions.
- Keep shared chrome ownership in the shell rather than duplicating navbar logic in pages.

### `components/library/library-browse.tsx`

- Add local UI state `filtersOpen`, initialized to `false`.
- Remove page-local top-right action buttons.
- Render the filter panel inline above content only when `filtersOpen` is `true`.
- Move the search field into the filter panel.
- Wire shared navbar actions to local browse behavior.

### `components/library/filter-bar.tsx`

- Preserve current filtering behavior and callbacks.
- Support rendering as the full browse refinement panel, with search above the existing type/status/metadata controls.
- Keep active filter chips visible inside the panel when it is open.

No API or server-side changes are required.

## Interaction Design

- Default state on each visit: filters closed.
- Tapping the breadcrumb-bar `Filters` action reveals the filter panel inline.
- Tapping again hides it without clearing any active filters.
- Active filters remain applied even while the panel is hidden.
- Search filtering continues to work exactly as it does now, but from inside the panel.
- Type filtering continues to work exactly as it does now, but from inside the panel.
- Tapping `+` in the breadcrumb bar routes to `/library/new`.

## Responsive Behavior

### Desktop

- Breadcrumbs remain on the left, page actions on the right.
- The content area starts directly with the library grid when filters are closed.
- Expanded filters appear below the breadcrumb bar and above the content grid.

### Mobile

- The breadcrumb row uses compact actions so label text and actions still fit.
- Users see the content grid immediately when filters are closed.
- Opening filters reveals search and refinement controls without permanently consuming content space.

## Error Handling

- If vocabulary lists are empty, the existing `FilterBar` behavior remains unchanged.
- If filters are active while the panel is hidden, item results still reflect those active filters.
- If a type filter is active while the panel is hidden, the flat-grid result mode still remains active.
- No special recovery state is needed because this is presentational and URL-backed.

## Testing Strategy

Add component tests for `LibraryBrowse` to cover:

- filters are hidden by default
- breadcrumb-bar `Filters` action reveals the filter panel
- search is hidden while the panel is closed
- search and type pills appear inside the panel when opened
- hiding the panel does not clear active filters
- breadcrumb-bar `+` action routes to `/library/new`

Add shell/chrome tests to cover:

- breadcrumb bar renders optional right-side actions
- pages without actions retain the current breadcrumb layout

Existing data-loading and route tests should continue to pass because URL parsing and filtering behavior remain unchanged.

## Risks

- Adding page-owned actions to shared shell chrome can create coupling if the API is not kept generic.
- Mobile breadcrumb width becomes tighter once actions live in the top bar.
- The filter action still needs to communicate hidden active filters clearly.

## Acceptance Criteria

- The breadcrumb bar supports reusable page-level actions.
- `library/browse` shows `Filters` and `+` in the breadcrumb bar.
- Search is hidden by default and available inside the filter panel.
- Type selection is available inside the filter panel as pills.
- Hiding the panel does not clear any current filters.
- The bottom quick-add/new panel is absent.
- The mobile layout leaves more visible space for browsing content than before.
