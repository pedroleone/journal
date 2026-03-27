// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FoodQuadrant } from "@/components/dashboard/food-quadrant";

const onSavedIds: string[] = [];

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    className,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    className?: string;
  }) => (
    <a href={href} className={className} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/components/food/food-inline-composer", () => ({
  FoodInlineComposer: ({
    year,
    month,
    day,
    onSaved,
  }: {
    year: number;
    month: number;
    day: number;
    onSaved?: (entryId: string) => void | Promise<void>;
  }) => (
    <div data-testid="dashboard-food-inline-composer">
      <div>{`${year}-${month}-${day}`}</div>
      <input placeholder="What are you eating?" />
      <button
        type="button"
        onClick={() => {
          onSavedIds.push("dashboard-food-1");
          void onSaved?.("dashboard-food-1");
        }}
      >
        Log
      </button>
    </div>
  ),
}));

describe("FoodQuadrant", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    onSavedIds.length = 0;
  });

  it("links the food quadrant card to the expanded food page", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce({
        json: async () => [],
      } as Response)
      .mockResolvedValueOnce({
        json: async () => [],
      } as Response);

    render(<FoodQuadrant />);

    expect((await screen.findByRole("link", { name: /food/i })).getAttribute("href")).toBe(
      "/food",
    );
  });

  it("opens a dashboard-local food composer for today", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce({
        json: async () => [],
      } as Response)
      .mockResolvedValueOnce({
        json: async () => [],
      } as Response);

    render(<FoodQuadrant />);

    fireEvent.click(await screen.findByRole("button", { name: /quick add food/i }));

    const today = new Date();
    expect(await screen.findByPlaceholderText(/what are you eating/i)).toBeTruthy();
    expect(screen.getByText(`${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`)).toBeTruthy();
  });

  it("stays on the dashboard after dashboard quick add saves and refreshes the quadrant", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce({
        json: async () => [],
      } as Response)
      .mockResolvedValueOnce({
        json: async () => [],
      } as Response)
      .mockResolvedValueOnce({
        json: async () => [],
      } as Response)
      .mockResolvedValueOnce({
        json: async () => [{ id: "u1" }],
      } as Response);

    render(<FoodQuadrant />);

    fireEvent.click(await screen.findByRole("button", { name: /quick add food/i }));
    fireEvent.click(screen.getByRole("button", { name: /^log$/i }));

    await waitFor(() => {
      expect(screen.queryByPlaceholderText(/what are you eating/i)).toBeNull();
    });
    expect(screen.getByRole("link", { name: /food/i })).toBeTruthy();
    expect(onSavedIds).toEqual(["dashboard-food-1"]);
    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledTimes(4);
    });
  });
});
