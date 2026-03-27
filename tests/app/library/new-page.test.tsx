// @vitest-environment jsdom

import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
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
    coverUploadDisabled?: boolean;
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
    expect(detailSpy.mock.calls.at(-1)?.[0]).toEqual(
      expect.objectContaining({ coverUploadDisabled: true }),
    );
  });

  it("passes the expected draft metadata for books", async () => {
    render(<LibraryNewPage />);

    fireEvent.click(screen.getByRole("button", { name: "Book" }));

    const detail = await screen.findByTestId("library-detail");
    expect(detail.textContent).toContain("__new__:book");
    const draftItem = detailSpy.mock.calls.at(-1)?.[0].item;
    expect(draftItem).toEqual(
      expect.objectContaining({
        id: "__new__",
        type: "book",
        title: "",
        status: "backlog",
      }),
    );
    expect(draftItem?.metadata).toEqual(
      expect.objectContaining({
        bookFormat: null,
        totalPages: null,
      }),
    );
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

  it("clears book metadata when a new draft changes to a non-book type", async () => {
    render(<LibraryNewPage />);

    fireEvent.click(screen.getByRole("button", { name: "Book" }));

    let detailProps = detailSpy.mock.calls.at(-1)?.[0];
    await act(async () => {
      await detailProps.onUpdate({
        metadata: {
          bookFormat: "ebook",
          totalPages: null,
          currentProgressPercent: 40,
          currentProgressPage: null,
          progressUpdatedAt: "2026-03-21T12:00:00.000Z",
        },
      });
    });

    detailProps = detailSpy.mock.calls.at(-1)?.[0];
    await act(async () => {
      await detailProps.onUpdate({ type: "game" });
    });

    await waitFor(() => {
      expect(detailSpy.mock.calls.at(-1)?.[0].item).toEqual(
        expect.objectContaining({
          type: "game",
          metadata: null,
        }),
      );
    });

    fireEvent.click(await screen.findByRole("button", { name: "Save draft" }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/library",
        expect.objectContaining({ method: "POST" }),
      );
    });

    const fetchCall = vi.mocked(global.fetch).mock.calls.at(-1);
    expect(fetchCall).toBeTruthy();
    const body = fetchCall?.[1] && "body" in fetchCall[1] ? fetchCall[1].body : null;
    expect(typeof body).toBe("string");
    expect(JSON.parse(body as string)).toEqual(
      expect.objectContaining({
        type: "game",
        metadata: null,
      }),
    );
  });
});
