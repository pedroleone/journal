import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("layout navigation shell", () => {
  it("exports viewport fit cover for safe-area layouts", () => {
    const layout = readFileSync(path.resolve(process.cwd(), "app/layout.tsx"), "utf8");

    expect(layout).toContain('viewportFit: "cover"');
  });

  it("exports remapped theme colors for light and dark browser chrome", () => {
    const layout = readFileSync(path.resolve(process.cwd(), "app/layout.tsx"), "utf8");

    expect(layout).toContain('{ media: "(prefers-color-scheme: light)", color: "#f4efe6" }');
    expect(layout).toContain('{ media: "(prefers-color-scheme: dark)", color: "#111118" }');
  });
});
