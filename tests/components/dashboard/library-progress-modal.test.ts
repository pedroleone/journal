import { describe, it, expect } from "vitest";
import { buildProgressPayload } from "@/components/dashboard/library-progress-modal";

describe("buildProgressPayload", () => {
  // ebook
  describe("ebook", () => {
    it("returns progressPercent for valid ebook input", () => {
      expect(buildProgressPayload("ebook", "45", null)).toEqual({ progressPercent: 45 });
    });

    it("returns progressPercent of 0 for ebook", () => {
      expect(buildProgressPayload("ebook", "0", null)).toEqual({ progressPercent: 0 });
    });

    it("returns progressPercent of 100 for ebook", () => {
      expect(buildProgressPayload("ebook", "100", null)).toEqual({ progressPercent: 100 });
    });

    it("truncates fractional ebook percent", () => {
      expect(buildProgressPayload("ebook", "45.9", null)).toEqual({ progressPercent: 45 });
    });

    it("returns null for ebook with non-numeric draft", () => {
      expect(buildProgressPayload("ebook", "abc", null)).toBeNull();
    });

    it("returns null for ebook percent > 100", () => {
      expect(buildProgressPayload("ebook", "101", null)).toBeNull();
    });

    it("returns null for ebook percent < 0", () => {
      expect(buildProgressPayload("ebook", "-1", null)).toBeNull();
    });
  });

  // physical
  describe("physical", () => {
    it("returns currentPage for valid physical input", () => {
      expect(buildProgressPayload("physical", "120", null)).toEqual({ currentPage: 120 });
    });

    it("truncates fractional page number", () => {
      expect(buildProgressPayload("physical", "120.7", null)).toEqual({ currentPage: 120 });
    });

    it("returns null for physical with page 0", () => {
      expect(buildProgressPayload("physical", "0", null)).toBeNull();
    });

    it("returns null for physical with negative page", () => {
      expect(buildProgressPayload("physical", "-5", null)).toBeNull();
    });

    it("returns null for physical with non-numeric draft", () => {
      expect(buildProgressPayload("physical", "abc", null)).toBeNull();
    });
  });

  // audiobook
  describe("audiobook", () => {
    it("returns currentMinutes for valid audiobook input", () => {
      // total = 240 min, remaining = 60 min → listened = 180
      expect(buildProgressPayload("audiobook", "1h", 240)).toEqual({ currentMinutes: 180 });
    });

    it("returns currentMinutes for h+min format", () => {
      // total = 300 min, remaining = 90 min → listened = 210
      expect(buildProgressPayload("audiobook", "1h 30min", 300)).toEqual({ currentMinutes: 210 });
    });

    it("returns null when totalDurationMinutes is null", () => {
      expect(buildProgressPayload("audiobook", "1h", null)).toBeNull();
    });

    it("returns null when remaining time exceeds total (listened would be zero or negative)", () => {
      // total = 60 min, remaining = 60 min → listened = 0, invalid
      expect(buildProgressPayload("audiobook", "1h", 60)).toBeNull();
    });

    it("returns null when remaining > total", () => {
      // total = 30 min, remaining = 60 min → listened = -30, invalid
      expect(buildProgressPayload("audiobook", "1h", 30)).toBeNull();
    });

    it("returns null for invalid audiobook time string", () => {
      expect(buildProgressPayload("audiobook", "notatime", 240)).toBeNull();
    });

    it("returns null for empty audiobook draft", () => {
      expect(buildProgressPayload("audiobook", "", 240)).toBeNull();
    });
  });
});
