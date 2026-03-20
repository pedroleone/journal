# Dashboard Theme Token Remap Design

## Summary

Align the app's global color system with the `public/layouts/d-dashboard` reference by remapping the existing theme tokens in `app/globals.css`. Dark mode should closely match the dashboard palette. Light mode should remain available, but as a softer paper-like translation of the same surface hierarchy and accent system.

## Goals

- Make the app feel like one coherent design system across light and dark modes.
- Keep the existing light/dark toggle behavior.
- Match the dashboard reference closely in dark mode.
- Translate that same hierarchy into a softer paper-like light mode.
- Centralize the change at the token layer so current components inherit the palette with minimal churn.
- Record deferred visual cleanup so follow-up work can stay narrowly scoped.

## Non-Goals

- No layout, spacing, typography, or interaction redesign in this pass.
- No new parallel theme namespace or component-level token migration.
- No route or shell behavior changes.
- No broad cleanup of every literal Tailwind color in feature components unless it breaks the shared theme badly enough to block this pass.
- No attempt to resolve all remaining UX differences between the live app and the `d-dashboard` mockups.

## Current Problem

The current app mixes two different visual systems:

- Dark mode already gestures toward the dashboard reference.
- Light mode still uses a distinct warm parchment palette that does not clearly map to the dashboard hierarchy.
- Many shared UI primitives rely on generic `background`, `card`, `popover`, `muted`, `border`, and `sidebar` tokens without a single underlying semantic model.
- Some feature components still use literal Tailwind colors, which makes the app feel inconsistent even when the global theme tokens are correct.

This leaves the product in a halfway state where the dashboard layout exists, but the overall color language does not fully match.

## Proposed Approach

Use a token remap only strategy:

1. Define a shared semantic palette in `app/globals.css` that expresses the dashboard visual hierarchy:
   - base background
   - top bar background
   - primary surface
   - card surface
   - hover surface
   - primary text
   - secondary text
   - muted text
   - strong border
   - subtle border
   - ring/focus color
   - domain accents
2. Keep the existing app-facing token contract:
   - `--background`
   - `--foreground`
   - `--card`
   - `--popover`
   - `--primary`
   - `--secondary`
   - `--muted`
   - `--accent`
   - `--border`
   - `--input`
   - `--ring`
   - `--sidebar`
   - related foreground variants
3. Remap the app-facing tokens from the shared semantic palette in both light and dark modes.
4. Update browser chrome colors in `app/layout.tsx` so `themeColor` reflects the new light and dark background values.

This preserves compatibility with the current component tree while making the palette coherent across the app.

## Theme Model

### Dark Mode

Dark mode should track `public/layouts/d-dashboard/styles.css` closely:

- deep charcoal base background
- slightly lifted dashboard panels and cards
- cool neutral border system
- bright off-white foreground text
- strong separation between top bar, quadrants, surfaces, and hover states
- domain accents that remain saturated enough to anchor each area

The intent is not to reinterpret the mockup, but to make the live app feel like it belongs to it.

### Light Mode

Light mode should be a paper-like translation of the same hierarchy:

- warm off-white base instead of pure white
- cream and parchment surface elevations rather than cool grays
- ink-like text values with clear primary/secondary/muted separation
- soft taupe borders and inputs
- domain accents slightly muted relative to dark mode so the interface stays refined

The light theme should feel like the daylight version of the same product, not a separate visual identity.

## Scope Of Code Changes

### `app/globals.css`

- Introduce or normalize the semantic dashboard-style palette variables.
- Remap existing app-facing theme tokens from those variables in both modes.
- Keep the current token names consumed by the component library.
- Preserve existing animation and typography rules unless they depend on outdated color assumptions.

### `app/layout.tsx`

- Update `viewport.themeColor` values to match the remapped light and dark backgrounds.
- Leave theme bootstrapping logic unchanged unless a mismatch appears during implementation.

### Existing Components

- Rely on the token remap first.
- Avoid page-by-page restyling during this pass.
- Only touch component code if a literal color or mode-specific class causes a clearly broken result after the global remap.

## Interaction And Behavior

- The existing `ThemeProvider` in `hooks/use-theme.tsx` remains the source of light/dark switching behavior.
- User theme preference storage remains unchanged.
- System preference fallback remains unchanged.
- No additional theme modes are added.
- No route-specific theming is introduced.

## Deferred Follow-up Backlog

This pass should explicitly leave the following cleanup items for a follow-up task:

- Replace literal Tailwind status and state colors in feature components with theme-aware tokens where they visibly clash with the remapped palette.
- Audit feature screens against `public/layouts/d-dashboard` for remaining page-level discrepancies once the global palette is correct.
- Review contrast and hover/focus states that may remain slightly off after the token remap.
- Normalize isolated semantic colors in places like library status pills, selection states, and ad hoc badges.

Known likely follow-up touchpoints include:

- `components/library/library-list.tsx`
- any feature component still using literal `blue-*`, `green-*`, `red-*`, or similar utility classes
- any page-level surface using `bg-card/30` or similar opacity-based styling that looks wrong under the new tokens

The goal of documenting these items now is to keep the next iteration scoped as cleanup rather than reopening theme direction decisions.

## Testing Strategy

Add or adjust tests that verify global theme behavior rather than component-by-component styling:

- confirm the root layout still boots without hydration issues
- confirm global theme classes continue to switch correctly
- confirm the global CSS still exposes the expected theme tokens in both modes where tests currently depend on them

Manual verification should cover:

- dashboard shell in light and dark modes
- top bar, quadrant surfaces, and shared backgrounds
- one or two representative expanded pages that rely heavily on shared tokens
- browser chrome color consistency with the active theme

If useful during implementation verification, use the browser workflow via Playwriter for side-by-side visual checks against the reference layout.

## Risks

- Literal Tailwind colors in feature components may stand out more once the shared palette is corrected.
- A light mode that is too muted could lose hierarchy; too saturated could feel noisy.
- `themeColor` values that do not match the actual background can make browser chrome feel off on mobile devices.
- Small token changes can have large downstream effects across shadcn-based primitives.

## Acceptance Criteria

- The app retains both light and dark modes.
- Dark mode feels materially aligned with `d-dashboard`.
- Light mode feels like a softer paper-like translation of that same hierarchy.
- Existing shared tokens remain the public contract for component styling.
- Global color changes are primarily centralized in `app/globals.css`.
- Browser chrome color in `app/layout.tsx` matches the new theme backgrounds.
- Deferred component-level cleanup is documented for a follow-up pass.
