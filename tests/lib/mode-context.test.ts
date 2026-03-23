import { describe, expect, it } from "vitest";
import { getModeFromPathname } from "@/lib/mode-context";

describe("getModeFromPathname", () => {
  it("treats food routes as food mode", () => {
    expect(getModeFromPathname("/food")).toBe("food");
    expect(getModeFromPathname("/food/entry/123")).toBe("food");
  });

  it("defaults non-food routes to journal mode", () => {
    expect(getModeFromPathname("/journal/browse")).toBe("journal");
    expect(getModeFromPathname("/journal/write")).toBe("journal");
    expect(getModeFromPathname("/settings")).toBe("journal");
  });
});
