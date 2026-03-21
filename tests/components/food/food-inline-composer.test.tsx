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
  let postFoodResponse: Response;

  beforeEach(() => {
    vi.clearAllMocks();
    postFoodResponse = makeJsonResponse({ id: "food-1" }, 201);
    global.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input.toString();

      if (url === "/api/food" && init?.method === "POST") {
        return postFoodResponse;
      }

      if (url === "/api/food/food-1" && init?.method === "DELETE") {
        return new Response(null, { status: 204 });
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

  it("surfaces a create failure message", async () => {
    postFoodResponse = makeJsonResponse({ error: "Unable to create food entry" }, 500);

    render(<FoodInlineComposer year={2026} month={3} day={20} />);

    fireEvent.change(screen.getByPlaceholderText(/what are you eating/i), {
      target: { value: "Late lunch" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^log$/i }));

    await waitFor(() => {
      expect(screen.getByText("Unable to create food entry")).toBeTruthy();
    });
  });

  it("rolls back the created entry when upload fails", async () => {
    mockUploadEncryptedImage.mockRejectedValueOnce(new Error("Image upload failed"));

    render(<FoodInlineComposer year={2026} month={3} day={20} />);

    fireEvent.change(screen.getByPlaceholderText(/what are you eating/i), {
      target: { value: "Late lunch" },
    });
    fireEvent.change(screen.getByLabelText(/photo/i), {
      target: {
        files: [new File(["a"], "meal.jpg", { type: "image/jpeg" })],
      },
    });
    fireEvent.click(screen.getByRole("button", { name: /^log$/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/food/food-1",
        expect.objectContaining({ method: "DELETE" }),
      );
    });

    expect(screen.getByText("Image upload failed")).toBeTruthy();
  });

  it("rolls back the created entry when onSaved fails", async () => {
    const onSaved = vi.fn().mockRejectedValue(new Error("Save callback failed"));

    render(<FoodInlineComposer year={2026} month={3} day={20} onSaved={onSaved} />);

    fireEvent.change(screen.getByPlaceholderText(/what are you eating/i), {
      target: { value: "Late lunch" },
    });
    fireEvent.change(screen.getByLabelText(/photo/i), {
      target: {
        files: [new File(["a"], "meal.jpg", { type: "image/jpeg" })],
      },
    });
    fireEvent.click(screen.getByRole("button", { name: /^log$/i }));

    await waitFor(() => {
      expect(onSaved).toHaveBeenCalledWith("food-1");
    });

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/food/food-1",
        expect.objectContaining({ method: "DELETE" }),
      );
    });

    expect(screen.getByText("Save callback failed")).toBeTruthy();
  });
});
