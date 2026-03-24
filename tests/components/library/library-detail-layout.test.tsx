// @vitest-environment jsdom

import { render } from "@testing-library/react";
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
  VocabularyInput: ({ placeholder }: { placeholder?: string }) => (
    <div data-testid="vocabulary-input">{placeholder}</div>
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
});
