// @vitest-environment jsdom

import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { InstallAppButton } from "@/components/pwa/install-app-button";

function setStandalone(value: boolean) {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: value && query.includes("display-mode"),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      onchange: null,
      dispatchEvent: vi.fn(),
    })),
  });
}

describe("InstallAppButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setStandalone(false);
  });

  it("is hidden before the browser exposes install", () => {
    render(<InstallAppButton />);
    expect(screen.queryByRole("button", { name: /install/i })).toBeNull();
  });

  it("appears after beforeinstallprompt and prompts on click", async () => {
    const prompt = vi.fn().mockResolvedValue(undefined);
    const event = new Event("beforeinstallprompt") as Event & {
      prompt: typeof prompt;
      userChoice: Promise<{ outcome: "accepted"; platform: string }>;
      preventDefault: () => void;
    };
    event.prompt = prompt;
    event.userChoice = Promise.resolve({ outcome: "accepted", platform: "web" });
    event.preventDefault = vi.fn();

    render(<InstallAppButton />);
    act(() => {
      window.dispatchEvent(event);
    });

    const button = await screen.findByRole("button", { name: /install/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(prompt).toHaveBeenCalledOnce();
    });
  });

  it("hides after appinstalled", async () => {
    const event = new Event("beforeinstallprompt") as Event & {
      prompt: () => Promise<void>;
      userChoice: Promise<{ outcome: "dismissed"; platform: string }>;
      preventDefault: () => void;
    };
    event.prompt = vi.fn().mockResolvedValue(undefined);
    event.userChoice = Promise.resolve({
      outcome: "dismissed",
      platform: "web",
    });
    event.preventDefault = vi.fn();

    render(<InstallAppButton />);
    act(() => {
      window.dispatchEvent(event);
    });

    expect(await screen.findByRole("button", { name: /install/i })).toBeTruthy();

    act(() => {
      window.dispatchEvent(new Event("appinstalled"));
    });

    await waitFor(() => {
      expect(screen.queryByRole("button", { name: /install/i })).toBeNull();
    });
  });
});
