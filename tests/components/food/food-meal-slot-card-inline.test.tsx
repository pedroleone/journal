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
  }: {
    year: number;
    month: number;
    day: number;
    mealSlot?: string;
  }) => (
    <div
      data-testid="food-inline-composer"
      data-year={year}
      data-month={month}
      data-day={day}
      data-meal-slot={mealSlot ?? ""}
    >
      composer
    </div>
  ),
}));

describe("FoodMealSlotCard inline actions", () => {
  it("opens the inline composer for an empty slot", () => {
    render(
      <FoodMealSlotCard
        slot="lunch"
        slotLabel="Lunch"
        year={2026}
        month={3}
        day={20}
        state={{ kind: "empty", entries: [] }}
      />,
    );

    expect(screen.queryByTestId("food-inline-composer")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /add lunch/i }));

    const composer = screen.getByTestId("food-inline-composer");
    expect(composer.getAttribute("data-year")).toBe("2026");
    expect(composer.getAttribute("data-month")).toBe("3");
    expect(composer.getAttribute("data-day")).toBe("20");
    expect(composer.getAttribute("data-meal-slot")).toBe("lunch");
  });

  it("opens the inline composer from a filled slot append action", () => {
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
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /add another breakfast/i }));

    const composer = screen.getByTestId("food-inline-composer");
    expect(composer.getAttribute("data-year")).toBe("2026");
    expect(composer.getAttribute("data-month")).toBe("3");
    expect(composer.getAttribute("data-day")).toBe("20");
    expect(composer.getAttribute("data-meal-slot")).toBe("breakfast");
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
