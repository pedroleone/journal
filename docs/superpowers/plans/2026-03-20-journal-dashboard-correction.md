# Journal Dashboard Correction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Correct the journal browse/write implementation so it matches the approved dashboard layout, uses date-aware dashboard routing, and keeps editing as a full-page experience.

**Architecture:** Keep the current journal APIs and canvas components, but correct the route responsibilities. Browse becomes a date-aware reading/archive surface with the approved header language, write becomes a focused editor without archive chrome, and the dashboard quadrant computes its destination from the selected day and entry availability.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind CSS, shadcn/ui primitives, Vitest, Testing Library

---

## File Structure

### Existing files to modify

- `components/dashboard/journal-quadrant.tsx`
  - Make the quadrant target and write action date-aware.
- `app/journal/browse/page.tsx`
  - Replace the improvised browse header and honor explicit date selection.
- `app/journal/write/page.tsx`
  - Remove archive/sidebar UI and align the editing header with the approved journal layout.
- `components/journal/entry-viewer.tsx`
  - Support browse header/meta layout details if needed without reintroducing generic page framing.
- `app/globals.css`
  - Restore the intended journal meta-row styles, wording treatment, and icon/layout alignment.
- `tests/app/journal/browse-page.test.tsx`
  - Expand browse-route tests for explicit date handling and corrected header behavior.
- `tests/app/journal/write-page.test.tsx`
  - Cover no-sidebar write rendering and seeded-date header behavior.

### New files to create

- `tests/components/dashboard/journal-quadrant.test.tsx`
  - Verify date-aware dashboard journal navigation behavior.

### Reference files to consult while implementing

- `docs/superpowers/specs/2026-03-20-journal-dashboard-correction-design.md`
- `public/layouts/d-dashboard/journal.html`
- `public/layouts/d-dashboard/styles.css`

## Task 1: Lock in date-aware dashboard journal routing with failing tests

**Files:**
- Create: `tests/components/dashboard/journal-quadrant.test.tsx`
- Modify: `components/dashboard/journal-quadrant.tsx`

- [ ] **Step 1: Write the failing existing-day browse-target test**

```tsx
it("links the journal card to browse for the selected day when an entry exists", async () => {
  mockFetchWithEntry();

  render(<JournalQuadrant date={new Date("2026-03-19T00:00:00")} />);

  const link = await screen.findByRole("link", { name: /journal/i });
  expect(link.getAttribute("href")).toBe("/journal/browse?date=2026-03-19");
});
```

- [ ] **Step 2: Write the failing empty-day write-target test**

```tsx
it("links the journal card to write for the selected day when no entry exists", async () => {
  mockFetchWithoutEntry();

  render(<JournalQuadrant date={new Date("2026-03-20T00:00:00")} />);

  const link = await screen.findByRole("link", { name: /journal/i });
  expect(link.getAttribute("href")).toBe("/journal/write?year=2026&month=3&day=20");
});
```

- [ ] **Step 3: Run the new dashboard journal test file to verify failure**

Run: `pnpm test -- tests/components/dashboard/journal-quadrant.test.tsx`

Expected: FAIL because `JournalQuadrant` always links to `/journal/browse` and the write action is not date-aware.

- [ ] **Step 4: Implement minimal date-aware routing in the journal quadrant**

Implementation notes for `components/dashboard/journal-quadrant.tsx`:
- Derive the selected day query values from the `date` prop.
- If an entry exists, set the card `href` to `/journal/browse?date=YYYY-MM-DD`.
- If no entry exists, set the card `href` to `/journal/write?year=YYYY&month=M&day=D`.
- Apply the same date-aware write target to the secondary write action.

- [ ] **Step 5: Run the dashboard journal routing tests**

Run: `pnpm test -- tests/components/dashboard/journal-quadrant.test.tsx`

Expected: PASS

- [ ] **Step 6: Commit the dashboard routing slice**

```bash
git add components/dashboard/journal-quadrant.tsx tests/components/dashboard/journal-quadrant.test.tsx
git commit -m "feat: make dashboard journal routing date-aware"
```

## Task 2: Correct browse route selection rules and header language

**Files:**
- Modify: `app/journal/browse/page.tsx`
- Modify: `tests/app/journal/browse-page.test.tsx`
- Reference: `components/journal/entry-viewer.tsx`

- [ ] **Step 1: Write the failing explicit-date browse test**

```tsx
it("uses the query-selected date instead of snapping to the latest entry", async () => {
  mockSearchParams("date=2026-03-18");
  mockDates([{ id: "latest", year: 2026, month: 3, day: 20 }]);

  render(<BrowsePage />);

  expect(await screen.findByTestId("entry-viewer")).toHaveTextContent("2026-3-18");
});
```

- [ ] **Step 2: Write the failing header correction test**

```tsx
it("does not render the improvised archive-aware heading", async () => {
  render(<BrowsePage />);

  expect(screen.queryByText(/archive-aware journal/i)).toBeNull();
  expect(await screen.findByText(/editing|saved|no entry yet/i)).toBeTruthy();
});
```

- [ ] **Step 3: Run the browse page test file to verify failure**

Run: `pnpm test -- tests/app/journal/browse-page.test.tsx`

Expected: FAIL because browse still renders the improvised heading and does not honor explicit date selection.

- [ ] **Step 4: Implement minimal browse correction**

Implementation notes for `app/journal/browse/page.tsx`:
- Parse an explicit `date` query param, or explicit `year/month/day` if already present.
- Use that selected day before applying latest-entry fallback.
- Remove the `Archive-aware journal` title block.
- Replace it with the approved journal chrome language: archive toggle as a tool, not page identity.
- Keep the archive panel available only in browse mode.

- [ ] **Step 5: Run the browse route tests**

Run: `pnpm test -- tests/app/journal/browse-page.test.tsx`

Expected: PASS

- [ ] **Step 6: Commit the browse correction slice**

```bash
git add app/journal/browse/page.tsx tests/app/journal/browse-page.test.tsx
git commit -m "fix: restore journal browse header and date selection"
```

## Task 3: Make write a full-page editor with the approved meta/header layout

**Files:**
- Modify: `app/journal/write/page.tsx`
- Modify: `app/globals.css`
- Modify: `tests/app/journal/write-page.test.tsx`

- [ ] **Step 1: Write the failing no-sidebar write test**

```tsx
it("does not render the desktop journal date tree while editing", async () => {
  render(<WritePage />);

  expect(screen.queryByText("date-tree")).toBeNull();
});
```

- [ ] **Step 2: Write the failing approved-meta test**

```tsx
it("renders the compact journal meta row for editing", async () => {
  render(<WritePage />);

  expect(await screen.findByText(/editing/i)).toBeTruthy();
  expect(screen.getByText(/saved|saving|draft/i)).toBeTruthy();
});
```

- [ ] **Step 3: Run the write page test file to verify failure**

Run: `pnpm test -- tests/app/journal/write-page.test.tsx`

Expected: FAIL because write still renders the desktop sidebar and the header does not yet match the approved layout.

- [ ] **Step 4: Remove archive/sidebar UI from write mode**

Implementation notes for `app/journal/write/page.tsx`:
- Remove the desktop `CollapsibleSidebar` and `DateTree` render path entirely.
- Keep seeded-date behavior intact.
- Preserve calendar/date editing behavior inside the writer header instead of via the sidebar.

- [ ] **Step 5: Restore the approved meta row and wording**

Implementation notes for `app/journal/write/page.tsx` and `app/globals.css`:
- Use the approved icon/wording structure:
  - date
  - editing
  - saved/saving/etc.
- Keep the large date heading below the meta row.
- Align separators, muted text, and spacing with `public/layouts/d-dashboard/journal.html`.

- [ ] **Step 6: Run the write route tests**

Run: `pnpm test -- tests/app/journal/write-page.test.tsx`

Expected: PASS

- [ ] **Step 7: Commit the write correction slice**

```bash
git add app/journal/write/page.tsx app/globals.css tests/app/journal/write-page.test.tsx
git commit -m "fix: restore full-page journal editing layout"
```

## Task 4: Verify corrected journal behavior end-to-end

**Files:**
- Review only: `components/dashboard/journal-quadrant.tsx`
- Review only: `app/journal/browse/page.tsx`
- Review only: `app/journal/write/page.tsx`

- [ ] **Step 1: Run the focused journal correction suite**

Run:

```bash
pnpm test -- tests/components/dashboard/journal-quadrant.test.tsx tests/app/journal/browse-page.test.tsx tests/app/journal/write-page.test.tsx
```

Expected: PASS

- [ ] **Step 2: Run the full test suite**

Run: `pnpm test`

Expected: PASS

- [ ] **Step 3: Manually verify the journal correction**

Run: `pnpm dev`

Manual checks:
- dashboard selected day with entry opens browse on that day
- dashboard selected day without entry opens full-page write on that day
- browse no longer shows `Archive-aware journal`
- browse header uses the intended journal layout language
- write shows no archive/sidebar chrome and reads as a full-page editor

- [ ] **Step 4: Commit the final corrected state**

```bash
git add components/dashboard/journal-quadrant.tsx app/journal/browse/page.tsx app/journal/write/page.tsx app/globals.css tests/components/dashboard/journal-quadrant.test.tsx tests/app/journal/browse-page.test.tsx tests/app/journal/write-page.test.tsx
git commit -m "fix: correct journal dashboard layout behavior"
```
