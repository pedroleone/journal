# Journal Dashboard Correction Design

## Summary

Correct the journal implementation so it matches the approved dashboard journal design more closely. This pass restores the intended browse and write separation, fixes the journal header language and iconography, makes dashboard navigation date-aware, and ensures editing is a full-page experience without the archive/sidebar visible.

## Goals

- Remove the improvised browse header and restore the approved journal layout language.
- Keep browse and write in the same design family while giving write a dedicated full-page editing experience.
- Make dashboard journal navigation respect the selected dashboard date.
- Send empty selected days directly to the full-page writer.
- Preserve the archive panel only for browse mode.

## Non-Goals

- No new archive interaction redesign.
- No broader dashboard shell redesign outside journal-related routing and presentation.
- No new journal data model or API changes.

## Current Problems

- The browse route shows an invented title (`Archive-aware journal`) that does not exist in the approved design.
- The header structure in both browse and write does not match the approved journal mockup's meta row, icons, or wording.
- The write route still shows the legacy desktop sidebar, which breaks the intended full-page editing experience.
- The dashboard journal card always routes to `/journal/browse`, even when the selected day has no entry.
- Browse defaults to latest-entry behavior too aggressively instead of respecting explicitly selected days.

## Proposed Approach

Use route-aware correction rather than introducing more shared state:

1. Restore a design-accurate journal header in browse mode.
2. Remove archive/sidebar UI from write mode entirely.
3. Make the dashboard journal card compute a date-aware target:
   - existing day -> browse on that day
   - empty day -> write on that day
4. Make browse honor incoming date selection before falling back to latest existing entry.
5. Keep the archive panel as a browse-only secondary control.

## Browse Mode

Browse should be a reading/archive surface:

- top content area uses the approved journal language rather than a generic page title
- meta row uses compact status/date treatment with matching separators and wording
- archive toggle remains available as a tool, not as the page identity
- selected-day content remains in the centered journal canvas
- query-provided dates should open directly, even when the selected day has no entry

Browse should feel like the expanded dashboard journal view with archive access, not a standalone app section.

## Write Mode

Write should be a full-page editor:

- no archive panel
- no desktop `DateTree` sidebar
- same journal visual language as browse, but optimized for uninterrupted editing
- meta row matches the approved design structure:
  - date
  - editing state
  - save state
- large date heading stays aligned with the journal layout reference

The write page should read as "focused editing" rather than "browse plus editing controls."

## Dashboard Navigation

The dashboard journal quadrant should become date-aware at the source:

- if the selected dashboard day already has a journal entry, open browse for that day
- if the selected dashboard day has no journal entry, open write for that day
- the secondary write action should also preserve the selected dashboard day

This avoids intermediate hops and produces the expected UX for empty days.

## Date Selection Rules

- Query-driven date selection takes precedence in browse mode.
- Latest-entry fallback applies only when no explicit date was provided.
- Write mode should seed from explicit `year/month/day` params and remain on that date unless the user changes it.

## Layout Details To Restore

This pass should explicitly move the journal layout back toward the approved mockup:

- compact meta row
- icon treatment matching the dashboard style
- approved wording for editing and save states
- subtle separators
- no extra marketing or placeholder title text at the top of the journal view

## Testing Strategy

Add or update tests for:

- dashboard journal card routing to browse for existing days
- dashboard journal card routing to write for empty days
- browse honoring incoming selected dates
- write rendering without archive/sidebar UI
- corrected header/meta structure in browse and write where practical

Manual verification should cover:

- dashboard -> journal routing on an existing-entry day
- dashboard -> journal routing on an empty day
- browse header visual alignment with the approved design
- write page as a full-page editing experience with no archive chrome

## Acceptance Criteria

- The browse header no longer shows `Archive-aware journal`.
- Browse layout uses the approved journal header language and visual treatment.
- Write mode does not show the archive or desktop date sidebar.
- Clicking the dashboard journal card opens browse for days with an entry.
- Clicking the dashboard journal card opens full-page write for days without an entry.
- Browse respects explicitly selected dates before applying latest-entry fallback.
