// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CollapsibleSidebar } from "@/components/ui/collapsible-sidebar";

const useMediaQueryMock = vi.fn();

vi.mock("@/hooks/use-media-query", () => ({
  useMediaQuery: () => useMediaQueryMock(),
}));

describe("CollapsibleSidebar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const store: Record<string, string> = {};
    Object.defineProperty(globalThis, "localStorage", {
      value: {
        getItem: (key: string) => store[key] ?? null,
        setItem: (key: string, value: string) => { store[key] = value; },
        removeItem: (key: string) => { delete store[key]; },
        clear: () => { for (const k in store) delete store[k]; },
        get length() { return Object.keys(store).length; },
        key: (i: number) => Object.keys(store)[i] ?? null,
      },
      writable: true,
      configurable: true,
    });
    useMediaQueryMock.mockReturnValue(false); // desktop by default
  });

  it("renders children on desktop", () => {
    render(
      <CollapsibleSidebar visible={true}>
        <div>sidebar content</div>
      </CollapsibleSidebar>,
    );
    expect(screen.getByText("sidebar content")).toBeDefined();
  });

  it("shows collapse button on desktop", () => {
    render(
      <CollapsibleSidebar visible={true}>
        <div>content</div>
      </CollapsibleSidebar>,
    );
    expect(screen.getByRole("button", { name: /collapse sidebar/i })).toBeDefined();
  });

  it("hides children after clicking collapse on desktop", () => {
    render(
      <CollapsibleSidebar visible={true}>
        <div>sidebar content</div>
      </CollapsibleSidebar>,
    );
    fireEvent.click(screen.getByRole("button", { name: /collapse sidebar/i }));
    expect(screen.queryByText("sidebar content")).toBeNull();
  });

  it("shows expand button after collapse on desktop", () => {
    render(
      <CollapsibleSidebar visible={true}>
        <div>content</div>
      </CollapsibleSidebar>,
    );
    fireEvent.click(screen.getByRole("button", { name: /collapse sidebar/i }));
    expect(screen.getByRole("button", { name: /expand sidebar/i })).toBeDefined();
  });

  it("persists collapsed state to localStorage", () => {
    render(
      <CollapsibleSidebar visible={true}>
        <div>content</div>
      </CollapsibleSidebar>,
    );
    fireEvent.click(screen.getByRole("button", { name: /collapse sidebar/i }));
    expect(localStorage.getItem("sidebar-collapsed")).toBe("true");
  });

  it("reads initial collapsed state from localStorage", () => {
    localStorage.setItem("sidebar-collapsed", "true");
    render(
      <CollapsibleSidebar visible={true}>
        <div>sidebar content</div>
      </CollapsibleSidebar>,
    );
    expect(screen.queryByText("sidebar content")).toBeNull();
    expect(screen.getByRole("button", { name: /expand sidebar/i })).toBeDefined();
  });

  it("renders children on mobile when visible=true", () => {
    useMediaQueryMock.mockReturnValue(true);
    render(
      <CollapsibleSidebar visible={true}>
        <div>sidebar content</div>
      </CollapsibleSidebar>,
    );
    expect(screen.getByText("sidebar content")).toBeDefined();
  });

  it("renders nothing on mobile when visible=false", () => {
    useMediaQueryMock.mockReturnValue(true);
    render(
      <CollapsibleSidebar visible={false}>
        <div>sidebar content</div>
      </CollapsibleSidebar>,
    );
    expect(screen.queryByText("sidebar content")).toBeNull();
  });

  it("shows no toggle button on mobile", () => {
    useMediaQueryMock.mockReturnValue(true);
    render(
      <CollapsibleSidebar visible={true}>
        <div>content</div>
      </CollapsibleSidebar>,
    );
    expect(screen.queryByRole("button", { name: /collapse sidebar/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /expand sidebar/i })).toBeNull();
  });
});
