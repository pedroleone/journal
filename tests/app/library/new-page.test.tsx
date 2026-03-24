// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import LibraryNewPage from "@/app/library/new/page";

const push = vi.fn();
const detailSpy = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

vi.mock("@/hooks/use-locale", () => ({
  useLocale: () => ({
    t: {
      library: {
        back: "Back",
        book: "Book",
        album: "Album",
        movie: "Movie",
        game: "Game",
        video: "Video",
        misc: "Misc",
        selectType: "Select type",
      },
    },
  }),
}));

vi.mock("@/components/library/library-detail", () => ({
  LibraryDetail: (props: {
    item: { id: string; type: string };
    onUpdate: (data: Record<string, unknown>) => Promise<void>;
    onCreate?: (data: Record<string, unknown>) => Promise<void>;
  }) => {
    detailSpy(props);
    return (
      <div data-testid="library-detail">
        {props.item.id}:{props.item.type}
        <button type="button" onClick={() => void props.onCreate?.({ title: "Created title" })}>
          Save draft
        </button>
      </div>
    );
  },
}));

describe("LibraryNewPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ id: "created-1" }),
    });
  });

  it("opens the full detail editor for the selected type", async () => {
    render(<LibraryNewPage />);

    fireEvent.click(screen.getByRole("button", { name: "Game" }));

    const detail = await screen.findByTestId("library-detail");
    expect(detail.textContent).toContain("__new__:game");
    expect(detailSpy).toHaveBeenCalled();
  });

  it("creates only when the editor explicitly saves", async () => {
    render(<LibraryNewPage />);

    fireEvent.click(screen.getByRole("button", { name: "Book" }));

    expect(global.fetch).not.toHaveBeenCalled();

    fireEvent.click(await screen.findByRole("button", { name: "Save draft" }));

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/library",
      expect.objectContaining({ method: "POST" }),
    );
    await waitFor(() => {
      expect(push).toHaveBeenCalledWith("/library/created-1");
    });
  });
});
