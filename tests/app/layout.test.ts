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

    expect(layout).toContain('{ media: "(prefers-color-scheme: light)", color: "#f7f8fa" }');
    expect(layout).toContain('{ media: "(prefers-color-scheme: dark)", color: "#111118" }');
  });

  it("does not inline theme bootstrap code that mutates the html element before hydration", () => {
    const layout = readFileSync(path.resolve(process.cwd(), "app/layout.tsx"), "utf8");

    expect(layout).not.toContain("document.documentElement.classList.add('dark')");
    expect(layout).not.toContain("localStorage.getItem('theme')");
  });
});
