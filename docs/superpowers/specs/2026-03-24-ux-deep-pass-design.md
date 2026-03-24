# UX Deep Pass — Design Spec

**Date:** 2026-03-24
**Status:** Draft

## Overview

Comprehensive UX pass across the entire journal app, covering visual direction, layout restructuring, interaction improvements, and bug fixes. Informed by hands-on browser testing of every section (dashboard, journal, notes, library, food) at both desktop and mobile viewport sizes.

## 1. Visual Direction: Clean & Functional

Shift the app's aesthetic toward a tighter, information-dense, tool-like feel. Sans-serif typography throughout, neutral dark palette with blue accents replacing the current purple.

**Key principles:**
- High contrast, tight spacing
- Consistent section headers with inline action links (e.g., `JOURNAL  Browse · Write`)
- Status badges, tags, and metadata in a compact, uniform style
- No decorative elements — every pixel earns its place

**Reference points:** Linear, Notion, Things 3.

**What changes:**
- Replace purple accent color (`#7c5af0` / `#a78bfa`) with blue: primary `#7c8aff`, muted `#5a6abf`, hover `#9aa4ff`. Derive additional variants by adjusting opacity as needed.
- Tighten padding and margins globally
- Standardize section header pattern: uppercase label left, action links right
- Unify card styles across sections (consistent border-radius, padding, background)
- Clean up button styles — remove oversized pill buttons, use compact rectangular buttons

**What stays:**
- Dark theme as default
- Existing component library (shadcn/ui) — restyle, don't replace
- Light theme option in settings

## 2. Dashboard Layout: Main Column + Sidebar

Replace the current 2x2 grid with an asymmetric two-column layout.

**Left column (wider, ~60%):** Daily actions
- **Journal** — last entry preview with word count, "Write" button, "Browse Entries" link
- **Food** — today's meal slots with filled/empty state, quick-add, inbox count

**Right column (narrower, ~40%):** Reference sections
- **Notes** — recent notes list with tags, "Browse" and "New" links
- **Library** — in-progress items with cover thumbnails, "Browse" and "Add" links

**Mobile (below 768px):** Sidebar stacks below the main column in the same order (Journal → Food → Notes → Library).

**Header:** Existing date navigation bar (already present) with previous/next day buttons, date display, settings gear — no changes to its structure, just restyled to match the new visual direction.

**Fixes included:**
- Remove the food section's `<a href="/food">` overlay that blocks the quick-add textarea
- Standardize section headers (currently inconsistent across sections)
- Replace confusing stats ("0 slots filled  4 unsorted") with clearer format ("1/3 filled · 4 inbox") — denominator counts only the 3 default-visible meal slots, not snacks or observation

## 3. Journal Writing: Inline Markdown Rendering

Replace the raw textarea with light inline markdown rendering so the writing surface feels polished without adding complexity.

**Renders inline:**
- `---` → visible horizontal divider line
- `*text*` → italic text (used for timestamps like *4:01 PM*)
- `**text**` → bold text
- Line breaks render naturally

**Does not add:**
- No formatting toolbar
- No block-level features (headings, lists, code blocks)
- No WYSIWYG — the underlying text remains plain markdown

**"New thought" button behavior:** Still inserts a divider and timestamp, but they render visually instead of showing raw markdown syntax.

**Implementation approach:** Use a focus/blur swap pattern. The component renders two sibling elements occupying the same space:
- **Editing state (on focus):** A standard `<textarea>` showing raw markdown, as it works today.
- **Preview state (on blur):** A `<div>` that renders the markdown with basic formatting (dividers as `<hr>`, `*text*` as `<em>`, `**text**` as `<strong>`). The preview div replaces the textarea visually when the user clicks away.

Clicking the preview div focuses the textarea and restores the cursor. The rendering logic is a simple regex-based transform — no rich text library needed. Malformed syntax (e.g., a lone `*` without closing) renders as literal characters.

No new dependencies required.

**Storage format:** No change. The stored format remains plain markdown text, encrypted server-side as before. No new storage format is introduced.

## 4. Delete Confirmation Dialogs

Add confirmation dialogs to all destructive actions across the app.

**Affected actions:**
- Journal: "Delete Entry" button on browse detail view
- Notes: "Delete note" button, subnote delete button
- Library: "Delete item" button on detail view
- Food: delete entry button on day view, delete button on inbox items

**Dialog pattern:** Use shadcn/ui `AlertDialog` component, which provides focus trapping, Escape to dismiss, and screen reader announcements out of the box.
- Clear description of what will be deleted
- "Cancel" (secondary) and "Delete" (destructive/red) buttons
- No "Don't show again" option — this is encrypted data with no recovery

**Also:** Move the journal browse "Delete Entry" button away from "Edit Entry" — currently they sit side by side as equally prominent buttons. Delete should be visually demoted (e.g., smaller, in a secondary position, or behind a "..." overflow menu).

## 5. Food Slots: Collapse to Essentials

Simplify the food day view to reduce visual noise.

**Default visible slots:** Breakfast, Lunch, Dinner, Observation
**Hidden by default:** Morning Snack, Afternoon Snack, Midnight Snack

**Layout order:** Breakfast, Lunch, Dinner, then "+ Add snack" expander, then Observation.

**Expander:** The "+ Add snack" button sits between Dinner and Observation. Clicking it reveals the three snack slots (Morning Snack above Lunch, Afternoon Snack below Lunch, Midnight Snack below Dinner — inserted into their natural chronological positions). Once a snack slot has content for that day, it stays visible for the rest of the day. Expansion state is per-session only (no backend persistence needed) — refreshing the page resets to the collapsed view, but slots with content remain visible because they have data.

**Other food fixes:**
- Fix breadcrumb duplication on the food page ("Dashboard / Food" appears twice)
- Fix date locale leakage — Portuguese dates showing when app language is set to English

## 6. Library Detail: View Mode with Edit Toggle

Replace the always-editable form with a clean read-only view.

**View mode (default):**
- Cover image, title, author displayed as styled text (not input fields)
- Status shown as a badge
- Metadata (year, pages, URL, genres, reactions) displayed as labeled values
- Thoughts/reactions timeline is always interactive — the "Add thought" button and thought text inputs already work independently from metadata fields, so this is preserving existing behavior, not adding new functionality
- "Edit" button in the header to switch to edit mode

**Edit mode:**
- Fields become editable inputs (same as current behavior)
- Status quick-change buttons appear (→ Finished, → Dropped)
- "Save" and "Cancel" buttons replace the "Edit" button
- Cover image change button appears

**Delete:** Available in both modes but with confirmation dialog (see section 4).

## 7. Bug Fixes

These are standalone fixes not tied to a specific feature redesign:

1. **Food quick-add overlay** — the `<a href="/food" aria-hidden="true" class="absolute inset-0">` element on the dashboard food section intercepts pointer events on the quick-add textarea. This is a frontend-only fix: restructure the link element's z-index or position so it doesn't cover the textarea. No API changes needed.

2. **Date locale leakage** — Notes sidebar shows Portuguese-formatted dates ("19 de mar. de 2026") while journal shows English dates ("Thursday, March 19, 2026"), even when the app language is set to English. Ensure all date formatting respects the language setting.

3. **Food page breadcrumb duplication** — "Dashboard / Food" appears in both the top banner and the main content area. Remove the duplicate.

## 8. Additional Polish

- **Journal browse calendar:** Add clearer visual differentiation for days with entries vs empty days. Days with entries get a filled dot; empty days get no dot. Days marked "Empty" in the current UI should show no indicator at all.
- **Notes date format:** Use relative dates where appropriate ("2 days ago") and absolute dates for older items, consistent with the journal section.
- **Dashboard food stats:** Replace "0 slots filled  4 unsorted" with "1/3 filled · 4 inbox" — denominator counts only the 3 default-visible meal slots (Breakfast, Lunch, Dinner), consistent with the collapsed slot design in Section 5. Clearer labeling, dot separator.

## 9. Testing

Per AGENTS.md, all new features must include tests.

- **Markdown preview rendering:** Unit tests for the regex-based transform function (covers `---`, `*italic*`, `**bold**`, malformed syntax, edge cases)
- **Confirmation dialogs:** Component tests verifying that delete buttons trigger the AlertDialog and that confirming calls the delete handler
- **Food slot collapsing:** Component test verifying default visible slots, expander behavior, and slots-with-content staying visible
- **Library view/edit toggle:** Component test verifying view mode renders text (not inputs), edit button switches to edit mode, save/cancel returns to view mode

Existing tests must continue to pass after all changes.

## Scope Boundaries

**In scope:**
- All visual and layout changes described above
- Bug fixes
- Existing pages only — no new pages or features

**Out of scope:**
- New features (search, tagging improvements, etc.)
- Backend/API changes (all changes in this spec are frontend-only)
- Authentication or encryption changes
- Settings page redesign (beyond fixing locale bug)
- Telegram integration changes
- New dependencies heavier than ~50KB (no Tiptap, ProseMirror, etc.)
