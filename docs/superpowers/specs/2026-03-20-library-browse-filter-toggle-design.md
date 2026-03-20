# Library Browse Filter Toggle Design

## Summary

Adjust the `library/browse` layout so the sticky header is smaller and more predictable, while making advanced filters optional. The search bar and type pills remain visible; the advanced filter panel is hidden by default and can be toggled open when needed.

## Goals

- Keep primary browsing controls visible without consuming too much viewport space.
- Remove the feeling that the filter area is visually dislocated from the top of the page.
- Let users browse the library without always seeing the advanced filters.
- Improve the mobile experience by avoiding a large sticky block that leaves too little space for content.

## Non-Goals

- No changes to library filtering semantics or URL parameter names.
- No persistence of the advanced filter panel open/closed state.
- No modal, drawer, or sheet implementation for filters in this iteration.

## Current Problem

`components/library/library-browse.tsx` renders the search bar, type pills, and `FilterBar` inside a single sticky container with `top-14`. That couples all filter UI into one pinned block:

- The vertical composition can feel slightly offset or visually detached.
- The advanced filters are always visible, even when not needed.
- On mobile, the sticky block consumes too much of the screen and reduces the visible content area.

## Proposed Approach

Use a two-tier layout:

1. A reduced sticky header that contains only:
   - search input
   - type pills
   - advanced filters toggle button
2. A conditional advanced filter panel rendered in normal page flow below the sticky header.

This keeps the most-used controls available while letting the expanded filter section scroll naturally with the page.

## Component Changes

### `components/library/library-browse.tsx`

- Add local UI state `filtersOpen`, initialized to `false`.
- Keep the search bar sticky.
- Keep the type pills inside the sticky area.
- Add a toggle control near the type pills.
- Move `FilterBar` outside the sticky wrapper.
- Render `FilterBar` only when `filtersOpen` is `true`.
- Adjust top offset classes so mobile uses a smaller sticky offset than desktop.

### `components/library/filter-bar.tsx`

- Preserve current filtering behavior and callbacks.
- Support rendering as a standalone collapsible section below the sticky controls.
- Keep active filter chips visible inside the panel when it is open.

No API or server-side changes are required.

## Interaction Design

- Default state on each visit: advanced filters closed.
- Tapping the toggle reveals the advanced filter panel inline.
- Tapping again hides it without clearing any active filters.
- Active filters remain applied even while the panel is hidden.
- Search and type filtering continue to work exactly as they do now.

## Responsive Behavior

### Desktop

- Sticky search/type bar remains near the top for quick refinement.
- Expanded advanced filters appear immediately below the sticky region.

### Mobile

- Sticky offset is reduced so the header does not consume as much viewport height.
- Expanded advanced filters scroll as normal content instead of staying pinned.
- Users can hide the advanced panel and browse the grid with more vertical space.

## Error Handling

- If vocabulary lists are empty, the existing `FilterBar` behavior remains unchanged.
- If filters are active while the panel is hidden, item results still reflect those active filters.
- No special recovery state is needed because this is presentational and URL-backed.

## Testing Strategy

Add component tests for `LibraryBrowse` to cover:

- advanced filters are hidden by default
- toggle button reveals the filter panel
- toggle button hides the filter panel again
- active filters remain effective when the panel is hidden

Existing page tests should continue to pass because URL parsing and data loading remain unchanged.

## Risks

- Moving `FilterBar` outside the sticky wrapper may expose spacing issues between header and content.
- The toggle label/icon needs to communicate state clearly enough without adding clutter.

## Acceptance Criteria

- `library/browse` loads with advanced filters hidden.
- Search and type pills remain visible and usable.
- A toggle shows and hides the advanced filter panel.
- Hiding the panel does not clear any current filters.
- The mobile layout leaves more visible space for browsing content than before.
