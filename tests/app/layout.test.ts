import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("layout navigation shell", () => {
  it("exports viewport fit cover for safe-area layouts", () => {
    const layout = readFileSync(path.resolve(process.cwd(), "app/layout.tsx"), "utf8");

    expect(layout).toContain('viewportFit: "cover"');
  });

  it("adds mobile bottom-bar clearance only when the app shell shows navigation", () => {
    const shell = readFileSync(path.resolve(process.cwd(), "components/app-shell.tsx"), "utf8");

    expect(shell).toContain('pathname === "/login" || pathname === "/"');
    expect(shell).toContain('"pb-20 md:pb-0"');
  });
});
