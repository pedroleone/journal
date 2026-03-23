import { describe, expect, it } from "vitest";
import { getSafeReturnTo } from "@/app/food/entry/[id]/page";

describe("getSafeReturnTo", () => {
  it("keeps a safe /food return target with workspace query params", () => {
    expect(getSafeReturnTo("/food?date=2026-03-19&view=inbox")).toBe(
      "/food?date=2026-03-19&view=inbox",
    );
  });

  it("falls back to /food for unsafe return targets", () => {
    expect(getSafeReturnTo("https://evil.example/steal")).toBe("/food");
    expect(getSafeReturnTo("/notes/browse")).toBe("/food");
    expect(getSafeReturnTo(null)).toBe("/food");
  });
});
