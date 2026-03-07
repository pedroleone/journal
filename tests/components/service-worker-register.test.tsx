// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";

describe("registerServiceWorker", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it("does nothing outside production", async () => {
    vi.stubEnv("NODE_ENV", "test");
    const register = vi.fn();
    Object.defineProperty(window.navigator, "serviceWorker", {
      configurable: true,
      value: {
        register,
        addEventListener: vi.fn(),
      },
    });

    const { registerServiceWorker } = await import(
      "@/components/pwa/service-worker-register"
    );
    const result = await registerServiceWorker();

    expect(result).toBeNull();
    expect(register).not.toHaveBeenCalled();
  });

  it("registers the service worker in production when supported", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const registration = {};
    const register = vi.fn().mockResolvedValue(registration);
    const addEventListener = vi.fn();
    Object.defineProperty(window.navigator, "serviceWorker", {
      configurable: true,
      value: {
        register,
        addEventListener,
      },
    });

    const { registerServiceWorker } = await import(
      "@/components/pwa/service-worker-register"
    );
    const result = await registerServiceWorker();

    expect(register).toHaveBeenCalledWith("/sw.js");
    expect(addEventListener).toHaveBeenCalledWith(
      "controllerchange",
      expect.any(Function),
    );
    expect(result).toBe(registration);
  });
});
