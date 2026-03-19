import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("layout navigation shell", () => {
  it("exports viewport fit cover for safe-area layouts", () => {
    const layout = readFileSync(path.resolve(process.cwd(), "app/layout.tsx"), "utf8");

    expect(layout).toContain('viewportFit: "cover"');
  });
});
