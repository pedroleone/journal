// @vitest-environment jsdom

import type { ReactNode } from "react";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import NotesBrowsePage from "@/app/notes/browse/page";

const replace = vi.fn();
const useMediaQueryMock = vi.fn();

function jsonResponse(data: unknown) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

const useSearchParamsMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  useSearchParams: () => useSearchParamsMock(),
}));

vi.mock("@/hooks/use-media-query", () => ({
  useMediaQuery: (query: string) => useMediaQueryMock(query),
}));

vi.mock("@/components/ui/collapsible-sidebar", () => ({
  CollapsibleSidebar: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/notes/note-detail", () => ({
  NoteDetail: ({ note }: { note: { title: string | null; content: string } }) => (
    <div data-testid="note-detail">
      <h2>{note.title}</h2>
      <p>{note.content}</p>
    </div>
  ),
}));

describe("NotesBrowsePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useMediaQueryMock.mockReturnValue(false);
    useSearchParamsMock.mockReturnValue(new URLSearchParams());
  });

  it("shows the newly selected note detail instead of leaving the previous content on screen", async () => {
    global.fetch = vi.fn((input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input.toString();

      if (url === "/api/notes") {
        return Promise.resolve(jsonResponse([
          {
            id: "note-1",
            title: "First note",
            tags: null,
            images: null,
            created_at: "2026-03-08T12:00:00.000Z",
            updated_at: "2026-03-08T12:00:00.000Z",
          },
          {
            id: "note-2",
            title: "Second note",
            tags: null,
            images: null,
            created_at: "2026-03-09T12:00:00.000Z",
            updated_at: "2026-03-09T12:00:00.000Z",
          },
        ]));
      }

      if (url === "/api/notes/note-1") {
        return Promise.resolve(jsonResponse({
          id: "note-1",
          title: "First note",
          tags: null,
          images: null,
          content: "First content",
          created_at: "2026-03-08T12:00:00.000Z",
          updated_at: "2026-03-08T12:00:00.000Z",
          subnotes: [],
        }));
      }

      if (url === "/api/notes/note-2") {
        return Promise.resolve(jsonResponse({
          id: "note-2",
          title: "Second note",
          tags: null,
          images: null,
          content: "Second content",
          created_at: "2026-03-09T12:00:00.000Z",
          updated_at: "2026-03-09T12:00:00.000Z",
          subnotes: [],
        }));
      }

      return Promise.reject(new Error(`Unexpected fetch: ${url}`));
    }) as unknown as typeof fetch;

    render(<NotesBrowsePage />);

    fireEvent.click(await screen.findByRole("button", { name: /first note/i }));
    expect(await screen.findByText("First content")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /second note/i }));

    expect(await screen.findByText("Second content")).toBeTruthy();
    expect(within(screen.getByTestId("note-detail")).getByText("Second note")).toBeTruthy();
    expect(screen.queryByText("First content")).toBeNull();
  });

  it("ignores late note responses after the user switches to a different note", async () => {
    const noteOne = deferred<Response>();
    const noteTwo = deferred<Response>();

    global.fetch = vi.fn((input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input.toString();

      if (url === "/api/notes") {
        return Promise.resolve(jsonResponse([
          {
            id: "note-1",
            title: "First note",
            tags: null,
            images: null,
            created_at: "2026-03-08T12:00:00.000Z",
            updated_at: "2026-03-08T12:00:00.000Z",
          },
          {
            id: "note-2",
            title: "Second note",
            tags: null,
            images: null,
            created_at: "2026-03-09T12:00:00.000Z",
            updated_at: "2026-03-09T12:00:00.000Z",
          },
        ]));
      }

      if (url === "/api/notes/note-1") return noteOne.promise;
      if (url === "/api/notes/note-2") return noteTwo.promise;

      return Promise.reject(new Error(`Unexpected fetch: ${url}`));
    }) as unknown as typeof fetch;

    render(<NotesBrowsePage />);

    fireEvent.click(await screen.findByRole("button", { name: /first note/i }));
    fireEvent.click(screen.getByRole("button", { name: /second note/i }));

    noteTwo.resolve(jsonResponse({
      id: "note-2",
      title: "Second note",
      tags: null,
      images: null,
      content: "Second content",
      created_at: "2026-03-09T12:00:00.000Z",
      updated_at: "2026-03-09T12:00:00.000Z",
      subnotes: [],
    }));

    expect(await screen.findByText("Second content")).toBeTruthy();

    noteOne.resolve(jsonResponse({
      id: "note-1",
      title: "First note",
      tags: null,
      images: null,
      content: "First content",
      created_at: "2026-03-08T12:00:00.000Z",
      updated_at: "2026-03-08T12:00:00.000Z",
      subnotes: [],
    }));

    await waitFor(() => {
      expect(screen.getByText("Second content")).toBeTruthy();
    });
    expect(screen.queryByText("First content")).toBeNull();
  });

  it("preselects the requested note from the query string", async () => {
    useSearchParamsMock.mockReturnValue(new URLSearchParams("id=note-2"));

    global.fetch = vi.fn((input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input.toString();

      if (url === "/api/notes") {
        return Promise.resolve(jsonResponse([
          {
            id: "note-1",
            title: "First note",
            tags: null,
            images: null,
            created_at: "2026-03-08T12:00:00.000Z",
            updated_at: "2026-03-08T12:00:00.000Z",
          },
          {
            id: "note-2",
            title: "Second note",
            tags: null,
            images: null,
            created_at: "2026-03-09T12:00:00.000Z",
            updated_at: "2026-03-09T12:00:00.000Z",
          },
        ]));
      }

      if (url === "/api/notes/note-2") {
        return Promise.resolve(jsonResponse({
          id: "note-2",
          title: "Second note",
          tags: null,
          images: null,
          content: "Second content",
          created_at: "2026-03-09T12:00:00.000Z",
          updated_at: "2026-03-09T12:00:00.000Z",
          subnotes: [],
        }));
      }

      return Promise.reject(new Error(`Unexpected fetch: ${url}`));
    }) as unknown as typeof fetch;

    render(<NotesBrowsePage />);

    expect(await screen.findByText("Second content")).toBeTruthy();
  });
});
