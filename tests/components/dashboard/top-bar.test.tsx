// @vitest-environment jsdom

import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TopBar } from "@/components/dashboard/top-bar";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    className,
    "aria-label": ariaLabel,
  }: {
    children: React.ReactNode;
    href: string;
    className?: string;
    "aria-label"?: string;
  }) => (
    <a href={href} className={className} aria-label={ariaLabel}>
      {children}
    </a>
  ),
}));

vi.mock("@/hooks/use-media-query", () => ({
  useMediaQuery: () => true,
}));

describe("TopBar", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("shows Write button when no entry exists for today", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    } as Response);

    render(<TopBar />);

    await waitFor(() => {
      expect(screen.getByText("Write")).toBeTruthy();
    });

    const today = new Date();
    const writeLink = screen.getByText("Write").closest("a");
    expect(writeLink?.getAttribute("href")).toBe(
      `/journal/write?year=${today.getFullYear()}&month=${today.getMonth() + 1}&day=${today.getDate()}`,
    );
  });

  it("shows Continue writing with word count when entry exists", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          id: "entry-1",
          content: "Hello world this is a test entry with some words",
        },
      ],
    } as Response);

    render(<TopBar />);

    await waitFor(() => {
      expect(
        screen.getByText(/Continue writing · 10 words/),
      ).toBeTruthy();
    });

    const link = screen.getByText(/Continue writing/).closest("a");
    expect(link?.getAttribute("href")).toBe("/journal/write?entry=entry-1");
  });

  it("renders calendar icon linking to journal browse", () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    } as Response);

    render(<TopBar />);

    const calendarLink = screen.getByLabelText("Journal calendar");
    expect(calendarLink.getAttribute("href")).toBe("/journal/browse");
  });

  it("renders settings icon linking to settings", () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    } as Response);

    render(<TopBar />);

    const settingsLink = screen.getByLabelText("Settings");
    expect(settingsLink.getAttribute("href")).toBe("/settings");
  });
});
