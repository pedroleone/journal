# Journal Dashboard Archive Design

## Summary

Bring the live journal experience into alignment with the `d-dashboard` expanded journal layout while adding a missing history-browsing feature. The route should become an editor-first journal canvas with a toggleable archive panel, preserving the mockup's centered reading surface and dashboard chrome.

## Goals

- Match the journal route more closely to `public/layouts/d-dashboard/journal.html`.
- Add a browsing pattern for older entries without reintroducing the legacy persistent sidebar layout.
- Keep the journal canvas dominant by default.
- Maintain a consistent dashboard visual language across desktop and mobile.
- Fix journal typography so headings, controls, and prose each use an intentional font role.

## Non-Goals

- No broad redesign of food, notes, library, or dashboard-home in this pass.
- No month/year aggregate reading mode redesign.
- No archive metadata expansion that requires new backend queries unless existing data already supports it cheaply.
- No route restructuring beyond what is needed to make the journal browse/write experience visually coherent.

## Current Problem

The current journal browse view still reflects the older product structure:

- a persistent left sidebar dominates desktop browsing
- the main content states use generic placeholders rather than the new dashboard journal canvas
- typography is inconsistent with the `d-dashboard` reference, especially for longform prose
- the `d-dashboard` journal mockup looks calmer and more intentional, but it lacks a concrete pattern for browsing older entries

This leaves the journal route visually disconnected from the dashboard redesign and functionally split between browsing and editing modes.

## Proposed Approach

Use an editor-first expanded journal page with a toggleable archive:

1. Keep the centered expanded journal canvas from the `d-dashboard` reference as the default visual state.
2. Add a compact archive toggle in the journal chrome.
3. Open the archive as a left slide-over panel on desktop and a full-height sheet on mobile.
4. Use the archive panel for year/month/day browsing only.
5. Render selected-day loading, entry, and empty states inside the same journal canvas.
6. Correct font roles so navigation stays sans, display dates stay display serif, and prose uses a dedicated reading serif.

## Layout Model

### Main Journal Canvas

The default state of the route is a centered journal surface that mirrors the `d-dashboard` expanded page:

- breadcrumb/top chrome remains part of the shared dashboard shell
- compact journal actions sit near the top of the content area
- date/meta row and main date heading anchor the page
- journal body remains the dominant visual element
- image tray and save/edit metadata stay within the same canvas language

The canvas should not visually collapse into a split-pane layout when browsing older entries.

### Archive Panel

The archive is navigation chrome, not primary content:

- desktop: left-anchored slide-over panel
- mobile: full-height sheet
- opened by an archive toggle near the journal header controls
- styled with dashboard surfaces, borders, muted labels, and journal accent cues
- contains the date tree and any lightweight supporting metadata that is already available without extra fetch complexity

The archive should feel like an extension of the dashboard shell rather than a generic app sidebar.

## Interaction Model

### Selection

- On first load, auto-select the latest available journal date, matching current behavior.
- Selecting a date updates the main journal canvas in place.
- On mobile, selecting a date closes the archive immediately.
- On desktop, the archive remains in its current open or closed state after selection.

### Toggle Behavior

- The archive toggle shows clear active styling while the panel is open.
- The panel does not reopen itself automatically after the user closes it.
- The panel open state is local UI state; the selected date is the meaningful page state.

### Canvas States

The journal canvas supports only these primary states:

- loading skeleton rendered in the new journal layout
- populated selected-day entry view
- no-entry state for the selected day, with a direct action to write for that date

This pass should avoid month-level or year-level aggregate reading views because they pull the page away from the selected editor-first model.

### Offline Behavior

Existing offline and reconnect messaging should be preserved, but rendered within the archive panel and journal canvas surfaces so it feels native to the new layout.

## Typography

Typography should be made explicit instead of relying on current incidental defaults:

- `DM Sans` remains the UI/control/navigation font
- `Fraunces` remains the display font for large journal dates and key headings
- longform journal prose gets a dedicated reading serif token

Implementation should prefer adding a reading-serif token at the app level and applying it to journal prose surfaces, rather than stretching the display font into body copy. The result should feel closer to the `d-dashboard` mockup's literary tone while keeping controls crisp and modern.

## Component Scope

This pass should stay narrow and focused on the journal route:

- restyle or replace the current browse-page shell
- introduce a journal-specific archive panel wrapper
- adapt `DateTree` into a dashboard-aligned archive navigator, or add a dedicated journal archive tree if that is cleaner
- refactor `EntryViewer` so its loading, empty, and populated states all fit the new journal canvas
- align the write flow visually with the same expanded journal language where practical

The goal is route-level cohesion, not a large dashboard abstraction project.

## Data And API Impact

- Continue using the existing `/api/entries/dates` endpoint for archive structure.
- Continue using existing date-based entry fetches for selected-day content.
- Do not introduce new data dependencies unless there is a strong UX payoff and the data is already cheap to derive.

If optional archive row metadata is added, it should come only from already-available information.

## Testing Strategy

Add or update tests around route behavior and layout state:

- latest journal date is auto-selected on load
- archive toggle behavior works on desktop and mobile
- selecting a date renders the correct journal canvas state
- mobile selection closes the archive
- empty selected-day state offers the expected write action
- typography-related class or token usage is covered only where practical and stable

Manual verification should cover:

- desktop archive slide-over behavior
- mobile archive sheet behavior
- visual alignment with `public/layouts/d-dashboard/journal.html`
- journal prose typography in read and write contexts

## Risks

- Reusing the existing `DateTree` too literally may keep legacy sidebar assumptions in the new design.
- Merging browse and write styling could create route-level duplication if component boundaries stay shallow.
- A new prose serif could clash with existing markdown/editor rendering if applied too broadly.
- Empty and loading states may still feel generic unless they are redesigned as part of the journal canvas itself.

## Acceptance Criteria

- The journal route visually aligns with the `d-dashboard` expanded journal layout.
- Older-entry browsing is available through a toggleable archive panel, not a persistent browse sidebar.
- The journal canvas remains the dominant visual element on desktop and mobile.
- Selecting dates updates the same journal canvas rather than switching to a different layout mode.
- Mobile archive browsing closes after date selection.
- Journal typography clearly separates UI, display, and prose roles.
- Tests cover the new archive interaction model and selected-day rendering states.
