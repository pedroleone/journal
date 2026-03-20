import { eq } from "drizzle-orm";
import { db } from "../db";
import { deleteEncryptedObject } from "../r2";
import {
  entries,
  foodEntries,
  mediaItems,
  mediaItemNotes,
  notes,
  noteSubnotes,
} from "../schema";

type ImageArrayOwner = { images: string[] | null };
type LibraryItemOwner = { cover_image: string | null };

export type DemoSeedExistingContent = {
  journalEntries: ImageArrayOwner[];
  foodEntries: ImageArrayOwner[];
  notes: ImageArrayOwner[];
  noteSubnotes: ImageArrayOwner[];
  libraryItems: LibraryItemOwner[];
  libraryNotes: ImageArrayOwner[];
};

type DemoSeedResetDeps = {
  loadExistingUserContent: (userId: string) => Promise<DemoSeedExistingContent>;
  deleteUserRows: (userId: string) => Promise<void>;
  deleteEncryptedObject: (key: string) => Promise<void>;
};

async function loadExistingUserContent(userId: string): Promise<DemoSeedExistingContent> {
  const [
    journalEntries,
    foodRows,
    noteRows,
    subnoteRows,
    libraryRows,
    libraryNoteRows,
  ] = await Promise.all([
    db.select({ images: entries.images }).from(entries).where(eq(entries.userId, userId)),
    db.select({ images: foodEntries.images }).from(foodEntries).where(eq(foodEntries.userId, userId)),
    db.select({ images: notes.images }).from(notes).where(eq(notes.userId, userId)),
    db.select({ images: noteSubnotes.images }).from(noteSubnotes).where(eq(noteSubnotes.userId, userId)),
    db.select({ cover_image: mediaItems.cover_image }).from(mediaItems).where(eq(mediaItems.userId, userId)),
    db.select({ images: mediaItemNotes.images }).from(mediaItemNotes).where(eq(mediaItemNotes.userId, userId)),
  ]);

  return {
    journalEntries,
    foodEntries: foodRows,
    notes: noteRows,
    noteSubnotes: subnoteRows,
    libraryItems: libraryRows,
    libraryNotes: libraryNoteRows,
  };
}

async function deleteUserRows(userId: string) {
  await db.delete(noteSubnotes).where(eq(noteSubnotes.userId, userId));
  await db.delete(mediaItemNotes).where(eq(mediaItemNotes.userId, userId));
  await db.delete(entries).where(eq(entries.userId, userId));
  await db.delete(foodEntries).where(eq(foodEntries.userId, userId));
  await db.delete(notes).where(eq(notes.userId, userId));
  await db.delete(mediaItems).where(eq(mediaItems.userId, userId));
}

const defaultDeps: DemoSeedResetDeps = {
  loadExistingUserContent,
  deleteUserRows,
  deleteEncryptedObject,
};

export function collectDemoSeedImageKeys(records: DemoSeedExistingContent) {
  return Array.from(new Set([
    ...records.journalEntries.flatMap((entry) => entry.images ?? []),
    ...records.foodEntries.flatMap((entry) => entry.images ?? []),
    ...records.notes.flatMap((note) => note.images ?? []),
    ...records.noteSubnotes.flatMap((subnote) => subnote.images ?? []),
    ...records.libraryItems.flatMap((item) => (item.cover_image ? [item.cover_image] : [])),
    ...records.libraryNotes.flatMap((note) => note.images ?? []),
  ]));
}

export async function resetDemoSeedUserData(userId: string, deps: DemoSeedResetDeps = defaultDeps) {
  const existingContent = await deps.loadExistingUserContent(userId);
  const imageKeys = collectDemoSeedImageKeys(existingContent);

  await deps.deleteUserRows(userId);

  for (const imageKey of imageKeys) {
    await deps.deleteEncryptedObject(imageKey);
  }
}
