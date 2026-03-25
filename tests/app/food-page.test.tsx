// @vitest-environment jsdom

import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import FoodPage from "@/app/food/page";

type FoodEntryView = {
  id: string;
  source: "web";
  year: number;
  month: number;
  day: number;
  hour: number | null;
  meal_slot: string | null;
  content: string;
  logged_at: string;
  images: string[] | null;
  tags: string[] | null;
};

let testBaseDate: Date;
let dayEntriesByDate: Map<string, FoodEntryView[]>;
let uncategorizedEntries: FoodEntryView[];
let searchParamsValue = "";
let failingDayKeys: Set<string>;
let rejectedDayKeys: Set<string>;
let delayedDeleteIds: Set<string>;
let deleteResolvers: Map<string, () => void>;
let delayedDayKeys: Set<string>;
let dayResolvers: Map<string, () => void>;
let delayedAssignIds: Set<string>;
let assignResolvers: Map<string, () => void>;
const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(searchParamsValue),
  usePathname: () => "/food",
  useRouter: () => ({ replace }),
}));

vi.mock("@/components/encrypted-image-gallery", () => ({
  EncryptedImageGallery: ({ imageKeys }: { imageKeys: string[] }) => (
    <div data-testid="encrypted-image-gallery">{imageKeys.join(",")}</div>
  ),
}));

vi.mock("@/hooks/use-media-query", () => ({
  useMediaQuery: () => false,
}));

vi.mock("@/components/food/food-meal-slot-card", () => ({
  FoodMealSlotCard: ({
    slot,
    slotLabel,
    state,
    year,
    month,
    day,
    onSkip,
    onUndoSkip,
    onDeleteEntry,
    onEntrySaved,
  }: {
    slot: string;
    slotLabel: string;
    state: {
      kind: "empty" | "filled" | "skipped";
      entries: Array<{ id: string; content: string }>;
      skippedEntry?: { id: string };
    };
    year?: number;
    month?: number;
    day?: number;
    onSkip?: () => void;
    onUndoSkip?: () => void;
    onDeleteEntry?: (entryId: string) => void | Promise<void>;
    onEntrySaved?: (entryId: string) => void | Promise<void>;
  }) => (
    <section data-testid={`meal-slot-${slot}`}>
      <h2>{slotLabel}</h2>
      <div>{`${year}-${month}-${day}`}</div>
      <div>{state.kind}</div>
      {state.entries.map((entry) => (
        <div key={entry.id}>{entry.content}</div>
      ))}
      {state.kind === "empty" ? (
        <button
          type="button"
          onClick={() => void onEntrySaved?.(`${slot}-saved`)}
        >
          {`Save ${slotLabel}`}
        </button>
      ) : null}
      {state.kind === "filled" && state.entries[0] ? (
        <button type="button" onClick={() => void onDeleteEntry?.(state.entries[0].id)}>
          {`Delete ${slotLabel}`}
        </button>
      ) : null}
      {slot !== "observation" ? (
        <button type="button" onClick={onSkip}>
          {`Skip ${slotLabel}`}
        </button>
      ) : null}
      {state.kind === "skipped" && state.skippedEntry ? (
        <button type="button" onClick={onUndoSkip}>
          {`Undo ${slotLabel}`}
        </button>
      ) : null}
    </section>
  ),
}));

function makeJsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function makeEntry(
  overrides: Partial<FoodEntryView> & Pick<FoodEntryView, "id" | "content" | "year" | "month" | "day">,
): FoodEntryView {
  return {
    source: "web",
    hour: 8,
    meal_slot: "breakfast",
    logged_at: `${overrides.year}-${String(overrides.month).padStart(2, "0")}-${String(
      overrides.day,
    ).padStart(2, "0")}T08:00:00.000Z`,
    images: null,
    tags: null,
    ...overrides,
  };
}

function formatDateForExpectation(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

describe("FoodPage", () => {
  beforeEach(() => {
    searchParamsValue = "";
    failingDayKeys = new Set();
    rejectedDayKeys = new Set();
    delayedDeleteIds = new Set();
    deleteResolvers = new Map();
    delayedDayKeys = new Set();
    dayResolvers = new Map();
    delayedAssignIds = new Set();
    assignResolvers = new Map();
    vi.clearAllMocks();
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation(() => ({
        matches: true,
        media: "",
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    testBaseDate = new Date();
    const previousDate = new Date(testBaseDate);
    previousDate.setDate(testBaseDate.getDate() - 1);
    const nextDate = new Date(testBaseDate);
    nextDate.setDate(testBaseDate.getDate() + 1);
    const baseKey = `${testBaseDate.getFullYear()}-${testBaseDate.getMonth() + 1}-${testBaseDate.getDate()}`;
    const previousKey = `${previousDate.getFullYear()}-${previousDate.getMonth() + 1}-${previousDate.getDate()}`;
    const nextKey = `${nextDate.getFullYear()}-${nextDate.getMonth() + 1}-${nextDate.getDate()}`;

    dayEntriesByDate = new Map<string, FoodEntryView[]>([
      [
        baseKey,
        [
          makeEntry({
            id: "breakfast-1",
            year: testBaseDate.getFullYear(),
            month: testBaseDate.getMonth() + 1,
            day: testBaseDate.getDate(),
            content: "Eggs",
            meal_slot: "breakfast",
          }),
          makeEntry({
            id: "lunch-1",
            year: testBaseDate.getFullYear(),
            month: testBaseDate.getMonth() + 1,
            day: testBaseDate.getDate(),
            content: "Chicken bowl",
            hour: 12,
            meal_slot: "lunch",
            images: ["img-1"],
          }),
          makeEntry({
            id: "skip-1",
            year: testBaseDate.getFullYear(),
            month: testBaseDate.getMonth() + 1,
            day: testBaseDate.getDate(),
            content: "",
            hour: 10,
            meal_slot: "morning_snack",
            tags: ["skipped"],
          }),
        ],
      ],
      [
        previousKey,
        [
          makeEntry({
            id: "prev-breakfast",
            year: previousDate.getFullYear(),
            month: previousDate.getMonth() + 1,
            day: previousDate.getDate(),
            content: "Previous oats",
            meal_slot: "breakfast",
          }),
        ],
      ],
      [
        nextKey,
        [
          makeEntry({
            id: "next-breakfast",
            year: nextDate.getFullYear(),
            month: nextDate.getMonth() + 1,
            day: nextDate.getDate(),
            content: "Next pancakes",
            meal_slot: "breakfast",
          }),
        ],
      ],
    ]);

    uncategorizedEntries = [
      makeEntry({
        id: "u1",
        year: testBaseDate.getFullYear(),
        month: testBaseDate.getMonth() + 1,
        day: testBaseDate.getDate(),
        content: "Loose apple",
        hour: 14,
        meal_slot: null,
        logged_at: `${testBaseDate.getFullYear()}-${String(testBaseDate.getMonth() + 1).padStart(2, "0")}-${String(
          testBaseDate.getDate(),
        ).padStart(2, "0")}T14:00:00.000Z`,
      }),
      makeEntry({
        id: "u2",
        year: testBaseDate.getFullYear(),
        month: testBaseDate.getMonth() + 1,
        day: testBaseDate.getDate(),
        content: "Protein shake",
        hour: 16,
        meal_slot: null,
        logged_at: `${testBaseDate.getFullYear()}-${String(testBaseDate.getMonth() + 1).padStart(2, "0")}-${String(
          testBaseDate.getDate(),
        ).padStart(2, "0")}T16:00:00.000Z`,
      }),
    ];

    global.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input.toString();

      if (url.startsWith("/api/food?uncategorized=true")) {
        return makeJsonResponse(uncategorizedEntries);
      }

      if (url.startsWith("/api/food?year=")) {
        const params = new URLSearchParams(url.split("?")[1]);
        const key = `${params.get("year")}-${params.get("month")}-${params.get("day")}`;
        if (rejectedDayKeys.has(key)) {
          throw new Error("Network failure");
        }
        if (delayedDayKeys.has(key)) {
          return await new Promise<Response>((resolve) => {
            dayResolvers.set(key, () => resolve(makeJsonResponse(dayEntriesByDate.get(key) ?? [])));
          });
        }
        if (failingDayKeys.has(key)) {
          return makeJsonResponse({ error: "Failed" }, 500);
        }
        return makeJsonResponse(dayEntriesByDate.get(key) ?? []);
      }

      if (url === "/api/food" && init?.method === "POST") {
        const body = JSON.parse(String(init.body)) as {
          meal_slot?: string;
          year: number;
          month: number;
          day: number;
          tags?: string[];
        };
        const key = `${body.year}-${body.month}-${body.day}`;
        const current = dayEntriesByDate.get(key) ?? [];

        if (body.tags?.includes("skipped")) {
          dayEntriesByDate.set(key, [
            makeEntry({
              id: `${body.meal_slot}-skip-new`,
              year: body.year,
              month: body.month,
              day: body.day,
              content: "",
              meal_slot: body.meal_slot ?? null,
              tags: ["skipped"],
            }),
            ...current,
          ]);
        } else {
          dayEntriesByDate.set(key, [
            makeEntry({
              id: `${body.meal_slot}-saved`,
              year: body.year,
              month: body.month,
              day: body.day,
              content: `Saved ${body.meal_slot}`,
              meal_slot: body.meal_slot ?? null,
            }),
            ...current,
          ]);
        }

        return makeJsonResponse({ id: "new-food" }, 201);
      }

      if (url === "/api/food/breakfast-1" && init?.method === "DELETE") {
        const key = baseKey;
        if (delayedDeleteIds.has("breakfast-1")) {
          return await new Promise<Response>((resolve) => {
            deleteResolvers.set("breakfast-1", () => {
              dayEntriesByDate.set(
                key,
                (dayEntriesByDate.get(key) ?? []).filter((entry) => entry.id !== "breakfast-1"),
              );
              resolve(makeJsonResponse({ ok: true }));
            });
          });
        }
        dayEntriesByDate.set(
          key,
          (dayEntriesByDate.get(key) ?? []).filter((entry) => entry.id !== "breakfast-1"),
        );
        return makeJsonResponse({ ok: true });
      }

      if (url === "/api/food/skip-1" && init?.method === "DELETE") {
        const key = baseKey;
        dayEntriesByDate.set(
          key,
          (dayEntriesByDate.get(key) ?? []).filter((entry) => entry.id !== "skip-1"),
        );
        return makeJsonResponse({ ok: true });
      }

      if (url === "/api/food/u1/assign" && init?.method === "PATCH") {
        const body = JSON.parse(String(init.body)) as {
          year: number;
          month: number;
          day: number;
          meal_slot: string | null;
        };
        if (delayedAssignIds.has("u1")) {
          return await new Promise<Response>((resolve) => {
            assignResolvers.set("u1", () => {
              uncategorizedEntries = uncategorizedEntries.filter((entry) => entry.id !== "u1");
              const key = `${body.year}-${body.month}-${body.day}`;
              dayEntriesByDate.set(key, [
                makeEntry({
                  id: "assigned-u1",
                  year: body.year,
                  month: body.month,
                  day: body.day,
                  content: "Loose apple",
                  meal_slot: body.meal_slot,
                  hour: 14,
                }),
                ...(dayEntriesByDate.get(key) ?? []),
              ]);
              resolve(makeJsonResponse({ ok: true }));
            });
          });
        }
        uncategorizedEntries = uncategorizedEntries.filter((entry) => entry.id !== "u1");
        const key = `${body.year}-${body.month}-${body.day}`;
        dayEntriesByDate.set(key, [
          makeEntry({
            id: "assigned-u1",
            year: body.year,
            month: body.month,
            day: body.day,
            content: "Loose apple",
            meal_slot: body.meal_slot,
            hour: 14,
          }),
          ...(dayEntriesByDate.get(key) ?? []),
        ]);
        return makeJsonResponse({ ok: true });
      }

      if (url === "/api/food/u1" && init?.method === "DELETE") {
        if (delayedDeleteIds.has("u1")) {
          return await new Promise<Response>((resolve) => {
            deleteResolvers.set("u1", () => {
              uncategorizedEntries = uncategorizedEntries.filter((entry) => entry.id !== "u1");
              resolve(makeJsonResponse({ ok: true }));
            });
          });
        }
        uncategorizedEntries = uncategorizedEntries.filter((entry) => entry.id !== "u1");
        return makeJsonResponse({ ok: true });
      }

      throw new Error(`Unhandled fetch: ${url}`);
    }) as typeof fetch;
  });

  it("renders the unified day workspace with breadcrumb shell and day controls", async () => {
    render(<FoodPage />);

    expect(await screen.findByRole("button", { name: /quick add/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /inbox \(2\)/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /previous day/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /next day/i })).toBeTruthy();
    expect(screen.getByLabelText(/jump to date/i)).toBeTruthy();
    expect(screen.getByText("Breakfast")).toBeTruthy();
    expect(screen.getByText("Morning Snack")).toBeTruthy();
    expect(screen.getByText("Lunch")).toBeTruthy();
    expect(screen.getByText("Dinner")).toBeTruthy();
    expect(screen.getByText("Observation")).toBeTruthy();
  });

  it("loads adjacent days from previous and next navigation", async () => {
    const previousDate = new Date(testBaseDate);
    previousDate.setDate(testBaseDate.getDate() - 1);
    const nextDate = new Date(testBaseDate);
    nextDate.setDate(testBaseDate.getDate() + 1);

    render(<FoodPage />);

    expect(await screen.findByText("Eggs")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /previous day/i }));

    expect(await screen.findByText("Previous oats")).toBeTruthy();
    await waitFor(() => {
      expect(replace).toHaveBeenLastCalledWith(
        `/food?date=${previousDate.getFullYear()}-${String(previousDate.getMonth() + 1).padStart(2, "0")}-${String(previousDate.getDate()).padStart(2, "0")}&view=day`,
        { scroll: false },
      );
      expect(fetch).toHaveBeenCalledWith(
        `/api/food?year=${previousDate.getFullYear()}&month=${previousDate.getMonth() + 1}&day=${previousDate.getDate()}`,
      );
    });

    fireEvent.click(screen.getByRole("button", { name: /next day/i }));
    fireEvent.click(screen.getByRole("button", { name: /next day/i }));

    expect(await screen.findByText("Next pancakes")).toBeTruthy();
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        `/api/food?year=${nextDate.getFullYear()}&month=${nextDate.getMonth() + 1}&day=${nextDate.getDate()}`,
      );
    });
  });

  it("supports direct date jump from the page workspace", async () => {
    const nextDate = new Date(testBaseDate);
    nextDate.setDate(testBaseDate.getDate() + 1);
    const nextValue = [
      nextDate.getFullYear(),
      String(nextDate.getMonth() + 1).padStart(2, "0"),
      String(nextDate.getDate()).padStart(2, "0"),
    ].join("-");

    render(<FoodPage />);

    await screen.findByText("Eggs");

    fireEvent.change(screen.getByLabelText(/jump to date/i), {
      target: { value: nextValue },
    });

    expect(await screen.findByText("Next pancakes")).toBeTruthy();
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        `/api/food?year=${nextDate.getFullYear()}&month=${nextDate.getMonth() + 1}&day=${nextDate.getDate()}`,
      );
    });
  });

  it("uses the calendar action to focus the date jump control", async () => {
    render(<FoodPage />);

    const jumpInput = screen.getByLabelText(/jump to date/i);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /select date/i }));
    });

    expect(document.activeElement).toBe(jumpInput);
  });

  it("opens inbox mode in place and returns to day mode without route navigation", async () => {
    render(<FoodPage />);

    fireEvent.click(await screen.findByRole("button", { name: /inbox \(2\)/i }));

    expect(await screen.findByText(/uncategorized entries/i)).toBeTruthy();
    expect(screen.getByText("Loose apple")).toBeTruthy();
    expect(screen.getByRole("button", { name: /day view/i })).toBeTruthy();
    expect(screen.queryByTestId("meal-slot-breakfast")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /day view/i }));

    expect(await screen.findByTestId("meal-slot-breakfast")).toBeTruthy();
    expect(screen.queryByText(/uncategorized entries/i)).toBeNull();
  });

  it("refreshes the visible day in place after inline slot save and delete callbacks", async () => {
    render(<FoodPage />);

    expect(await screen.findByText("Eggs")).toBeTruthy();

    const baseKey = `${testBaseDate.getFullYear()}-${testBaseDate.getMonth() + 1}-${testBaseDate.getDate()}`;
    dayEntriesByDate.set(baseKey, [
      makeEntry({
        id: "dinner-saved",
        year: testBaseDate.getFullYear(),
        month: testBaseDate.getMonth() + 1,
        day: testBaseDate.getDate(),
        content: "Saved dinner",
        hour: 19,
        meal_slot: "dinner",
      }),
      ...(dayEntriesByDate.get(baseKey) ?? []),
    ]);
    fireEvent.click(screen.getByRole("button", { name: /save dinner/i }));

    expect(await screen.findByText("Saved dinner")).toBeTruthy();
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        `/api/food?year=${testBaseDate.getFullYear()}&month=${testBaseDate.getMonth() + 1}&day=${testBaseDate.getDate()}`,
      );
    });

    fireEvent.click(screen.getByRole("button", { name: /delete breakfast/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/food/breakfast-1",
        expect.objectContaining({ method: "DELETE" }),
      );
    });
    await waitFor(() => {
      expect(screen.queryByText("Eggs")).toBeNull();
    });
  });

  it("keeps organizer actions inside inbox mode and refreshes inbox and day state in place", async () => {
    render(<FoodPage />);

    fireEvent.click(await screen.findByRole("button", { name: /inbox \(2\)/i }));
    await screen.findByText(/uncategorized entries/i);
    expect(
      screen.getByRole("button", { name: /assign loose apple to selected day/i }).hasAttribute(
        "disabled",
      ),
    ).toBe(true);
    fireEvent.change(screen.getByLabelText(/meal slot loose apple/i), {
      target: { value: "afternoon_snack" },
    });
    fireEvent.click(await screen.findByRole("button", { name: /assign loose apple to selected day/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/food/u1/assign",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({
            year: testBaseDate.getFullYear(),
            month: testBaseDate.getMonth() + 1,
            day: testBaseDate.getDate(),
            meal_slot: "afternoon_snack",
          }),
        }),
      );
    });
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /inbox \(1\)/i })).toBeTruthy();
    });
    expect(screen.queryByText("Loose apple")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /day view/i }));

    expect(await screen.findByText("Loose apple")).toBeTruthy();
  });

  it("disables inbox assignment while the organizer request is in flight", async () => {
    delayedAssignIds.add("u1");
    render(<FoodPage />);

    fireEvent.click(await screen.findByRole("button", { name: /inbox \(2\)/i }));
    await screen.findByText(/uncategorized entries/i);
    fireEvent.change(screen.getByLabelText(/meal slot loose apple/i), {
      target: { value: "afternoon_snack" },
    });

    const assignButton = screen.getByRole("button", { name: /assign loose apple to selected day/i });
    fireEvent.click(assignButton);

    expect(assignButton.hasAttribute("disabled")).toBe(true);
    expect(
      screen.getByRole("button", { name: /assign protein shake to selected day/i }).hasAttribute(
        "disabled",
      ),
    ).toBe(true);
    expect(
      (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls.filter(
        ([url, init]) => url === "/api/food/u1/assign" && init?.method === "PATCH",
      ),
    ).toHaveLength(1);

    assignResolvers.get("u1")?.();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /inbox \(1\)/i })).toBeTruthy();
    });
  });

  it("supports inline inbox deletion with a dialog confirmation and in-place refresh", async () => {
    render(<FoodPage />);

    fireEvent.click(await screen.findByRole("button", { name: /inbox \(2\)/i }));
    await screen.findByText(/uncategorized entries/i);

    fireEvent.click(screen.getByRole("button", { name: /delete loose apple/i }));
    expect(screen.getByRole("alertdialog")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /^delete$/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/food/u1",
        expect.objectContaining({ method: "DELETE" }),
      );
    });
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /inbox \(1\)/i })).toBeTruthy();
    });
    expect(screen.queryByText("Loose apple")).toBeNull();
  });

  it("completes inbox delete through the confirmation dialog", async () => {
    delayedDeleteIds.add("u1");
    render(<FoodPage />);

    fireEvent.click(await screen.findByRole("button", { name: /inbox \(2\)/i }));
    await screen.findByText(/uncategorized entries/i);

    fireEvent.click(screen.getByRole("button", { name: /delete loose apple/i }));
    fireEvent.click(screen.getByRole("button", { name: /^delete$/i }));

    expect(
      (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls.filter(
        ([url, init]) => url === "/api/food/u1" && init?.method === "DELETE",
      ),
    ).toHaveLength(1);

    deleteResolvers.get("u1")?.();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /inbox \(1\)/i })).toBeTruthy();
    });
  });

  it("restores a dated inbox workspace from search params and preserves that return target on open", async () => {
    const previousDate = new Date(testBaseDate);
    previousDate.setDate(testBaseDate.getDate() - 1);
    searchParamsValue = `date=${previousDate.getFullYear()}-${String(previousDate.getMonth() + 1).padStart(2, "0")}-${String(previousDate.getDate()).padStart(2, "0")}&view=inbox`;

    render(<FoodPage />);

    expect(await screen.findByText(/uncategorized entries/i)).toBeTruthy();
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        `/api/food?year=${previousDate.getFullYear()}&month=${previousDate.getMonth() + 1}&day=${previousDate.getDate()}`,
      );
    });

    const openLink = screen.getAllByRole("link", { name: /open/i })[0];
    expect(openLink.getAttribute("href")).toBe(
      `/food/entry/u1?returnTo=${encodeURIComponent(
        `/food?date=${searchParamsValue.split("&")[0].slice(5)}&view=inbox`,
      )}`,
    );
  });

  it("adopts incoming query changes after mount instead of rewriting them back to the previous state", async () => {
    const { rerender } = render(<FoodPage />);

    expect(await screen.findByText("Eggs")).toBeTruthy();

    const previousDate = new Date(testBaseDate);
    previousDate.setDate(testBaseDate.getDate() - 1);
    searchParamsValue = `date=${previousDate.getFullYear()}-${String(previousDate.getMonth() + 1).padStart(2, "0")}-${String(previousDate.getDate()).padStart(2, "0")}&view=inbox`;
    replace.mockClear();

    rerender(<FoodPage />);

    expect(await screen.findByText(/uncategorized entries/i)).toBeTruthy();
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        `/api/food?year=${previousDate.getFullYear()}&month=${previousDate.getMonth() + 1}&day=${previousDate.getDate()}`,
      );
    });
    expect(replace).not.toHaveBeenCalledWith(
      `/food?date=${formatDateForExpectation(testBaseDate)}&view=day`,
      { scroll: false },
    );
  });

  it("preserves an externally provided partial query without canonicalizing it immediately", async () => {
    const { rerender } = render(<FoodPage />);

    expect(await screen.findByText("Eggs")).toBeTruthy();

    const previousDate = new Date(testBaseDate);
    previousDate.setDate(testBaseDate.getDate() - 1);
    searchParamsValue = `date=${formatDateForExpectation(previousDate)}`;
    replace.mockClear();

    rerender(<FoodPage />);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        `/api/food?year=${previousDate.getFullYear()}&month=${previousDate.getMonth() + 1}&day=${previousDate.getDate()}`,
      );
    });
    expect(replace).not.toHaveBeenCalledWith(
      `/food?date=${formatDateForExpectation(previousDate)}&view=day`,
      { scroll: false },
    );
  });

  it("preserves the current day when an external query only changes inbox view", async () => {
    const previousDate = new Date(testBaseDate);
    previousDate.setDate(testBaseDate.getDate() - 1);
    searchParamsValue = `date=${formatDateForExpectation(previousDate)}&view=day`;
    const { rerender } = render(<FoodPage />);

    expect(await screen.findByText("Previous oats")).toBeTruthy();

    searchParamsValue = "view=inbox";
    replace.mockClear();
    rerender(<FoodPage />);

    expect(await screen.findByText(/uncategorized entries/i)).toBeTruthy();
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        `/api/food?year=${previousDate.getFullYear()}&month=${previousDate.getMonth() + 1}&day=${previousDate.getDate()}`,
      );
    });
    expect(replace).not.toHaveBeenCalledWith(
      `/food?date=${formatDateForExpectation(testBaseDate)}&view=inbox`,
      { scroll: false },
    );
  });

  it("clears stale day entries when a day fetch fails after navigation", async () => {
    const nextDate = new Date(testBaseDate);
    nextDate.setDate(testBaseDate.getDate() + 1);
    const nextKey = `${nextDate.getFullYear()}-${nextDate.getMonth() + 1}-${nextDate.getDate()}`;
    failingDayKeys.add(nextKey);

    render(<FoodPage />);

    expect(await screen.findByText("Eggs")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /next day/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        `/api/food?year=${nextDate.getFullYear()}&month=${nextDate.getMonth() + 1}&day=${nextDate.getDate()}`,
      );
    });
    await waitFor(() => {
      expect(screen.queryByText("Eggs")).toBeNull();
    });
  });

  it("clears stale day entries when a day fetch rejects after navigation", async () => {
    const nextDate = new Date(testBaseDate);
    nextDate.setDate(testBaseDate.getDate() + 1);
    const nextKey = `${nextDate.getFullYear()}-${nextDate.getMonth() + 1}-${nextDate.getDate()}`;
    rejectedDayKeys.add(nextKey);

    render(<FoodPage />);

    expect(await screen.findByText("Eggs")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /next day/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        `/api/food?year=${nextDate.getFullYear()}&month=${nextDate.getMonth() + 1}&day=${nextDate.getDate()}`,
      );
    });
    await waitFor(() => {
      expect(screen.queryByText("Eggs")).toBeNull();
    });
  });

  it("shows a loading gate instead of stale entries while a new day is still loading", async () => {
    const nextDate = new Date(testBaseDate);
    nextDate.setDate(testBaseDate.getDate() + 1);
    const nextKey = `${nextDate.getFullYear()}-${nextDate.getMonth() + 1}-${nextDate.getDate()}`;
    delayedDayKeys.add(nextKey);

    render(<FoodPage />);

    expect(await screen.findByText("Eggs")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /next day/i }));

    expect(screen.getByText("Loading...")).toBeTruthy();
    expect(screen.queryByText("Eggs")).toBeNull();

    dayResolvers.get(nextKey)?.();

    expect(await screen.findByText("Next pancakes")).toBeTruthy();
  });

  it("keeps the currently visible day when a prior-day mutation resolves after navigation", async () => {
    delayedDeleteIds.add("breakfast-1");

    render(<FoodPage />);

    expect(await screen.findByText("Eggs")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /delete breakfast/i }));
    fireEvent.click(screen.getByRole("button", { name: /next day/i }));

    expect(await screen.findByText("Next pancakes")).toBeTruthy();

    deleteResolvers.get("breakfast-1")?.();

    await waitFor(() => {
      expect(screen.getByText("Next pancakes")).toBeTruthy();
    });
    expect(screen.queryByText("Eggs")).toBeNull();
  });

  it("renders richer inbox context for photo-only uncategorized items", async () => {
    uncategorizedEntries = [
      {
        ...uncategorizedEntries[0],
        content: "",
        images: ["img-2"],
      },
    ];

    render(<FoodPage />);

    fireEvent.click(await screen.findByRole("button", { name: /inbox \(1\)/i }));
    await screen.findByText(/uncategorized entries/i);

    expect(await screen.findByText("Photo entry")).toBeTruthy();
    expect(screen.getByTestId("encrypted-image-gallery")).toBeTruthy();
  });
});
