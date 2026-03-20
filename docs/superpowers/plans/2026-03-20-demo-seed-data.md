# Demo Seed Data Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a local-only `pnpm seed:demo -- --email <user@example.com>` command that wipes one existing user's app data and reseeds a realistic medium-density account with encrypted text and encrypted images.

**Architecture:** Keep the implementation in small server-side modules: one deterministic dataset builder, one curated image cache helper, one destructive reset helper, and one runner that validates the target user and orchestrates inserts/uploads. Use direct DB inserts plus existing crypto/R2 helpers so the script is fast and independent from OAuth/session flows while still matching the app's storage model.

**Tech Stack:** Next.js App Router, TypeScript, pnpm, Drizzle ORM, Turso/libSQL, Cloudflare R2, Vitest, Web Crypto

---

## File Structure

- Modify: `package.json`
  - Add the `seed:demo` script and declare `tsx` as a direct dev dependency if needed.
- Modify: `pnpm-lock.yaml`
  - Record the direct `tsx` dev dependency change.
- Modify: `.gitignore`
  - Ignore the local image cache directory.
- Modify: `lib/auth/user.ts`
  - Add exact-email lookup for the seed target.
- Modify: `tests/lib/auth-user.test.ts`
  - Cover the new email lookup helper.
- Create: `lib/dev/demo-seed-data.ts`
  - Build deterministic journal, food, notes, subnotes, library items, and library notes.
- Create: `tests/lib/demo-seed-data.test.ts`
  - Verify record counts, media coverage, and fixture shape.
- Create: `lib/dev/demo-seed-image-cache.ts`
  - Own the curated image manifest, cache directory, and download/reuse logic.
- Create: `tests/lib/demo-seed-image-cache.test.ts`
  - Verify cache hits skip downloads and missing files are fetched.
- Create: `lib/dev/demo-seed-reset.ts`
  - Collect owned image keys and clear the target user's existing data safely.
- Create: `tests/lib/demo-seed-reset.test.ts`
  - Cover image-key collection and destructive reset ordering.
- Create: `lib/dev/demo-seed-runner.ts`
  - Parse CLI args, validate local/dev environment, resolve the user, call reset/cache helpers, encrypt content, upload encrypted blobs, and insert seeded rows.
- Create: `tests/lib/demo-seed-runner.test.ts`
  - Cover CLI validation and orchestration behavior with mocked DB/R2/crypto helpers.
- Create: `scripts/seed-demo.ts`
  - Thin executable entrypoint that invokes the runner.

### Task 1: Add User Lookup And Seed Command Guards

**Files:**
- Modify: `lib/auth/user.ts`
- Modify: `tests/lib/auth-user.test.ts`
- Create: `lib/dev/demo-seed-runner.ts`
- Create: `tests/lib/demo-seed-runner.test.ts`

- [ ] **Step 1: Write the failing auth-user test for exact email lookup**

```ts
it("returns the matching user when email exists", async () => {
  mockDb.where.mockResolvedValueOnce([{ id: "user-1", email: "seed@example.com" }]);

  const user = await getUserByEmail("seed@example.com");

  expect(user).toEqual({ id: "user-1", email: "seed@example.com" });
});
```

- [ ] **Step 2: Write the failing runner tests for missing and unknown email**

```ts
it("rejects when --email is missing", async () => {
  await expect(runDemoSeed([], deps)).rejects.toThrow("--email is required");
});

it("rejects when the target user does not exist", async () => {
  deps.getUserByEmail.mockResolvedValueOnce(null);

  await expect(runDemoSeed(["--email", "missing@example.com"], deps))
    .rejects.toThrow('No user found for email "missing@example.com"');
});
```

- [ ] **Step 3: Run the focused tests to verify they fail**

Run: `pnpm test tests/lib/auth-user.test.ts tests/lib/demo-seed-runner.test.ts`
Expected: FAIL because `getUserByEmail` and the runner validation path do not exist yet.

- [ ] **Step 4: Implement the minimal lookup and guard logic**

```ts
export async function getUserByEmail(email: string) {
  const [user] = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(eq(users.email, email));

  return user ?? null;
}

export async function runDemoSeed(argv: string[], deps = defaultDeps) {
  const emailIndex = argv.indexOf("--email");
  const email = emailIndex >= 0 ? argv[emailIndex + 1] : undefined;
  if (!email) throw new Error("--email is required");

  assertLocalSeedEnvironment();

  const user = await deps.getUserByEmail(email);
  if (!user) throw new Error(`No user found for email "${email}"`);

  return { user };
}
```

- [ ] **Step 5: Run the focused tests to verify they pass**

Run: `pnpm test tests/lib/auth-user.test.ts tests/lib/demo-seed-runner.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add lib/auth/user.ts tests/lib/auth-user.test.ts lib/dev/demo-seed-runner.ts tests/lib/demo-seed-runner.test.ts
git commit -m "test: add demo seed user lookup guards"
```

### Task 2: Build The Deterministic Demo Dataset

**Files:**
- Create: `lib/dev/demo-seed-data.ts`
- Create: `tests/lib/demo-seed-data.test.ts`

- [ ] **Step 1: Write the failing dataset test for density and media coverage**

```ts
it("builds a medium-density dataset that covers every library media type", () => {
  const data = buildDemoSeedData("user-1");

  expect(data.journalEntries.length).toBeGreaterThanOrEqual(45);
  expect(data.foodEntries.length).toBeGreaterThanOrEqual(35);
  expect(data.notes.length).toBeGreaterThanOrEqual(12);
  expect(new Set(data.libraryItems.map((item) => item.type))).toEqual(
    new Set(["book", "album", "movie", "game", "video", "misc"]),
  );
});
```

- [ ] **Step 2: Add a failing dataset test for linked note/subnote/image references**

```ts
it("keeps seeded note and library-note relationships internally consistent", () => {
  const data = buildDemoSeedData("user-1");

  expect(data.noteSubnotes.every((subnote) => data.notes.some((note) => note.id === subnote.noteId))).toBe(true);
  expect(data.libraryNotes.every((note) => data.libraryItems.some((item) => item.id === note.mediaItemId))).toBe(true);
  expect(data.imageRefs.size).toBeGreaterThan(0);
});
```

- [ ] **Step 3: Run the dataset test to verify it fails**

Run: `pnpm test tests/lib/demo-seed-data.test.ts`
Expected: FAIL because the dataset builder does not exist yet.

- [ ] **Step 4: Implement the minimal deterministic dataset builder**

```ts
export function buildDemoSeedData(userId: string, now = new Date("2026-03-20T12:00:00.000Z")) {
  return {
    journalEntries: buildJournalFixtures(userId, now),
    foodEntries: buildFoodFixtures(userId, now),
    notes: buildNoteFixtures(userId, now),
    noteSubnotes: buildSubnoteFixtures(userId, now),
    libraryItems: buildLibraryFixtures(userId, now),
    libraryNotes: buildLibraryNoteFixtures(userId, now),
    imageRefs: new Set(["desk-book", "meal-bowl", "street-night"]),
  };
}
```

- [ ] **Step 5: Run the dataset test to verify it passes**

Run: `pnpm test tests/lib/demo-seed-data.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add lib/dev/demo-seed-data.ts tests/lib/demo-seed-data.test.ts
git commit -m "feat: add deterministic demo seed dataset"
```

### Task 3: Add Curated Image Cache Support

**Files:**
- Modify: `.gitignore`
- Create: `lib/dev/demo-seed-image-cache.ts`
- Create: `tests/lib/demo-seed-image-cache.test.ts`

- [ ] **Step 1: Write the failing cache test for download reuse**

```ts
it("reuses cached image files without fetching them again", async () => {
  await writeCachedImage(cacheDir, "desk-book.jpg", new Uint8Array([1, 2, 3]));

  const result = await ensureDemoSeedImageCache({ cacheDir, fetch: fetchMock });

  expect(fetchMock).not.toHaveBeenCalled();
  expect(result["desk-book"]).toContain("desk-book.jpg");
});
```

- [ ] **Step 2: Add a failing cache test for missing files**

```ts
it("downloads missing images into the cache directory", async () => {
  fetchMock.mockResolvedValueOnce(new Response(new Uint8Array([4, 5, 6]), {
    headers: { "content-type": "image/jpeg" },
  }));

  const result = await ensureDemoSeedImageCache({ cacheDir, fetch: fetchMock });

  expect(fetchMock).toHaveBeenCalledOnce();
  expect(result["desk-book"]).toContain("desk-book");
});
```

- [ ] **Step 3: Run the cache tests to verify they fail**

Run: `pnpm test tests/lib/demo-seed-image-cache.test.ts`
Expected: FAIL because the cache helper does not exist yet.

- [ ] **Step 4: Implement the manifest, cache helper, and git ignore entry**

```ts
export const DEMO_SEED_IMAGE_CACHE_DIR = ".demo-seed-cache/images";

export const DEMO_SEED_IMAGE_MANIFEST = [
  { id: "desk-book", filename: "desk-book.jpg", url: "https://..." },
  { id: "meal-bowl", filename: "meal-bowl.jpg", url: "https://..." },
];

export async function ensureDemoSeedImageCache({ cacheDir = DEMO_SEED_IMAGE_CACHE_DIR, fetch = globalThis.fetch }) {
  await mkdir(cacheDir, { recursive: true });
  // Return existing file paths when present; fetch only the missing manifest items.
}
```

- [ ] **Step 5: Run the cache tests to verify they pass**

Run: `pnpm test tests/lib/demo-seed-image-cache.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add .gitignore lib/dev/demo-seed-image-cache.ts tests/lib/demo-seed-image-cache.test.ts
git commit -m "feat: add demo seed image cache"
```

### Task 4: Add The Destructive Reset Helper

**Files:**
- Create: `lib/dev/demo-seed-reset.ts`
- Create: `tests/lib/demo-seed-reset.test.ts`

- [ ] **Step 1: Write the failing reset test for cross-domain image key collection**

```ts
it("collects image keys from every supported owner shape", () => {
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
```

- [ ] **Step 2: Add a failing reset orchestration test**

```ts
it("deletes user records before removing their encrypted image blobs", async () => {
  await resetDemoSeedUserData("user-1", deps);

  expect(deps.deleteRows).toHaveBeenCalledWith("note_subnotes", "user-1");
  expect(deps.deleteRows).toHaveBeenCalledWith("media_item_notes", "user-1");
  expect(deps.deleteEncryptedObject).toHaveBeenCalledWith("library/cover.enc");
});
```

- [ ] **Step 3: Run the reset tests to verify they fail**

Run: `pnpm test tests/lib/demo-seed-reset.test.ts`
Expected: FAIL because the reset helper does not exist yet.

- [ ] **Step 4: Implement the minimal reset helper**

```ts
export function collectDemoSeedImageKeys(records: DemoSeedExistingRecords) {
  return unique([
    ...records.journalEntries.flatMap((entry) => entry.images ?? []),
    ...records.foodEntries.flatMap((entry) => entry.images ?? []),
    ...records.notes.flatMap((note) => note.images ?? []),
    ...records.noteSubnotes.flatMap((subnote) => subnote.images ?? []),
    ...records.libraryItems.flatMap((item) => item.cover_image ? [item.cover_image] : []),
    ...records.libraryNotes.flatMap((note) => note.images ?? []),
  ]);
}

export async function resetDemoSeedUserData(userId: string, deps = defaultDeps) {
  const existing = await deps.loadExistingUserContent(userId);
  const keys = collectDemoSeedImageKeys(existing);
  await deps.deleteUserRows(userId);
  for (const key of keys) await deps.deleteEncryptedObject(key);
}
```

- [ ] **Step 5: Run the reset tests to verify they pass**

Run: `pnpm test tests/lib/demo-seed-reset.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add lib/dev/demo-seed-reset.ts tests/lib/demo-seed-reset.test.ts
git commit -m "feat: add demo seed reset helper"
```

### Task 5: Wire The Runner, Upload Images, And Expose The CLI Command

**Files:**
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Modify: `lib/dev/demo-seed-runner.ts`
- Modify: `tests/lib/demo-seed-runner.test.ts`
- Create: `scripts/seed-demo.ts`

- [ ] **Step 1: Extend the runner test with a failing happy-path orchestration case**

```ts
it("resets the user, uploads encrypted images, and inserts seeded rows", async () => {
  deps.getUserByEmail.mockResolvedValue({ id: "user-1", email: "seed@example.com" });
  deps.ensureDemoSeedImageCache.mockResolvedValue({ "desk-book": "/tmp/desk-book.jpg" });
  deps.buildDemoSeedData.mockReturnValue(makeDemoSeedData());

  await runDemoSeed(["--email", "seed@example.com"], deps);

  expect(deps.resetDemoSeedUserData).toHaveBeenCalledWith("user-1");
  expect(deps.putEncryptedObject).toHaveBeenCalled();
  expect(deps.insertEntries).toHaveBeenCalled();
});
```

- [ ] **Step 2: Run the runner test to verify it fails**

Run: `pnpm test tests/lib/demo-seed-runner.test.ts`
Expected: FAIL because the runner only validates arguments and does not seed data yet.

- [ ] **Step 3: Add `tsx` and the `seed:demo` package script**

Run: `pnpm add -D tsx`
Expected: PASS and `package.json` / `pnpm-lock.yaml` update.

- [ ] **Step 4: Implement the minimal runner and script entrypoint**

```ts
export async function runDemoSeed(argv: string[], deps = defaultDeps) {
  const email = readEmailArg(argv);
  assertLocalSeedEnvironment();
  const user = await deps.getUserByEmail(email);
  if (!user) throw new Error(`No user found for email "${email}"`);

  const cachedImages = await deps.ensureDemoSeedImageCache();
  const seedData = deps.buildDemoSeedData(user.id);

  await deps.resetDemoSeedUserData(user.id);
  await insertDemoSeedRecords({ userId: user.id, seedData, cachedImages, deps });
}
```

```ts
// scripts/seed-demo.ts
import { runDemoSeed } from "@/lib/dev/demo-seed-runner";

runDemoSeed(process.argv.slice(2)).catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
```

- [ ] **Step 5: Run the focused runner tests to verify they pass**

Run: `pnpm test tests/lib/demo-seed-runner.test.ts`
Expected: PASS

- [ ] **Step 6: Run the full new-unit-test set**

Run: `pnpm test tests/lib/auth-user.test.ts tests/lib/demo-seed-data.test.ts tests/lib/demo-seed-image-cache.test.ts tests/lib/demo-seed-reset.test.ts tests/lib/demo-seed-runner.test.ts`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add package.json pnpm-lock.yaml lib/auth/user.ts lib/dev/demo-seed-data.ts lib/dev/demo-seed-image-cache.ts lib/dev/demo-seed-reset.ts lib/dev/demo-seed-runner.ts scripts/seed-demo.ts tests/lib/auth-user.test.ts tests/lib/demo-seed-data.test.ts tests/lib/demo-seed-image-cache.test.ts tests/lib/demo-seed-reset.test.ts tests/lib/demo-seed-runner.test.ts .gitignore
git commit -m "feat: add local demo seed command"
```

### Task 6: Verify The End-To-End Flow

**Files:**
- Verify only

- [ ] **Step 1: Run the full test suite**

Run: `pnpm test`
Expected: PASS

- [ ] **Step 2: Run the seed command against a known local user**

Run: `pnpm seed:demo -- --email <existing-local-user@example.com>`
Expected: PASS with console output identifying the matched user and summarizing the seeded counts.

- [ ] **Step 3: Manual verification in the app**

Check:
- journal browse shows multiple recent dates and image-backed entries
- food screens show varied meal-slot coverage and a few uncategorized items
- notes screens show tags, subnotes, and image-backed notes
- library browse/detail screens show every supported type, varied statuses, ratings, covers, and note threads
- encrypted images load successfully after seeding

- [ ] **Step 4: Commit verification-ready state**

```bash
git add package.json pnpm-lock.yaml lib/auth/user.ts lib/dev/demo-seed-data.ts lib/dev/demo-seed-image-cache.ts lib/dev/demo-seed-reset.ts lib/dev/demo-seed-runner.ts scripts/seed-demo.ts tests/lib/auth-user.test.ts tests/lib/demo-seed-data.test.ts tests/lib/demo-seed-image-cache.test.ts tests/lib/demo-seed-reset.test.ts tests/lib/demo-seed-runner.test.ts .gitignore
git commit -m "chore: verify demo seed workflow"
```
