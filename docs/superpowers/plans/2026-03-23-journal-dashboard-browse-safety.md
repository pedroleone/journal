# Journal Dashboard Browse Safety Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove journal text exposure from the dashboard, add a calendar-first browse page, and add chronological previous/next navigation on the dedicated journal entry page.

**Architecture:** Refactor the dashboard journal quadrant into a state-driven summary surface, replace the browse route's archive-panel model with a month calendar plus empty-day state, and extend the entry page with adjacent-entry navigation. Keep backend changes narrow by reusing `/api/entries` and `/api/entries/dates` where practical, adding only the smallest extra entry-navigation support if the current data shape is insufficient.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind CSS, Vitest, Testing Library, pnpm

---

## File Structure

### Existing files to modify

- `components/dashboard/journal-quadrant.tsx`
  - Replace journal preview rendering with dashboard-safe action/status states.
- `app/journal/browse/page.tsx`
  - Replace archive-panel browse flow with month-calendar browsing and empty-day selection state.
- `app/journal/entry/[id]/page.tsx`
  - Add previous/next existing-entry navigation and preserve browse back-navigation.
- `app/api/entries/route.ts`
  - Extend selected-day entry payload only if dashboard metadata or browse linking needs additional fields.
- `app/api/entries/[id]/route.ts`
  - Extend entry-by-id payload or navigation support only if needed for adjacent-entry controls.
- `app/api/entries/dates/route.ts`
  - Reuse for calendar marks and latest-entry fallback; modify only if the current shape is missing data required for browse linking.
- `lib/i18n.ts`
  - Update or add journal labels used by the new dashboard and browse states.
- `tests/components/dashboard/journal-quadrant.test.tsx`
  - Replace preview-oriented assertions with dashboard-safe state coverage.
- `tests/app/journal/browse-page.test.tsx`
  - Replace archive-panel expectations with calendar-route expectations.
- `tests/components/journal/entry-viewer-layout.test.tsx`
  - Update only if shared browse-view assumptions change materially.
- `tests/app/journal/write-page.test.tsx`
  - Touch only if browse empty-state linking changes write-route entry points.

### New files to create

- `components/journal/journal-month-calendar.tsx`
  - Focused month calendar component for journal browse interactions, if reuse of `date-tree` is not clean.
- `tests/components/journal/journal-month-calendar.test.tsx`
  - Cover calendar marking, month navigation, and day selection behavior.
- `tests/app/journal/entry-page-navigation.test.tsx`
  - Cover previous/next existing-entry controls on the dedicated entry page.

### Reference files to consult while implementing

- `docs/superpowers/specs/2026-03-23-journal-dashboard-browse-safety-design.md`
- `components/journal/date-tree.tsx`
- `components/journal/entry-viewer.tsx`
- `components/dashboard/quadrant-card.tsx`

## Task 1: Refactor the dashboard journal quadrant into safe state-driven UI

**Files:**
- Modify: `components/dashboard/journal-quadrant.tsx`
- Modify: `tests/components/dashboard/journal-quadrant.test.tsx`

- [ ] **Step 1: Write the failing dashboard journal tests**

```tsx
it("shows Continue Writing, last updated metadata, and word count for today when an entry exists", async () => {
  mockSelectedDayEntry({
    id: "entry-1",
    content: "Today I wrote five simple words",
    updated_at: "2026-03-23T16:00:00.000Z",
    images: [],
  });

  render(<JournalQuadrant date={new Date("2026-03-23T10:00:00.000Z")} />);

  expect(await screen.findByRole("link", { name: /continue writing/i })).toHaveAttribute(
    "href",
    "/journal/write?entry=entry-1",
  );
  expect(screen.getByText(/5 words/i)).toBeTruthy();
  expect(screen.getByText(/last updated/i)).toBeTruthy();
  expect(screen.queryByText(/today i wrote five simple words/i)).toBeNull();
});

it("shows Write and Empty journal when there is no selected-day entry and no prior history", async () => {
  mockSelectedDayEntries([]);
  mockEntryDates([]);

  render(<JournalQuadrant date={new Date("2026-03-23T10:00:00.000Z")} />);

  expect(await screen.findByRole("link", { name: /^write$/i })).toHaveAttribute(
    "href",
    "/journal/write?year=2026&month=3&day=23",
  );
  expect(screen.getByText(/empty journal/i)).toBeTruthy();
});
```

- [ ] **Step 2: Run the journal quadrant test file to verify failure**

Run: `pnpm test -- tests/components/dashboard/journal-quadrant.test.tsx`

Expected: FAIL because the current quadrant still renders preview text and archive-era actions.

- [ ] **Step 3: Implement the minimal dashboard journal state model**

Implementation notes for `components/dashboard/journal-quadrant.tsx`:
- Derive whether the selected date is today.
- If the selected day has an entry:
  - today: show `Continue Writing`, last-updated metadata, and word count
  - non-today: show status-only `Entry available`
- If the selected day is empty:
  - today: show `Write` plus latest-entry fallback (`X days ago` or `Empty journal`)
  - non-today: show status-only `No entry for this day`
- Replace `Archive` semantics with `Browse Entries`.
- Never render journal content preview text.

- [ ] **Step 4: Run the journal quadrant tests**

Run: `pnpm test -- tests/components/dashboard/journal-quadrant.test.tsx`

Expected: PASS

- [ ] **Step 5: Commit the dashboard journal slice**

```bash
git add components/dashboard/journal-quadrant.tsx tests/components/dashboard/journal-quadrant.test.tsx
git commit -m "feat: make dashboard journal card privacy-safe"
```

## Task 2: Build the month calendar component for journal browse

**Files:**
- Create: `components/journal/journal-month-calendar.tsx`
- Create: `tests/components/journal/journal-month-calendar.test.tsx`

- [ ] **Step 1: Write the failing calendar component tests**

```tsx
it("marks days with entries and leaves empty days unmarked", () => {
  render(
    <JournalMonthCalendar
      visibleMonth={{ year: 2026, month: 3 }}
      selectedDate={{ year: 2026, month: 3, day: 12 }}
      entryDates={["2026-03-05", "2026-03-12"]}
      onSelectDay={vi.fn()}
      onChangeMonth={vi.fn()}
    />,
  );

  expect(screen.getByRole("button", { name: /march 12/i })).toHaveAttribute("data-has-entry", "true");
  expect(screen.getByRole("button", { name: /march 8/i })).toHaveAttribute("data-has-entry", "false");
});

it("calls month navigation handlers when previous and next are pressed", () => {
  const onChangeMonth = vi.fn();
  renderCalendar({ onChangeMonth });

  fireEvent.click(screen.getByRole("button", { name: /previous month/i }));
  fireEvent.click(screen.getByRole("button", { name: /next month/i }));

  expect(onChangeMonth).toHaveBeenCalledTimes(2);
});
```

- [ ] **Step 2: Run the calendar component test file to verify failure**

Run: `pnpm test -- tests/components/journal/journal-month-calendar.test.tsx`

Expected: FAIL because the month calendar component does not exist yet.

- [ ] **Step 3: Implement the minimal month calendar component**

Implementation notes for `components/journal/journal-month-calendar.tsx`:
- Render one month grid at a time.
- Render previous/next month buttons.
- Mark day cells with entry presence.
- Make every day selectable.
- Keep the API focused on visible month, selected day, known entry dates, and callbacks.

- [ ] **Step 4: Run the calendar component tests**

Run: `pnpm test -- tests/components/journal/journal-month-calendar.test.tsx`

Expected: PASS

- [ ] **Step 5: Commit the calendar component slice**

```bash
git add components/journal/journal-month-calendar.tsx tests/components/journal/journal-month-calendar.test.tsx
git commit -m "feat: add journal month calendar browser"
```

## Task 3: Replace the browse route archive-panel model with calendar browsing

**Files:**
- Modify: `app/journal/browse/page.tsx`
- Modify: `lib/i18n.ts`
- Modify: `tests/app/journal/browse-page.test.tsx`
- Modify: `tests/components/journal/entry-viewer-layout.test.tsx`

- [ ] **Step 1: Write the failing browse page tests**

```tsx
it("renders the current month calendar and shows Browse Entries instead of archive controls", async () => {
  mockEntryDates([{ id: "entry-1", year: 2026, month: 3, day: 7 }]);

  render(<BrowsePage />);

  expect(await screen.findByRole("button", { name: /previous month/i })).toBeTruthy();
  expect(screen.getByRole("button", { name: /next month/i })).toBeTruthy();
  expect(screen.queryByRole("button", { name: /archive/i })).toBeNull();
});

it("shows an inline empty-day state with Write for this day when an empty date is selected", async () => {
  mockEntryDates([{ id: "entry-1", year: 2026, month: 3, day: 7 }]);

  render(<BrowsePage />);
  fireEvent.click(await screen.findByRole("button", { name: /march 8/i }));

  expect(screen.getByText(/no entry for this day/i)).toBeTruthy();
  expect(screen.getByRole("link", { name: /write for this day/i })).toHaveAttribute(
    "href",
    "/journal/write?year=2026&month=3&day=8",
  );
});
```

- [ ] **Step 2: Run the browse page tests to verify failure**

Run: `pnpm test -- tests/app/journal/browse-page.test.tsx`

Expected: FAIL because the route still uses the archive-panel model.

- [ ] **Step 3: Implement the calendar-first browse route**

Implementation notes for `app/journal/browse/page.tsx`:
- Remove archive-panel UI and related mobile sheet logic.
- Track visible month and selected day.
- Default visible month to today unless a query date is present.
- Use known entry dates to decide whether a selected day navigates or shows the empty-day state.
- When a selected day has an entry, route to the dedicated entry page for that day’s entry.
- Preserve offline messaging, adapted to the calendar surface.

- [ ] **Step 4: Run the browse page tests**

Run: `pnpm test -- tests/app/journal/browse-page.test.tsx`

Expected: PASS

- [ ] **Step 5: Commit the browse route slice**

```bash
git add app/journal/browse/page.tsx lib/i18n.ts tests/app/journal/browse-page.test.tsx tests/components/journal/entry-viewer-layout.test.tsx
git commit -m "feat: turn journal browse into month calendar"
```

## Task 4: Add chronological previous/next navigation to the entry page

**Files:**
- Modify: `app/journal/entry/[id]/page.tsx`
- Modify: `app/api/entries/[id]/route.ts`
- Modify: `app/api/entries/dates/route.ts`
- Create: `tests/app/journal/entry-page-navigation.test.tsx`

- [ ] **Step 1: Write the failing entry navigation tests**

```tsx
it("renders previous and next links for adjacent existing entries", async () => {
  mockEntryDetail({
    id: "entry-2",
    year: 2026,
    month: 3,
    day: 12,
    content: "middle entry",
    previousEntryId: "entry-1",
    nextEntryId: "entry-3",
  });

  render(await EntryPage({ params: Promise.resolve({ id: "entry-2" }) }));

  expect(screen.getByRole("link", { name: /previous entry/i })).toHaveAttribute("href", "/journal/entry/entry-1");
  expect(screen.getByRole("link", { name: /next entry/i })).toHaveAttribute("href", "/journal/entry/entry-3");
});

it("omits unavailable navigation at the ends of the timeline", async () => {
  mockEntryDetail({
    id: "entry-1",
    year: 2026,
    month: 3,
    day: 5,
    content: "oldest entry",
    previousEntryId: null,
    nextEntryId: "entry-2",
  });

  render(await EntryPage({ params: Promise.resolve({ id: "entry-1" }) }));

  expect(screen.queryByRole("link", { name: /previous entry/i })).toBeNull();
  expect(screen.getByRole("link", { name: /next entry/i })).toBeTruthy();
});
```

- [ ] **Step 2: Run the entry navigation tests to verify failure**

Run: `pnpm test -- tests/app/journal/entry-page-navigation.test.tsx`

Expected: FAIL because adjacent-entry controls do not exist yet.

- [ ] **Step 3: Implement minimal adjacent-entry support**

Implementation notes for `app/api/entries/[id]/route.ts` and `app/journal/entry/[id]/page.tsx`:
- Prefer returning `previousEntryId` and `nextEntryId` with the entry detail payload.
- Compute adjacency chronologically across existing entries only.
- Keep the UI minimal: `Back to Browse`, `Previous Entry`, `Next Entry`.

- [ ] **Step 4: Run the entry navigation tests**

Run: `pnpm test -- tests/app/journal/entry-page-navigation.test.tsx`

Expected: PASS

- [ ] **Step 5: Commit the entry navigation slice**

```bash
git add app/journal/entry/[id]/page.tsx app/api/entries/[id]/route.ts app/api/entries/dates/route.ts tests/app/journal/entry-page-navigation.test.tsx
git commit -m "feat: add journal entry chronology navigation"
```

## Task 5: Verify the full journal browse-safety pass

**Files:**
- Review only: `components/dashboard/journal-quadrant.tsx`
- Review only: `components/journal/journal-month-calendar.tsx`
- Review only: `app/journal/browse/page.tsx`
- Review only: `app/journal/entry/[id]/page.tsx`

- [ ] **Step 1: Run the focused journal suite**

Run:

```bash
pnpm test -- tests/components/dashboard/journal-quadrant.test.tsx tests/components/journal/journal-month-calendar.test.tsx tests/app/journal/browse-page.test.tsx tests/app/journal/entry-page-navigation.test.tsx
```

Expected: PASS

- [ ] **Step 2: Run the full test suite**

Run: `pnpm test`

Expected: PASS

- [ ] **Step 3: Manually verify the product flow**

Run: `pnpm dev`

Manual checks:
- dashboard never shows journal body text
- today-with-entry shows `Continue Writing`
- today-without-entry shows `Write` plus either `X days ago` or `Empty journal`
- non-today shows status-only card states
- `Browse Entries` replaces old archive language
- browse page defaults to a month calendar
- populated days open dedicated entry pages
- empty days show inline empty state with `Write for this day`
- entry page previous/next controls follow chronology only

- [ ] **Step 4: Commit the final verified state**

```bash
git add components/dashboard/journal-quadrant.tsx components/journal/journal-month-calendar.tsx app/journal/browse/page.tsx app/journal/entry/[id]/page.tsx app/api/entries/route.ts app/api/entries/[id]/route.ts app/api/entries/dates/route.ts lib/i18n.ts tests/components/dashboard/journal-quadrant.test.tsx tests/components/journal/journal-month-calendar.test.tsx tests/app/journal/browse-page.test.tsx tests/app/journal/entry-page-navigation.test.tsx
git commit -m "feat: redesign journal dashboard and browse flow"
```
