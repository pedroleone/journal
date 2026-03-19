# Fix Mobile UI Issues in Library

## Context
Three mobile UX bugs on the library feature:
1. Can't scroll the library detail page on mobile — content is clipped
2. Year/pages number inputs show browser-native spinner controls that look out of place
3. Nav bar buttons (library, plus) overlap with settings/logout on narrow screens

## Fix 1: Library detail page not scrollable on mobile

**Root cause**: `app/library/[id]/page.tsx:130` wraps everything in `h-[calc(100vh-3.5rem)]` with `overflow-hidden` (line 143). Inside, `library-detail.tsx` only enables scrolling at `lg:` breakpoint (`lg:overflow-y-auto` on both columns at lines 379 and 591). On mobile (below `lg`), neither column scrolls, and the parent clips content.

**Fix**:
- In `page.tsx:143`, change `overflow-hidden` to `overflow-y-auto lg:overflow-hidden` so the whole page scrolls on mobile, while keeping `overflow-hidden` at `lg:` where individual columns handle their own scrolling

**Files**:
- `app/library/[id]/page.tsx` (line 143)

## Fix 2: Hide number input spinners

**Root cause**: `type="number"` inputs show native browser up/down arrows. Affects year field (line 496) and pages field (line 541) in `library-detail.tsx`.

**Fix**: Add CSS to `app/globals.css` to hide number input spinners globally:
```css
input[type="number"]::-webkit-outer-spin-button,
input[type="number"]::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
input[type="number"] {
  -moz-appearance: textfield;
}
```

**Files**:
- `app/globals.css`

## Fix 3: Nav buttons overlapping on narrow mobile screens

**Root cause**: In `app-nav.tsx`, the left button groups use `shrink-0` (line 131), preventing them from shrinking. With two sections (journal + library), each with browse + plus buttons, plus 4 right-side buttons, they compete for space and overlap on narrow viewports.

**Fix**: Remove `shrink-0` from the button group containers (line 131) so they can compress on narrow screens. The parent already has `min-w-0` (line 123).

**Files**:
- `components/app-nav.tsx` (line 131)

## Verification
- Test on mobile viewport (375px width) in browser devtools
- Verify library detail page scrolls fully on mobile
- Verify year/pages inputs have no spinner arrows
- Verify all nav buttons are accessible without overlapping on 375px width
