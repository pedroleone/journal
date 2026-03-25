# Typography System Cleanup Design

## Summary

Create a calmer, more uniform typography system for the app by reducing font-role drift, replacing the current decorative heading serif with a quieter display serif, and consolidating ad hoc type treatments into a small shared hierarchy.

## Goals

- Make the app feel calm, productive, and visually consistent.
- Keep the UI primarily driven by one sans-serif family.
- Use serif typography selectively for warmth in page titles and long-form reading.
- Replace repeated one-off heading and metadata styles with shared typography roles.
- Preserve the journal's reading quality without making the whole product feel editorial.

## Non-Goals

- No full visual redesign of layouts, spacing, or color tokens.
- No new branding system beyond typography cleanup.
- No per-domain typography personalities for journal, notes, food, and library.
- No redesign of exported document typography beyond keeping export-page UI aligned with the app system.
- No changes to encryption, routing, or data behavior.

## Current Problems

- The app currently uses four font roles, but two serif roles create overlapping and inconsistent moods:
  - `Fraunces` for headings feels expressive and decorative.
  - `Source Serif 4` for reading surfaces feels literary and editorial.
- Heading treatment is scattered across pages with repeated combinations like `font-display text-2xl tracking-tight`.
- Metadata and kicker text use multiple uppercase/spacing variants such as `tracking-wider`, `tracking-widest`, and custom letter spacing values.
- Some content-detail views make local typography decisions that do not map cleanly to a shared hierarchy.
- The result is a product that feels mixed rather than deliberate.

## Proposed Approach

Adopt a restrained "warm sans UI + restrained serif display" system:

1. Keep one sans-serif family as the default app voice.
2. Keep one serif family for display and reading contexts.
3. Keep mono only for technical/editor surfaces.
4. Define a small reusable scale for headings, body, and metadata.
5. Replace repeated component-level type styling with semantic shared roles.

This should keep the product operational and calm while preserving enough warmth for a personal journal.

## Font Roles

### UI Sans

Use `DM Sans` as the default interface family for:

- navigation
- buttons
- form controls
- cards
- lists
- helper text
- metadata and labels

The UI should feel steady and legible by default. Most of the app should live in this family.

### Display Serif

Replace `Fraunces` with a quieter serif for display use. Preferred candidates:

- `Newsreader`
- `Crimson Pro`

Recommendation: `Newsreader`

Use the display serif for:

- page `h1`
- major `h2`
- journal entry titles
- note titles
- library item titles when rendered as major content titles

The serif should add warmth without looking ornamental.

### Reading Serif

Use the same serif family for long-form reading and writing surfaces unless a clear implementation problem appears. This keeps display and reading moods aligned and removes the current split between decorative display serif and editorial prose serif.

Use the reading serif for:

- `.journal-prose`
- long-form note/journal viewers
- long-form editor surfaces where the product already wants a more literary reading feel

### Mono

Keep `Geist Mono` for code-like or editor-technical contexts only.

Do not let mono become part of the app's general identity.

## Hierarchy And Scale

Replace repeated ad hoc text sizing with a small shared scale:

- `display-xl`: large page title / hero title
- `display-lg`: major section title
- `title-md`: card or content title
- `body-md`: default app body text
- `body-sm`: supporting UI text
- `meta-xs`: uppercase metadata, labels, and chips

Implementation can use semantic utility classes, CSS component classes, or a mixture of both, but the hierarchy should be defined once and reused everywhere.

## Usage Rules

### Serif Usage

- Serif headings should use slight negative tracking.
- Serif headings should not be uppercase.
- Serif should appear in major content moments, not in operational UI chrome.

### Sans Usage

- Buttons, nav, filters, tabs, form controls, cards, and secondary UI text stay in sans.
- Default body copy across the application stays in sans unless the surface is explicitly a reading surface.

### Metadata Usage

- Metadata should use one shared uppercase style.
- Stop mixing multiple tracking conventions for small labels.
- Chips, dates, section kickers, and small status labels should all derive from the same role.

### Reading Surfaces

- Reading surfaces get serif text plus larger line-height.
- Browse lists and dashboards should not inherit reading prose styling.
- Editors and viewers should clearly separate long-form text from surrounding operational controls.

## Repo Scope

### Font Definition

Update `app/layout.tsx` so the root font variables reflect the new system:

- keep `DM Sans`
- keep `Geist Mono`
- replace `Fraunces`
- consolidate serif usage so display and prose roles come from one quieter serif family

### Global Tokens

Extend `app/globals.css` with shared typography tokens or semantic classes for:

- page titles
- section titles
- content titles
- body text
- meta labels
- reading prose

The goal is to stop rebuilding the same heading patterns inline across the app.

### Usage Cleanup

Normalize the main typography hotspots already visible in the repo:

- `app/settings/page.tsx`
- `app/export/page.tsx`
- `app/journal/browse/page.tsx`
- `app/journal/entry/[id]/page.tsx`
- `app/journal/write/page.tsx`
- `components/auth/auth-page.tsx`
- `components/notes/note-detail.tsx`
- `components/library/library-detail.tsx`
- `components/journal/journal-month-calendar.tsx`

The main cleanup target is not every text node. It is the shared hierarchy points:

- page titles
- section titles
- content titles
- metadata labels
- reading blocks

For `app/export/page.tsx`, only the in-app route UI should join the shared typography system. The generated export document markup can keep its simpler document-oriented font fallback unless implementation reveals a low-cost alignment opportunity.

## Risks

- If the serif choice is too decorative, the app will still feel stylistically mixed.
- If the serif is applied too broadly, the product may drift from calm/productive into editorial.
- If the cleanup only changes fonts without consolidating hierarchy, inconsistency will remain.
- Some detail views may still need light local tuning after the shared system lands.

## Testing Strategy

Add tests for any new typography helper abstraction introduced in code.

Manual verification should cover:

- consistent title treatment across major pages
- consistent metadata styling across dashboard, browse, and detail screens
- reading surfaces still feel comfortable for long-form text
- operational UI remains clean and legible on desktop and mobile
- no accidental mono or serif bleed into forms and navigation

## Acceptance Criteria

- The app uses one primary sans family, one restrained serif family, and one mono family.
- `Fraunces` is removed from the active typography system.
- Shared heading and metadata roles replace repeated one-off class combinations.
- Major pages and detail views present a visibly more uniform hierarchy.
- Reading surfaces remain warmer than general UI without creating a second competing visual identity.
