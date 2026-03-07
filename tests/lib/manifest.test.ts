import { describe, expect, it } from "vitest";
import manifest from "@/app/manifest";

describe("manifest", () => {
  it("returns install metadata for the app shell", () => {
    const data = manifest();

    expect(data.name).toBe("Journal");
    expect(data.start_url).toBe("/");
    expect(data.display).toBe("standalone");
    expect(data.icons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          src: "/icons/icon-192.png",
          sizes: "192x192",
        }),
        expect.objectContaining({
          src: "/icons/icon-512.png",
          sizes: "512x512",
        }),
        expect.objectContaining({
          src: "/icons/icon-maskable-512.png",
          purpose: "maskable",
        }),
      ]),
    );
  });
});
