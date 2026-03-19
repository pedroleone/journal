# Responsive Navigation Redesign

## Context

The current top navbar (`components/app-nav.tsx`) crams 8 content buttons + 4 utility buttons into a single horizontal bar. On mobile, labels are hidden (`hidden sm:inline`), leaving bare icons that are hard to identify. Creating new content requires finding the tiny `+` button next to the right icon. The goal is a navigation system that's intuitive on mobile while remaining clean on desktop.

## Approach

**Mobile (< 768px):** Bottom tab bar + Floating Action Button (FAB)
**Desktop (>= 768px):** Refined top bar (similar to current, always showing labels)

### Design Direction

- **Tone:** Warm, refined, consistent with the existing parchment/brown aesthetic
- **Mobile bottom bar:** 4 tabs with icon + label, a centered FAB for creating content
- **FAB interaction:** Opens a bottom sheet with all 4 create options
- **Mobile top bar:** Slim bar showing current section name + settings/theme controls
- **Desktop:** Current layout refined — labels always visible, no layout change needed

## Files to Create

| File | Purpose |
|------|---------|
| `components/nav/nav-sections.ts` | Shared section config + `useCreateHandlers()` hook (extracts logic from current `app-nav.tsx`) |
| `components/nav/desktop-top-bar.tsx` | Desktop top navigation bar (labels always visible) |
| `components/nav/mobile-top-bar.tsx` | Slim mobile top bar (section name + settings/theme) |
| `components/nav/mobile-bottom-bar.tsx` | Bottom tab bar with FAB + create sheet |

## Files to Modify

| File | Change |
|------|--------|
| `components/app-nav.tsx` | Replace with responsive orchestrator: renders desktop or mobile nav based on `useMediaQuery("(min-width: 768px)")` |
| `app/layout.tsx` | Add `pb-20 md:pb-0` to a `<main>` wrapper around `{children}` for bottom bar clearance; add `viewport-fit: cover` to viewport export |
| `app/globals.css` | Add bottom sheet animation keyframes |
| `lib/i18n.ts` | Add `createNew` translation key to `Translations` type + both locale objects |
| `components/nav-wrapper.tsx` | No change needed |

## Component Details

### 1. `nav-sections.ts` — Shared Config

Extract from `app-nav.tsx`:
- `NAV_SECTIONS` array: `{ key, icon, browseRoute, i18nKeys }` for all 4 sections
- `useCreateHandlers()` hook: returns `{ createJournal, createFood, createNote, createLibrary }` — moves the async today-entry journal logic here so it lives in one place

### 2. `desktop-top-bar.tsx`

Same visual as current `app-nav.tsx` but cleaner:
- Left: 4 section tabs, each with `Icon + Label` (labels always shown at desktop widths)
- Each tab has an adjacent `+` create button
- Right: `InstallAppButton`, theme toggle, settings, sign out
- Active tab: `bg-secondary` with `aria-current="page"`
- Height: `h-14` (unchanged)

### 3. `mobile-top-bar.tsx`

Slim bar (`h-12`) fixed at top:
- Left: Current section name as text (from `useMode()` + i18n)
- Right: Theme toggle (Sun/Moon) + Settings gear
- No sign out (accessible from settings page)

### 4. `mobile-bottom-bar.tsx`

This is the main mobile component, containing the tab bar, FAB, and create sheet:

**Tab bar:**
- Fixed at bottom, `h-16` + `pb-[env(safe-area-inset-bottom)]`
- 4 tabs arranged horizontally, each with icon (`h-5 w-5`) + label (`text-[11px]`)
- Active tab: `text-foreground`, inactive: `text-muted-foreground`
- `bg-background border-t border-border/60`

**FAB:**
- 56px circle (`h-14 w-14 rounded-full`) centered above the tab bar
- `bg-primary text-primary-foreground shadow-lg`
- Plus icon that rotates 45deg when sheet is open (becomes X)
- Positioned: `absolute -top-7 left-1/2 -translate-x-1/2`

**Create sheet (inline, not a separate component):**
- Backdrop: `fixed inset-0 bg-black/40` with fade animation
- Panel: slides up from bottom with `rounded-t-2xl bg-background`
- Content: heading "Create new" + 4 large tappable rows with `Icon + Label`
- Each row navigates to the create route and closes the sheet
- Closes on: backdrop tap, FAB tap, Escape key
- Focus management: focus first option on open, return to FAB on close

### 5. `app-nav.tsx` — Orchestrator

```tsx
const isDesktop = useMediaQuery("(min-width: 768px)");

if (isDesktop) return <DesktopTopBar />;
return (
  <>
    <MobileTopBar />
    <MobileBottomBar />
  </>
);
```

## Layout Changes

In `app/layout.tsx`, wrap `{children}` in a `<main>`:
```tsx
<NavWrapper />
<main className="pb-20 md:pb-0">
  {children}
</main>
```

Add to viewport export:
```tsx
viewportFit: "cover",
```

## i18n

Add to `Translations` type and both locale objects:
- `nav.createNew` — EN: "Create new", PT: "Criar novo"

## Accessibility

- Bottom bar: `<nav aria-label="Main navigation">` with tabs
- FAB: `aria-expanded`, `aria-controls="create-sheet"`
- Create sheet: `role="dialog"`, `aria-modal="true"`, close on Escape
- Focus trap: focus first create option on open, return to FAB on close
- `motion-safe:` prefix on transitions for reduced-motion support

## CSS Additions (globals.css)

```css
/* Safe area support for bottom bar */
@supports (padding-bottom: env(safe-area-inset-bottom)) {
  .safe-bottom {
    padding-bottom: env(safe-area-inset-bottom);
  }
}
```

## Verification

1. `pnpm test` — all existing + new tests pass
2. `pnpm lint` — no lint errors
3. `pnpm build` — builds successfully
4. Manual check: resize browser between mobile/desktop widths, verify:
   - Desktop: top bar with labels, create buttons, settings, theme, sign out
   - Mobile: bottom tabs with labels, FAB opens create sheet, slim top bar with section name
5. Test in mobile viewport: all 4 browse routes accessible from tabs, all 4 create routes from FAB sheet
6. Test keyboard: Escape closes sheet, Tab cycles through sheet options
7. Test dark mode toggle from both mobile and desktop nav
