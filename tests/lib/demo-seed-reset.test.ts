import { describe, expect, it, vi } from "vitest";

describe("collectDemoSeedImageKeys", () => {
  it("collects image keys from every supported owner shape", async () => {
    const { collectDemoSeedImageKeys } = await import("@/lib/dev/demo-seed-reset");

    const keys = collectDemoSeedImageKeys({
      journalEntries: [{ images: ["journal/a.enc"] }],
      foodEntries: [{ images: ["food/a.enc"] }],
      notes: [{ images: ["notes/a.enc"] }],
      noteSubnotes: [{ images: ["subnotes/a.enc"] }],
      libraryItems: [{ cover_image: "library/cover.enc" }],
      libraryNotes: [{ images: ["library-notes/a.enc"] }],
    });

    expect(keys).toEqual([
      "journal/a.enc",
      "food/a.enc",
      "notes/a.enc",
      "subnotes/a.enc",
      "library/cover.enc",
      "library-notes/a.enc",
    ]);
  });
});

describe("resetDemoSeedUserData", () => {
  it("deletes user records before removing their encrypted image blobs", async () => {
    const deleteUserRows = vi.fn().mockResolvedValue(undefined);
    const deleteEncryptedObject = vi.fn().mockResolvedValue(undefined);
    const loadExistingUserContent = vi.fn().mockResolvedValue({
      journalEntries: [{ images: ["journal/a.enc"] }],
      foodEntries: [{ images: [] }],
      notes: [{ images: ["notes/a.enc"] }],
      noteSubnotes: [{ images: ["subnotes/a.enc"] }],
      libraryItems: [{ cover_image: "library/cover.enc" }],
      libraryNotes: [{ images: ["library-notes/a.enc"] }],
    });
    const { resetDemoSeedUserData } = await import("@/lib/dev/demo-seed-reset");

    await resetDemoSeedUserData("user-1", {
      loadExistingUserContent,
      deleteUserRows,
      deleteEncryptedObject,
    });

    expect(deleteUserRows).toHaveBeenCalledWith("user-1");
    expect(deleteEncryptedObject).toHaveBeenCalledWith("journal/a.enc");
    expect(deleteEncryptedObject).toHaveBeenCalledWith("library/cover.enc");
    expect(deleteUserRows.mock.invocationCallOrder[0]).toBeLessThan(
      deleteEncryptedObject.mock.invocationCallOrder[0],
    );
  });
});
