// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LibraryDetail, type LibraryDetailData } from "@/components/library/library-detail";

vi.mock("@/hooks/use-locale", () => ({
  useLocale: () => ({
    t: {
      library: {
        book: "Book",
        album: "Album",
        movie: "Movie",
        game: "Game",
        video: "Video",
        misc: "Misc",
        saving: "Saving",
        deleteItem: "Delete item",
        cancel: "Cancel",
        changeCover: "Change cover",
        addCover: "Add cover",
        albumName: "Album name",
        title: "Title",
        artistName: "Artist",
        status: "Status",
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
