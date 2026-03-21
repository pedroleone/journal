// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import FoodPage from "@/app/food/page";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

vi.mock("@/components/encrypted-image-gallery", () => ({
  EncryptedImageGallery: ({ imageKeys }: { imageKeys: string[] }) => (
    <div data-testid="encrypted-image-gallery">{imageKeys.join(",")}</div>
  ),
}));

function makeJsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("FoodPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input.toString();

      if (url.startsWith("/api/food?uncategorized=true")) {
        return makeJsonResponse([
          {
            id: "u1",
            source: "web",
            year: 2026,
            month: 3,
            day: 20,
            hour: 14,
            meal_slot: null,
            content: "Loose apple",
            logged_at: "2026-03-20T14:00:00.000Z",
            images: null,
            tags: null,
          },
          {
            id: "u2",
            source: "web",
            year: 2026,
            month: 3,
            day: 20,
            hour: 16,
            meal_slot: null,
            content: "Protein shake",
            logged_at: "2026-03-20T16:00:00.000Z",
            images: null,
            tags: null,
          },
        ]);
      }

      if (url.startsWith("/api/food?year=")) {
        return makeJsonResponse([
          {
            id: "breakfast-1",
            source: "web",
            year: 2026,
            month: 3,
            day: 20,
            hour: 8,
            meal_slot: "breakfast",
            content: "Eggs",
            logged_at: "2026-03-20T08:00:00.000Z",
            images: null,
            tags: null,
          },
          {
            id: "breakfast-2",
            source: "web",
            year: 2026,
            month: 3,
            day: 20,
            hour: 9,
            meal_slot: "breakfast",
            content: "Toast",
            logged_at: "2026-03-20T09:00:00.000Z",
            images: null,
            tags: null,
          },
          {
            id: "lunch-1",
            source: "web",
            year: 2026,
            month: 3,
            day: 20,
            hour: 12,
            meal_slot: "lunch",
            content: "Chicken bowl",
            logged_at: "2026-03-20T12:45:00.000Z",
            images: ["img-1"],
            tags: null,
          },
          {
            id: "skip-1",
            source: "web",
            year: 2026,
            month: 3,
            day: 20,
            hour: 10,
            meal_slot: "morning_snack",
            content: "",
            logged_at: "2026-03-20T10:00:00.000Z",
            images: null,
            tags: ["skipped"],
          },
        ]);
      }

      if (url === "/api/food" && init?.method === "POST") {
        return makeJsonResponse({ id: "new-food" }, 201);
      }

      if (url === "/api/food/skip-1" && init?.method === "DELETE") {
        return makeJsonResponse({ ok: true });
      }

      throw new Error(`Unhandled fetch: ${url}`);
    }) as typeof fetch;
  });

  it("renders the expanded Concept D food view with header actions and meal slots", async () => {
    render(<FoodPage />);

    expect(await screen.findByRole("link", { name: /dashboard/i })).toBeTruthy();
    expect(screen.getByText("Food")).toBeTruthy();
    expect(screen.getByRole("button", { name: /quick add/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /inbox/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /calendar/i })).toBeTruthy();
    expect(screen.getByText("Breakfast")).toBeTruthy();
    expect(screen.getByText("Morning Snack")).toBeTruthy();
    expect(screen.getByText("Lunch")).toBeTruthy();
    expect(screen.getByText("Dinner")).toBeTruthy();
    expect(screen.getByText("Observation")).toBeTruthy();
  });

  it("renders stacked entries, skipped slots, and encrypted image previews", async () => {
    render(<FoodPage />);

    expect(await screen.findByText("Eggs")).toBeTruthy();
    expect(screen.getByText("Toast")).toBeTruthy();
    expect(screen.getByText("Skipped")).toBeTruthy();
    expect(screen.getByText("Chicken bowl")).toBeTruthy();
    expect(screen.getByTestId("encrypted-image-gallery")).toBeTruthy();
  });

  it("shows the uncategorized inbox count in the header action", async () => {
    render(<FoodPage />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /inbox \(2\)/i })).toBeTruthy();
    });
  });

  it("opens the uncategorized inbox in place instead of navigating away", async () => {
    render(<FoodPage />);

    fireEvent.click(await screen.findByRole("button", { name: /inbox \(2\)/i }));

    expect(await screen.findByText(/uncategorized entries/i)).toBeTruthy();
    expect(screen.getByText("Loose apple")).toBeTruthy();
    expect(screen.queryByText("Breakfast")).toBeNull();
  });

  it("wires add and skip actions to the live page behavior", async () => {
    render(<FoodPage />);

    fireEvent.click(await screen.findByRole("button", { name: /add dinner/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/food",
        expect.objectContaining({
          method: "POST",
        }),
      );
    });
    expect(mockPush).toHaveBeenCalledWith("/food/entry/new-food?edit=true");

    fireEvent.click(screen.getByRole("button", { name: /undo skip morning snack/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/food/skip-1",
        expect.objectContaining({
          method: "DELETE",
        }),
      );
    });
  });
});
