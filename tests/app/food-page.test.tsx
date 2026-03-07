// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import FoodPage from "@/app/food/page";
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

describe("FoodPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input.toString();

      if (url.startsWith("/api/food?uncategorized=true")) {
        return makeJsonResponse([]);
      }

      if (url === "/api/food" && init?.method === "POST") {
        return makeJsonResponse({ id: "food-1" }, 201);
      }

      throw new Error(`Unhandled fetch: ${url}`);
    }) as typeof fetch;
    mockUploadEncryptedImage.mockResolvedValue({ key: "img-1", images: ["img-1"] });
  });

  it("appends selected files across picker opens and supports chip removal", async () => {
    const { container } = render(<FoodPage />);
    const input = container.querySelector('input[type="file"]');

    expect(input).toBeTruthy();

    fireEvent.change(input as HTMLInputElement, {
      target: {
        files: [
          new File(["a"], "apple.jpg", { type: "image/jpeg" }),
          new File(["b"], "banana.jpg", { type: "image/jpeg" }),
        ],
      },
    });

    expect(await screen.findByText("apple.jpg")).toBeTruthy();
    expect(screen.getByText("banana.jpg")).toBeTruthy();

    fireEvent.change(input as HTMLInputElement, {
      target: {
        files: [new File(["c"], "carrot.jpg", { type: "image/jpeg" })],
      },
    });

    expect(screen.getByText("apple.jpg")).toBeTruthy();
    expect(screen.getByText("banana.jpg")).toBeTruthy();
    expect(screen.getByText("carrot.jpg")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Remove banana.jpg" }));

    await waitFor(() => {
      expect(screen.queryByText("banana.jpg")).toBeNull();
    });
    expect(screen.getByText("apple.jpg")).toBeTruthy();
    expect(screen.getByText("carrot.jpg")).toBeTruthy();
  });

  it("clears pending files after a successful log", async () => {
    const { container } = render(<FoodPage />);
    const input = container.querySelector('input[type="file"]');

    fireEvent.change(input as HTMLInputElement, {
      target: {
        files: [
          new File(["a"], "apple.jpg", { type: "image/jpeg" }),
          new File(["b"], "banana.jpg", { type: "image/jpeg" }),
        ],
      },
    });

    fireEvent.click(await screen.findByRole("button", { name: "Log" }));

    await waitFor(() => {
      expect(mockUploadEncryptedImage).toHaveBeenCalledTimes(2);
    });

    await waitFor(() => {
      expect(screen.queryByText("apple.jpg")).toBeNull();
      expect(screen.queryByText("banana.jpg")).toBeNull();
    });
  });
});
