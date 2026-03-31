// @vitest-environment jsdom

import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { LibraryBrowse, type BrowseItem } from "@/components/library/library-browse";
import { EMPTY_FILTERS, type LibraryFilters } from "@/components/library/filter-bar";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  usePathname: () => "/library/browse",
}));

vi.mock("@/hooks/use-locale", () => ({
  useLocale: () => ({
    t: {
      library: {
        search: "Search library...",
        empty: "No library items yet.",
        noMatch: "No items match your search.",
        newItem: "+ New Item",
        selectOrCreate: "Select or create",
        all: "All",
        book: "Books",
        album: "Albums",
        movie: "Movies",
        game: "Games",
        video: "Videos",
        misc: "Misc",
        backlog: "Backlog",
        inProgress: "In Progress",
        finished: "Finished",
        dropped: "Dropped",
        title: "Title",
        creator: "Creator",
        url: "URL",
        rating: "Rating",
        reactions: "Reactions",
        genres: "Genres",
        status: "Status",
        type: "Type",
        thoughts: "Thoughts",
        addThought: "Add thought",
        writeThought: "Write thought",
        save: "Save",
        delete: "Delete",
        cancel: "Cancel",
        back: "Back",
        loading: "Loading...",
        saving: "Saving...",
        adding: "Adding...",
        platform: "Platform",
        pages: "Pages",
        duration: "Duration",
        channel: "Channel",
        deleteItem: "Delete item",
        filters: "Filters",
        clearFilters: "Clear filters",
        allStatuses: "All statuses",
        allGenres: "All genres",
        allReactions: "All reactions",
        allPlatforms: "All platforms",
        ratingAndAbove: (n: number) => `${n}+ stars`,
        anyRating: "Any rating",
        noItemsForFilters: "No items for these filters.",
        addCover: "Add cover",
        changeCover: "Change cover",
        removeCover: "Remove cover",
        quickAdd: "Quick add",
        titlePlaceholder: "Title",
        albumName: "Album name",
        artistName: "Artist",
        artistPlaceholder: "Artist",
        select: "Select",
        selectAll: "Select all",
        updateStatus: "Update status",
        nSelected: (n: number) => `${n} selected`,
        year: "Year",
        selectType: "Select type",
        addToLibrary: "Add to library",
        listening: "Listening",
        listened: "Listened",
        nItems: (type: string, count: number) => `${count} ${type}`,
      },
    },
  }),
}));

vi.mock("@/hooks/use-media-query", () => ({
  useMediaQuery: () => false,
}));

function makeItem(overrides: Partial<BrowseItem> = {}): BrowseItem {
  return {
    id: "item-1",
    type: "book",
    title: "Test Book",
    creator: "Author",
    status: "backlog",
    rating: null,
    cover_image: null,
    url: null,
    reactions: null,
    genres: null,
    metadata: null,
    added_at: "2026-03-20T00:00:00.000Z",
    started_at: null,
    finished_at: null,
    created_at: "2026-03-20T00:00:00.000Z",
    updated_at: "2026-03-20T00:00:00.000Z",
    ...overrides,
  };
}

function renderBrowse({
  items = [makeItem()],
  filters = EMPTY_FILTERS,
}: {
  items?: BrowseItem[];
  filters?: LibraryFilters;
} = {}) {
  return render(
    <DashboardShell>
      <LibraryBrowse
        items={items}
        filters={filters}
        onFilterChange={vi.fn()}
        genres={[{ value: "Fantasy", count: 1 }]}
        reactions={[{ value: "Interesting", count: 1 }]}
        platforms={[{ value: "Switch", count: 1 }]}
      />
    </DashboardShell>,
  );
}

describe("LibraryBrowse", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("keeps search hidden until the breadcrumb Filters action opens the panel", () => {
    renderBrowse();

    const banner = screen.getByRole("banner");

    expect(within(banner).getByRole("button", { name: "Filters" })).toBeTruthy();
    expect(within(banner).getByRole("button", { name: "+ New Item" })).toBeTruthy();
    expect(screen.queryByPlaceholderText("Search library...")).toBeNull();
    expect(screen.queryByText("All statuses")).toBeNull();
    expect(screen.queryByRole("button", { name: "Books" })).toBeNull();

    fireEvent.click(within(banner).getByRole("button", { name: "Filters" }));

    expect(screen.getByPlaceholderText("Search library...")).toBeTruthy();
    expect(screen.getByText("All statuses")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Books" })).toBeTruthy();
  });

  it("hides the panel without affecting filtered empty-state behavior", () => {
    renderBrowse({
      items: [],
      filters: { ...EMPTY_FILTERS, status: "finished" },
    });

    fireEvent.click(within(screen.getByRole("banner")).getByRole("button", { name: "Filters" }));
    expect(screen.getByText("All statuses")).toBeTruthy();

    fireEvent.click(within(screen.getByRole("banner")).getByRole("button", { name: "Filters" }));

    expect(screen.queryByText("All statuses")).toBeNull();
    expect(screen.getByText("No items for these filters.")).toBeTruthy();
  });

  it("includes an active type in the hidden filter count", () => {
    renderBrowse({
      filters: { ...EMPTY_FILTERS, type: "book" },
    });

    expect(
      within(screen.getByRole("banner")).getByRole("button", { name: "Filters" }).textContent,
    ).toContain("1");
    expect(screen.queryByRole("button", { name: "Books" })).toBeNull();
  });

  it("routes from the breadcrumb add action and removes bottom actions", () => {
    renderBrowse();

    expect(screen.queryByText("Quick add")).toBeNull();

    fireEvent.click(
      within(screen.getByRole("banner")).getByRole("button", { name: "+ New Item" }),
    );

    expect(push).toHaveBeenCalledWith("/library/new");
  });

  it("shows saved ebook progress percentages on in-progress book cards", () => {
    renderBrowse({
      items: [
        makeItem({
          id: "ebook-1",
          type: "book",
          status: "in_progress",
          title: "Saved Ebook Progress",
          metadata: {
            bookFormat: "ebook",
            totalPages: null,
            currentProgressPercent: 45,
            currentProgressPage: null,
            totalDurationMinutes: null,
            currentProgressMinutes: null,
            progressUpdatedAt: "2026-03-23T00:00:00.000Z",
          },
        }),
      ],
    });

    expect(screen.getByText("45%")).toBeTruthy();
  });

  it("shows derived physical book progress percentages on in-progress book cards", () => {
    renderBrowse({
      items: [
        makeItem({
          id: "physical-1",
          type: "book",
          status: "in_progress",
          title: "Derived Physical Progress",
          metadata: {
            bookFormat: "physical",
            totalPages: 500,
            currentProgressPercent: null,
            currentProgressPage: 125,
            totalDurationMinutes: null,
            currentProgressMinutes: null,
            progressUpdatedAt: "2026-03-23T00:00:00.000Z",
          },
        }),
      ],
    });

    expect(screen.getByText("25%")).toBeTruthy();
  });

  it("does not show progress percentages for non-book or non-in-progress cards", () => {
    renderBrowse({
      items: [
        makeItem({
          id: "book-backlog",
          type: "book",
          status: "backlog",
          title: "Backlog Book",
          metadata: {
            bookFormat: "ebook",
            totalPages: null,
            currentProgressPercent: 80,
            currentProgressPage: null,
            totalDurationMinutes: null,
            currentProgressMinutes: null,
            progressUpdatedAt: "2026-03-23T00:00:00.000Z",
          },
        }),
        makeItem({
          id: "album-progress",
          type: "album",
          status: "in_progress",
          title: "In Progress Album",
          metadata: {
            bookFormat: "physical",
            totalPages: 200,
            currentProgressPercent: null,
            currentProgressPage: 50,
            totalDurationMinutes: null,
            currentProgressMinutes: null,
            progressUpdatedAt: "2026-03-23T00:00:00.000Z",
          },
        }),
        makeItem({
          id: "finished-book",
          type: "book",
          status: "finished",
          title: "Finished Book",
          metadata: {
            bookFormat: "physical",
            totalPages: 200,
            currentProgressPercent: null,
            currentProgressPage: 200,
            totalDurationMinutes: null,
            currentProgressMinutes: null,
            progressUpdatedAt: "2026-03-23T00:00:00.000Z",
          },
        }),
      ],
    });

    expect(screen.queryByText("80%")).toBeNull();
    expect(screen.queryByText("25%")).toBeNull();
    expect(screen.queryByText("100%")).toBeNull();
  });

  it("hides invalid book progress data on cards", () => {
    renderBrowse({
      items: [
        makeItem({
          id: "ebook-invalid",
          type: "book",
          status: "in_progress",
          title: "Invalid Ebook Progress",
          metadata: {
            bookFormat: "ebook",
            totalPages: null,
            currentProgressPercent: 101,
            currentProgressPage: null,
            totalDurationMinutes: null,
            currentProgressMinutes: null,
            progressUpdatedAt: "2026-03-23T00:00:00.000Z",
          },
        }),
        makeItem({
          id: "physical-invalid",
          type: "book",
          status: "in_progress",
          title: "Invalid Physical Progress",
          metadata: {
            bookFormat: "physical",
            totalPages: 500,
            currentProgressPercent: null,
            currentProgressPage: 501,
            totalDurationMinutes: null,
            currentProgressMinutes: null,
            progressUpdatedAt: "2026-03-23T00:00:00.000Z",
          },
        }),
      ],
    });

    expect(screen.queryByText("101%")).toBeNull();
    expect(screen.queryByText("100%")).toBeNull();
  });
});
