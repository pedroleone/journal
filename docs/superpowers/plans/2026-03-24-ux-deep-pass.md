# UX Deep Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Comprehensive UX pass across the journal app — new visual direction, dashboard layout restructuring, inline markdown rendering, delete confirmations, food slot collapsing, and library view/edit toggle.

**Architecture:** All changes are frontend-only. The app uses Next.js App Router with client components, shadcn/ui, Tailwind CSS with CSS custom properties for theming, and CodeMirror for markdown editing. The dashboard uses a quadrant-based component system (`QuadrantGrid` + `QuadrantCard`).

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS 4, shadcn/ui, CodeMirror 6, Vitest

**Spec:** `docs/superpowers/specs/2026-03-24-ux-deep-pass-design.md`

---

### Task 1: Bug Fixes (food overlay, breadcrumb, locale)

Fix the three standalone bugs before any visual work, since they affect testing of subsequent tasks.

**Files:**
- Modify: `components/dashboard/quadrant-card.tsx`
- Modify: `app/food/page.tsx`
- Modify: `components/food/food-page-shell.tsx`
- Modify: `lib/i18n.ts`
- Test: `tests/components/dashboard/quadrant-card.test.ts`

- [ ] **Step 1: Fix food quick-add overlay in quadrant-card.tsx**

The `<Link href={href} aria-hidden="true" tabIndex={-1} className="absolute inset-0 rounded-md" />` on line 37-41 of `components/dashboard/quadrant-card.tsx` intercepts all pointer events. The children container on line 43 has `pointer-events-none` which prevents interaction with the quick-add textarea.

Fix: Add `pointer-events-auto` to interactive children when they need it. Change the children container to allow pointer events, and instead make the overlay link only cover the card when no interactive content is active. The simplest fix: add `pointer-events-none` to the overlay link and `pointer-events-auto` to the children container.

```tsx
// Line 37-41: Add pointer-events-none to the link
<Link
  href={href}
  aria-hidden="true"
  tabIndex={-1}
  className="absolute inset-0 rounded-md pointer-events-none"
/>
// Line 43: Remove pointer-events-none from children container
<div className="relative z-10 flex-1 overflow-hidden">
  {children}
</div>
// Line 46-48: Remove pointer-events-none from footer
<div className="relative z-10 mt-3 flex items-center gap-3 text-xs text-muted-foreground">
  {footer}
</div>
```

- [ ] **Step 2: Fix food page breadcrumb duplication**

The spec reports a breadcrumb duplication on the food page. Verify whether this still exists by checking `components/food/food-page-shell.tsx` and `app/food/page.tsx`. The breadcrumb may be rendered by `components/dashboard/breadcrumb-bar.tsx` and duplicated elsewhere. If the duplication is already fixed or does not exist, skip this step.

- [ ] **Step 3: Fix date locale leakage**

Search for `toLocaleDateString([], ...)` and `toLocaleString([], ...)` calls across the codebase. These use an empty array which falls back to the browser's default locale (e.g., Portuguese) instead of the app's configured language. Replace the empty array `[]` with the `localeCode` from `lib/i18n.ts`.

All files with `toLocaleDateString([], ...)`:
- `components/library/library-list.tsx:56`
- `components/library/library-detail.tsx:64`
- `app/journal/browse/page.tsx:40`
- `app/export/page.tsx:48, 421`
- `components/notes/note-list.tsx:28`
- `components/notes/note-detail.tsx:50`

All files with `toLocaleString([], ...)`:
- `components/library/library-detail.tsx:54`
- `components/dashboard/journal-quadrant.tsx:39`
- `components/notes/note-detail.tsx:40`
- `app/food/entry/[id]/page.tsx:31`

- [ ] **Step 4: Run tests to verify no regressions**

Run: `pnpm test`
Expected: All existing tests pass.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "fix: food overlay, breadcrumb duplication, date locale leakage"
```

---

### Task 2: Add AlertDialog component and delete confirmations

**Files:**
- Create: `components/ui/alert-dialog.tsx` (via shadcn CLI)
- Create: `components/shared/confirm-delete-dialog.tsx`
- Modify: `app/journal/entry/[id]/page.tsx`
- Modify: `app/food/entry/[id]/page.tsx`
- Modify: `app/food/page.tsx`
- Modify: `components/food/food-inbox-panel.tsx`
- Modify: `components/library/library-detail.tsx`
- Modify: `app/notes/browse/page.tsx` or `components/notes/note-viewer.tsx`
- Test: `tests/components/shared/confirm-delete-dialog.test.ts`

- [ ] **Step 1: Install shadcn AlertDialog**

Run: `pnpm dlx shadcn@latest add alert-dialog`

- [ ] **Step 2: Create shared ConfirmDeleteDialog component**

Create `components/shared/confirm-delete-dialog.tsx`:

```tsx
"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ConfirmDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title: string;
  description: string;
}

export function ConfirmDeleteDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
}: ConfirmDeleteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

- [ ] **Step 3: Write test for ConfirmDeleteDialog**

Create `tests/components/shared/confirm-delete-dialog.test.ts` with tests verifying:
- Dialog renders title and description when open
- Cancel button calls onOpenChange(false)
- Delete button calls onConfirm
- Dialog is not visible when open is false

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test tests/components/shared/confirm-delete-dialog.test.ts`

- [ ] **Step 5: Replace journal entry delete with AlertDialog**

In `app/journal/entry/[id]/page.tsx` (line 104), replace `confirm("Delete this entry?")` with `ConfirmDeleteDialog`. Add state:

```tsx
const [deleteOpen, setDeleteOpen] = useState(false);
```

Replace the `confirm()` call with `setDeleteOpen(true)`, and add the dialog:

```tsx
<ConfirmDeleteDialog
  open={deleteOpen}
  onOpenChange={setDeleteOpen}
  onConfirm={handleDelete}
  title="Delete journal entry"
  description="This journal entry will be permanently deleted. This action cannot be undone."
/>
```

Also move the Delete button away from Edit — place it in a secondary position (e.g., smaller ghost button, or at the end of the action row).

- [ ] **Step 6: Replace food entry and food page deletes with AlertDialog**

In `app/food/entry/[id]/page.tsx` (line 171), replace `confirm("Delete this food entry?")` with `ConfirmDeleteDialog` using the same pattern as Step 5.

In `app/food/page.tsx`, wrap `handleDeleteEntry` calls with the dialog. In `components/food/food-inbox-panel.tsx`, replace the inline confirm/cancel button pattern with the AlertDialog.

- [ ] **Step 7: Replace library detail delete with AlertDialog**

In `components/library/library-detail.tsx`, replace the `confirmDelete` two-step pattern (lines using `confirmDelete` state) with `ConfirmDeleteDialog`. Also update the note block delete pattern.

- [ ] **Step 8: Replace notes delete with AlertDialog**

Find the delete note and delete subnote handlers in the notes components and wrap them with `ConfirmDeleteDialog`.

- [ ] **Step 9: Run all tests**

Run: `pnpm test`
Expected: All tests pass.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: add confirmation dialogs for all delete actions"
```

---

### Task 3: Theme color update (purple → blue)

**Files:**
- Modify: `app/globals.css`
- Test: `tests/app/globals.test.ts`

- [ ] **Step 1: Update CSS custom properties**

In `app/globals.css`, update the domain accent colors and any purple-specific values:

Light mode (`:root`):
- `--journal: #6f6fe4` → `--journal: #6070e4` (shift toward blue)
- Keep `--notes`, `--food`, `--library`, `--inbox` as-is (they're already distinct)

Dark mode (`.dark`):
- `--journal: #7c7cff` → `--journal: #7c8aff` (primary blue from spec)
- `--journal-dim: rgba(124, 124, 255, 0.15)` → `--journal-dim: rgba(124, 138, 255, 0.15)`
- `--notes: #b07cff` → keep as-is (notes has its own purple identity)

- [ ] **Step 2: Search for hardcoded color values in components**

Search the codebase for any hardcoded references to the old journal color values (`#6f6fe4`, `#7c7cff`) outside of `globals.css` and replace with CSS variable references (`var(--journal)`). Also search for any other hardcoded purple hex values in component files.

Run: `grep -rn "#6f6fe4\|#7c7cff" --include="*.tsx" --include="*.ts" --include="*.css"`

- [ ] **Step 3: Update existing theme tests**

Check `tests/app/globals.test.ts` for any hardcoded color values that need updating.

- [ ] **Step 4: Run tests**

Run: `pnpm test`
Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "style: shift accent palette from purple to blue"
```

---

### Task 4: Dashboard layout — main column + sidebar

**Files:**
- Modify: `components/dashboard/quadrant-grid.tsx`
- Modify: `app/dashboard-home.tsx`
- Modify: `components/dashboard/quadrant-card.tsx`
- Modify: `components/dashboard/food-quadrant.tsx` (stats format)
- Test: existing dashboard tests

- [ ] **Step 1: Update QuadrantGrid to asymmetric layout**

Change `components/dashboard/quadrant-grid.tsx` from a 2x2 grid to a main+sidebar layout:

```tsx
import type { ReactNode } from "react";

interface QuadrantGridProps {
  main: ReactNode;
  sidebar: ReactNode;
}

export function QuadrantGrid({ main, sidebar }: QuadrantGridProps) {
  return (
    <div className="flex flex-1 flex-col gap-px bg-border md:flex-row">
      <div className="flex flex-1 flex-col gap-px md:w-3/5">{main}</div>
      <div className="flex flex-1 flex-col gap-px md:w-2/5">{sidebar}</div>
    </div>
  );
}
```

- [ ] **Step 2: Update DashboardHome to use new layout**

Update `app/dashboard-home.tsx` to pass `main` and `sidebar` props:

```tsx
<QuadrantGrid
  main={
    <>
      <JournalQuadrant date={date} />
      <FoodQuadrant date={date} />
    </>
  }
  sidebar={
    <>
      <NotesQuadrant />
      <LibraryQuadrant />
    </>
  }
/>
```

- [ ] **Step 3: Update food stats format**

In `components/dashboard/food-quadrant.tsx`, change the footer from:
```tsx
<span>{filledSlots.size} slots filled</span>
```
to:
```tsx
<span>{mealsFilled}/3 filled</span>
```

Where `mealsFilled` counts only the 3 default meal slots (breakfast, lunch, dinner) — not snacks or observation:
```tsx
const DEFAULT_MEALS = ["breakfast", "lunch", "dinner"];
const mealsFilled = [...filledSlots].filter(s => DEFAULT_MEALS.includes(s)).length;
```

And update `InboxBadge` display if needed to show "N inbox" format.

- [ ] **Step 4: Standardize section headers**

Review each quadrant component to ensure they all use the same header pattern: uppercase label left, action links right. The `QuadrantCard` component already does this — verify consistency across `JournalQuadrant`, `FoodQuadrant`, `NotesQuadrant`, `LibraryQuadrant`.

- [ ] **Step 5: Update any dashboard tests**

Check `tests/` for dashboard-related tests and update them for the new layout structure.

- [ ] **Step 6: Run tests**

Run: `pnpm test`
Expected: All tests pass.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: restructure dashboard to main column + sidebar layout"
```

---

### Task 5: Tighten spacing and button styles

**Files:**
- Modify: `app/globals.css`
- Modify: `components/dashboard/quadrant-card.tsx`
- Modify: `components/dashboard/top-bar.tsx`
- Modify: Various component files as needed

- [ ] **Step 1: Tighten QuadrantCard padding**

In `components/dashboard/quadrant-card.tsx`, reduce padding from `p-4` to `p-3` and adjust margins.

- [ ] **Step 2: Clean up button styles**

Search for pill-shaped buttons (classes containing `rounded-full` or `rounded-2xl` on buttons) and replace with `rounded-md` for a more compact, rectangular style. Focus on the journal write page's "Write" button and any CTA buttons.

- [ ] **Step 3: Update card border-radius and padding consistency**

Ensure all card-like elements across quadrants use the same `rounded-md` border radius and consistent internal padding.

- [ ] **Step 4: Run tests and visual check**

Run: `pnpm test`
Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "style: tighten spacing and unify button/card styles"
```

---

### Task 6: Journal inline markdown preview

The spec describes a focus/blur swap pattern with a `<textarea>` and a preview `<div>`. However, the project already uses CodeMirror (`components/ui/markdown-editor.tsx` with `@uiw/react-codemirror`) which provides inline syntax highlighting. Since CodeMirror is already a dependency, we enhance the existing markdown highlighting to better render `---`, `*italic*`, and `**bold**` visually in the editing surface — rather than building a separate focus/blur swap system. The `renderMarkdownPreview` function is used for the read-only browse view only.

**Files:**
- Modify: `components/ui/markdown-editor.tsx`
- Create: `lib/markdown-preview.ts`
- Test: `tests/lib/markdown-preview.test.ts`

- [ ] **Step 1: Write test for markdown transform function**

Create `tests/lib/markdown-preview.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { renderMarkdownPreview } from "@/lib/markdown-preview";

describe("renderMarkdownPreview", () => {
  it("renders --- as <hr>", () => {
    expect(renderMarkdownPreview("hello\n\n---\n\nworld")).toContain("<hr");
  });

  it("renders *text* as <em>", () => {
    expect(renderMarkdownPreview("*italic*")).toContain("<em>italic</em>");
  });

  it("renders **text** as <strong>", () => {
    expect(renderMarkdownPreview("**bold**")).toContain("<strong>bold</strong>");
  });

  it("leaves malformed syntax as literal", () => {
    const result = renderMarkdownPreview("a lone * here");
    expect(result).not.toContain("<em>");
    expect(result).toContain("*");
  });

  it("renders empty lines as line breaks", () => {
    const result = renderMarkdownPreview("line1\n\nline2");
    expect(result).toContain("<br");
  });

  it("handles empty string", () => {
    expect(renderMarkdownPreview("")).toBe("");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test tests/lib/markdown-preview.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement markdown transform function**

Create `lib/markdown-preview.ts`:

```typescript
export function renderMarkdownPreview(text: string): string {
  if (!text) return "";

  return text
    .split("\n")
    .map((line) => {
      // Horizontal rule
      if (/^---+$/.test(line.trim())) {
        return '<hr class="my-4 border-border" />';
      }

      let html = escapeHtml(line);

      // Bold: **text**
      html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

      // Italic: *text* (but not **)
      html = html.replace(/(?<!\*)\*([^*]+?)\*(?!\*)/g, "<em>$1</em>");

      return html || "<br />";
    })
    .join("\n");
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test tests/lib/markdown-preview.test.ts`
Expected: PASS.

- [ ] **Step 5: Enhance CodeMirror styling for better visual rendering**

In `components/ui/markdown-editor.tsx`, enhance the `markdownHighlight` to make horizontal rules (`---`) render as actual visual dividers. Add a CodeMirror decoration plugin that replaces `---` lines with a styled `<hr>` widget, and makes `*timestamp*` render in italic with a distinct style.

If a decoration approach is too complex, add a simpler CSS-based solution: style the `.cm-line` elements that contain only `---` with a border-bottom and hidden text.

- [ ] **Step 6: Add read-only preview mode to journal browse**

The journal browse/read view (`app/journal/browse/page.tsx`) should use the `renderMarkdownPreview` function to display formatted content instead of raw markdown when viewing entries (not editing).

- [ ] **Step 7: Run all tests**

Run: `pnpm test`
Expected: All tests pass.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: add inline markdown preview for journal entries"
```

---

### Task 7: Food slot collapsing

**Files:**
- Modify: `app/food/page.tsx`
- Modify: `lib/food.ts`
- Test: `tests/app/food-slots.test.ts`

- [ ] **Step 1: Write test for slot visibility logic**

Create `tests/app/food-slots.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { getVisibleSlots } from "@/lib/food";

describe("getVisibleSlots", () => {
  it("shows breakfast, lunch, dinner, observation by default", () => {
    const visible = getVisibleSlots([], false);
    expect(visible).toEqual(["breakfast", "lunch", "dinner", "observation"]);
  });

  it("shows all slots when expanded", () => {
    const visible = getVisibleSlots([], true);
    expect(visible).toHaveLength(7);
    expect(visible).toContain("morning_snack");
    expect(visible).toContain("afternoon_snack");
    expect(visible).toContain("midnight_snack");
  });

  it("shows snack slot if it has content even when collapsed", () => {
    const entries = [{ meal_slot: "morning_snack" }];
    const visible = getVisibleSlots(entries, false);
    expect(visible).toContain("morning_snack");
    expect(visible).not.toContain("afternoon_snack");
  });

  it("orders slots chronologically", () => {
    const visible = getVisibleSlots([], true);
    expect(visible).toEqual([
      "breakfast",
      "morning_snack",
      "lunch",
      "afternoon_snack",
      "dinner",
      "midnight_snack",
      "observation",
    ]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test tests/app/food-slots.test.ts`
Expected: FAIL — `getVisibleSlots` not found.

- [ ] **Step 3: Implement getVisibleSlots in lib/food.ts**

Add to `lib/food.ts`:

```typescript
const SLOT_ORDER: MealSlot[] = [
  "breakfast",
  "morning_snack",
  "lunch",
  "afternoon_snack",
  "dinner",
  "midnight_snack",
  "observation",
];

const DEFAULT_VISIBLE: MealSlot[] = [
  "breakfast",
  "lunch",
  "dinner",
  "observation",
];

const SNACK_SLOTS: MealSlot[] = [
  "morning_snack",
  "afternoon_snack",
  "midnight_snack",
];

export function getVisibleSlots(
  entries: { meal_slot: MealSlot | string | null }[],
  expanded: boolean,
): MealSlot[] {
  if (expanded) return [...SLOT_ORDER];

  const filledSnacks = new Set(
    entries
      .filter((e) => e.meal_slot && SNACK_SLOTS.includes(e.meal_slot as MealSlot))
      .map((e) => e.meal_slot as MealSlot),
  );

  const visible = new Set<MealSlot>(DEFAULT_VISIBLE);
  for (const s of filledSnacks) visible.add(s);

  return SLOT_ORDER.filter((s) => visible.has(s));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test tests/app/food-slots.test.ts`
Expected: PASS.

- [ ] **Step 5: Update food page to use collapsible slots**

In `app/food/page.tsx`:
1. Add `const [snacksExpanded, setSnacksExpanded] = useState(false);`
2. Replace the hardcoded `MEAL_SLOTS` iteration with `getVisibleSlots(dayEntries, snacksExpanded)`
3. Add a "+ Add snack" button between Dinner and Observation slots when collapsed:

```tsx
{!snacksExpanded && (
  <button
    onClick={() => setSnacksExpanded(true)}
    className="text-sm text-muted-foreground hover:text-foreground"
  >
    + Add snack
  </button>
)}
```

- [ ] **Step 6: Run all tests**

Run: `pnpm test`
Expected: All tests pass.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: collapse snack slots behind expander on food page"
```

---

### Task 8: Library detail view/edit toggle

**Files:**
- Modify: `components/library/library-detail.tsx`
- Test: `tests/components/library/library-detail-toggle.test.ts`

- [ ] **Step 1: Write test for view/edit toggle**

Create `tests/components/library/library-detail-toggle.test.ts`:

Since `library-detail.tsx` is a complex client component with server data dependencies, write unit tests for the view/edit state logic rather than full component rendering. Create a `getFieldDisplayMode` helper and test it:

```typescript
import { describe, it, expect } from "vitest";
import { getFieldDisplayMode } from "@/components/library/library-detail";

describe("library detail view/edit toggle", () => {
  it("defaults to view mode", () => {
    expect(getFieldDisplayMode(false)).toBe("view");
  });

  it("returns edit mode when editMode is true", () => {
    expect(getFieldDisplayMode(true)).toBe("edit");
  });
});
```

For the full component behavior (view mode renders text not inputs, Edit button switches modes, Cancel reverts), these are best verified via browser testing after implementation. The component tests should focus on any extracted pure logic (state transitions, field visibility rules).

If the component can be rendered in tests with mocked data, write more thorough tests:
- Verify view mode renders title in a `<span>` or `<h1>`, not an `<input>`
- Verify clicking "Edit" button causes input elements to appear
- Verify "Cancel" hides the inputs and restores text display
- Verify the "Add thought" textarea is present in both modes

- [ ] **Step 2: Implement view/edit toggle in library-detail.tsx**

In `components/library/library-detail.tsx`:

1. Add `const [editMode, setEditMode] = useState(false);` state
2. Create a `ViewModeField` component that renders a label + value as plain text
3. Wrap the metadata fields (title, creator, url, year, pages, genres, reactions) in a conditional:
   - `editMode === false` → render as `ViewModeField` (styled text, not inputs)
   - `editMode === true` → render as current inputs
4. Add an "Edit" button in the header that sets `editMode = true`
5. In edit mode, show "Save" and "Cancel" buttons:
   - Save: triggers the existing blur-save handlers, then `setEditMode(false)`
   - Cancel: reverts any unsaved changes, then `setEditMode(false)`
6. Keep the thoughts/reactions section always interactive regardless of mode
7. Status badge in view mode shows current status as a read-only badge; in edit mode shows the transition buttons (→ Finished, → Dropped)

- [ ] **Step 3: Run tests**

Run: `pnpm test`
Expected: All tests pass.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add view/edit toggle to library detail page"
```

---

### Task 9: Additional polish

**Files:**
- Modify: `app/journal/browse/page.tsx` (calendar dot indicators)
- Modify: Various note components (relative dates)
- Modify: `components/dashboard/food-quadrant.tsx` (stats format — if not done in Task 4)

- [ ] **Step 1: Improve journal browse calendar indicators**

In `app/journal/browse/page.tsx`, ensure days with entries show a filled dot and days without entries show no indicator. Remove any "Empty" labels — empty days should be visually quiet.

- [ ] **Step 2: Add relative date formatting to notes**

Where notes show dates like "19 de mar. de 2026", add a relative date helper that shows "2 days ago" for recent items and switches to absolute dates for older items (> 7 days). Create a utility function if one doesn't exist:

```typescript
export function formatRelativeDate(iso: string, localeCode: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString(localeCode, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
```

- [ ] **Step 3: Run all tests**

Run: `pnpm test`
Expected: All tests pass.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "polish: calendar indicators, relative dates, food stats"
```

---

### Task 10: Final verification

- [ ] **Step 1: Run full test suite**

Run: `pnpm test`
Expected: All tests pass.

- [ ] **Step 2: Run type check**

Run: `pnpm tsc --noEmit`
Expected: No type errors.

- [ ] **Step 3: Run lint**

Run: `pnpm lint`
Expected: No lint errors.

- [ ] **Step 4: Build check**

Run: `pnpm build`
Expected: Build succeeds.

- [ ] **Step 5: Manual verification**

Start the dev server (`pnpm dev`) and verify in browser:
- Dashboard shows main column + sidebar layout
- Food quick-add works (no overlay blocking)
- All delete actions show confirmation dialogs
- Food page shows 3 default slots with snack expander
- Library detail opens in view mode, edit button works
- Journal entries render markdown inline
- No Portuguese date formatting when language is English
- No duplicate breadcrumbs on food page
- Blue accent colors throughout (no purple)
- Mobile layout stacks correctly below 768px
