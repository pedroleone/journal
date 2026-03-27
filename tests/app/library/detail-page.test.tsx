// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import LibraryDetailPage from "@/app/library/[id]/page";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "item-1" }),
  useRouter: () => ({ push }),
}));

vi.mock("@/hooks/use-locale", () => ({
  useLocale: () => ({
    t: {
      library: {
        back: "Back",
        loading: "Loading item...",
      },
    },
  }),
}));

vi.mock("@/components/library/library-detail", () => ({
  LibraryDetail: ({
    item,
    onProgressSubmit,
  }: {
    item: { title: string };
    onProgressSubmit?: (data: { progressPercent: number }) => Promise<void>;
  }) => (
    <div data-testid="library-detail">
      {item.title}
      <button
        type="button"
        data-testid="submit-progress"
        onClick={() => void onProgressSubmit?.({ progressPercent: 50 })}
      >
        Submit progress
      </button>
    </div>
  ),
}));

describe("LibraryDetailPage", () => {
  function jsonResponse(body: unknown) {
    return new Response(JSON.stringify(body), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue(
      jsonResponse({
        id: "item-1",
        title: "Test title",
      }),
    );
  });

  it("lets the browser handle page scrolling for library detail pages", async () => {
    render(<LibraryDetailPage />);

    const detail = await screen.findByTestId("library-detail");
    const content = detail.parentElement;

    expect(content?.className).toContain("flex-1");
    expect(content?.className).not.toContain("overflow-y-auto");
    expect(content?.className).not.toContain("lg:overflow-hidden");
  });

  it("wires a progress submit handler into LibraryDetail", async () => {
    vi.mocked(global.fetch)
      .mockResolvedValueOnce(
        jsonResponse({
          id: "item-1",
          title: "Test title",
        }),
      )
      .mockResolvedValueOnce(jsonResponse({ ok: true }))
      .mockResolvedValueOnce(
        jsonResponse({
          id: "item-1",
          title: "Updated title",
        }),
      );

    render(<LibraryDetailPage />);

    await screen.findByTestId("library-detail");
    fireEvent.click(screen.getByTestId("submit-progress"));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/library/item-1/progress",
        expect.objectContaining({ method: "POST" }),
      );
    });
    await screen.findByText("Updated title");
  });
});
