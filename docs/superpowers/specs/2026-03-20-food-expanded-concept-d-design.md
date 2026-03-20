# Food Expanded Concept D Design

## Goal

Replace the current simplified `/food` page with an expanded Concept D food dashboard that matches the prototype's visual language while preserving and upgrading the app's stronger existing food behaviors.

## User-Validated Direction

- `/food` becomes the expanded food screen.
- The page should follow the Concept D expanded layout from `public/layouts/d-dashboard/food.html`.
- Existing food workflows should be merged into that layout rather than flattened to the prototype's older assumptions.
- Uncategorized entries remain behind an action instead of living inline on the main screen.
- Meal slots with multiple entries should show those entries inline in stacked cards rather than hiding them behind a secondary "open slot" flow.

## Scope

### In Scope

- Rebuild `/food` as a date-focused expanded dashboard surface.
- Preserve Concept D breadcrumb/header/actions structure.
- Render the seven meal slots as the main content grid.
- Support real slot states:
  - populated slots
  - multi-entry slots
  - empty slots
  - skipped slots
  - observation slot
- Reuse current food behaviors where applicable:
  - date loading
  - day grouping by meal slot
  - add empty-slot entry
  - skip slot
  - undo skip
  - open/edit entry actions
  - uncategorized organizer route
- Add a quick-add entry action that fits the expanded layout.
- Preserve mobile usability with a responsive adaptation of the grid.
- Add or update tests for the new layout and interactions.

### Out of Scope

- Redesigning the uncategorized organizer flow beyond keeping it reachable from the new header action.
- Changing food APIs unless needed to support the new UI shape.
- Broad dashboard refactors outside food-related shared primitives.

## UX Structure

### Page Shell

The page uses the expanded content shell already established by Concept D:

- breadcrumb back to dashboard
- current section label (`Food`)
- active date display
- header action row

The surface should feel like a direct implementation of the reference layout rather than a generic card page.

### Header Actions

The header actions map the prototype controls to real app capabilities:

- `Quick Add`: opens an in-context quick add surface for the selected date
- `Inbox (n)`: navigates to the uncategorized organizer flow
- `Calendar`: opens a date picker and reloads the page for the selected day

Quick Add should not consume the whole page. It should behave like a compact contextual action that supports the current app's ability to create a food entry quickly.

### Main Grid

The main content is a seven-slot meal grid:

- breakfast
- morning snack
- lunch
- afternoon snack
- dinner
- midnight snack
- observation

Each slot is represented as a meal card following the prototype's visual hierarchy.

## Slot States

### Populated Slot

When a slot has one entry, show:

- slot name
- time
- entry text preview
- image preview when available
- entry actions (`Open`, `Edit`)

### Multi-Entry Slot

When a slot has multiple real entries, the card expands vertically and displays entries inline as stacked sub-cards. This keeps the page useful as a complete day-review surface and avoids forcing extra navigation for common repeated-meal scenarios.

Each stacked item should still expose entry-level actions without overwhelming the card.

### Empty Slot

When a slot has no entries and is not skipped, show an empty state that stays visually close to the prototype:

- slot label
- clear "add" affordance
- skip affordance for meal slots other than observation

The card should still read as a grid item rather than collapsing into button-only chrome.

### Skipped Slot

When a slot has a skipped marker entry, show a muted skipped state with an undo affordance.

### Observation Slot

Observation behaves like a normal slot for populated content and empty creation, but should not expose skip because skipping observation does not carry useful meaning.

## Data Flow

`/food` becomes the main day-oriented page and should load the selected date's food entries directly.

Recommended reuse from the current browse implementation:

- existing date-based fetch flow
- grouping entries by meal slot
- existing add/skip/undo operations
- existing entry links and navigation behavior

The selected day should default to today and update from the calendar action. The page should not require the browse screen's left archive sidebar.

## Quick Add Behavior

Quick Add should preserve the "fast capture" value of the old `/food` page while fitting the new dashboard surface.

Recommended implementation:

- open a compact overlay, dialog, or embedded panel from the header action
- default creation to the currently selected day
- allow text entry and photo attachment
- after success, refresh the visible day grid

The result should feel additive to the dashboard rather than like a second full-page mode fighting the main layout.

## Error Handling

The expanded shell should remain visible even if fetches fail.

Use pane-level states:

- loading skeletons or subdued loading placeholders for the meal grid
- lightweight empty states when the selected date has no entries
- non-destructive inline feedback for action failures

Avoid fallback behavior that drops the user back into the old simplified layout.

## Responsive Behavior

Desktop can preserve the multi-column prototype feel. Mobile should keep the same information architecture while collapsing the grid into a single-column stack or another compact responsive arrangement that still reads as Concept D rather than a plain list.

Header actions should remain accessible without crowding the top of the page.

## Component Design

The page should move away from one large render function and instead use focused food UI pieces, likely including:

- expanded food page shell/header
- meal grid
- meal slot card
- stacked meal entry preview
- quick add surface

Shared behaviors from the existing food browse page should be extracted or reused instead of duplicated where practical.

## Testing

Add or update tests to cover:

- `/food` rendering as the expanded layout instead of the old quick log
- meal slot state rendering for empty, skipped, single-entry, and multi-entry cases
- header actions wiring for inbox and date/calendar behavior
- quick add interaction and refresh behavior
- slot add/skip/undo actions

Tests should follow the existing Vitest patterns in `tests/app` and `tests/components`.

## Risks

- The current `/food` and `/food/browse` pages split responsibilities; reusing behavior without duplicating logic will require some extraction.
- The quick-add experience must integrate cleanly without making the expanded screen visually noisy.
- Multi-entry cards can become cluttered if action density is too high, so card internals should stay restrained.

## Recommendation

Implement `/food` as the new canonical expanded day view, reusing current food organizer behavior behind focused actions instead of separate primary screens. Preserve the Concept D layout closely at the shell and grid level, then let the stronger existing product behavior appear inside the meal cards and header actions.
