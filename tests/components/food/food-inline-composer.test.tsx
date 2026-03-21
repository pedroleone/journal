// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FoodInlineComposer } from "@/components/food/food-inline-composer";
import { uploadEncryptedImage } from "@/lib/client-images";

vi.mock("@/lib/client-images", () => ({
  uploadEncryptedImage: vi.fn(),
}));

const mockUploadEncryptedImage = vi.mocked(uploadEncryptedImage);

function makeJsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("FoodInlineComposer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input.toString();

      if (url === "/api/food" && init?.method === "POST") {
        return makeJsonResponse({ id: "food-1" }, 201);
      }

      throw new Error(`Unhandled fetch: ${url}`);
    }) as typeof fetch;
    mockUploadEncryptedImage.mockResolvedValue({ key: "img-1", images: ["img-1"] });
  });

  it("creates an uncategorized entry for the selected day", async () => {
    const onSaved = vi.fn();

    render(<FoodInlineComposer year={2026} month={3} day={20} onSaved={onSaved} />);

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
            day: 20,
          }),
        }),
      );
    });

    await waitFor(() => {
      expect(onSaved).toHaveBeenCalledWith("food-1");
    });
  });

  it("includes meal_slot when provided", async () => {
    const onSaved = vi.fn();

    render(
      <FoodInlineComposer
        year={2026}
        month={3}
        day={20}
        mealSlot="lunch"
        onSaved={onSaved}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText(/what are you eating/i), {
      target: { value: "Sandwich" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^log$/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/food",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            content: "Sandwich",
            images: [],
            year: 2026,
            month: 3,
            day: 20,
            meal_slot: "lunch",
          }),
        }),
      );
    });

    await waitFor(() => {
      expect(onSaved).toHaveBeenCalledWith("food-1");
    });
  });
});
