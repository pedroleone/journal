# Food Inline Composer And Route Consolidation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn `/food` into the single food workspace with inline slot composition, in-place inbox mode, day navigation, inline delete confirmation, dashboard quick add, and no `/food/browse` route.

**Architecture:** Extract a reusable compact food composer first, then wire it into `/food` slot cards and the header/day shell so the page can create uncategorized and slot-bound items without route jumps. Fold the browse-page organizer logic into `/food`, add explicit day navigation in the food shell, and reuse the same composer on the dashboard as a localized quick-add surface. Remove `/food/browse` only after its organizer responsibilities are covered on `/food`.

**Tech Stack:** Next.js App Router, React client components, TypeScript, Vitest, Testing Library, existing food APIs, existing shadcn/ui components

---

## File Structure

**Modify**
- `app/food/page.tsx`
  Responsibility: become the only food workspace with day navigation, day/inbox mode switching, slot actions, and inline refresh behavior.
- `components/food/food-meal-slot-card.tsx`
  Responsibility: add append action, inline composer mount point, and inline delete confirmation for visible food items.
- `components/dashboard/food-quadrant.tsx`
  Responsibility: keep the quadrant pointing to `/food` and add the dashboard quick-add entry point.
- `app/dashboard-home.tsx`
  Responsibility: provide the selected dashboard date to the dashboard quick-add entry point if needed at the shell level.
- `lib/i18n.ts`
  Responsibility: add or update copy for inline composition, delete confirmation, browse removal, and day navigation labels.
- `tests/app/food-page.test.tsx`
  Responsibility: validate the unified `/food` behavior instead of the old page/browse split.
- `tests/components/dashboard/food-quadrant-links.test.tsx`
  Responsibility: cover the new dashboard quick-add contract in addition to the `/food` target.

**Create**
- `components/food/food-inline-composer.tsx`
  Responsibility: reusable compact composer used by header quick add, empty-slot add, append-in-slot, and dashboard quick add.
- `components/food/food-page-shell.tsx`
  Responsibility: top-level food shell that renders breadcrumb, date navigation, actions, and the active content region.
- `components/food/food-inbox-panel.tsx`
  Responsibility: render uncategorized items inside `/food` with the same expanded style.
- `tests/components/food/food-inline-composer.test.tsx`
  Responsibility: focused coverage for inline create behavior and save callbacks.
- `tests/components/food/food-meal-slot-card-inline.test.tsx`
  Responsibility: focused coverage for append mode and inline delete confirmation.

**Delete**
- `app/food/browse/page.tsx`
  Responsibility: removed once `/food` fully absorbs day browsing and uncategorized organization.

## Task 1: Extract A Reusable Inline Food Composer

**Files:**
- Create: `components/food/food-inline-composer.tsx`
- Create: `tests/components/food/food-inline-composer.test.tsx`
- Modify: `components/food/food-quick-add.tsx`

- [ ] **Step 1: Write the failing inline composer tests**

```tsx
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { FoodInlineComposer } from "@/components/food/food-inline-composer";

it("creates an uncategorized entry for the selected day", async () => {
  const onSaved = vi.fn();
  render(
    <FoodInlineComposer
      year={2026}
      month={3}
      day={21}
      onSaved={onSaved}
    />,
  );

  fireEvent.change(screen.getByPlaceholderText(/what are you eating/i), {
    target: { value: "Late lunch" },
  });
  fireEvent.click(screen.getByRole("button", { name: /^log$/i }));

  await waitFor(() => {
    expect(fetch).toHaveBeenCalledWith(
      "/api/food",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          content: "Late lunch",
          images: [],
          year: 2026,
          month: 3,
          day: 21,
        }),
      }),
    );
  });
  expect(onSaved).toHaveBeenCalled();
});

it("creates a slot-bound entry when mealSlot is provided", async () => {
  render(
    <FoodInlineComposer
      year={2026}
      month={3}
      day={21}
      mealSlot="dinner"
      onSaved={vi.fn()}
    />,
  );

  fireEvent.change(screen.getByPlaceholderText(/what are you eating/i), {
    target: { value: "Soup" },
  });
  fireEvent.click(screen.getByRole("button", { name: /^log$/i }));

  await waitFor(() => {
    expect(fetch).toHaveBeenCalledWith(
      "/api/food",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          content: "Soup",
          images: [],
          year: 2026,
          month: 3,
          day: 21,
          meal_slot: "dinner",
        }),
      }),
    );
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test tests/components/food/food-inline-composer.test.tsx`
Expected: FAIL because `components/food/food-inline-composer.tsx` does not exist.

- [ ] **Step 3: Implement the minimal reusable composer**

```tsx
export function FoodInlineComposer({ year, month, day, mealSlot, onSaved }: Props) {
  const [content, setContent] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  async function handleSave() {
    const response = await fetch("/api/food", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: content.trim(),
        images: [],
        year,
        month,
        day,
        meal_slot: mealSlot,
      }),
    });
    const data = await response.json();

    for (const file of selectedFiles) {
      await uploadEncryptedImage({
        file,
        ownerKind: "food",
        ownerId: data.id,
      });
    }

    await onSaved(data.id);
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test tests/components/food/food-inline-composer.test.tsx`
Expected: PASS

- [ ] **Step 5: Swap `FoodQuickAdd` to use the shared composer**

```tsx
export function FoodQuickAdd(props: FoodQuickAddProps) {
  return open ? <FoodInlineComposer {...props} onSaved={handleSaved} /> : <Button>Quick Add</Button>;
}
```

- [ ] **Step 6: Run regression tests**

Run:
- `pnpm test tests/components/food/food-inline-composer.test.tsx`
- `pnpm test tests/components/food/food-quick-add.test.tsx`

Expected:
- both PASS

- [ ] **Step 7: Commit**

```bash
git add components/food/food-inline-composer.tsx components/food/food-quick-add.tsx tests/components/food/food-inline-composer.test.tsx tests/components/food/food-quick-add.test.tsx
git commit -m "feat: extract reusable food inline composer"
```

## Task 2: Add Inline Append And Delete Confirmation To Slot Cards

**Files:**
- Modify: `components/food/food-meal-slot-card.tsx`
- Create: `tests/components/food/food-meal-slot-card-inline.test.tsx`

- [ ] **Step 1: Write the failing slot-card interaction tests**

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { FoodMealSlotCard } from "@/components/food/food-meal-slot-card";

it("opens an inline composer when adding to an empty slot", async () => {
  render(
    <FoodMealSlotCard
      slot="lunch"
      slotLabel="Lunch"
      state={{ kind: "empty", entries: [] }}
      year={2026}
      month={3}
      day={21}
    />,
  );

  fireEvent.click(screen.getByRole("button", { name: /add lunch/i }));
  expect(await screen.findByPlaceholderText(/what are you eating/i)).toBeTruthy();
});

it("opens an inline composer when appending to a filled slot", async () => {
  render(
    <FoodMealSlotCard
      slot="breakfast"
      slotLabel="Breakfast"
      state={{
        kind: "filled",
        entries: [
          { id: "1", content: "Eggs", logged_at: "2026-03-21T08:00:00.000Z", images: null, hour: 8 },
        ],
      }}
      year={2026}
      month={3}
      day={21}
    />,
  );

  fireEvent.click(screen.getByRole("button", { name: /add another breakfast/i }));
  expect(await screen.findByPlaceholderText(/what are you eating/i)).toBeTruthy();
});

it("uses a two-step delete confirmation inside the card", () => {
  render(
    <FoodMealSlotCard
      slot="breakfast"
      slotLabel="Breakfast"
      state={{
        kind: "filled",
        entries: [
          { id: "1", content: "Eggs", logged_at: "2026-03-21T08:00:00.000Z", images: null, hour: 8 },
        ],
      }}
    />,
  );

  fireEvent.click(screen.getByRole("button", { name: /delete eggs/i }));
  expect(screen.getByRole("button", { name: /confirm delete eggs/i })).toBeTruthy();
  expect(screen.getByRole("button", { name: /cancel delete eggs/i })).toBeTruthy();
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test tests/components/food/food-meal-slot-card-inline.test.tsx`
Expected: FAIL because append controls and inline delete confirmation do not exist yet.

- [ ] **Step 3: Implement inline append and inline delete state**

```tsx
const [showComposer, setShowComposer] = useState(false);
const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);

{state.kind === "empty" ? (
  <>
    <Button onClick={() => setShowComposer(true)}>Add {slotLabel}</Button>
    {showComposer ? (
      <FoodInlineComposer
        year={year}
        month={month}
        day={day}
        mealSlot={slot}
        onSaved={handleComposerSaved}
      />
    ) : null}
  </>
) : null}

{state.kind === "filled" ? (
  <Button onClick={() => setShowComposer(true)}>Add another {slotLabel}</Button>
) : null}

{showComposer ? (
  <FoodInlineComposer
    year={year}
    month={month}
    day={day}
    mealSlot={slot}
    onSaved={handleComposerSaved}
  />
) : null}
```

Implementation notes:
- empty slots should use the same inline composer surface instead of route navigation
- filled slots should expose append without disrupting existing open/edit affordances
- delete confirmation must stay local to the specific entry row
- extend `FoodMealSlotCard` to accept `year`, `month`, and `day` so both empty-slot add and filled-slot append can mount the shared composer without page-level routing

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test tests/components/food/food-meal-slot-card-inline.test.tsx`
Expected: PASS

- [ ] **Step 5: Run regression tests**

Run:
- `pnpm test tests/components/food/food-meal-slot-card.test.tsx`
- `pnpm test tests/components/food/food-meal-slot-card-inline.test.tsx`

Expected:
- both PASS

- [ ] **Step 6: Commit**

```bash
git add components/food/food-meal-slot-card.tsx tests/components/food/food-meal-slot-card-inline.test.tsx
git commit -m "feat: add inline append and delete confirmation to food slots"
```

## Task 3: Consolidate `/food` Into A Single Day-And-Inbox Workspace

**Files:**
- Modify: `app/food/page.tsx`
- Create: `components/food/food-page-shell.tsx`
- Create: `components/food/food-inbox-panel.tsx`
- Modify: `lib/i18n.ts`
- Modify: `tests/app/food-page.test.tsx`

- [ ] **Step 1: Write the failing `/food` workspace tests**

```tsx
it("navigates to previous and next days inside /food", async () => {
  render(<FoodPage />);

  fireEvent.click(await screen.findByRole("button", { name: /previous day/i }));
  await waitFor(() => {
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("day=20"),
      expect.anything(),
    );
  });
});

it("jumps to a calendar-selected day inside /food", async () => {
  render(<FoodPage />);

  fireEvent.change(await screen.findByLabelText(/food date/i), {
    target: { value: "2026-03-18" },
  });

  await waitFor(() => {
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("day=18"),
      expect.anything(),
    );
  });
});

it("shows inbox mode in place and returns to day mode", async () => {
  render(<FoodPage />);

  fireEvent.click(await screen.findByRole("button", { name: /inbox/i }));
  expect(await screen.findByText(/uncategorized entries/i)).toBeTruthy();

  fireEvent.click(screen.getByRole("button", { name: /day view/i }));
  expect(await screen.findByText("Breakfast")).toBeTruthy();
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test tests/app/food-page.test.tsx`
Expected: FAIL because `/food` does not yet expose explicit previous/next day controls or the final consolidated shell behavior.

- [ ] **Step 3: Implement the food page shell and fold browse behavior in**

```tsx
export function FoodPageShell() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [mode, setMode] = useState<"day" | "inbox">("day");

  return (
    <>
      <header>
        <button aria-label="Previous day" onClick={() => setSelectedDate(addDays(selectedDate, -1))} />
        <button aria-label="Next day" onClick={() => setSelectedDate(addDays(selectedDate, 1))} />
        <input
          aria-label="Food date"
          type="date"
          value={formatDateInput(selectedDate)}
          onChange={(event) => setSelectedDate(parseDateInput(event.target.value))}
        />
        <button aria-label="Inbox" onClick={() => setMode("inbox")} />
      </header>
      {mode === "inbox" ? <FoodInboxPanel /> : <FoodMealGrid />}
    </>
  );
}
```

Implementation notes:
- keep the existing breadcrumb shell and in-place inbox mode
- move any remaining useful uncategorized organizer logic from `/food/browse` into the new inbox panel
- previous/next day controls and direct calendar date selection must live on `/food`, not only on the dashboard

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test tests/app/food-page.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/food/page.tsx components/food/food-page-shell.tsx components/food/food-inbox-panel.tsx lib/i18n.ts tests/app/food-page.test.tsx
git commit -m "feat: consolidate food page into day and inbox workspace"
```

## Task 4: Add Dashboard Quick Add Using The Shared Composer

**Files:**
- Modify: `components/dashboard/food-quadrant.tsx`
- Modify: `app/dashboard-home.tsx`
- Modify: `tests/components/dashboard/food-quadrant-links.test.tsx`

- [ ] **Step 1: Write the failing dashboard quick-add test**

```tsx
it("opens a dashboard-local food composer for the selected date", async () => {
  render(<FoodQuadrant date={new Date("2026-03-21T10:00:00.000Z")} />);

  fireEvent.click(await screen.findByRole("button", { name: /quick add food/i }));
  expect(await screen.findByPlaceholderText(/what are you eating/i)).toBeTruthy();
});

it("stays on the dashboard after dashboard quick add saves", async () => {
  render(<FoodQuadrant date={new Date("2026-03-21T10:00:00.000Z")} />);

  fireEvent.click(await screen.findByRole("button", { name: /quick add food/i }));
  fireEvent.change(await screen.findByPlaceholderText(/what are you eating/i), {
    target: { value: "Late lunch" },
  });
  fireEvent.click(screen.getByRole("button", { name: /^log$/i }));

  await waitFor(() => {
    expect(screen.queryByPlaceholderText(/what are you eating/i)).toBeNull();
  });
  expect(screen.getByRole("link", { name: /food/i })).toBeTruthy();
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test tests/components/dashboard/food-quadrant-links.test.tsx`
Expected: FAIL because the dashboard only links to `/food` and does not yet mount the shared composer.

- [ ] **Step 3: Implement the dashboard-local quick add surface**

```tsx
const [showQuickAdd, setShowQuickAdd] = useState(false);

{showQuickAdd ? (
  <FoodInlineComposer
    year={date.getFullYear()}
    month={date.getMonth() + 1}
    day={date.getDate()}
    onSaved={async () => {
      setShowQuickAdd(false);
      await refreshQuadrant();
    }}
  />
) : (
  <button aria-label="Quick add food" onClick={() => setShowQuickAdd(true)} />
)}
```

Implementation notes:
- keep the user on the dashboard after save rather than navigating to `/food`
- reuse the same inline composer component rather than introducing a dashboard-only form
- dashboard quick add should create uncategorized items for the dashboard’s selected date
- after save, close the composer in place and refresh the dashboard quadrant summary so the new uncategorized count is visible without leaving the dashboard

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test tests/components/dashboard/food-quadrant-links.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add components/dashboard/food-quadrant.tsx app/dashboard-home.tsx tests/components/dashboard/food-quadrant-links.test.tsx
git commit -m "feat: add dashboard food quick add"
```

## Task 5: Remove `/food/browse` And Run Full Verification

**Files:**
- Delete: `app/food/browse/page.tsx`
- Modify: `tests/app/food-page.test.tsx`
- Modify: `components/food/food-inbox-panel.tsx`
- Modify: `tests/components/dashboard/food-quadrant-links.test.tsx`

- [ ] **Step 1: Add the failing route-removal regression check**

```tsx
it("does not rely on the legacy browse route for inbox behavior", async () => {
  render(<FoodPage />);

  fireEvent.click(await screen.findByRole("button", { name: /inbox/i }));
  expect(await screen.findByText(/uncategorized entries/i)).toBeTruthy();
  expect(screen.queryByRole("link", { name: /browse/i })).toBeNull();
});

it("allows deleting an uncategorized inbox item with local confirmation", async () => {
  render(<FoodPage />);

  fireEvent.click(await screen.findByRole("button", { name: /inbox/i }));
  fireEvent.click(await screen.findByRole("button", { name: /delete late lunch/i }));
  fireEvent.click(screen.getByRole("button", { name: /confirm delete late lunch/i }));

  await waitFor(() => {
    expect(fetch).toHaveBeenCalledWith(
      "/api/food/uncategorized-1",
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});
```

- [ ] **Step 2: Run the focused tests to verify the regression is captured**

Run: `pnpm test tests/app/food-page.test.tsx tests/components/dashboard/food-quadrant-links.test.tsx`
Expected: FAIL only if the page or dashboard still depends on `/food/browse`.

- [ ] **Step 3: Delete the legacy route and finish cleanup**

Implementation notes:
- remove `app/food/browse/page.tsx`
- leave `/food/browse` unhandled so it 404s
- make sure no dashboard or food-page code still links to the removed route
- `FoodInboxPanel` must reuse the same delete/confirm/delete-refresh contract already used by meal-slot cards so uncategorized items remain removable from `/food`

- [ ] **Step 4: Run verification**

Run:
- `pnpm test tests/components/food/food-inline-composer.test.tsx`
- `pnpm test tests/components/food/food-meal-slot-card.test.tsx`
- `pnpm test tests/components/food/food-meal-slot-card-inline.test.tsx`
- `pnpm test tests/app/food-page.test.tsx`
- `pnpm test tests/components/dashboard/food-quadrant-links.test.tsx`
- `test ! -f app/food/browse/page.tsx`
- `pnpm test`
- `pnpm build`

Expected:
- focused food and dashboard tests PASS
- legacy browse route file absent
- full suite PASS
- build PASS unless blocked by the known font-fetch sandbox issue

- [ ] **Step 5: Commit**

```bash
git add app/food/page.tsx components/food/food-inbox-panel.tsx tests/app/food-page.test.tsx tests/components/dashboard/food-quadrant-links.test.tsx
git rm app/food/browse/page.tsx
git commit -m "refactor: remove legacy food browse route"
```
