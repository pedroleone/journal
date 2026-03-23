// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FoodMealSlotCard } from "@/components/food/food-meal-slot-card";

vi.mock("@/components/encrypted-image-gallery", () => ({
  EncryptedImageGallery: ({ imageKeys }: { imageKeys: string[] }) => (
    <div data-testid="encrypted-image-gallery">{imageKeys.join(",")}</div>
  ),
}));

describe("FoodMealSlotCard", () => {
  it("renders a populated single-entry slot with time and actions", () => {
    render(
      <FoodMealSlotCard
        slot="lunch"
        slotLabel="Lunch"
        returnTo="/food?date=2026-03-20&view=day"
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
    expect(screen.getByRole("link", { name: /open/i }).getAttribute("href")).toBe(
      "/food/entry/1?returnTo=%2Ffood%3Fdate%3D2026-03-20%26view%3Dday",
    );
    expect(screen.getByRole("link", { name: /edit/i }).getAttribute("href")).toBe(
      "/food/entry/1?returnTo=%2Ffood%3Fdate%3D2026-03-20%26view%3Dday&edit=true",
    );
    expect(screen.getByTestId("encrypted-image-gallery")).toBeTruthy();
  });

  it("renders multiple inline entries for a filled slot", () => {
    render(
      <FoodMealSlotCard
        slot="breakfast"
        slotLabel="Breakfast"
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
            {
              id: "2",
              content: "Toast",
              logged_at: "2026-03-20T09:00:00.000Z",
              images: null,
              hour: 9,
            },
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
    render(
      <FoodMealSlotCard
        slot="dinner"
        slotLabel="Dinner"
        state={{ kind: "empty", entries: [] }}
        canSkip
      />,
    );

    expect(screen.getByRole("button", { name: /add dinner/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /skip dinner/i })).toBeTruthy();
  });

  it("does not render skip for the observation slot", () => {
    render(
      <FoodMealSlotCard
        slot="observation"
        slotLabel="Observation"
        state={{ kind: "empty", entries: [] }}
        canSkip={false}
      />,
    );

    expect(screen.getByRole("button", { name: /add observation/i })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /skip observation/i })).toBeNull();
  });

  it("renders the skipped state with undo", () => {
    render(
      <FoodMealSlotCard
        slot="morning_snack"
        slotLabel="Morning Snack"
        state={{
          kind: "skipped",
          skippedEntry: {
            id: "skip-1",
            meal_slot: "morning_snack",
            tags: ["skipped"],
          },
          entries: [],
        }}
      />,
    );

    expect(screen.getByText("Skipped")).toBeTruthy();
    expect(screen.getByRole("button", { name: /undo skip morning snack/i })).toBeTruthy();
  });
});
