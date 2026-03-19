// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
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
  LibraryDetail: ({ item }: { item: { title: string } }) => (
    <div data-testid="library-detail">{item.title}</div>
  ),
}));

describe("LibraryDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        id: "item-1",
        title: "Test title",
      }),
    });
  });

  it("uses page-level scrolling on mobile while preserving desktop clipping", async () => {
    render(<LibraryDetailPage />);

    const detail = await screen.findByTestId("library-detail");
    const content = detail.parentElement;

    expect(content?.className).toContain("overflow-y-auto");
    expect(content?.className).toContain("lg:overflow-hidden");
  });
});
