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

  it("shows an upload failure without deleting the created entry", async () => {
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
      expect(screen.getByText("Image upload failed")).toBeTruthy();
    });
    expect(fetch).not.toHaveBeenCalledWith(
      "/api/food/food-1",
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  it("reuses the created entry when retrying after upload failure", async () => {
    mockUploadEncryptedImage
      .mockRejectedValueOnce(new Error("Image upload failed"))
      .mockResolvedValueOnce({ key: "img-1", images: ["img-1"] });

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
      expect(screen.getByText("Image upload failed")).toBeTruthy();
    });

    fireEvent.click(screen.getByRole("button", { name: /^log$/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1);
    });
    expect(mockUploadEncryptedImage).toHaveBeenCalledTimes(2);
  });

  it("shows a save callback failure without deleting the created entry", async () => {
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
      expect(screen.getByText("Save callback failed")).toBeTruthy();
    });
    expect(fetch).not.toHaveBeenCalledWith(
      "/api/food/food-1",
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  it("reuses the created entry when retrying after save callback failure", async () => {
    const onSaved = vi
      .fn()
      .mockRejectedValueOnce(new Error("Save callback failed"))
      .mockResolvedValueOnce(undefined);

    render(<FoodInlineComposer year={2026} month={3} day={20} onSaved={onSaved} />);

    fireEvent.change(screen.getByPlaceholderText(/what are you eating/i), {
      target: { value: "Late lunch" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^log$/i }));

    await waitFor(() => {
      expect(screen.getByText("Save callback failed")).toBeTruthy();
    });

    fireEvent.click(screen.getByRole("button", { name: /^log$/i }));

    await waitFor(() => {
      expect(onSaved).toHaveBeenCalledTimes(2);
    });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("keeps retry available for image-only entries after save callback failure", async () => {
    const onSaved = vi
      .fn()
      .mockRejectedValueOnce(new Error("Save callback failed"))
      .mockResolvedValueOnce(undefined);

    render(<FoodInlineComposer year={2026} month={3} day={20} onSaved={onSaved} />);

    fireEvent.change(screen.getByLabelText(/photo/i), {
      target: {
        files: [new File(["a"], "meal.jpg", { type: "image/jpeg" })],
      },
    });
    fireEvent.click(screen.getByRole("button", { name: /^log$/i }));

    await waitFor(() => {
      expect(screen.getByText("Save callback failed")).toBeTruthy();
    });

    const logButton = screen.getByRole("button", { name: /^log$/i });
    expect((logButton as HTMLButtonElement).disabled).toBe(false);

    fireEvent.click(logButton);

    await waitFor(() => {
      expect(onSaved).toHaveBeenCalledTimes(2);
    });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("locks draft inputs once retries are bound to an existing entry", async () => {
    const onSaved = vi.fn().mockRejectedValueOnce(new Error("Save callback failed"));

    render(<FoodInlineComposer year={2026} month={3} day={20} onSaved={onSaved} />);

    fireEvent.change(screen.getByPlaceholderText(/what are you eating/i), {
      target: { value: "Late lunch" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^log$/i }));

    await waitFor(() => {
      expect(screen.getByText("Save callback failed")).toBeTruthy();
    });

    expect(
      (screen.getByPlaceholderText(/what are you eating/i) as HTMLTextAreaElement).disabled,
    ).toBe(true);
    expect((screen.getByRole("button", { name: /photo/i }) as HTMLButtonElement).disabled).toBe(
      true,
    );
  });

  it("lets the user remove a failed file while retrying an existing entry", async () => {
    mockUploadEncryptedImage.mockRejectedValueOnce(new Error("Image upload failed"));

    render(<FoodInlineComposer year={2026} month={3} day={20} />);

    fireEvent.change(screen.getByLabelText(/photo/i), {
      target: {
        files: [new File(["a"], "meal.jpg", { type: "image/jpeg" })],
      },
    });
    fireEvent.click(screen.getByRole("button", { name: /^log$/i }));

    await waitFor(() => {
      expect(screen.getByText("Image upload failed")).toBeTruthy();
    });

    const removeButton = screen.getByRole("button", { name: /remove meal\.jpg/i });
    expect((removeButton as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(removeButton);

    expect(screen.queryByText("meal.jpg")).toBeNull();
    expect((screen.getByRole("button", { name: /^log$/i }) as HTMLButtonElement).disabled).toBe(
      true,
    );
  });

  it("lets a created text entry complete after removing the only failed file", async () => {
    const onSaved = vi.fn();
    mockUploadEncryptedImage.mockRejectedValueOnce(new Error("Image upload failed"));

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
      expect(screen.getByText("Image upload failed")).toBeTruthy();
    });

    fireEvent.click(screen.getByRole("button", { name: /remove meal\.jpg/i }));
    fireEvent.click(screen.getByRole("button", { name: /^log$/i }));

    await waitFor(() => {
      expect(onSaved).toHaveBeenCalledWith("food-1");
    });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("allows completing save after partial upload success and removing the failed remainder", async () => {
    const onSaved = vi.fn();
    mockUploadEncryptedImage
      .mockResolvedValueOnce({ key: "img-1", images: ["img-1"] })
      .mockRejectedValueOnce(new Error("Second upload failed"));

    render(<FoodInlineComposer year={2026} month={3} day={20} onSaved={onSaved} />);

    fireEvent.change(screen.getByLabelText(/photo/i), {
      target: {
        files: [
          new File(["a"], "first.jpg", { type: "image/jpeg" }),
          new File(["b"], "second.jpg", { type: "image/jpeg" }),
        ],
      },
    });
    fireEvent.click(screen.getByRole("button", { name: /^log$/i }));

    await waitFor(() => {
      expect(screen.getByText("Second upload failed")).toBeTruthy();
    });

    fireEvent.click(screen.getByRole("button", { name: /remove second\.jpg/i }));
    fireEvent.click(screen.getByRole("button", { name: /^log$/i }));

    await waitFor(() => {
      expect(onSaved).toHaveBeenCalledWith("food-1");
    });
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
