# Library Browse Filter Toggle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make advanced library filters optional while keeping search and type controls visible in a smaller sticky header across desktop and mobile.

**Architecture:** Keep URL-backed filter state unchanged and add only local presentation state for whether the advanced filter panel is visible. Reduce the sticky region in `LibraryBrowse` to the primary controls, then render `FilterBar` conditionally in normal document flow so mobile browsing gets more usable vertical space.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Vitest, Testing Library, Tailwind CSS

---

## File Structure

- Modify: `components/library/library-browse.tsx`
  - Own the advanced-filter visibility state and layout changes.
- Modify: `tests/components/library/library-browse.test.tsx`
  - Add regression coverage for the new toggle and default closed state.
- Optional modify: `components/library/filter-bar.tsx`
  - Only if minor class adjustments are needed after the `LibraryBrowse` refactor.

### Task 1: Add Regression Coverage For Advanced Filter Visibility

**Files:**
- Create: `tests/components/library/library-browse.test.tsx`
- Reference: `components/library/library-browse.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
it("keeps advanced filters hidden by default and reveals them on toggle", () => {
  renderLibraryBrowse();

  expect(screen.queryByText(/all statuses/i)).toBeNull();

  fireEvent.click(screen.getByRole("button", { name: /filters/i }));

  expect(screen.getByText(/all statuses/i)).toBeTruthy();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test tests/components/library/library-browse.test.tsx`
Expected: FAIL because the filter panel renders immediately and no toggle exists yet.

- [ ] **Step 3: Add a second failing test for hiding the panel without clearing filters**

```tsx
it("hides the panel without clearing applied filters", () => {
  renderLibraryBrowse({
    filters: { ...EMPTY_FILTERS, status: "finished" },
  });

  fireEvent.click(screen.getByRole("button", { name: /filters/i }));
  fireEvent.click(screen.getByRole("button", { name: /filters/i }));

  expect(screen.queryByText(/all statuses/i)).toBeNull();
  expect(screen.getByText(/1 item/i)).toBeTruthy();
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `pnpm test tests/components/library/library-browse.test.tsx`
Expected: FAIL because there is still no toggle-driven hidden state.

- [ ] **Step 5: Commit**

```bash
git add tests/components/library/library-browse.test.tsx
git commit -m "test: cover library browse filter toggle behavior"
```

### Task 2: Implement The Toggleable Advanced Filter Panel

**Files:**
- Modify: `components/library/library-browse.tsx`
- Optional Modify: `components/library/filter-bar.tsx`
- Test: `tests/components/library/library-browse.test.tsx`

- [ ] **Step 1: Write the minimal implementation**

Implementation notes:
- Add `const [filtersOpen, setFiltersOpen] = useState(false)`.
- Keep search and type pills in the sticky wrapper.
- Add a toggle button with a stable accessible name including `Filters`.
- Move `FilterBar` below the sticky header and render it only when `filtersOpen` is true.
- Adjust sticky offset classes so mobile uses less top spacing than desktop.

- [ ] **Step 2: Run the focused test**

Run: `pnpm test tests/components/library/library-browse.test.tsx`
Expected: PASS

- [ ] **Step 3: Run existing related coverage**

Run: `pnpm test tests/app/library/detail-page.test.tsx tests/components/library/library-browse.test.tsx`
Expected: PASS

- [ ] **Step 4: Refine spacing only if needed**

Check for:
- sticky header height feels reasonable on mobile
- no doubled border or awkward gap between sticky controls and panel
- no regression to type/search interaction

- [ ] **Step 5: Commit**

```bash
git add components/library/library-browse.tsx components/library/filter-bar.tsx tests/components/library/library-browse.test.tsx
git commit -m "feat: add toggleable library browse filters"
```

### Task 3: Full Verification

**Files:**
- Verify only

- [ ] **Step 1: Run the full test suite**

Run: `pnpm test`
Expected: PASS

- [ ] **Step 2: Run lint on touched files if needed**

Run: `pnpm lint components/library/library-browse.tsx tests/components/library/library-browse.test.tsx`
Expected: PASS

- [ ] **Step 3: Manual verification**

Check in browser:
- advanced filters are closed on first load
- toggle opens and closes reliably
- active filters still affect results when panel is hidden
- mobile viewport shows more content below the sticky controls

- [ ] **Step 4: Commit verification-ready state**

```bash
git add components/library/library-browse.tsx components/library/filter-bar.tsx tests/components/library/library-browse.test.tsx
git commit -m "chore: verify library browse filter toggle"
```
