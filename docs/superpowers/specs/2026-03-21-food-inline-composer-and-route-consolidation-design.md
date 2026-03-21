# Food Inline Composer And Route Consolidation Design

## Goal

Turn `/food` into the single food workspace by adding inline meal-slot composition, in-place deletion, and built-in day navigation, while removing the old `/food/browse` route.

## User-Validated Direction

- `/food` remains the canonical expanded food page.
- `Inbox` should replace the main content in place rather than navigating away.
- Empty slots should open an inline composer inside the slot.
- Filled slots should also be able to open an inline composer to append another item in that slot.
- Existing food items should be deletable from the same page with a softer two-step confirmation.
- `/food` must support navigating previous days directly, without depending on the dashboard.
- `/food/browse` should be removed rather than preserved.
- The dashboard should gain a quick-add entry point that opens the same inline composer flow and lands in inbox mode after save.

## Scope

### In Scope

- Add day navigation controls directly to `/food`
- Convert slot add behavior from route navigation to inline composition
- Allow appending to filled meal slots inline
- Keep header quick add and align it with the same inline composer model
- Show uncategorized inbox content inside `/food`
- Add inline two-step delete confirmation for food entries
- Remove `/food/browse` and move its needed behavior into `/food`
- Update dashboard food links and dashboard quick-add entry point
- Add tests for day navigation, inline composition, delete confirmation, inbox/day switching, and dashboard entry points

### Out Of Scope

- Redesigning the food entry detail page beyond leaving it available for open/edit
- Changing food API contracts unless required to support existing behavior from the unified page
- Broad dashboard redesign outside food-specific links and quick-add entry

## UX Structure

### Single Food Workspace

`/food` becomes the only food surface. The page shell remains Concept D styled, with:

- breadcrumb back to dashboard
- active section label
- active date label
- previous/next day controls
- calendar action
- quick add action
- inbox toggle action

The main content area swaps between:

- day meal grid
- uncategorized inbox organizer

### Day Navigation

Food should support moving across days without returning to the dashboard. Users can:

- go to previous day
- go to next day
- jump to a specific day from the calendar

Changing the day updates the meal grid for that date and keeps the page shell intact.

### Inline Slot Composer

Each slot card can open an inline composer.

For empty slots:

- composer is the primary add action
- it creates the first item for that slot on the active day

For filled slots:

- composer opens as an append action within the same slot card
- it adds another item to that slot on the active day

This composer should follow the same compact interaction model as the current quick add surface instead of routing to a full entry page.

### Header And Dashboard Quick Add

The header quick add remains available on `/food`.

The dashboard also gains a quick-add entry point that opens directly on the dashboard rather than navigating to `/food`. It should reuse the same inline composer component or layout treatment used in `/food`, stay mobile-safe, bind to the dashboard's currently selected date, and leave the dashboard in place after save. The intent is to reuse the same food composition pattern rather than introducing a second capture UI.

### Inbox In Place

Clicking `Inbox` changes the main content region to the uncategorized organizer view without leaving `/food`. This organizer should use the same visual language as the expanded page and should remain focused on uncategorized items rather than becoming a second browse route.

After a header/dashboard quick-add save, landing in inbox mode is acceptable for now.

## Deletion Behavior

Each visible food item on the page should expose a garbage icon.

Delete should use a softer two-step local confirmation:

1. user taps the garbage icon
2. card reveals a confirm/cancel treatment
3. confirm calls the existing delete route
4. visible day or inbox content refreshes in place

No immediate destructive action and no browser `confirm()` dialog.

## Routing

`/food` is the single page for:

- today’s meal grid
- previous day navigation
- uncategorized inbox content

`/food/browse` should be removed and allowed to 404 rather than redirecting.

Dashboard food links should point to `/food`, and dashboard quick add should also enter the unified `/food` workflow.

## Component Design

Recommended component split:

- `FoodPageShell`
  - owns selected date, active mode (`day` or `inbox`), and top-level refresh behavior
- `FoodInlineComposer`
  - reusable inline entry creator for header quick add, empty-slot add, and append-in-slot
- `FoodMealSlotCard`
  - renders slot state, append action, inline composer state, and inline delete confirmation
- `FoodInboxPanel`
  - renders uncategorized entries inside `/food`
- dashboard food triggers
  - updated to target the unified `/food` experience

This keeps the composition model consistent and avoids separate implementations for slot add, append, and header quick add.

## Data Flow

`/food` owns the active day.

Creating an item:

- header/dashboard quick add creates an uncategorized item for the active day
- slot composer creates an item for the active day with `meal_slot` prefilled
- append composer does the same within a filled slot
- dashboard quick add uses the dashboard's selected date as the target day and stays on the dashboard after save

Deleting an item:

- call existing delete route
- refresh the visible mode (`day` grid or `inbox`)

Switching days:

- reload the selected day’s assigned entries
- keep uncategorized inbox available via the same page mode toggle

## Error Handling

The shell should remain visible during:

- day reload
- inbox reload
- inline create
- delete confirmation flow

Errors should stay local to the affected area or composer and should not drop the user out of `/food`.

## Testing

Add or update tests for:

- previous/next day navigation on `/food`
- calendar date changes on `/food`
- inline composer opening on empty slots
- append composer opening on filled slots
- inline create behavior for slot-bound entries
- inbox mode replacing the main content in place
- two-step delete confirmation and refresh
- dashboard food card linking to `/food`
- dashboard quick-add entry into the unified food flow
- `/food/browse` removal impact as needed by route-level tests

## Risks

- Inline composition and inline deletion both add transient state to slot cards; state boundaries should stay local and predictable.
- Folding `/food/browse` into `/food` can create one large page if extraction is sloppy.
- Dashboard quick add must share the same composition behavior instead of becoming a second special-case capture path.

## Recommendation

Keep `/food` as the only food workspace and evolve it into a full day-and-inbox surface with built-in date navigation, inline slot composition, and inline delete confirmation. Remove the legacy browse route and reuse one compact composer pattern across header quick add, slot add, slot append, and dashboard quick add.
