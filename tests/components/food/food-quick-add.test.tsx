// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FoodQuickAdd } from "@/components/food/food-quick-add";
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

describe("FoodQuickAdd", () => {
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

  it("opens from the header action and creates an entry for the selected day", async () => {
    const onSaved = vi.fn();

    render(<FoodQuickAdd year={2026} month={3} day={20} onSaved={onSaved} />);

    fireEvent.click(screen.getByRole("button", { name: /quick add/i }));
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
      expect(onSaved).toHaveBeenCalled();
    });
  });

  it("uploads encrypted images against the created food entry", async () => {
    render(<FoodQuickAdd year={2026} month={3} day={20} onSaved={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: /quick add/i }));
    fireEvent.change(screen.getByLabelText(/photo/i), {
      target: {
        files: [new File(["a"], "meal.jpg", { type: "image/jpeg" })],
      },
    });
    fireEvent.click(screen.getByRole("button", { name: /^log$/i }));

    await waitFor(() => {
      expect(mockUploadEncryptedImage).toHaveBeenCalledWith({
        file: expect.any(File),
        ownerKind: "food",
        ownerId: "food-1",
      });
    });
  });
});
