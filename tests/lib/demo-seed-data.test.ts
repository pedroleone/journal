import { describe, expect, it } from "vitest";
import { buildDemoSeedData } from "@/lib/dev/demo-seed-data";

describe("buildDemoSeedData", () => {
  it("builds a medium-density dataset that covers every library media type", () => {
    const data = buildDemoSeedData("user-1");

    expect(data.journalEntries.length).toBeGreaterThanOrEqual(45);
    expect(data.foodEntries.length).toBeGreaterThanOrEqual(35);
    expect(data.notes.length).toBeGreaterThanOrEqual(12);
    expect(data.libraryItems.length).toBeGreaterThanOrEqual(18);
    expect(new Set(data.libraryItems.map((item) => item.type))).toEqual(
      new Set(["book", "album", "movie", "game", "video", "misc"]),
    );
  });

  it("keeps seeded note and library-note relationships internally consistent", () => {
    const data = buildDemoSeedData("user-1");

    expect(
      data.noteSubnotes.every((subnote) => data.notes.some((note) => note.id === subnote.noteId)),
    ).toBe(true);
    expect(
      data.libraryNotes.every((note) =>
        data.libraryItems.some((item) => item.id === note.mediaItemId)),
    ).toBe(true);
    expect(data.imageRefs.size).toBeGreaterThan(0);
  });

  it("includes seeded image references across multiple app surfaces", () => {
    const data = buildDemoSeedData("user-1");

    const journalImageCount = data.journalEntries.filter((entry) => entry.imageRefs.length > 0).length;
    const noteImageCount = data.notes.filter((note) => note.imageRefs.length > 0).length;
    const libraryCoverCount = data.libraryItems.filter((item) => item.coverImageRef !== null).length;

    expect(journalImageCount).toBeGreaterThan(0);
    expect(noteImageCount).toBeGreaterThan(0);
    expect(libraryCoverCount).toBeGreaterThan(0);
  });
});
