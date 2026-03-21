# Food Expanded Concept D Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the simplified `/food` page with an expanded Concept D day view that preserves current food workflows, including slot actions, quick add, calendar-driven day selection, and inbox routing.

**Architecture:** Keep `/food` as the canonical day-oriented food surface and reuse the existing browse-page data and mutation behavior instead of re-implementing food logic twice. Extract the shared day-view concerns into focused food UI/helpers, then compose them into a Concept D shell on `/food` while leaving `/food/browse` as the organizer-focused route. Use TDD for the new page states and interaction wiring before moving UI code.

**Tech Stack:** Next.js App Router, React client components, TypeScript, Vitest, Testing Library, existing shadcn/ui components, existing food APIs

---

## File Structure

**Modify**
- `app/food/page.tsx`
  Responsibility: become the expanded Concept D food day page instead of the current quick-log-only screen, with selected date driven by search params.
- `app/food/browse/page.tsx`
  Responsibility: shed any duplicated presentation/data logic that should move into shared food helpers/components while preserving organizer behavior.
- `hooks/use-locale.tsx`
  Responsibility: add any missing food copy needed by the new shell and quick add affordances.
- `tests/app/food-page.test.tsx`
  Responsibility: replace the old quick-log-only expectations with `/food` expanded layout coverage.

**Create**
- `hooks/use-food-day-view.ts`
  Responsibility: shared fetch/mutation state for selected-day food entries, including day loading, add, skip, undo, and refresh behavior consumed by both `/food` and `/food/browse`.
- `lib/food-date.ts`
  Responsibility: shared helpers to parse `year`/`month`/`day` search params, default invalid input to today, and convert `Date` objects into API/search-param parts.
- `lib/client-food.ts`
  Responsibility: shared client-side food entry creation helper that preserves the current encrypted capture flow used by quick add.
- `components/food/food-expanded-page.tsx`
  Responsibility: top-level expanded Concept D food surface for a selected day.
- `components/food/food-expanded-page-client.tsx`
  Responsibility: client boundary for the `/food` route, holding `useSearchParams`, `useRouter`, and the shared food day hook wiring.
- `components/food/food-header-actions.tsx`
  Responsibility: breadcrumb/date/header action row, including inbox and calendar controls that update `year`/`month`/`day` search params.
- `components/food/food-meal-grid.tsx`
  Responsibility: map grouped day entries into the seven-slot grid.
- `components/food/food-meal-slot-card.tsx`
  Responsibility: render single-entry, multi-entry, skipped, and empty slot states.
- `components/food/food-quick-add.tsx`
  Responsibility: compact quick add surface for the selected day with text/photo support.
- `components/food/food-day-state.ts`
  Responsibility: shared shaping helpers for grouping day entries and deriving slot states used by page/components and tests.
- `tests/components/food/food-meal-slot-card.test.tsx`
  Responsibility: isolated coverage for slot-state rendering.
- `tests/components/food/food-quick-add.test.tsx`
  Responsibility: quick add interaction coverage without page-level noise.
- `tests/components/food/food-header-actions.test.tsx`
  Responsibility: focused coverage for breadcrumb, inbox navigation, and calendar-driven date selection wiring.
- `tests/lib/food-date.test.ts`
  Responsibility: unit coverage for search-param date parsing and default-to-today behavior.
- `tests/lib/client-food.test.ts`
  Responsibility: unit coverage for encrypted client-side food creation and image upload flow.

## Task 1: Define Shared Food Day State

**Files:**
- Create: `components/food/food-day-state.ts`
- Test: `tests/components/food/food-meal-slot-card.test.tsx`

- [ ] **Step 1: Write the failing slot-state tests**

```tsx
import { describe, expect, it } from "vitest";
import {
  buildMealSlotState,
  groupEntriesByMealSlot,
} from "@/components/food/food-day-state";

describe("buildMealSlotState", () => {
  it("returns stacked state when a slot has multiple non-skipped entries", () => {
    const state = buildMealSlotState("breakfast", [
      { id: "1", meal_slot: "breakfast", tags: null },
      { id: "2", meal_slot: "breakfast", tags: null },
    ]);

    expect(state.kind).toBe("filled");
    expect(state.entries).toHaveLength(2);
  });

  it("returns skipped state when the slot contains a skipped marker", () => {
    const state = buildMealSlotState("lunch", [
      { id: "3", meal_slot: "lunch", tags: ["skipped"] },
    ]);

    expect(state.kind).toBe("skipped");
  });

  it("returns empty state when there are no entries for the slot", () => {
    expect(buildMealSlotState("dinner", []).kind).toBe("empty");
  });

  it("groups entries by meal slot for page-level rendering", () => {
    const grouped = groupEntriesByMealSlot([
      { id: "1", meal_slot: "breakfast", tags: null },
      { id: "2", meal_slot: "lunch", tags: null },
    ]);

    expect(grouped.breakfast).toHaveLength(1);
    expect(grouped.lunch).toHaveLength(1);
    expect(grouped.dinner).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test tests/components/food/food-meal-slot-card.test.tsx`
Expected: FAIL because `components/food/food-day-state.ts` and the exported helper do not exist yet.

- [ ] **Step 3: Write the minimal shared slot-state helper**

```ts
import { MealSlot } from "@/lib/food";

type DayEntry = {
  id: string;
  meal_slot: MealSlot | null;
  tags: string[] | null;
};

export function groupEntriesByMealSlot(entries: DayEntry[]) {
  return {
    breakfast: entries.filter((entry) => entry.meal_slot === "breakfast"),
    morning_snack: entries.filter((entry) => entry.meal_slot === "morning_snack"),
    lunch: entries.filter((entry) => entry.meal_slot === "lunch"),
    afternoon_snack: entries.filter((entry) => entry.meal_slot === "afternoon_snack"),
    dinner: entries.filter((entry) => entry.meal_slot === "dinner"),
    midnight_snack: entries.filter((entry) => entry.meal_slot === "midnight_snack"),
    observation: entries.filter((entry) => entry.meal_slot === "observation"),
  };
}

export function buildMealSlotState(slot: MealSlot, entries: DayEntry[]) {
  const slotEntries = entries.filter((entry) => entry.meal_slot === slot);
  const skippedEntry = slotEntries.find((entry) => entry.tags?.includes("skipped"));
  const realEntries = slotEntries.filter((entry) => !entry.tags?.includes("skipped"));

  if (skippedEntry) return { kind: "skipped" as const, skippedEntry, entries: [] };
  if (realEntries.length === 0) return { kind: "empty" as const, entries: [] };
  return { kind: "filled" as const, entries: realEntries };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test tests/components/food/food-meal-slot-card.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add components/food/food-day-state.ts tests/components/food/food-meal-slot-card.test.tsx
git commit -m "feat: add food slot state helpers"
```

## Task 2: Build Meal Slot Card UI

**Files:**
- Create: `components/food/food-meal-slot-card.tsx`
- Modify: `components/food/food-day-state.ts`
- Test: `tests/components/food/food-meal-slot-card.test.tsx`

- [ ] **Step 1: Expand the failing component tests**

```tsx
import { render, screen } from "@testing-library/react";
import { FoodMealSlotCard } from "@/components/food/food-meal-slot-card";

it("renders a populated single-entry slot with time and actions", () => {
  render(
    <FoodMealSlotCard
      slotLabel="Lunch"
      state={{
        kind: "filled",
        entries: [
          {
            id: "1",
            content: "Chicken bowl",
            logged_at: "2026-03-20T12:45:00.000Z",
            images: ["img-1"],
            hour: 12,
          },
        ],
      }}
    />,
  );

  expect(screen.getByText("Chicken bowl")).toBeTruthy();
  expect(screen.getByText("12:00")).toBeTruthy();
  expect(screen.getByRole("link", { name: /open/i })).toBeTruthy();
  expect(screen.getByRole("link", { name: /edit/i })).toBeTruthy();
});

it("renders multiple inline entries for a filled slot", () => {
  render(
    <FoodMealSlotCard
      slotLabel="Breakfast"
      state={{
        kind: "filled",
        entries: [
          { id: "1", content: "Eggs", logged_at: "2026-03-20T08:00:00.000Z", images: null, hour: 8 },
          { id: "2", content: "Toast", logged_at: "2026-03-20T09:00:00.000Z", images: null, hour: 9 },
        ],
      }}
    />,
  );

  expect(screen.getByText("Eggs")).toBeTruthy();
  expect(screen.getByText("Toast")).toBeTruthy();
  expect(screen.getAllByRole("link", { name: /open/i })).toHaveLength(2);
  expect(screen.getAllByRole("link", { name: /edit/i })).toHaveLength(2);
});

it("renders add and skip controls for an empty non-observation slot", () => {
  render(<FoodMealSlotCard slotLabel="Dinner" state={{ kind: "empty", entries: [] }} canSkip />);

  expect(screen.getByRole("button", { name: /add/i })).toBeTruthy();
  expect(screen.getByRole("button", { name: /skip/i })).toBeTruthy();
});

it("does not render skip for the observation slot", () => {
  render(
    <FoodMealSlotCard
      slotLabel="Observation"
      state={{ kind: "empty", entries: [] }}
      canSkip={false}
    />,
  );

  expect(screen.getByRole("button", { name: /add/i })).toBeTruthy();
  expect(screen.queryByRole("button", { name: /skip/i })).toBeNull();
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test tests/components/food/food-meal-slot-card.test.tsx`
Expected: FAIL because `FoodMealSlotCard` does not exist.

- [ ] **Step 3: Write the minimal card component**

```tsx
export function FoodMealSlotCard({ slotLabel, state, canSkip, onAdd, onSkip, onUndoSkip }) {
  if (state.kind === "skipped") {
    return (
      <section>
        <h2>{slotLabel}</h2>
        <button onClick={onUndoSkip}>Undo</button>
      </section>
    );
  }

  if (state.kind === "empty") {
    return (
      <section>
        <h2>{slotLabel}</h2>
        <button onClick={onAdd}>Add</button>
        {canSkip ? <button onClick={onSkip}>Skip</button> : null}
      </section>
    );
  }

  return (
    <section>
      <h2>{slotLabel}</h2>
      {state.entries.map((entry) => (
        <article key={entry.id}>
          <p>{entry.content}</p>
          <p>{formatSlotTime(entry.logged_at, entry.hour)}</p>
          {entry.images?.length ? <EncryptedImageGallery imageKeys={entry.images} /> : null}
          <Link href={`/food/entry/${entry.id}?edit=true`}>Edit</Link>
          <Link href={`/food/entry/${entry.id}`}>Open</Link>
        </article>
      ))}
    </section>
  );
}
```

Implementation notes:
- populated slot state must cover single-entry and stacked multi-entry rendering
- real entries must show time, image preview when present, and per-entry `Open`/`Edit` actions
- observation slot must never render skip controls
- do not reduce multi-entry cards to plain text rows

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test tests/components/food/food-meal-slot-card.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add components/food/food-day-state.ts components/food/food-meal-slot-card.tsx tests/components/food/food-meal-slot-card.test.tsx
git commit -m "feat: add concept d food meal slot card"
```

## Task 3: Add Quick Add as a Compact Surface

**Files:**
- Create: `components/food/food-quick-add.tsx`
- Create: `lib/client-food.ts`
- Modify: `tests/app/food-page.test.tsx`
- Create: `tests/components/food/food-quick-add.test.tsx`
- Create: `tests/lib/client-food.test.ts`

- [ ] **Step 1: Write the failing quick-add component tests**

```tsx
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { FoodQuickAdd } from "@/components/food/food-quick-add";

it("creates an entry for the selected day and uploads chosen files", async () => {
  render(<FoodQuickAdd year={2026} month={3} day={20} onSaved={vi.fn()} />);

  fireEvent.change(screen.getByPlaceholderText(/what are you eating/i), {
    target: { value: "Late lunch" },
  });
  fireEvent.change(screen.getByLabelText(/photo/i), {
    target: {
      files: [new File(["a"], "meal.jpg", { type: "image/jpeg" })],
    },
  });
  fireEvent.click(screen.getByRole("button", { name: /log/i }));

  await waitFor(() => {
    expect(fetch).toHaveBeenCalledWith(
      "/api/food",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining("\"year\":2026"),
      }),
    );
  });

  await waitFor(() => {
    expect(uploadEncryptedImage).toHaveBeenCalledTimes(1);
  });
});

it("refreshes the parent day view after a successful save", async () => {
  const onSaved = vi.fn();

  render(<FoodQuickAdd year={2026} month={3} day={20} onSaved={onSaved} />);
  fireEvent.change(screen.getByPlaceholderText(/what are you eating/i), {
    target: { value: "Soup" },
  });
  fireEvent.click(screen.getByRole("button", { name: /log/i }));

  await waitFor(() => {
    expect(onSaved).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test tests/components/food/food-quick-add.test.tsx`
Expected: FAIL because `FoodQuickAdd` does not exist.

- [ ] **Step 3: Extract the current quick-log behavior into the new compact component**

```tsx
import { createClientFoodEntry } from "@/lib/client-food";

export function FoodQuickAdd({ year, month, day, onSaved }: Props) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  async function handleLog() {
    await createClientFoodEntry({
      content,
      files: selectedFiles,
      year,
      month,
      day,
    });

    onSaved();
    setOpen(false);
  }

  return open ? (
    <div>
      <Textarea value={content} onChange={(event) => setContent(event.target.value)} />
      <input
        aria-label="Photo"
        type="file"
        accept="image/*"
        multiple
        onChange={(event) => setSelectedFiles(Array.from(event.target.files ?? []))}
      />
      <Button onClick={handleLog}>Log</Button>
    </div>
  ) : (
    <Button onClick={() => setOpen(true)}>Quick Add</Button>
  );
}
```

Implementation notes:
- do not post plaintext capture logic directly from the component
- extract the current food-create contract from `app/food/page.tsx` into `lib/client-food.ts` instead of inventing a new API:
  - `POST /api/food` with `{ content, images: [], year, month, day }`
  - read `{ id }` from the response
  - call `uploadEncryptedImage({ file, ownerKind: "food", ownerId: id })` for each selected file using the existing helper in `lib/client-images.ts`
- keep the request/refresh order identical to the current page flow: create entry first, upload encrypted images second, then call `onSaved`
- keep image upload encrypted before upload and do not change the server route contract as part of this layout work

- [ ] **Step 4: Add direct encryption-flow unit tests**

```ts
import { describe, expect, it, vi } from "vitest";
import { createClientFoodEntry } from "@/lib/client-food";

it("encrypts text payloads before creating a food entry", async () => {
  await createClientFoodEntry({
    content: "Late lunch",
    files: [],
    year: 2026,
    month: 3,
    day: 20,
  });

  expect(encryptClientText).toHaveBeenCalledWith("Late lunch");
  expect(fetch).toHaveBeenCalledWith(
    "/api/food",
    expect.objectContaining({
      body: expect.stringContaining("\"content\":\"Late lunch\""),
      body: expect.stringContaining("\"images\":[]"),
      body: expect.stringContaining("\"year\":2026"),
    }),
  );
});

it("encrypts and uploads selected images before resolving", async () => {
  await createClientFoodEntry({
    content: "",
    files: [new File(["a"], "meal.jpg", { type: "image/jpeg" })],
    year: 2026,
    month: 3,
    day: 20,
  });

  expect(uploadEncryptedImage).toHaveBeenCalledTimes(1);
});
```

- [ ] **Step 5: Run the focused tests to verify they pass**

Run:
- `pnpm test tests/components/food/food-quick-add.test.tsx`
- `pnpm test tests/lib/client-food.test.ts`

Expected:
- quick-add component test PASS
- encrypted client-food helper test PASS

- [ ] **Step 6: Commit**

```bash
git add components/food/food-quick-add.tsx lib/client-food.ts tests/components/food/food-quick-add.test.tsx tests/lib/client-food.test.ts
git commit -m "feat: add compact food quick add"
```

## Task 4: Extract Shared Day Fetch and Mutation State

**Files:**
- Create: `hooks/use-food-day-view.ts`
- Create: `lib/food-date.ts`
- Modify: `app/food/browse/page.tsx`
- Test: `tests/app/food-page.test.tsx`
- Create: `tests/lib/food-date.test.ts`

- [ ] **Step 1: Write the failing shared-state test coverage**

```tsx
it("loads a selected day and exposes slot mutation actions through shared state", async () => {
  const { result } = renderHook(() =>
    useFoodDayView({
      year: 2026,
      month: 3,
      day: 20,
    }),
  );

  await waitFor(() => {
    expect(result.current.dayEntries).toHaveLength(2);
  });

  await act(async () => {
    await result.current.addToSlot("dinner");
    await result.current.skipSlot("morning_snack");
    await result.current.undoSkip("skip-1");
  });

  expect(fetch).toHaveBeenCalled();
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test tests/app/food-page.test.tsx`
Expected: FAIL because `useFoodDayView` does not exist and the day fetch/mutation behavior is still embedded in `app/food/browse/page.tsx`.

- [ ] **Step 3: Extract the shared selected-day state and actions**

```tsx
type FoodDayViewState = {
  dayEntries: FoodEntryView[];
  uncategorizedCount: number;
  loading: boolean;
  error: string;
  loadDayEntries: () => Promise<void>;
  addToSlot: (slot: MealSlot) => Promise<void>;
  skipSlot: (slot: MealSlot) => Promise<void>;
  undoSkip: (entryId: string) => Promise<void>;
};

export function useFoodDayView({ year, month, day }: FoodDayArgs) {
  const [dayEntries, setDayEntries] = useState<FoodEntryView[]>([]);
  const [uncategorizedCount, setUncategorizedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDayEntries = useCallback(async () => {
    setLoading(true);
    setError("");
    const response = await fetch(`/api/food?year=${year}&month=${month}&day=${day}`);
    if (!response.ok) {
      setError("Could not load this day.");
      setLoading(false);
      return;
    }

    const data = (await response.json()) as FoodEntryView[];
    setDayEntries(data);
    setLoading(false);
  }, [year, month, day]);

  const loadUncategorizedCount = useCallback(async () => {
    const response = await fetch("/api/food?uncategorized=true");
    if (!response.ok) return;
    const data = (await response.json()) as FoodEntryView[];
    setUncategorizedCount(data.length);
  }, []);

  const addToSlot = useCallback(async (slot: MealSlot) => {
    const response = await fetch("/api/food", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: "",
        images: [],
        meal_slot: slot,
        year,
        month,
        day,
      }),
    });
    if (!response.ok) return;
    await loadDayEntries();
    await loadUncategorizedCount();
  }, [year, month, day, loadDayEntries, loadUncategorizedCount]);

  const skipSlot = useCallback(async (slot: MealSlot) => {
    const response = await fetch("/api/food", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: "",
        meal_slot: slot,
        year,
        month,
        day,
        tags: ["skipped"],
      }),
    });
    if (!response.ok) return;
    await loadDayEntries();
    await loadUncategorizedCount();
  }, [year, month, day, loadDayEntries, loadUncategorizedCount]);

  const undoSkip = useCallback(async (entryId: string) => {
    const response = await fetch(`/api/food/${entryId}`, { method: "DELETE" });
    if (!response.ok) return;
    await loadDayEntries();
    await loadUncategorizedCount();
  }, [loadDayEntries, loadUncategorizedCount]);

  return {
    dayEntries,
    uncategorizedCount,
    loading,
    error,
    loadDayEntries,
    addToSlot,
    skipSlot,
    undoSkip,
  } satisfies FoodDayViewState;
}

export function getSelectedFoodDate(searchParams: URLSearchParams): Date {
  // parse year/month/day, default invalid input to today
}

export function getDateParts(date: Date) {
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  };
}
```

Implementation notes:
- move the selected-day fetch and mutation logic out of `app/food/browse/page.tsx`
- make `/food` and the already-client `app/food/browse/page.tsx` consume the same day-view hook rather than duplicating add/skip/undo behavior
- define and export the full hook contract, including `uncategorizedCount`, so the header action label is not implicit
- centralize date parsing/default-to-today behavior in `lib/food-date.ts`
- on `year`/`month`/`day` changes, rerun `loadDayEntries` from an effect inside the hook so search-param changes naturally reload the visible day
- keep uncategorized organizer state in `/food/browse`; only selected-day state belongs in the shared hook

- [ ] **Step 4: Add direct date-helper unit tests**

```ts
import { describe, expect, it, vi } from "vitest";
import { getDateParts, getSelectedFoodDate } from "@/lib/food-date";

it("uses explicit year/month/day params when valid", () => {
  const date = getSelectedFoodDate(new URLSearchParams("year=2026&month=3&day=20"));

  expect(getDateParts(date)).toEqual({ year: 2026, month: 3, day: 20 });
});

it("defaults invalid date params to today", () => {
  vi.setSystemTime(new Date("2026-03-20T10:00:00.000Z"));

  const date = getSelectedFoodDate(new URLSearchParams("year=2026&month=99&day=99"));

  expect(getDateParts(date)).toEqual({ year: 2026, month: 3, day: 20 });
});
```

- [ ] **Step 5: Run the focused tests to verify they pass**

Run:
- `pnpm test tests/lib/food-date.test.ts`
- `pnpm test tests/app/food-page.test.tsx`

Expected:
- date helper test PASS
- page test PASS

- [ ] **Step 6: Commit**

```bash
git add hooks/use-food-day-view.ts lib/food-date.ts app/food/browse/page.tsx tests/app/food-page.test.tsx tests/lib/food-date.test.ts
git commit -m "refactor: extract shared food day view state"
```

## Task 5: Replace `/food` with the Expanded Concept D Day Page

**Files:**
- Modify: `app/food/page.tsx`
- Modify: `hooks/use-food-day-view.ts`
- Modify: `lib/food-date.ts`
- Create: `components/food/food-expanded-page.tsx`
- Create: `components/food/food-expanded-page-client.tsx`
- Create: `components/food/food-header-actions.tsx`
- Create: `components/food/food-meal-grid.tsx`
- Modify: `hooks/use-locale.tsx`
- Test: `tests/app/food-page.test.tsx`
- Create: `tests/components/food/food-header-actions.test.tsx`

- [ ] **Step 1: Rewrite the page-level tests around the new shell**

```tsx
it("routes the inbox action to the organizer page", async () => {
  render(<FoodPage />);

  expect(await screen.findByRole("link", { name: /inbox/i })).toHaveAttribute(
    "href",
    "/food/browse",
  );
});

it("renders the concept d food header and meal grid for the selected date", async () => {
  render(<FoodPage />);

  expect(await screen.findByText("Food")).toBeTruthy();
  expect(screen.getByRole("link", { name: /dashboard/i })).toBeTruthy();
  expect(screen.getByText(/march/i)).toBeTruthy();
  expect(screen.getByRole("button", { name: /quick add/i })).toBeTruthy();
  expect(screen.getByRole("link", { name: /inbox/i })).toBeTruthy();
  expect(screen.getByRole("button", { name: /calendar/i })).toBeTruthy();
  expect(screen.getByText("Breakfast")).toBeTruthy();
  expect(screen.getByText("Dinner")).toBeTruthy();
});

it("shows stacked entries when a meal slot has more than one item", async () => {
  render(<FoodPage />);

  expect(await screen.findByText("Eggs")).toBeTruthy();
  expect(screen.getByText("Toast")).toBeTruthy();
});

it("lets the user add, skip, and undo a slot from the expanded grid", async () => {
  render(<FoodPage />);

  fireEvent.click(await screen.findByRole("button", { name: /add dinner/i }));
  fireEvent.click(screen.getByRole("button", { name: /skip morning snack/i }));
  fireEvent.click(await screen.findByRole("button", { name: /undo/i }));

  await waitFor(() => {
    expect(fetch).toHaveBeenCalled();
  });
});

it("changes the selected date from the calendar control and reloads the grid", async () => {
  render(<FoodPage />);

  fireEvent.click(await screen.findByRole("button", { name: /calendar/i }));
  fireEvent.click(screen.getByRole("gridcell", { name: "21" }));

  await waitFor(() => {
    expect(mockRouterPush).toHaveBeenCalledWith(
      expect.stringContaining("day=21"),
    );
  });
});

it("keeps the expanded shell visible while day data is loading and after a fetch failure", async () => {
  render(<FoodPage />);

  expect(await screen.findByText("Food")).toBeTruthy();
  expect(screen.getByText(/loading/i)).toBeTruthy();

  await waitFor(() => {
    expect(screen.getByText(/could not load this day/i)).toBeTruthy();
  });
  expect(screen.getByRole("button", { name: /calendar/i })).toBeTruthy();
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test tests/app/food-page.test.tsx`
Expected: FAIL because the current `/food` page still renders the old quick log.

- [ ] **Step 3: Implement the expanded page composition**

```tsx
// app/food/page.tsx
import { FoodExpandedPageClient } from "@/components/food/food-expanded-page-client";

export default function FoodPage() {
  return <FoodExpandedPageClient />;
}

// components/food/food-expanded-page-client.tsx
"use client";

export function FoodExpandedPageClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const selectedDate = getSelectedFoodDate(searchParams);
  const foodDay = useFoodDayView(getDateParts(selectedDate));
  const inboxCount = foodDay.uncategorizedCount;

  return (
    <FoodExpandedPage
      dayEntries={foodDay.dayEntries}
      selectedDate={selectedDate}
      onSelectDate={(date) =>
        router.push(
          `/food?year=${date.getFullYear()}&month=${date.getMonth() + 1}&day=${date.getDate()}`,
        )
      }
      onAddToSlot={foodDay.addToSlot}
      onSkipSlot={foodDay.skipSlot}
      onUndoSkip={foodDay.undoSkip}
      onRefresh={foodDay.loadDayEntries}
      loading={foodDay.loading}
      error={foodDay.error}
      inboxCount={inboxCount}
      inboxHref="/food/browse"
    />
  );
}
```

Implementation notes:
- keep `app/food/page.tsx` as a thin App Router entry and move `useSearchParams` / `useRouter` into `components/food/food-expanded-page-client.tsx`, with `"use client"` at the top of that file
- keep pure formatting/render helpers and non-hook display pieces server-safe where possible; only the interactive page shell, date routing, and mutations need to be client components
- consume the extracted `useFoodDayView` hook instead of re-embedding fetch/mutation logic in `/food`
- source `Inbox (n)` from an uncategorized-count value exposed by the shared hook, loaded from the existing uncategorized query path
- store the selected day in `/food` search params (`year`, `month`, `day`) so calendar selection is shareable and deterministic
- default to today when search params are absent or invalid
- remove the old full-page quick-log card from `/food`
- render the Concept D breadcrumb/back-to-dashboard link and active date label as part of the required shell
- use inline stacked entries inside meal cards
- wire `Inbox (n)` to the organizer route
- use a compact date picker in `FoodHeaderActions` by reusing the existing `Calendar` + `Popover` pattern already present in the codebase, and update search params when a day is selected
- ensure page-level tests cover add/skip/undo and calendar reload behavior
- keep the shell visible during loading/errors with pane-level placeholder/error content rather than a blank page
- implement the seven-slot grid responsively: desktop uses the multi-column Concept D grid, narrow screens collapse to a single-column stacked layout while preserving header actions

- [ ] **Step 4: Add focused header-actions component tests**

```tsx
it("renders the dashboard breadcrumb and inbox link", () => {
  render(
    <FoodHeaderActions
      selectedDate={new Date("2026-03-20T10:00:00.000Z")}
      inboxCount={4}
      onSelectDate={vi.fn()}
    />,
  );

  expect(screen.getByRole("link", { name: /dashboard/i })).toBeTruthy();
  expect(screen.getByRole("link", { name: /inbox/i })).toHaveAttribute("href", "/food/browse");
});

it("calls onSelectDate when the calendar picks a new day", async () => {
  const onSelectDate = vi.fn();
  render(
    <FoodHeaderActions
      selectedDate={new Date("2026-03-20T10:00:00.000Z")}
      inboxCount={4}
      onSelectDate={onSelectDate}
    />,
  );

  fireEvent.click(screen.getByRole("button", { name: /calendar/i }));
  fireEvent.click(screen.getByRole("gridcell", { name: "21" }));

  expect(onSelectDate).toHaveBeenCalled();
});
```

- [ ] **Step 5: Run the focused tests to verify they pass**

Run:
- `pnpm test tests/components/food/food-header-actions.test.tsx`
- `pnpm test tests/app/food-page.test.tsx`

Expected:
- header-actions test PASS
- page test PASS

- [ ] **Step 6: Commit**

```bash
git add app/food/page.tsx components/food/food-expanded-page.tsx components/food/food-expanded-page-client.tsx components/food/food-header-actions.tsx components/food/food-meal-grid.tsx hooks/use-locale.tsx tests/app/food-page.test.tsx tests/components/food/food-header-actions.test.tsx
git commit -m "feat: rebuild food page as expanded concept d view"
```

## Task 6: Add Shell Loading/Error States and Responsive Layout Verification

**Files:**
- Modify: `components/food/food-expanded-page.tsx`
- Modify: `components/food/food-header-actions.tsx`
- Modify: `tests/app/food-page.test.tsx`

- [ ] **Step 1: Add the failing shell-state and mobile-layout tests**

```tsx
it("renders meal placeholders while day data is loading", async () => {
  render(<FoodPage />);

  expect(await screen.findByText(/loading/i)).toBeTruthy();
  expect(screen.getByText("Food")).toBeTruthy();
});

it("shows a pane-level error while preserving the expanded shell", async () => {
  render(<FoodPage />);

  expect(await screen.findByText(/could not load this day/i)).toBeTruthy();
  expect(screen.getByText("Food")).toBeTruthy();
  expect(screen.getByRole("button", { name: /calendar/i })).toBeTruthy();
});

it("stacks the meal grid on narrow screens without dropping header actions", async () => {
  mockMatchMedia("(max-width: 768px)", true);
  render(<FoodPage />);

  expect(await screen.findByRole("button", { name: /quick add/i })).toBeTruthy();
  expect(screen.getByTestId("food-meal-grid")).toHaveAttribute("data-layout", "stack");
  expect(screen.getByText("Breakfast")).toBeTruthy();
  expect(screen.getByText("Observation")).toBeTruthy();
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test tests/app/food-page.test.tsx`
Expected: FAIL because the expanded shell does not yet include explicit loading/error/mobile assertions.

- [ ] **Step 3: Implement pane-level shell states and responsive grid wiring**

```tsx
<section aria-live="polite">
  {loading ? <FoodMealGridSkeleton /> : null}
  {error ? <p>Could not load this day.</p> : null}
  {!loading && !error ? <FoodMealGrid data-layout={isMobile ? "stack" : "grid"} /> : null}
</section>
```

Implementation notes:
- preserve breadcrumb, date label, and header actions even when data is loading or failed
- use a deterministic responsive marker/class so the layout is testable
- do not fall back to the old quick-log layout on failure

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test tests/app/food-page.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add components/food/food-expanded-page.tsx components/food/food-header-actions.tsx tests/app/food-page.test.tsx
git commit -m "feat: add resilient food shell states"
```

## Task 7: Reuse Shared Day Logic in the Organizer View and Run Full Verification

**Files:**
- Modify: `app/food/browse/page.tsx`
- Modify: `components/food/food-day-state.ts`
- Modify: `hooks/use-food-day-view.ts`
- Test: `tests/app/food-page.test.tsx`
- Test: `tests/components/food/food-meal-slot-card.test.tsx`
- Test: `tests/components/food/food-quick-add.test.tsx`

- [ ] **Step 1: Add the failing regression test for organizer/shared-state interoperability**

```tsx
it("reuses the shared day hook and helpers inside the organizer route", async () => {
  render(<FoodBrowsePage />);

  expect(await screen.findByRole("button", { name: /uncategorized/i })).toBeTruthy();
  expect(await screen.findByText("Breakfast")).toBeTruthy();
  expect(screen.getByText("Observation")).toBeTruthy();
  expect(screen.getByText(/back to food/i)).toBeTruthy();
});
```

- [ ] **Step 2: Run the focused tests to verify the regression is captured**

Run: `pnpm test tests/app/food-page.test.tsx`
Expected: FAIL only if organizer routing or shared behavior regressed while landing the new shell.

- [ ] **Step 3: Deduplicate browse/page logic and finish wiring**

```tsx
const groupedSlots = groupEntriesByMealSlot(dayEntries);
const breakfastState = buildMealSlotState("breakfast", dayEntries);
```

Implementation notes:
- move any reusable day-state shaping out of `app/food/browse/page.tsx`
- keep `/food/browse` focused on uncategorized organization and archive-style navigation
- rename the browse-page back link from the old `Quick Log` wording to `Food` so it matches the new `/food` destination
- preserve the organizer route’s uncategorized button and archive/sidebar-oriented flow after the shared-state extraction
- do not reintroduce duplicated grouping rules in both pages

- [ ] **Step 4: Run verification**

Run:
- `pnpm test tests/components/food/food-meal-slot-card.test.tsx`
- `pnpm test tests/components/food/food-quick-add.test.tsx`
- `pnpm test tests/app/food-page.test.tsx`
- `pnpm test`
- `pnpm typecheck`
- `pnpm build`

Expected:
- focused food tests PASS
- full suite PASS
- typecheck PASS
- build PASS

- [ ] **Step 5: Commit**

```bash
git add app/food/browse/page.tsx components/food/food-day-state.ts tests/app/food-page.test.tsx tests/components/food/food-meal-slot-card.test.tsx tests/components/food/food-quick-add.test.tsx
git commit -m "refactor: share food day view logic across pages"
```
