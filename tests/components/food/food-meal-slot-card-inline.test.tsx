// @vitest-environment jsdom

import { fireEvent, render, screen, within, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FoodMealSlotCard } from "@/components/food/food-meal-slot-card";

vi.mock("@/components/encrypted-image-gallery", () => ({
  EncryptedImageGallery: ({ imageKeys }: { imageKeys: string[] }) => (
    <div data-testid="encrypted-image-gallery">{imageKeys.join(",")}</div>
  ),
}));

vi.mock("@/components/food/food-inline-composer", () => ({
  FoodInlineComposer: ({
    year,
    month,
    day,
    mealSlot,
    onSaved,
  }: {
    year: number;
    month: number;
    day: number;
    mealSlot?: string;
    onSaved?: (entryId: string) => void | Promise<void>;
  }) => (
    <div
      data-testid="food-inline-composer"
      data-year={year}
      data-month={month}
      data-day={day}
      data-meal-slot={mealSlot ?? ""}
    >
      composer
      <button
        type="button"
        onClick={() => {
          void Promise.resolve(onSaved?.("saved-entry-1")).catch(() => {});
        }}
      >
        Finish Save
      </button>
    </div>
  ),
}));

describe("FoodMealSlotCard inline actions", () => {
  it("opens the inline composer for an empty slot", async () => {
    const onEntrySaved = vi.fn();

    render(
      <FoodMealSlotCard
        slot="lunch"
        slotLabel="Lunch"
        year={2026}
        month={3}
        day={20}
        state={{ kind: "empty", entries: [] }}
        onEntrySaved={onEntrySaved}
      />,
    );

    expect(screen.queryByTestId("food-inline-composer")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /add lunch/i }));

    const composer = screen.getByTestId("food-inline-composer");
    expect(composer.getAttribute("data-year")).toBe("2026");
    expect(composer.getAttribute("data-month")).toBe("3");
    expect(composer.getAttribute("data-day")).toBe("20");
    expect(composer.getAttribute("data-meal-slot")).toBe("lunch");

    fireEvent.click(screen.getByRole("button", { name: /finish save/i }));

    await waitFor(() => {
      expect(screen.queryByTestId("food-inline-composer")).toBeNull();
    });
    expect(onEntrySaved).toHaveBeenCalledWith("saved-entry-1");
  });

  it("opens the inline composer from a filled slot append action", async () => {
    const onEntrySaved = vi.fn();

    render(
      <FoodMealSlotCard
        slot="breakfast"
        slotLabel="Breakfast"
        year={2026}
        month={3}
        day={20}
        state={{
          kind: "filled",
          entries: [
            {
              id: "1",
              content: "Eggs",
              logged_at: "2026-03-20T08:00:00.000Z",
              images: null,
              hour: 8,
            },
          ],
        }}
        onEntrySaved={onEntrySaved}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /add another breakfast/i }));

    const composer = screen.getByTestId("food-inline-composer");
    expect(composer.getAttribute("data-year")).toBe("2026");
    expect(composer.getAttribute("data-month")).toBe("3");
    expect(composer.getAttribute("data-day")).toBe("20");
    expect(composer.getAttribute("data-meal-slot")).toBe("breakfast");

    fireEvent.click(screen.getByRole("button", { name: /finish save/i }));

    await waitFor(() => {
      expect(screen.queryByTestId("food-inline-composer")).toBeNull();
    });
    expect(onEntrySaved).toHaveBeenCalledWith("saved-entry-1");
  });

  it("keeps the inline composer open when the parent save callback rejects", async () => {
    const onEntrySaved = vi.fn().mockRejectedValue(new Error("Refresh failed"));

    render(
      <FoodMealSlotCard
        slot="breakfast"
        slotLabel="Breakfast"
        year={2026}
        month={3}
        day={20}
        state={{
          kind: "filled",
          entries: [
            {
              id: "1",
              content: "Eggs",
              logged_at: "2026-03-20T08:00:00.000Z",
              images: null,
              hour: 8,
            },
          ],
        }}
        onEntrySaved={onEntrySaved}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /add another breakfast/i }));
    fireEvent.click(screen.getByRole("button", { name: /finish save/i }));

    await waitFor(() => {
      expect(onEntrySaved).toHaveBeenCalledWith("saved-entry-1");
    });
    expect(screen.getByTestId("food-inline-composer")).toBeTruthy();
  });

  it("keeps delete confirmation local to a single entry row", async () => {
    const onDeleteEntry = vi.fn().mockResolvedValue(undefined);

    render(
      <FoodMealSlotCard
        slot="dinner"
        slotLabel="Dinner"
        year={2026}
        month={3}
        day={20}
        onDeleteEntry={onDeleteEntry}
        state={{
          kind: "filled",
          entries: [
            {
              id: "1",
              content: "Soup",
              logged_at: "2026-03-20T18:00:00.000Z",
              images: null,
              hour: 18,
            },
            {
              id: "2",
              content: "Salad",
              logged_at: "2026-03-20T19:00:00.000Z",
              images: null,
              hour: 19,
            },
          ],
        }}
      />,
    );

    const firstRow = screen.getByText("Soup").closest("article");
    const secondRow = screen.getByText("Salad").closest("article");

    expect(firstRow).not.toBeNull();
    expect(secondRow).not.toBeNull();

    fireEvent.click(within(firstRow as HTMLElement).getByRole("button", { name: /delete entry/i }));

    expect(within(firstRow as HTMLElement).getByRole("button", { name: /^delete$/i })).toBeTruthy();
    expect(within(firstRow as HTMLElement).getByRole("button", { name: /cancel/i })).toBeTruthy();
    expect(within(secondRow as HTMLElement).getByRole("button", { name: /delete entry/i })).toBeTruthy();

    fireEvent.click(within(firstRow as HTMLElement).getByRole("button", { name: /cancel/i }));
    expect(onDeleteEntry).not.toHaveBeenCalled();

    fireEvent.click(within(firstRow as HTMLElement).getByRole("button", { name: /delete entry/i }));
    fireEvent.click(within(firstRow as HTMLElement).getByRole("button", { name: /^delete$/i }));

    await waitFor(() => {
      expect(onDeleteEntry).toHaveBeenCalledWith("1");
    });
  });
});
