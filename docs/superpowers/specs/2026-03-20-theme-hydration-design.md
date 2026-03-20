# Theme Hydration Design

## Summary

Remove the hydration mismatch caused by dark-mode bootstrapping in `app/layout.tsx` by consolidating theme ownership into one client-side mechanism. The rendered server HTML and the DOM React hydrates against should agree on `<html>`, while theme preference resolution still happens quickly after mount.

## Goals

- Eliminate the React hydration warning for the root `<html>` element.
- Keep the existing light/dark toggle API and stored preference behavior.
- Ensure only one part of the app is responsible for applying the `dark` class.
- Keep the change minimal and local to the current theme bootstrap path.
- Add regression tests covering the layout contract.

## Non-Goals

- No theme redesign or token changes.
- No server-side theme persistence or cookie-based SSR theme rendering.
- No new theme modes.
- No broad refactor of unrelated layout or shell code.

## Current Problem

`app/layout.tsx` renders `<html lang="en">` on the server, then injects an inline script that reads `localStorage` and may add `class="dark"` to `document.documentElement` before hydration. React then hydrates against mutated DOM and reports an attribute mismatch.

At the same time, `hooks/use-theme.tsx` already resolves the user's theme on mount and applies the same `dark` class in an effect. Theme ownership is therefore split across two independent mechanisms.

## Options Considered

### 1. Suppress the hydration warning

Add `suppressHydrationWarning` to `<html>` and keep the inline script.

Pros:
- Smallest code diff.
- Preserves pre-hydration dark-mode bootstrap.

Cons:
- Keeps divergent ownership.
- Accepts the mismatch rather than removing the cause.

### 2. Remove the inline script and keep `ThemeProvider` as the single owner

Render stable server HTML and let the provider resolve and apply theme after mount.

Pros:
- Removes the mismatch at the source.
- Keeps implementation small.
- Makes theme ownership explicit.

Cons:
- Can introduce a brief theme flash before the effect runs.

### 3. Build a stronger SSR-safe bootstrap around the existing provider

Keep a single theme owner but reduce first-paint drift by resolving theme in client code as early as possible without mutating the server-rendered `<html>` before hydration.

Pros:
- Best long-term shape.
- Eliminates mismatch while leaving room to optimize first paint.

Cons:
- More work than needed for this bug.

## Approved Approach

Implement option 3 in the narrowest form that solves the current bug:

- Remove the inline script from `app/layout.tsx` so the server markup stays stable.
- Keep `ThemeProvider` as the only place that resolves persisted/system theme and applies `document.documentElement.classList`.
- Tighten tests so `app/layout.tsx` no longer contains the inline theme bootstrap and still preserves existing viewport metadata.

This keeps theme ownership singular and removes the source of the mismatch. If first-paint flash becomes noticeable later, that should be addressed with a dedicated SSR-safe bootstrap design rather than another ad hoc mutation in `layout.tsx`.

## Data Flow

1. Server renders the root layout without theme-specific mutation logic on `<html>`.
2. Client mounts `ThemeProvider`.
3. `ThemeProvider` reads `localStorage` and `matchMedia`.
4. `ThemeProvider` resolves the theme and updates both React state and `document.documentElement.classList`.
5. Theme toggle interactions continue to update both React state and `localStorage`.

## Testing Strategy

- Extend `tests/app/layout.test.ts` to assert that the inline bootstrap script is absent from `app/layout.tsx`.
- Preserve the existing assertions around viewport metadata so the test still covers layout responsibilities.
- Run focused tests first, then the full suite.

## Risks

- Users with a stored dark preference may briefly see light mode before the provider applies `dark`.
- Any hidden dependency on the inline script would surface once removed; current code search suggests none exist.

## Acceptance Criteria

- React no longer reports a hydration mismatch caused by `<html>` theme attributes.
- `app/layout.tsx` no longer mutates `document.documentElement` via inline script.
- `ThemeProvider` remains the sole theme owner.
- Layout tests cover the new contract.
