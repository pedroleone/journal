import { access, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export const DEMO_SEED_IMAGE_CACHE_DIR = ".demo-seed-cache/images";

export const DEMO_SEED_IMAGE_MANIFEST = [
  { id: "desk-book", filename: "desk-book.jpg", url: "https://picsum.photos/seed/desk-book/1600/1200.jpg" },
  { id: "meal-bowl", filename: "meal-bowl.jpg", url: "https://picsum.photos/seed/meal-bowl/1600/1200.jpg" },
  { id: "street-night", filename: "street-night.jpg", url: "https://picsum.photos/seed/street-night/1600/1200.jpg" },
  { id: "vinyl-corner", filename: "vinyl-corner.jpg", url: "https://picsum.photos/seed/vinyl-corner/1600/1200.jpg" },
  { id: "movie-theater", filename: "movie-theater.jpg", url: "https://picsum.photos/seed/movie-theater/1600/1200.jpg" },
  { id: "game-handheld", filename: "game-handheld.jpg", url: "https://picsum.photos/seed/game-handheld/1600/1200.jpg" },
  { id: "notebook-flatlay", filename: "notebook-flatlay.jpg", url: "https://picsum.photos/seed/notebook-flatlay/1600/1200.jpg" },
  { id: "coffee-window", filename: "coffee-window.jpg", url: "https://picsum.photos/seed/coffee-window/1600/1200.jpg" },
  { id: "sunset-walk", filename: "sunset-walk.jpg", url: "https://picsum.photos/seed/sunset-walk/1600/1200.jpg" },
  { id: "shelf-detail", filename: "shelf-detail.jpg", url: "https://picsum.photos/seed/shelf-detail/1600/1200.jpg" },
] as const;

type FetchLike = typeof fetch;

type EnsureDemoSeedImageCacheOptions = {
  cacheDir?: string;
  fetch?: FetchLike;
};

export async function ensureDemoSeedImageCache({
  cacheDir = DEMO_SEED_IMAGE_CACHE_DIR,
  fetch = globalThis.fetch,
}: EnsureDemoSeedImageCacheOptions = {}) {
  if (!fetch) {
    throw new Error("Fetch API is not available for demo seed image downloads");
  }

  await mkdir(cacheDir, { recursive: true });

  const cachedPaths: Record<string, string> = {};

  for (const image of DEMO_SEED_IMAGE_MANIFEST) {
    const filePath = path.join(cacheDir, image.filename);

    try {
      await access(filePath);
      cachedPaths[image.id] = filePath;
      continue;
    } catch {
      // File is missing, fetch it below.
    }

    const response = await fetch(image.url);
    if (!response.ok) {
      throw new Error(`Failed to download demo seed image "${image.id}"`);
    }

    const body = new Uint8Array(await response.arrayBuffer());
    await writeFile(filePath, body);
    cachedPaths[image.id] = filePath;
  }

  return cachedPaths;
}
