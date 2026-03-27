// @vitest-environment jsdom

import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LibraryDetail, type LibraryDetailData } from "@/components/library/library-detail";

vi.mock("@/hooks/use-locale", () => ({
  useLocale: () => ({
    t: {
      library: {
        localeCode: "en-US",
        book: "Book",
        album: "Album",
        movie: "Movie",
        game: "Game",
        video: "Video",
        misc: "Misc",
        saving: "Saving",
        deleteItem: "Delete item",
        cancel: "Cancel",
        save: "Save",
        changeCover: "Change cover",
        addCover: "Add cover",
        albumName: "Album name",
        title: "Title",
        artistName: "Artist",
        status: "Status",
        format: "Format",
        ebook: "Ebook",
        physical: "Physical",
        progress: "Progress",
        currentProgress: "Current progress",
        currentProgressPage: "Current page",
        progressPercent: "Progress percent",
        lastUpdated: "Last updated",
        almostFinished: "Almost finished",
        url: "URL",
        year: "Year",
        rating: "Rating",
        platform: "Platform",
        pages: "Pages",
        duration: "Duration",
        channel: "Channel",
        genres: "Genres",
        reactions: "Reactions",
        addThought: "Add thought",
        writeThought: "Write thought",
        adding: "Adding",
        delete: "Delete",
        addToLibrary: "Add to library",
        type: "Type",
      },
    },
  }),
}));

vi.mock("@/components/ui/markdown-editor", () => ({
  MarkdownEditor: ({ value = "", placeholder }: { value?: string; placeholder?: string }) => (
    <div data-testid="markdown-editor">{value || placeholder}</div>
  ),
}));

vi.mock("@/components/library/vocabulary-input", () => ({
  VocabularyInput: ({
    field,
    mediaType,
    placeholder,
  }: {
    field: string;
    mediaType?: string;
    placeholder?: string;
  }) => (
    <div data-testid={`vocabulary-input-${field}`}>
      {placeholder}:{mediaType ?? "none"}
    </div>
  ),
}));

vi.mock("@/components/library/status-transition", () => ({
  StatusTransition: () => <div data-testid="status-transition">status</div>,
}));

function makeItem(overrides: Partial<LibraryDetailData> = {}): LibraryDetailData {
  return {
    id: "item-1",
    type: "book",
    title: "Test Book",
    creator: "Author",
    url: null,
    status: "backlog",
    rating: null,
    reactions: [],
    genres: [],
    metadata: null,
    cover_image: null,
    content: "Notes",
    added_at: "2026-03-20T00:00:00.000Z",
    started_at: null,
    finished_at: null,
    created_at: "2026-03-20T00:00:00.000Z",
    updated_at: "2026-03-20T00:00:00.000Z",
    notes: [],
    ...overrides,
  };
}

describe("LibraryDetail layout", () => {
  it("uses normal document flow instead of sticky or split scrolling", () => {
    const { container } = render(
      <LibraryDetail
        item={makeItem()}
        onUpdate={vi.fn(async () => undefined)}
        onAddNote={vi.fn(async () => undefined)}
        onUpdateNote={vi.fn(async () => undefined)}
        onDelete={vi.fn(async () => undefined)}
        onDeleteNote={vi.fn(async () => undefined)}
      />,
    );

    expect(container.querySelector(".sticky")).toBeNull();
    expect(container.querySelector(".overflow-y-auto")).toBeNull();
    expect(container.querySelector("[class*='lg:overflow-y-auto']")).toBeNull();
    expect(container.querySelector("[class*='lg\\:h-\\[calc\\(100\\%-49px\\)\\]']")).toBeNull();
  });

  it("uses the full editor for new items instead of the reduced quick-add form", () => {
    render(
      <LibraryDetail
        item={makeItem({ id: "__new__", type: "game", title: "" })}
        onUpdate={vi.fn(async () => undefined)}
        onAddNote={vi.fn(async () => undefined)}
        onUpdateNote={vi.fn(async () => undefined)}
        onDelete={vi.fn(async () => undefined)}
        onDeleteNote={vi.fn(async () => undefined)}
      />,
    );

    expect(screen.getByTestId("status-transition")).toBeTruthy();
    expect(screen.getByText("Year")).toBeTruthy();
    expect(screen.getByTestId("vocabulary-input-platform").textContent).toContain("game");
    expect(screen.getByTestId("vocabulary-input-genres").textContent).toContain("game");
    expect(screen.getByRole("button", { name: "Add to library" })).toBeTruthy();
  });

  it("shows book format controls for new book drafts", () => {
    render(
      <LibraryDetail
        item={makeItem({ id: "__new__", type: "book", title: "" })}
        onUpdate={vi.fn(async () => undefined)}
        onAddNote={vi.fn(async () => undefined)}
        onUpdateNote={vi.fn(async () => undefined)}
        onDelete={vi.fn(async () => undefined)}
        onDeleteNote={vi.fn(async () => undefined)}
      />,
    );

    expect(screen.getByLabelText(/format/i)).toBeTruthy();
    expect(screen.queryByLabelText(/total pages/i)).toBeNull();
  });

  it("includes year when creating a new book draft", () => {
    const onCreate = vi.fn(async () => undefined);

    render(
      <LibraryDetail
        item={makeItem({ id: "__new__", type: "book", title: "" })}
        onUpdate={vi.fn(async () => undefined)}
        onCreate={onCreate}
        onAddNote={vi.fn(async () => undefined)}
        onUpdateNote={vi.fn(async () => undefined)}
        onDelete={vi.fn(async () => undefined)}
        onDeleteNote={vi.fn(async () => undefined)}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText("Title"), { target: { value: "Dune" } });
    fireEvent.change(screen.getByPlaceholderText("2024"), { target: { value: "1965" } });
    fireEvent.click(screen.getByRole("button", { name: "Add to library" }));

    expect(onCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "book",
        title: "Dune",
        metadata: expect.objectContaining({
          year: 1965,
        }),
      }),
    );
  });

  it("only shows totalPages after selecting physical format", () => {
    render(
      <LibraryDetail
        item={makeItem({ id: "__new__", type: "book", title: "" })}
        onUpdate={vi.fn(async () => undefined)}
        onAddNote={vi.fn(async () => undefined)}
        onUpdateNote={vi.fn(async () => undefined)}
        onDelete={vi.fn(async () => undefined)}
        onDeleteNote={vi.fn(async () => undefined)}
      />,
    );

    expect(screen.queryByLabelText(/total pages/i)).toBeNull();
    fireEvent.change(screen.getByLabelText(/format/i), { target: { value: "physical" } });
    expect(screen.getByLabelText(/total pages/i)).toBeTruthy();
  });

  it("does not show the progress card for unsaved new book items", () => {
    render(
      <LibraryDetail
        item={makeItem({ id: "__new__", type: "book", title: "" })}
        onUpdate={vi.fn(async () => undefined)}
        onAddNote={vi.fn(async () => undefined)}
        onUpdateNote={vi.fn(async () => undefined)}
        onDelete={vi.fn(async () => undefined)}
        onDeleteNote={vi.fn(async () => undefined)}
      />,
    );

    expect(screen.queryByRole("group", { name: /progress/i })).toBeNull();
  });

  it("shows an ebook progress card with a percent input", () => {
    render(
      <LibraryDetail
        item={makeItem({
          type: "book",
          status: "in_progress",
          metadata: {
            bookFormat: "ebook",
            totalPages: null,
            currentProgressPercent: 45,
            currentProgressPage: null,
            progressUpdatedAt: "2026-03-21T12:00:00.000Z",
          },
        })}
        onUpdate={vi.fn(async () => undefined)}
        onAddNote={vi.fn(async () => undefined)}
        onUpdateNote={vi.fn(async () => undefined)}
        onDelete={vi.fn(async () => undefined)}
        onDeleteNote={vi.fn(async () => undefined)}
      />,
    );

    expect(screen.getByRole("group", { name: /progress/i })).toBeTruthy();
    expect(screen.getByLabelText(/progress percent/i)).toBeTruthy();
  });

  it("shows a physical-book progress card with a page input", () => {
    render(
      <LibraryDetail
        item={makeItem({
          type: "book",
          status: "in_progress",
          metadata: {
            bookFormat: "physical",
            totalPages: 320,
            currentProgressPercent: null,
            currentProgressPage: 120,
            progressUpdatedAt: "2026-03-21T12:00:00.000Z",
          },
        })}
        onUpdate={vi.fn(async () => undefined)}
        onAddNote={vi.fn(async () => undefined)}
        onUpdateNote={vi.fn(async () => undefined)}
        onDelete={vi.fn(async () => undefined)}
        onDeleteNote={vi.fn(async () => undefined)}
      />,
    );

    expect(screen.getByRole("group", { name: /progress/i })).toBeTruthy();
    expect(screen.getByLabelText(/current page/i)).toBeTruthy();
  });

  it("shows current progress and last-updated text in view mode", () => {
    const renderedDate = new Date("2026-03-21T12:00:00.000Z").toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    render(
      <LibraryDetail
        item={makeItem({
          type: "book",
          status: "in_progress",
          metadata: {
            bookFormat: "ebook",
            totalPages: null,
            currentProgressPercent: 45,
            currentProgressPage: null,
            progressUpdatedAt: "2026-03-21T12:00:00.000Z",
          },
        })}
        onUpdate={vi.fn(async () => undefined)}
        onAddNote={vi.fn(async () => undefined)}
        onUpdateNote={vi.fn(async () => undefined)}
        onDelete={vi.fn(async () => undefined)}
        onDeleteNote={vi.fn(async () => undefined)}
      />,
    );

    const progressCard = screen.getByRole("group", { name: /progress/i });
    expect(within(progressCard).getByText("Current progress")).toBeTruthy();
    expect(within(progressCard).getByText("45%")).toBeTruthy();
    expect(within(progressCard).getByText("Last updated")).toBeTruthy();
    expect(within(progressCard).getByText(renderedDate)).toBeTruthy();
  });

  it("keeps the progress card visible for finished books in read-only mode", () => {
    render(
      <LibraryDetail
        item={makeItem({
          type: "book",
          status: "finished",
          metadata: {
            bookFormat: "ebook",
            totalPages: null,
            currentProgressPercent: 100,
            currentProgressPage: null,
            progressUpdatedAt: "2026-03-21T12:00:00.000Z",
          },
        })}
        onUpdate={vi.fn(async () => undefined)}
        onAddNote={vi.fn(async () => undefined)}
        onUpdateNote={vi.fn(async () => undefined)}
        onDelete={vi.fn(async () => undefined)}
        onDeleteNote={vi.fn(async () => undefined)}
      />,
    );

    const progressCard = screen.getByRole("group", { name: /progress/i });
    expect(progressCard).toBeTruthy();
    expect(screen.getByLabelText(/progress percent/i)).toBeDisabled();
    expect(screen.getByRole("button", { name: /log/i })).toBeDisabled();
  });

  it("surfaces a subtle finish cue near completion", () => {
    render(
      <LibraryDetail
        item={makeItem({
          type: "book",
          status: "in_progress",
          metadata: {
            bookFormat: "ebook",
            totalPages: null,
            currentProgressPercent: 99,
            currentProgressPage: null,
            progressUpdatedAt: "2026-03-21T12:00:00.000Z",
          },
        })}
        onUpdate={vi.fn(async () => undefined)}
        onAddNote={vi.fn(async () => undefined)}
        onUpdateNote={vi.fn(async () => undefined)}
        onDelete={vi.fn(async () => undefined)}
        onDeleteNote={vi.fn(async () => undefined)}
      />,
    );

    expect(screen.getByText(/almost finished/i)).toBeTruthy();
  });

  it("disables the empty cover upload control for unsaved items when requested", () => {
    render(
      <LibraryDetail
        item={makeItem({ id: "__new__" })}
        coverUploadDisabled
        onUpdate={vi.fn(async () => undefined)}
        onAddNote={vi.fn(async () => undefined)}
        onUpdateNote={vi.fn(async () => undefined)}
        onDelete={vi.fn(async () => undefined)}
        onDeleteNote={vi.fn(async () => undefined)}
      />,
    );

    expect(screen.getByRole("button", { name: "Add cover" })).toBeDisabled();
  });
});
