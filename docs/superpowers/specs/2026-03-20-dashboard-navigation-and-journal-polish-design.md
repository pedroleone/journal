# Dashboard Navigation And Journal Polish Design

## Summary

Extend the current dashboard correction pass to restore archive access from the dashboard and make quadrant navigation consistent across journal, notes, and library. This pass also includes small journal UI polish fixes for the writer meta row and utility action styling.

## Goals

- Ensure journal browsing remains reachable from the dashboard even when the selected day has no entry.
- Add explicit `Browse` actions to journal, notes, and library quadrants for a unified dashboard pattern.
- Let notes and library item rows navigate directly to dedicated detail pages.
- Keep quadrant background clicks as browse-mode navigation.
- Polish the journal writer meta row spacing and utility action styling.

## Non-Goals

- No redesign of food quadrant interactions in this pass.
- No new archive behavior beyond restoring consistent access.
- No changes to notes or library browse/detail architecture outside dashboard entry points.

## Current Problems

- Journal dashboard navigation now sends empty days directly into write mode, which removes the obvious path to browse the archive from that state.
- Notes and library quadrants do not offer a matching explicit `Browse` action.
- Notes and library preview rows are passive text previews rather than direct links to the underlying item detail pages.
- The journal writer meta row is visually cramped.
- The writer utility actions (`Image`, `New thought`) do not share the same color treatment.

## Proposed Approach

Use a unified quadrant interaction model:

1. Quadrant background click -> browse mode for that domain.
2. Explicit secondary actions in the header:
   - journal: `Browse` + `Write`
   - notes: `Browse` + `New`
   - library: `Browse` + `Add`
3. Item rows inside notes and library quadrants become direct links to dedicated detail pages.
4. Journal keeps its date-aware primary routing behavior, but `Browse` always remains available as an archive entry point.
5. Writer UI gets small spacing/color corrections only.

## Quadrant Interaction Model

### Journal

- primary card target stays date-aware:
  - selected day with entry -> browse for that day
  - selected day without entry -> write for that day
- add explicit `Browse` action that always opens browse for the selected day
- keep explicit `Write` action for the selected day

This restores archive access without losing the empty-day shortcut into writing.

### Notes

- card background opens `/notes/browse`
- add explicit `Browse` action
- keep explicit `New` action
- each visible note row becomes a direct link to the note's dedicated detail page

### Library

- card background opens `/library/browse`
- add explicit `Browse` action
- keep explicit `Add` action
- each visible library row becomes a direct link to the item's dedicated detail page

## Quadrant Card Structure

`components/dashboard/quadrant-card.tsx` should no longer assume the entire content area is wrapped by one large link when child rows need their own links. The card should separate:

- label/browse identity in the header
- explicit action cluster
- content container that can host linked rows
- optional footer area

This avoids nested-link semantics and keeps interactions predictable.

## Journal Writer Polish

Keep the writer correction minimal and literal:

- increase spacing between meta row status groups
- soften separator treatment
- keep the save state visually distinct without crowding the row
- normalize the color treatment of `Image` and `New thought` so they feel like one control group

The intent is to match the approved mockup more closely, not to invent new writer controls.

## Testing Strategy

Add or update tests for:

- journal quadrant exposes both `Browse` and `Write`
- notes quadrant exposes both `Browse` and `New`
- library quadrant exposes both `Browse` and `Add`
- notes quadrant item rows link to dedicated detail pages
- library quadrant item rows link to dedicated detail pages
- journal writer meta row and utility controls use the corrected structure where practical

Manual verification should cover:

- empty selected journal day still offers browse access from the dashboard
- journal browse action opens archive/browse mode directly
- notes/library row clicks go to dedicated detail pages
- clicking outside note/library rows still opens browse mode
- journal writer spacing and utility control colors feel aligned

## Acceptance Criteria

- The dashboard always exposes a visible browse path for journal, notes, and library.
- Journal preserves the empty-day shortcut into write mode while still offering browse access.
- Notes and library preview rows navigate directly to dedicated detail pages.
- Clicking outside note/library rows in those quadrants still opens browse mode.
- Journal writer status groups are less cramped.
- `Image` and `New thought` share the same color treatment.
