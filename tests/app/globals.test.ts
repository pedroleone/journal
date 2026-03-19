import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("globals.css", () => {
  it("hides native spinner controls for number inputs", () => {
    const css = readFileSync(path.resolve(process.cwd(), "app/globals.css"), "utf8");

    expect(css).toContain('input[type="number"]::-webkit-outer-spin-button');
    expect(css).toContain('input[type="number"]::-webkit-inner-spin-button');
    expect(css).toContain("-webkit-appearance: none;");
    expect(css).toContain('input[type="number"] {');
    expect(css).toContain("-moz-appearance: textfield;");
  });
});
