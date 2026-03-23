// @vitest-environment jsdom

import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import EntryPage from "@/app/journal/entry/[id]/page";

const push = vi.fn();
const useOnlineStatusMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

vi.mock("@/hooks/use-online-status", () => ({
  useOnlineStatus: () => useOnlineStatusMock(),
}));

vi.mock("@/components/encrypted-image-gallery", () => ({
  EncryptedImageGallery: () => <div data-testid="image-gallery" />,
}));

describe("EntryPage navigation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useOnlineStatusMock.mockReturnValue(true);
  });

  it("renders previous and next links for adjacent existing entries", async () => {
    global.fetch = vi.fn((input: RequestInfo | URL) => {
      const url = String(input);

      if (url.endsWith("/api/entries/entry-2")) {
        return Promise.resolve({
          ok: true,
          json: vi.fn().mockResolvedValue({
            id: "entry-2",
            source: "web",
            year: 2026,
            month: 3,
            day: 12,
            content: "middle entry",
            created_at: "2026-03-12T10:00:00.000Z",
            updated_at: "2026-03-12T10:00:00.000Z",
            images: null,
          }),
        });
      }

      if (url.endsWith("/api/entries/dates")) {
        return Promise.resolve({
          ok: true,
          json: vi.fn().mockResolvedValue([
            { id: "entry-3", year: 2026, month: 3, day: 18 },
            { id: "entry-2", year: 2026, month: 3, day: 12 },
            { id: "entry-1", year: 2026, month: 3, day: 5 },
          ]),
        });
      }

      return Promise.reject(new Error(`Unhandled fetch: ${url}`));
    }) as typeof fetch;

    await act(async () => {
      render(<EntryPage params={Promise.resolve({ id: "entry-2" })} />);
    });

    expect((await screen.findByRole("link", { name: /previous entry/i })).getAttribute("href")).toBe(
      "/journal/entry/entry-1",
    );
    expect(screen.getByRole("link", { name: /next entry/i }).getAttribute("href")).toBe(
      "/journal/entry/entry-3",
    );
    expect(screen.getByRole("button", { name: /delete entry/i })).toBeTruthy();
  });

  it("omits unavailable navigation at the ends of the timeline", async () => {
    global.fetch = vi.fn((input: RequestInfo | URL) => {
      const url = String(input);

      if (url.endsWith("/api/entries/entry-1")) {
        return Promise.resolve({
          ok: true,
          json: vi.fn().mockResolvedValue({
            id: "entry-1",
            source: "web",
            year: 2026,
            month: 3,
            day: 5,
            content: "oldest entry",
            created_at: "2026-03-05T10:00:00.000Z",
            updated_at: "2026-03-05T10:00:00.000Z",
            images: null,
          }),
        });
      }

      if (url.endsWith("/api/entries/dates")) {
        return Promise.resolve({
          ok: true,
          json: vi.fn().mockResolvedValue([
            { id: "entry-3", year: 2026, month: 3, day: 18 },
            { id: "entry-2", year: 2026, month: 3, day: 12 },
            { id: "entry-1", year: 2026, month: 3, day: 5 },
          ]),
        });
      }

      return Promise.reject(new Error(`Unhandled fetch: ${url}`));
    }) as typeof fetch;

    await act(async () => {
      render(<EntryPage params={Promise.resolve({ id: "entry-1" })} />);
    });

    expect((await screen.findByRole("link", { name: /next entry/i })).getAttribute("href")).toBe(
      "/journal/entry/entry-2",
    );
    expect(screen.queryByRole("link", { name: /previous entry/i })).toBeNull();
  });
});
