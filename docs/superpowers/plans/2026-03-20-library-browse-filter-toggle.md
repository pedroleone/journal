# Library Browse Browse-First Controls Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move `library/browse` actions into the shared breadcrumb bar and hide search/filters behind a browse-first filter panel.

**Architecture:** Add a generic breadcrumb-actions registration path owned by the dashboard shell so pages can supply compact navbar actions without route-specific shell logic. Then update `LibraryBrowse` to register `Filters` and `+` in shared chrome while rendering search, type, and the rest of the filters only inside the inline filter panel.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Vitest, Testing Library, Tailwind CSS

---

## File Structure

- Create: `components/dashboard/breadcrumb-actions.tsx`
  - Own the generic client-side action registration store and hooks.
- Modify: `components/dashboard/dashboard-shell.tsx`
  - Wrap shell chrome in the breadcrumb-actions provider.
- Modify: `components/dashboard/breadcrumb-bar.tsx`
  - Render optional right-side actions.
- Modify: `components/library/library-browse.tsx`
  - Register breadcrumb actions, move search into the filter panel, remove page-local action buttons.
- Modify: `components/library/filter-bar.tsx`
  - Keep the panel focused on type/status/metadata filters and chips.
- Modify: `tests/components/library/library-browse.test.tsx`
  - Verify the library page uses shared chrome actions and hidden search.
- Create: `tests/components/dashboard/dashboard-shell.test.tsx`
  - Verify shared breadcrumb actions render only when registered.

### Task 1: Add Failing Tests For Shared Breadcrumb Actions

**Files:**
- Create: `tests/components/dashboard/dashboard-shell.test.tsx`
- Modify: `tests/components/library/library-browse.test.tsx`
- Reference: `components/dashboard/dashboard-shell.tsx`
- Reference: `components/library/library-browse.tsx`

- [ ] **Step 1: Write the failing shell test**

```tsx
it("renders breadcrumb actions supplied by a child page", () => {
  render(
    <DashboardShell>
      <ActionProbe />
    </DashboardShell>,
  );

  expect(screen.getByRole("button", { name: "Filters" })).toBeTruthy();
});
```

- [ ] **Step 2: Run the shell test to verify it fails**

Run: `pnpm test tests/components/dashboard/dashboard-shell.test.tsx`
Expected: FAIL because the shell has no action registration path yet.

- [ ] **Step 3: Update the library browse test to require shared-chrome controls**

```tsx
it("keeps search hidden until the breadcrumb Filters action opens the panel", () => {
  renderBrowseInShell();

  expect(screen.queryByPlaceholderText("Search library...")).toBeNull();

  fireEvent.click(screen.getByRole("button", { name: "Filters" }));

  expect(screen.getByPlaceholderText("Search library...")).toBeTruthy();
});
```

- [ ] **Step 4: Run the browse test to verify it fails**

Run: `pnpm test tests/components/library/library-browse.test.tsx`
Expected: FAIL because the page still owns the top controls and search is still visible.

- [ ] **Step 5: Commit**

```bash
git add tests/components/dashboard/dashboard-shell.test.tsx tests/components/library/library-browse.test.tsx
git commit -m "test: cover breadcrumb action slot for library browse"
```

### Task 2: Implement Generic Breadcrumb Actions

**Files:**
- Create: `components/dashboard/breadcrumb-actions.tsx`
- Modify: `components/dashboard/dashboard-shell.tsx`
- Modify: `components/dashboard/breadcrumb-bar.tsx`
- Test: `tests/components/dashboard/dashboard-shell.test.tsx`

- [ ] **Step 1: Write the minimal implementation**

Implementation notes:
- Create a small store-backed provider for breadcrumb actions.
- Expose one hook for pages to register actions and one hook for the breadcrumb bar to read them.
- Keep the API generic so pages pass `ReactNode`, not route-specific config.
- Clear actions on unmount.

- [ ] **Step 2: Run the shell test**

Run: `pnpm test tests/components/dashboard/dashboard-shell.test.tsx`
Expected: PASS

- [ ] **Step 3: Run related shell coverage**

Run: `pnpm test tests/components/dashboard/dashboard-shell.test.tsx tests/components/dashboard/quadrant-card.test.tsx`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add components/dashboard/breadcrumb-actions.tsx components/dashboard/dashboard-shell.tsx components/dashboard/breadcrumb-bar.tsx tests/components/dashboard/dashboard-shell.test.tsx
git commit -m "feat: add reusable breadcrumb actions"
```

### Task 3: Move Library Browse Controls Into Shared Chrome

**Files:**
- Modify: `components/library/library-browse.tsx`
- Modify: `components/library/filter-bar.tsx`
- Modify: `tests/components/library/library-browse.test.tsx`
- Optional Modify: `app/library/browse/page.tsx`

- [ ] **Step 1: Write the minimal implementation**

Implementation notes:
- Register `Filters` and `+` through the breadcrumb-actions hook.
- Remove page-local top action buttons.
- Move search into the inline filter panel and keep it hidden by default.
- Keep type pills inside the filter panel.
- Preserve URL-backed filtering behavior and `+` routing.

- [ ] **Step 2: Run the focused browse test**

Run: `pnpm test tests/components/library/library-browse.test.tsx`
Expected: PASS

- [ ] **Step 3: Run related coverage**

Run: `pnpm test tests/components/dashboard/dashboard-shell.test.tsx tests/components/library/library-browse.test.tsx tests/app/library/detail-page.test.tsx`
Expected: PASS

- [ ] **Step 4: Run lint on touched files**

Run: `pnpm lint components/dashboard/breadcrumb-actions.tsx components/dashboard/dashboard-shell.tsx components/dashboard/breadcrumb-bar.tsx components/library/library-browse.tsx components/library/filter-bar.tsx tests/components/dashboard/dashboard-shell.test.tsx tests/components/library/library-browse.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add components/dashboard/breadcrumb-actions.tsx components/dashboard/dashboard-shell.tsx components/dashboard/breadcrumb-bar.tsx components/library/library-browse.tsx components/library/filter-bar.tsx tests/components/dashboard/dashboard-shell.test.tsx tests/components/library/library-browse.test.tsx
git commit -m "feat: move library browse controls into shared chrome"
```

### Task 4: Full Verification

**Files:**
- Verify only

- [ ] **Step 1: Run the full test suite**

Run: `pnpm test`
Expected: PASS

- [ ] **Step 2: Manual verification**

Check in browser:
- `Filters` and `+` appear in the breadcrumb bar on `library/browse`
- search is hidden until filters are opened
- filter panel opens and closes correctly
- active filters still affect results when hidden
- mobile breadcrumb row still fits comfortably

- [ ] **Step 3: Commit verification-ready state**

```bash
git add components/dashboard/breadcrumb-actions.tsx components/dashboard/dashboard-shell.tsx components/dashboard/breadcrumb-bar.tsx components/library/library-browse.tsx components/library/filter-bar.tsx tests/components/dashboard/dashboard-shell.test.tsx tests/components/library/library-browse.test.tsx
git commit -m "chore: verify shared library browse controls"
```
