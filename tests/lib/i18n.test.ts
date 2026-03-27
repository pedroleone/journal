import { describe, expect, it } from "vitest";
import { formatRelativeDate } from "@/lib/i18n";

describe("formatRelativeDate", () => {
  function isoFromNow(daysAgo: number): string {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString();
  }

  it("returns 'Today' for a date from today", () => {
    expect(formatRelativeDate(isoFromNow(0), "en-US")).toBe("Today");
  });

  it("returns 'Yesterday' for a date from 1 day ago", () => {
    expect(formatRelativeDate(isoFromNow(1), "en-US")).toBe("Yesterday");
  });

  it("returns 'N days ago' for dates 2–6 days ago", () => {
    expect(formatRelativeDate(isoFromNow(2), "en-US")).toBe("2 days ago");
    expect(formatRelativeDate(isoFromNow(5), "en-US")).toBe("5 days ago");
    expect(formatRelativeDate(isoFromNow(6), "en-US")).toBe("6 days ago");
  });

  it("returns an absolute date for dates 7+ days ago", () => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const result = formatRelativeDate(sevenDaysAgo.toISOString(), "en-US");
    // Should be a short locale date string like "Mar 18, 2026"
    expect(result).not.toMatch(/ago/);
    expect(result.length).toBeGreaterThan(0);
  });

  it("formats absolute dates using the provided locale", () => {
    const oldDate = new Date("2020-01-15T12:00:00Z");
    const enResult = formatRelativeDate(oldDate.toISOString(), "en-US");
    const ptResult = formatRelativeDate(oldDate.toISOString(), "pt-BR");
    // Both should be absolute (no "ago") but may differ in format
    expect(enResult).not.toMatch(/ago/);
    expect(ptResult).not.toMatch(/ago/);
  });
});
