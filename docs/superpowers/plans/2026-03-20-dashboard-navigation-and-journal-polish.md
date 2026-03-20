# Dashboard Navigation And Journal Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add unified dashboard browse actions and direct item links for journal, notes, and library, while polishing the journal writer meta row and utility action styling.

**Architecture:** Keep the current dashboard quadrants and routes, but refactor the quadrant card interaction model so quadrant background clicks and item-row clicks can coexist without nested-link issues. Then add explicit browse actions across the relevant quadrants and apply narrowly scoped journal writer polish in the existing edit page.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind CSS, Vitest, Testing Library

---

## File Structure

### Existing files to modify

- `components/dashboard/quadrant-card.tsx`
  - Separate card-level browse navigation from item-level linked content.
- `components/dashboard/journal-quadrant.tsx`
  - Add explicit `Browse` action while preserving date-aware primary routing.
- `components/dashboard/notes-quadrant.tsx`
  - Add explicit `Browse` action and convert note rows into direct detail links.
- `components/dashboard/library-quadrant.tsx`
  - Add explicit `Browse` action and convert item rows into direct detail links.
- `app/journal/write/page.tsx`
  - Apply spacing and color polish to the writer meta row and utility action group.
- `app/globals.css`
  - Add or adjust styles needed for the journal writer polish.
- `tests/components/dashboard/quadrant-card.test.tsx`
  - Update expectations for the new quadrant-card structure if needed.
- `tests/components/dashboard/journal-quadrant.test.tsx`
  - Expand coverage for the explicit `Browse` action.

### New files to create

- `tests/components/dashboard/notes-quadrant.test.tsx`
  - Verify browse/new actions and direct note-item links.
- `tests/components/dashboard/library-quadrant-links.test.tsx`
  - Verify browse/add actions and direct library-item links.
- `tests/app/journal/write-page-polish.test.tsx`
  - Verify the journal writer meta row spacing/structure and utility action color grouping where practical.

### Reference files to consult while implementing

- `docs/superpowers/specs/2026-03-20-dashboard-navigation-and-journal-polish-design.md`
- `public/layouts/d-dashboard/journal.html`
- `public/layouts/d-dashboard/styles.css`

## Task 1: Refactor quadrant-card structure for browse surfaces plus direct row links

**Files:**
- Modify: `components/dashboard/quadrant-card.tsx`
- Modify: `tests/components/dashboard/quadrant-card.test.tsx`

- [ ] **Step 1: Write the failing quadrant-card interaction test**

```tsx
it("supports linked content rows without nesting them inside the primary browse link", () => {
  render(
    <QuadrantCard domain="notes" label="Notes" href="/notes/browse">
      <a href="/notes/browse?id=note-1">First note</a>
    </QuadrantCard>
  );

  const browseLink = screen.getByRole("link", { name: /notes/i });
  const noteLink = screen.getByRole("link", { name: /first note/i });

  expect(browseLink).not.toContainElement(noteLink);
});
```

- [ ] **Step 2: Run the quadrant-card test file to verify failure**

Run: `pnpm test -- tests/components/dashboard/quadrant-card.test.tsx`

Expected: FAIL because the content area is still wrapped in the primary link.

- [ ] **Step 3: Implement the minimal quadrant-card refactor**

Implementation notes for `components/dashboard/quadrant-card.tsx`:
- Keep the label/browse identity linked in the header.
- Add a card-surface browse link that does not wrap arbitrary child content when children may contain links.
- Preserve footer rendering without introducing nested anchors.
- Keep the existing visual style intact.

- [ ] **Step 4: Run the quadrant-card tests**

Run: `pnpm test -- tests/components/dashboard/quadrant-card.test.tsx`

Expected: PASS

- [ ] **Step 5: Commit the card-structure slice**

```bash
git add components/dashboard/quadrant-card.tsx tests/components/dashboard/quadrant-card.test.tsx
git commit -m "refactor: separate dashboard card and item navigation"
```

## Task 2: Add unified browse actions and direct row links to notes and library quadrants

**Files:**
- Modify: `components/dashboard/notes-quadrant.tsx`
- Modify: `components/dashboard/library-quadrant.tsx`
- Create: `tests/components/dashboard/notes-quadrant.test.tsx`
- Create: `tests/components/dashboard/library-quadrant-links.test.tsx`

- [ ] **Step 1: Write the failing notes quadrant test**

```tsx
it("shows browse and new actions and links note rows to dedicated detail pages", async () => {
  mockNotes([{ id: "n1", title: "Trip ideas", tags: ["travel"] }]);

  render(<NotesQuadrant />);

  expect(await screen.findByRole("link", { name: /browse/i })).toHaveAttribute("href", "/notes/browse");
  expect(screen.getByRole("link", { name: /new/i })).toHaveAttribute("href", "/notes/browse?new=1");
  expect(screen.getByRole("link", { name: /trip ideas/i })).toHaveAttribute("href", "/notes/browse?id=n1");
});
```

- [ ] **Step 2: Write the failing library quadrant test**

```tsx
it("shows browse and add actions and links library rows to dedicated detail pages", async () => {
  mockLibraryInProgress([{ id: "l1", title: "Dune", creator: "Frank Herbert", status: "in_progress", type: "book", rating: null, cover_image: null }]);
  mockLibraryFinished([]);

  render(<LibraryQuadrant />);

  expect(await screen.findByRole("link", { name: /browse/i })).toHaveAttribute("href", "/library/browse");
  expect(screen.getByRole("link", { name: /add/i })).toHaveAttribute("href", "/library/new");
  expect(screen.getByRole("link", { name: /dune/i })).toHaveAttribute("href", "/library/l1");
});
```

- [ ] **Step 3: Run the new notes/library quadrant tests to verify failure**

Run: `pnpm test -- tests/components/dashboard/notes-quadrant.test.tsx tests/components/dashboard/library-quadrant-links.test.tsx`

Expected: FAIL because browse actions and direct row links do not exist yet.

- [ ] **Step 4: Implement notes quadrant navigation updates**

Implementation notes for `components/dashboard/notes-quadrant.tsx`:
- Add a `Browse` action next to `New`.
- Convert preview note rows into direct detail links.
- Keep the card background or card-level browse affordance pointing to `/notes/browse`.

- [ ] **Step 5: Implement library quadrant navigation updates**

Implementation notes for `components/dashboard/library-quadrant.tsx`:
- Add a `Browse` action next to `Add`.
- Convert library preview rows into direct detail links using the dedicated detail route.
- Keep the card-level browse affordance pointing to `/library/browse`.

- [ ] **Step 6: Run the notes/library quadrant tests**

Run: `pnpm test -- tests/components/dashboard/notes-quadrant.test.tsx tests/components/dashboard/library-quadrant-links.test.tsx`

Expected: PASS

- [ ] **Step 7: Commit the notes/library dashboard slice**

```bash
git add components/dashboard/notes-quadrant.tsx components/dashboard/library-quadrant.tsx tests/components/dashboard/notes-quadrant.test.tsx tests/components/dashboard/library-quadrant-links.test.tsx
git commit -m "feat: add browse actions and direct dashboard item links"
```

## Task 3: Restore explicit browse access to the journal quadrant

**Files:**
- Modify: `components/dashboard/journal-quadrant.tsx`
- Modify: `tests/components/dashboard/journal-quadrant.test.tsx`

- [ ] **Step 1: Write the failing journal browse-action test**

```tsx
it("shows both browse and write actions for the selected day", async () => {
  mockFetchWithoutEntry();

  render(<JournalQuadrant date={new Date("2026-03-20T00:00:00")} />);

  expect(await screen.findByRole("link", { name: /browse/i })).toHaveAttribute("href", "/journal/browse?date=2026-03-20");
  expect(screen.getByRole("link", { name: /write/i })).toHaveAttribute("href", "/journal/write?year=2026&month=3&day=20");
});
```

- [ ] **Step 2: Run the journal quadrant test file to verify failure**

Run: `pnpm test -- tests/components/dashboard/journal-quadrant.test.tsx`

Expected: FAIL because only the write action exists today.

- [ ] **Step 3: Implement the journal browse action**

Implementation notes for `components/dashboard/journal-quadrant.tsx`:
- Add explicit `Browse` beside `Write`.
- Keep the existing date-aware primary target behavior intact.
- Ensure browse always targets the selected day.

- [ ] **Step 4: Run the journal quadrant tests**

Run: `pnpm test -- tests/components/dashboard/journal-quadrant.test.tsx`

Expected: PASS

- [ ] **Step 5: Commit the journal dashboard slice**

```bash
git add components/dashboard/journal-quadrant.tsx tests/components/dashboard/journal-quadrant.test.tsx
git commit -m "feat: restore dashboard journal browse access"
```

## Task 4: Apply journal writer spacing and control-color polish

**Files:**
- Modify: `app/journal/write/page.tsx`
- Modify: `app/globals.css`
- Create: `tests/app/journal/write-page-polish.test.tsx`

- [ ] **Step 1: Write the failing writer-polish test**

```tsx
it("renders the writer utility actions with one shared muted treatment", async () => {
  render(<WritePage />);

  const imageButton = await screen.findByRole("button", { name: /image/i });
  const thoughtButton = screen.getByRole("button", { name: /new thought/i });

  expect(imageButton.className).toBe(thoughtButton.className);
});
```

- [ ] **Step 2: Add a failing meta-row spacing/structure assertion**

```tsx
it("renders the writer status groups with visible separators and relaxed spacing", async () => {
  const { container } = render(<WritePage />);
  await screen.findByText(/writing|editing/i);
  expect(container.querySelector(".journal-meta-row")).toBeTruthy();
  expect(container.querySelectorAll(".journal-meta-separator").length).toBeGreaterThan(1);
});
```

- [ ] **Step 3: Run the writer-polish test file to verify failure**

Run: `pnpm test -- tests/app/journal/write-page-polish.test.tsx`

Expected: FAIL because the utility actions and meta row spacing are not yet normalized.

- [ ] **Step 4: Implement minimal writer polish**

Implementation notes for `app/journal/write/page.tsx` and `app/globals.css`:
- Increase the gaps in the meta row and soften separator treatment.
- Normalize the utility action classes so `Image` and `New thought` share the same color/hover behavior.
- Keep the current control structure; do not redesign the writer footer.

- [ ] **Step 5: Run the writer-polish tests**

Run: `pnpm test -- tests/app/journal/write-page-polish.test.tsx`

Expected: PASS

- [ ] **Step 6: Commit the writer polish slice**

```bash
git add app/journal/write/page.tsx app/globals.css tests/app/journal/write-page-polish.test.tsx
git commit -m "style: polish journal writer dashboard details"
```

## Task 5: Verify the expanded dashboard pass

**Files:**
- Review only: `components/dashboard/quadrant-card.tsx`
- Review only: `components/dashboard/journal-quadrant.tsx`
- Review only: `components/dashboard/notes-quadrant.tsx`
- Review only: `components/dashboard/library-quadrant.tsx`
- Review only: `app/journal/write/page.tsx`

- [ ] **Step 1: Run the focused dashboard/journal suite**

Run:

```bash
pnpm test -- tests/components/dashboard/quadrant-card.test.tsx tests/components/dashboard/journal-quadrant.test.tsx tests/components/dashboard/notes-quadrant.test.tsx tests/components/dashboard/library-quadrant-links.test.tsx tests/app/journal/write-page-polish.test.tsx
```

Expected: PASS

- [ ] **Step 2: Run the full test suite**

Run: `pnpm test`

Expected: PASS

- [ ] **Step 3: Manually verify the interaction model**

Run: `pnpm dev`

Manual checks:
- journal quadrant exposes browse access even on an empty day
- notes and library show `Browse` actions alongside their existing actions
- clicking note/library rows opens dedicated detail pages
- clicking elsewhere on those quadrants still opens browse mode
- journal meta row feels less cramped
- `Image` and `New thought` share the same color treatment

- [ ] **Step 4: Commit the final verified state**

```bash
git add components/dashboard/quadrant-card.tsx components/dashboard/journal-quadrant.tsx components/dashboard/notes-quadrant.tsx components/dashboard/library-quadrant.tsx app/journal/write/page.tsx app/globals.css tests/components/dashboard/quadrant-card.test.tsx tests/components/dashboard/journal-quadrant.test.tsx tests/components/dashboard/notes-quadrant.test.tsx tests/components/dashboard/library-quadrant-links.test.tsx tests/app/journal/write-page-polish.test.tsx
git commit -m "feat: unify dashboard browse actions and item links"
```
