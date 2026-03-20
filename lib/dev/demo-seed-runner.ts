import { readFile } from "node:fs/promises";
import path from "node:path";
import { db } from "../db";
import { deleteEncryptedObject, putEncryptedObject } from "../r2";
import {
  entries,
  foodEntries,
  mediaItems,
  mediaItemNotes,
  notes,
  noteSubnotes,
} from "../schema";
import {
  encryptServerBuffer,
  encryptServerText,
} from "../server-crypto";
import { getUserByEmail } from "../auth/user";
import type { DemoSeedData } from "./demo-seed-data";
import { buildDemoSeedData } from "./demo-seed-data";
import { ensureDemoSeedImageCache } from "./demo-seed-image-cache";
import { resetDemoSeedUserData } from "./demo-seed-reset";

type DemoSeedUser = {
  id: string;
  email: string;
};

type DemoSeedCachedImages = Record<string, string>;

type PersistDemoSeedDataInput = {
  user: DemoSeedUser;
  seedData: DemoSeedData;
  cachedImages: DemoSeedCachedImages;
};

type DemoSeedRunnerDeps = {
  getUserByEmail: (email: string) => Promise<DemoSeedUser | null>;
  ensureDemoSeedImageCache: () => Promise<DemoSeedCachedImages>;
  buildDemoSeedData: (userId: string) => DemoSeedData;
  preflightStorage: (input: PersistDemoSeedDataInput) => Promise<void>;
  resetDemoSeedUserData: (userId: string) => Promise<void>;
  persistDemoSeedData: (input: PersistDemoSeedDataInput) => Promise<void>;
  log: (message: string) => void;
};

const defaultDeps: DemoSeedRunnerDeps = {
  getUserByEmail,
  ensureDemoSeedImageCache,
  buildDemoSeedData,
  preflightStorage,
  resetDemoSeedUserData,
  persistDemoSeedData,
  log: console.log,
};

function readEmailArg(argv: string[]) {
  const emailIndex = argv.indexOf("--email");
  return emailIndex >= 0 ? argv[emailIndex + 1] : undefined;
}

function assertLocalSeedEnvironment() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Demo seed is limited to local/dev environments");
  }

  const requiredEnv = [
    "SERVER_ENCRYPTION_SECRET",
    "R2_ENDPOINT",
    "R2_ACCESS_KEY",
    "R2_SECRET_KEY",
    "R2_BUCKET",
  ];

  for (const envName of requiredEnv) {
    if (!process.env[envName]) {
      throw new Error(`${envName} is required for demo seed`);
    }
  }
}

function getImageContentType(filePath: string) {
  return path.extname(filePath).toLowerCase() === ".png"
    ? "image/png"
    : "image/jpeg";
}

async function uploadSeedImage(
  userId: string,
  ownerKind: "journal" | "food" | "note" | "note_subnote" | "library" | "library_note",
  ownerId: string,
  imageRef: string,
  cachedImages: DemoSeedCachedImages,
) {
  const sourcePath = cachedImages[imageRef];
  if (!sourcePath) {
    throw new Error(`Missing cached demo seed image "${imageRef}"`);
  }

  const buffer = new Uint8Array(await readFile(sourcePath));
  const encrypted = await encryptServerBuffer(buffer);
  const key = `${userId}/${ownerKind}/${ownerId}/${imageRef}.enc`;

  await putEncryptedObject({
    key,
    body: encrypted.ciphertext,
    iv: encrypted.iv,
    contentType: getImageContentType(sourcePath),
  });

  return key;
}

async function uploadSeedImages(
  userId: string,
  ownerKind: "journal" | "food" | "note" | "note_subnote" | "library_note",
  ownerId: string,
  imageRefs: string[],
  cachedImages: DemoSeedCachedImages,
) {
  return Promise.all(
    imageRefs.map((imageRef) => uploadSeedImage(userId, ownerKind, ownerId, imageRef, cachedImages)),
  );
}

async function encryptSeedText(content: string) {
  const encrypted = await encryptServerText(content);
  return {
    encrypted_content: encrypted.ciphertext,
    iv: encrypted.iv,
  };
}

async function persistDemoSeedData({ user, seedData, cachedImages }: PersistDemoSeedDataInput) {
  for (const entry of seedData.journalEntries) {
    const images = await uploadSeedImages(user.id, "journal", entry.id, entry.imageRefs, cachedImages);
    const encrypted = await encryptSeedText(entry.content);

    await db.insert(entries).values({
      id: entry.id,
      userId: user.id,
      source: "web",
      year: entry.year,
      month: entry.month,
      day: entry.day,
      hour: entry.hour,
      ...encrypted,
      images: images.length > 0 ? images : null,
      tags: null,
      created_at: entry.createdAt,
      updated_at: entry.updatedAt,
    });
  }

  for (const entry of seedData.foodEntries) {
    const images = await uploadSeedImages(user.id, "food", entry.id, entry.imageRefs, cachedImages);
    const encrypted = await encryptSeedText(entry.content);

    await db.insert(foodEntries).values({
      id: entry.id,
      userId: user.id,
      source: "web",
      year: entry.year,
      month: entry.month,
      day: entry.day,
      hour: entry.hour,
      meal_slot: entry.mealSlot,
      assigned_at: entry.assignedAt,
      logged_at: entry.loggedAt,
      ...encrypted,
      images: images.length > 0 ? images : null,
      tags: entry.tags.length > 0 ? entry.tags : null,
      created_at: entry.createdAt,
      updated_at: entry.updatedAt,
    });
  }

  for (const note of seedData.notes) {
    const images = await uploadSeedImages(user.id, "note", note.id, note.imageRefs, cachedImages);
    const encrypted = await encryptSeedText(note.content);

    await db.insert(notes).values({
      id: note.id,
      userId: user.id,
      title: note.title,
      tags: note.tags.length > 0 ? note.tags : null,
      images: images.length > 0 ? images : null,
      ...encrypted,
      created_at: note.createdAt,
      updated_at: note.updatedAt,
    });
  }

  for (const subnote of seedData.noteSubnotes) {
    const images = await uploadSeedImages(
      user.id,
      "note_subnote",
      subnote.id,
      subnote.imageRefs,
      cachedImages,
    );
    const encrypted = await encryptSeedText(subnote.content);

    await db.insert(noteSubnotes).values({
      id: subnote.id,
      noteId: subnote.noteId,
      userId: user.id,
      images: images.length > 0 ? images : null,
      ...encrypted,
      created_at: subnote.createdAt,
      updated_at: subnote.updatedAt,
    });
  }

  for (const item of seedData.libraryItems) {
    const coverImage = item.coverImageRef
      ? await uploadSeedImage(user.id, "library", item.id, item.coverImageRef, cachedImages)
      : null;
    const encrypted = await encryptSeedText(item.content);

    await db.insert(mediaItems).values({
      id: item.id,
      userId: user.id,
      type: item.type,
      title: item.title,
      creator: item.creator,
      url: item.url,
      status: item.status,
      rating: item.rating,
      reactions: item.reactions.length > 0 ? item.reactions : null,
      genres: item.genres.length > 0 ? item.genres : null,
      metadata: item.metadata,
      cover_image: coverImage,
      ...encrypted,
      added_at: item.addedAt,
      started_at: item.startedAt,
      finished_at: item.finishedAt,
      created_at: item.createdAt,
      updated_at: item.updatedAt,
    });
  }

  for (const note of seedData.libraryNotes) {
    const images = await uploadSeedImages(
      user.id,
      "library_note",
      note.id,
      note.imageRefs,
      cachedImages,
    );
    const encrypted = await encryptSeedText(note.content);

    await db.insert(mediaItemNotes).values({
      id: note.id,
      mediaItemId: note.mediaItemId,
      userId: user.id,
      images: images.length > 0 ? images : null,
      ...encrypted,
      created_at: note.createdAt,
      updated_at: note.updatedAt,
    });
  }
}

async function preflightStorage({ user, seedData, cachedImages }: PersistDemoSeedDataInput) {
  const [firstImageRef] = seedData.imageRefs;
  if (!firstImageRef) {
    return;
  }

  const sourcePath = cachedImages[firstImageRef];
  if (!sourcePath) {
    throw new Error(`Missing cached demo seed image "${firstImageRef}"`);
  }

  const buffer = new Uint8Array(await readFile(sourcePath));
  const encrypted = await encryptServerBuffer(buffer);
  const key = `${user.id}/seed-preflight/${firstImageRef}.enc`;

  await putEncryptedObject({
    key,
    body: encrypted.ciphertext,
    iv: encrypted.iv,
    contentType: getImageContentType(sourcePath),
  });

  await deleteEncryptedObject(key);
}

export async function runDemoSeed(argv: string[], deps: DemoSeedRunnerDeps = defaultDeps) {
  const email = readEmailArg(argv);
  if (!email) {
    throw new Error("--email is required");
  }

  assertLocalSeedEnvironment();

  const user = await deps.getUserByEmail(email);
  if (!user) {
    throw new Error(`No user found for email "${email}"`);
  }

  deps.log(`Matched user: ${user.email} ("${user.id}")`);

  const cachedImages = await deps.ensureDemoSeedImageCache();
  const seedData = deps.buildDemoSeedData(user.id);
  await deps.preflightStorage({ user, seedData, cachedImages });
  await deps.resetDemoSeedUserData(user.id);
  await deps.persistDemoSeedData({
    user,
    seedData,
    cachedImages,
  });

  deps.log(
    `Seeded ${seedData.journalEntries.length} journal entries, `
      + `${seedData.foodEntries.length} food entries, `
      + `${seedData.notes.length} notes, `
      + `${seedData.libraryItems.length} library items.`,
  );

  return { user };
}
