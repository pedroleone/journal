import { describe, it, expect } from "vitest";
import { getFieldDisplayMode } from "@/components/library/library-detail";

describe("library detail view/edit toggle", () => {
  it("defaults to view mode", () => {
    expect(getFieldDisplayMode(false)).toBe("view");
  });

  it("returns edit mode when editMode is true", () => {
    expect(getFieldDisplayMode(true)).toBe("edit");
  });
});
