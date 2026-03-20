# Journal Dashboard Archive Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the journal browse experience around the dashboard-style journal canvas with a toggleable archive panel, while fixing journal-specific font roles and keeping existing journal data flows intact.

**Architecture:** Keep the current journal data APIs and selected-date state model, but replace the browse page shell with a journal-specific expanded layout. Extract focused presentation components for the archive panel and journal canvas so loading, empty, and populated states all render in one consistent structure, then align write-mode typography and shell styling to the same visual system.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind CSS, shadcn/ui primitives, Vitest, Testing Library

---

## File Structure

### Existing files to modify

- `app/journal/browse/page.tsx`
  - Replace the legacy split-sidebar browse layout with the dashboard journal shell and archive toggle behavior.
- `app/journal/write/page.tsx`
  - Align the write route with the same journal canvas language and typography choices where practical.
- `components/journal/date-tree.tsx`
  - Either restyle this component into the dashboard archive navigator or trim it into a thinner shared tree primitive if reuse stays clean.
- `components/journal/entry-viewer.tsx`
  - Refactor generic browse states into journal-canvas states and expose props needed by the new shell.
- `app/layout.tsx`
  - Add a dedicated reading-serif font token if a new prose font is introduced.
- `app/globals.css`
  - Add journal prose font token(s) and dashboard-aligned journal route surface styles.
- `tests/app/journal/browse-page.test.tsx`
  - Expand route tests for archive toggle and mobile behavior.

### New files to create

- `components/journal/journal-archive-panel.tsx`
  - Archive panel wrapper with desktop/mobile variants and toggle-aware chrome.
- `components/journal/journal-canvas.tsx`
  - Shared canvas wrapper for loading, empty, and populated journal states.
- `components/journal/journal-entry-state.tsx`
  - Focused presentation component for the selected-day populated state if `EntryViewer` becomes too large.
- `tests/components/journal/journal-archive-panel.test.tsx`
  - Interaction coverage for archive toggle UI and archive close behavior.
- `tests/components/journal/journal-canvas.test.tsx`
  - Rendering coverage for journal loading/empty/populated layout states if the canvas abstraction is extracted.

### Reference files to consult while implementing

- `docs/superpowers/specs/2026-03-20-journal-dashboard-archive-design.md`
- `public/layouts/d-dashboard/journal.html`
- `public/layouts/d-dashboard/styles.css`

## Task 1: Add failing browse-route tests for the archive-first layout

**Files:**
- Modify: `tests/app/journal/browse-page.test.tsx`
- Reference: `app/journal/browse/page.tsx`

- [ ] **Step 1: Write the failing desktop archive-toggle test**

```tsx
it("keeps the journal canvas visible and toggles the archive panel on desktop", async () => {
  useMediaQueryMock.mockReturnValue(false);

  render(<BrowsePage />);

  expect(await screen.findByTestId("entry-viewer")).toBeTruthy();
  expect(screen.getByRole("button", { name: /archive/i })).toHaveAttribute("aria-pressed", "false");

  await userEvent.click(screen.getByRole("button", { name: /archive/i }));

  expect(screen.getByTestId("journal-archive-panel")).toBeTruthy();
  expect(screen.getByRole("button", { name: /archive/i })).toHaveAttribute("aria-pressed", "true");
});
```

- [ ] **Step 2: Write the failing mobile close-on-select test**

```tsx
it("closes the archive after selecting a date on mobile", async () => {
  useMediaQueryMock.mockReturnValue(true);

  render(<BrowsePage />);

  await userEvent.click(await screen.findByRole("button", { name: /archive/i }));
  await userEvent.click(screen.getByRole("button", { name: /wed, 06\/03/i }));

  expect(screen.queryByTestId("journal-archive-panel")).toBeNull();
  expect(screen.getByTestId("entry-viewer")).toHaveTextContent("2026-3-6");
});
```

- [ ] **Step 3: Run the route test file to verify failure**

Run: `pnpm test -- tests/app/journal/browse-page.test.tsx`

Expected: FAIL because the archive toggle and panel do not exist yet.

- [ ] **Step 4: Commit the failing test checkpoint**

```bash
git add tests/app/journal/browse-page.test.tsx
git commit -m "test: define journal archive browse behavior"
```

## Task 2: Build the journal archive panel and integrate it into the browse route

**Files:**
- Create: `components/journal/journal-archive-panel.tsx`
- Modify: `app/journal/browse/page.tsx`
- Modify: `components/journal/date-tree.tsx`
- Test: `tests/app/journal/browse-page.test.tsx`
- Test: `tests/components/journal/journal-archive-panel.test.tsx`

- [ ] **Step 1: Write the failing archive panel component test**

```tsx
it("renders the archive tree inside a dashboard-styled panel", () => {
  render(
    <JournalArchivePanel open dates={[{ id: "a", year: 2026, month: 3, day: 7 }]} selected={{ year: 2026, month: 3, day: 7 }} onSelect={vi.fn()} onClose={vi.fn()} />
  );

  expect(screen.getByTestId("journal-archive-panel")).toBeTruthy();
  expect(screen.getByText("Archive")).toBeTruthy();
  expect(screen.getByTestId("date-tree")).toBeTruthy();
});
```

- [ ] **Step 2: Run the new component test to verify failure**

Run: `pnpm test -- tests/components/journal/journal-archive-panel.test.tsx`

Expected: FAIL because `JournalArchivePanel` does not exist yet.

- [ ] **Step 3: Implement the archive panel wrapper**

Create `components/journal/journal-archive-panel.tsx` with a focused API similar to:

```tsx
interface JournalArchivePanelProps {
  open: boolean;
  isMobile: boolean;
  dates: DateEntry[];
  selected: DateSelection | null;
  onSelect: (selection: DateSelection) => void;
  onClose: () => void;
  onExport: () => void;
}
```

Implementation notes:
- Use existing shadcn sheet/dialog primitives if already available; otherwise keep the desktop panel and mobile sheet minimal and local.
- Add `data-testid="journal-archive-panel"` for stable tests.
- Include an `Archive` label, close control, and the date tree area.

- [ ] **Step 4: Restyle the date tree for archive usage**

Update `components/journal/date-tree.tsx` to support archive-panel presentation:

```tsx
interface DateTreeProps {
  dates: DateEntry[];
  selected: DateSelection | null;
  onSelect: (sel: DateSelection) => void;
  onExport: () => void;
  variant?: "sidebar" | "archive";
}
```

Implementation notes:
- Default `variant` to preserve current behavior where needed.
- For `archive`, tighten spacing, use dashboard-style text hierarchy, and keep the export action visually secondary.
- Keep day rows as the main selectable target.

- [ ] **Step 5: Integrate archive state into the browse route**

Refactor `app/journal/browse/page.tsx`:

```tsx
const [archiveOpen, setArchiveOpen] = useState(false);

function handleSelect(sel: DateSelection) {
  setSelected(sel);
  if (isMobile) setArchiveOpen(false);
}
```

Implementation notes:
- Preserve latest-date auto-selection.
- Remove the legacy `CollapsibleSidebar` dependency from this route if it no longer matches the design.
- Keep the journal canvas visible on desktop even when the archive is closed.
- Add an archive toggle button with `aria-pressed`.

- [ ] **Step 6: Run focused tests to verify the route and panel pass**

Run: `pnpm test -- tests/app/journal/browse-page.test.tsx tests/components/journal/journal-archive-panel.test.tsx`

Expected: PASS

- [ ] **Step 7: Commit the archive panel slice**

```bash
git add app/journal/browse/page.tsx components/journal/date-tree.tsx components/journal/journal-archive-panel.tsx tests/app/journal/browse-page.test.tsx tests/components/journal/journal-archive-panel.test.tsx
git commit -m "feat: add dashboard journal archive panel"
```

## Task 3: Refactor selected-day rendering into the journal canvas states

**Files:**
- Create: `components/journal/journal-canvas.tsx`
- Create: `components/journal/journal-entry-state.tsx`
- Modify: `components/journal/entry-viewer.tsx`
- Modify: `app/journal/browse/page.tsx`
- Test: `tests/components/journal/journal-canvas.test.tsx`
- Test: `tests/app/journal/browse-page.test.tsx`

- [ ] **Step 1: Write the failing journal canvas empty-state test**

```tsx
it("renders a write action for an empty selected day", () => {
  render(
    <JournalCanvas
      heading="Wednesday, 18 March 2026"
      meta={<span>No entry yet</span>}
      body={<p>Start writing for this day.</p>}
      actions={<Link href="/journal/write?year=2026&month=3&day=18">Write for this day</Link>}
    />
  );

  expect(screen.getByRole("link", { name: /write for this day/i })).toHaveAttribute(
    "href",
    "/journal/write?year=2026&month=3&day=18",
  );
});
```

- [ ] **Step 2: Run the canvas test to verify failure**

Run: `pnpm test -- tests/components/journal/journal-canvas.test.tsx`

Expected: FAIL because `JournalCanvas` does not exist yet.

- [ ] **Step 3: Implement the shared journal canvas wrapper**

Create `components/journal/journal-canvas.tsx` with a narrow API:

```tsx
interface JournalCanvasProps {
  heading: string;
  meta?: React.ReactNode;
  actions?: React.ReactNode;
  body: React.ReactNode;
  footer?: React.ReactNode;
}
```

Implementation notes:
- Match the spacing and hierarchy from `public/layouts/d-dashboard/journal.html`.
- Keep canvas width constrained and centered.
- Support loading skeleton and empty-state content without special-case page wrappers.

- [ ] **Step 4: Refactor `EntryViewer` around day-only canvas states**

Implementation notes for `components/journal/entry-viewer.tsx`:
- Keep the data fetch logic.
- Remove month/year aggregate rendering for this route pass, or gate it off if the route no longer selects month/year states.
- Render loading, offline error, empty day, and populated day through `JournalCanvas`.
- Keep edit links for editable web entries.
- Preserve image rendering via `EncryptedImageGallery`.

- [ ] **Step 5: Update the browse route empty/default rendering**

Implementation notes for `app/journal/browse/page.tsx`:
- Replace the generic centered “select date” placeholder with a journal-canvas empty state when needed.
- Ensure the first-load latest-date selection path still lands in the populated canvas immediately.

- [ ] **Step 6: Run focused component and route tests**

Run: `pnpm test -- tests/components/journal/journal-canvas.test.tsx tests/app/journal/browse-page.test.tsx`

Expected: PASS

- [ ] **Step 7: Commit the journal canvas refactor**

```bash
git add app/journal/browse/page.tsx components/journal/entry-viewer.tsx components/journal/journal-canvas.tsx components/journal/journal-entry-state.tsx tests/components/journal/journal-canvas.test.tsx tests/app/journal/browse-page.test.tsx
git commit -m "feat: render journal browse states in dashboard canvas"
```

## Task 4: Add journal-specific typography tokens and apply them to browse/write surfaces

**Files:**
- Modify: `app/layout.tsx`
- Modify: `app/globals.css`
- Modify: `components/journal/entry-viewer.tsx`
- Modify: `app/journal/write/page.tsx`
- Test: `tests/app/journal/browse-page.test.tsx`

- [ ] **Step 1: Write a failing browse-route typography assertion**

```tsx
it("applies the journal prose font treatment to the entry canvas", async () => {
  useMediaQueryMock.mockReturnValue(false);

  render(<BrowsePage />);

  const viewer = await screen.findByTestId("entry-viewer");
  expect(viewer.className).toMatch(/journal-prose/);
});
```

- [ ] **Step 2: Run the route test to verify failure**

Run: `pnpm test -- tests/app/journal/browse-page.test.tsx`

Expected: FAIL because the prose-specific class or token is not applied yet.

- [ ] **Step 3: Add the reading-serif font token**

Update `app/layout.tsx` with one additional font import if needed, for example:

```tsx
const reading = Source_Serif_4({
  variable: "--font-reading",
  subsets: ["latin"],
  display: "swap",
});
```

Then include it in `<body className={...}>`.

- [ ] **Step 4: Add global journal prose styles**

Update `app/globals.css`:

```css
@theme inline {
  --font-reading: var(--font-reading);
}

.journal-prose {
  font-family: var(--font-reading), ui-serif, Georgia, serif;
  font-size: 1.125rem;
  line-height: 1.9;
}
```

Implementation notes:
- Keep UI controls on `DM Sans`.
- Keep headings on `Fraunces`.
- Scope the prose class to longform journal content and textarea/editor surfaces only.

- [ ] **Step 5: Apply the prose class to journal read/write surfaces**

Implementation notes:
- Update `components/journal/entry-viewer.tsx` so markdown-rendered day content lives inside a `.journal-prose` wrapper.
- Update `app/journal/write/page.tsx` so the editor textarea or markdown surface picks up the same prose role without changing control typography.

- [ ] **Step 6: Run the route tests**

Run: `pnpm test -- tests/app/journal/browse-page.test.tsx`

Expected: PASS

- [ ] **Step 7: Commit the typography slice**

```bash
git add app/layout.tsx app/globals.css app/journal/write/page.tsx components/journal/entry-viewer.tsx tests/app/journal/browse-page.test.tsx
git commit -m "style: add dashboard journal typography roles"
```

## Task 5: Verify the full journal pass and capture any follow-up

**Files:**
- Modify: `docs/superpowers/plans/2026-03-20-journal-dashboard-archive.md` (check off completed items during execution only)
- Review: `docs/superpowers/specs/2026-03-20-journal-dashboard-archive-design.md`

- [ ] **Step 1: Run the targeted journal test suite**

Run:

```bash
pnpm test -- tests/app/journal/browse-page.test.tsx tests/components/journal/journal-archive-panel.test.tsx tests/components/journal/journal-canvas.test.tsx
```

Expected: PASS

- [ ] **Step 2: Run the full test suite**

Run: `pnpm test`

Expected: PASS

- [ ] **Step 3: Manually verify the journal route**

Run: `pnpm dev`

Manual checks:
- desktop archive opens as a left panel and does not displace the journal canvas
- mobile archive behaves like a full-height sheet and closes after selection
- latest date auto-loads into the journal canvas
- empty selected-day flow offers writing for that date
- journal headings, controls, and prose each use the intended font role

- [ ] **Step 4: Commit the final verified state**

```bash
git add app/journal/browse/page.tsx app/journal/write/page.tsx app/layout.tsx app/globals.css components/journal/date-tree.tsx components/journal/entry-viewer.tsx components/journal/journal-archive-panel.tsx components/journal/journal-canvas.tsx components/journal/journal-entry-state.tsx tests/app/journal/browse-page.test.tsx tests/components/journal/journal-archive-panel.test.tsx tests/components/journal/journal-canvas.test.tsx
git commit -m "feat: align journal with dashboard archive layout"
```

- [ ] **Step 5: Record any residual follow-up separately instead of widening scope**

If anything remains after verification, document only narrowly scoped leftovers such as:
- animation polish
- minor archive density tuning
- markdown typography edge cases
