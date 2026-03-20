# Journal Browse Layout Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align the journal browse experience with the approved dashboard layout so populated, empty, loading, and archive-selection states all share the same visual shell, metadata treatment, footer labels, and smaller reading typography.

**Architecture:** Keep the existing journal browse route and archive behavior, but rework the shared browse canvas and viewer state rendering so they follow one consistent presentation model. Use the existing `JournalCanvas` abstraction as the shell boundary, then move state-specific content into `EntryViewer` while adding targeted CSS hooks for layout fidelity instead of introducing a second read-only canvas component.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind CSS, Vitest, Testing Library

---

## File Structure

### Existing files to modify

- `components/journal/journal-canvas.tsx`
  - Restyle the shared journal browse shell to better match the approved layout frame and footer placement.
- `components/journal/entry-viewer.tsx`
  - Normalize populated, empty, loading, offline, and archive-selection states into the same metadata/body/footer structure and tighten browse prose styling.
- `app/globals.css`
  - Add browse-specific journal layout and typography hooks shared across journal browse states.
- `tests/components/journal/journal-canvas.test.tsx`
  - Expand coverage for the shared browse shell classes/structure if needed.
- `tests/app/journal/browse-page.test.tsx`
  - Add assertions for consistent browse chrome and state labels.

### New files to create

- `tests/components/journal/entry-viewer-layout.test.tsx`
  - Verify top metadata labels, footer labels, and browse prose treatment for populated and empty states.

### Reference files to consult while implementing

- `public/layouts/d-dashboard/journal.html`
- `public/layouts/d-dashboard/styles.css`
- `docs/superpowers/specs/2026-03-20-journal-dashboard-archive-design.md`
- `docs/superpowers/specs/2026-03-20-journal-dashboard-correction-design.md`

## Task 1: Lock in browse layout expectations with failing viewer tests

**Files:**
- Create: `tests/components/journal/entry-viewer-layout.test.tsx`

- [ ] **Step 1: Write the failing populated-entry layout test**

```tsx
it("renders populated browse days with layout-matched meta labels and footer labels", async () => {
  vi.spyOn(globalThis, "fetch").mockResolvedValue({
    ok: true,
    json: async () => [
      {
        id: "entry-1",
        source: "web",
        year: 2026,
        month: 3,
        day: 19,
        hour: null,
        content: "Today felt like a turning point.",
        created_at: "2026-03-19T20:00:00.000Z",
        images: ["img-1"],
      },
    ],
  } as Response);

  render(<EntryViewer year={2026} month={3} day={19} />);

  expect(await screen.findByText("Single entry")).toBeTruthy();
  expect(screen.getByText("Includes images")).toBeTruthy();
  expect(screen.getByText("Web entry")).toBeTruthy();
});
```

- [ ] **Step 2: Add the failing empty-day shell consistency test**

```tsx
it("keeps the same browse shell and footer structure for empty days", async () => {
  vi.spyOn(globalThis, "fetch").mockResolvedValue({
    ok: true,
    json: async () => [],
  } as Response);

  const { container } = render(<EntryViewer year={2026} month={3} day={20} />);

  expect(await screen.findByText(/write for this day/i)).toBeTruthy();
  expect(container.querySelector(".journal-browse-shell")).toBeTruthy();
  expect(container.querySelector(".journal-browse-footer")).toBeTruthy();
});
```

- [ ] **Step 3: Run the new viewer layout test file to verify failure**

Run: `pnpm test -- tests/components/journal/entry-viewer-layout.test.tsx`

Expected: FAIL because the current browse view does not expose the layout-matched shell hooks and footer treatment consistently enough.

- [ ] **Step 4: Commit the failing test slice after implementation passes later**

Do not commit yet; this task’s tests will be committed with the implementation in Task 3.

## Task 2: Add route-level browse assertions for shared shell behavior

**Files:**
- Modify: `tests/app/journal/browse-page.test.tsx`

- [ ] **Step 1: Write the failing browse-page assertion for the shared shell**

```tsx
it("uses the same browse shell for an empty selected day", async () => {
  mockDates([{ id: "d1", year: 2026, month: 3, day: 20 }]);
  mockEntries([]);

  const { container } = render(<BrowsePage />);

  await screen.findByText(/write for this day/i);
  expect(container.querySelector(".journal-browse-shell")).toBeTruthy();
});
```

- [ ] **Step 2: Add the failing populated-state label assertion**

```tsx
it("shows browse metadata and footer labels for populated days", async () => {
  mockDates([{ id: "d1", year: 2026, month: 3, day: 19 }]);
  mockEntries([
    {
      id: "entry-1",
      source: "web",
      year: 2026,
      month: 3,
      day: 19,
      hour: null,
      content: "Existing entry body",
      created_at: "2026-03-19T20:00:00.000Z",
      images: ["img-1"],
    },
  ]);

  render(<BrowsePage />);

  expect(await screen.findByText("Single entry")).toBeTruthy();
  expect(screen.getByText("Includes images")).toBeTruthy();
  expect(screen.getByText("Web entry")).toBeTruthy();
});
```

- [ ] **Step 3: Run the browse-page test file to verify failure**

Run: `pnpm test -- tests/app/journal/browse-page.test.tsx`

Expected: FAIL because the browse page currently does not surface the standardized shell hooks and layout labels consistently.

- [ ] **Step 4: Hold commit until implementation is complete**

Do not commit yet; these tests belong in the same slice as the browse-shell implementation.

## Task 3: Restyle the shared browse canvas and normalize entry viewer states

**Files:**
- Modify: `components/journal/journal-canvas.tsx`
- Modify: `components/journal/entry-viewer.tsx`
- Modify: `app/globals.css`
- Modify: `tests/components/journal/journal-canvas.test.tsx`
- Create: `tests/components/journal/entry-viewer-layout.test.tsx`
- Modify: `tests/app/journal/browse-page.test.tsx`

- [ ] **Step 1: Update `JournalCanvas` to expose a browse-specific shell structure**

Implementation notes:
- Add stable class hooks such as `journal-browse-shell`, `journal-browse-meta`, `journal-browse-body`, and `journal-browse-footer`.
- Tone down the write-style card feel so the browse shell reads closer to the approved layout while still fitting the app chrome.
- Keep the component generic enough for existing browse uses.

- [ ] **Step 2: Rework populated entry rendering in `EntryViewer`**

Implementation notes:
- Preserve the current top labels `Single entry`/`N entries` and `Includes images`/`Text only`.
- Ensure the footer always shows `Web entry` or `Imported entry` and total words.
- Reduce browse prose size and spacing to match the layout more closely.
- Keep entry body rendering within the shared shell rather than switching structures.

- [ ] **Step 3: Normalize empty, loading, offline, and archive-selection states**

Implementation notes:
- Render all states through the same shell, metadata row, and footer band.
- Replace ad hoc plain text blocks with state-specific copy inside the shared browse frame.
- Preserve the existing action affordances like `Write for this day`.

- [ ] **Step 4: Expand canvas and viewer tests to the new structure**

Implementation notes:
- Update `tests/components/journal/journal-canvas.test.tsx` only as needed for new stable shell hooks.
- Ensure `tests/components/journal/entry-viewer-layout.test.tsx` and `tests/app/journal/browse-page.test.tsx` pass against the new shell.

- [ ] **Step 5: Run the focused journal browse test suite**

Run: `pnpm test -- tests/components/journal/journal-canvas.test.tsx tests/components/journal/entry-viewer-layout.test.tsx tests/app/journal/browse-page.test.tsx`

Expected: PASS

- [ ] **Step 6: Commit the browse layout alignment slice**

```bash
git add components/journal/journal-canvas.tsx components/journal/entry-viewer.tsx app/globals.css tests/components/journal/journal-canvas.test.tsx tests/components/journal/entry-viewer-layout.test.tsx tests/app/journal/browse-page.test.tsx
git commit -m "feat: align journal browse layout with dashboard design"
```

## Task 4: Full verification

**Files:**
- No additional file changes expected

- [ ] **Step 1: Run the full test suite**

Run: `pnpm test`

Expected: PASS

- [ ] **Step 2: If tests fail, fix regressions before proceeding**

Implementation notes:
- Do not broaden scope.
- Only fix regressions introduced by the browse layout alignment.

- [ ] **Step 3: Report completion with verification evidence**

Include:
- Updated files
- Whether populated and empty browse states now share the same shell
- Confirmation that `pnpm test` passed
