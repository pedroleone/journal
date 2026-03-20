import { afterEach, describe, expect, it, vi } from "vitest";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

describe("ensureDemoSeedImageCache", () => {
  let cacheDir: string | null = null;

  afterEach(async () => {
    if (cacheDir) {
      await rm(cacheDir, { recursive: true, force: true });
      cacheDir = null;
    }
  });

  it("reuses cached image files without fetching them again", async () => {
    cacheDir = await mkdtemp(path.join(tmpdir(), "demo-seed-cache-"));
    const fetchMock = vi.fn().mockImplementation(async () =>
      new Response(new Uint8Array([7, 8, 9]), {
        status: 200,
        headers: { "content-type": "image/jpeg" },
      }));
    const { ensureDemoSeedImageCache, DEMO_SEED_IMAGE_MANIFEST } = await import(
      "@/lib/dev/demo-seed-image-cache"
    );
    const cached = DEMO_SEED_IMAGE_MANIFEST[0];
    const cachedPath = path.join(cacheDir, cached.filename);
    await writeFile(cachedPath, new Uint8Array([1, 2, 3]));

    const result = await ensureDemoSeedImageCache({ cacheDir, fetch: fetchMock });

    expect(fetchMock).toHaveBeenCalledTimes(DEMO_SEED_IMAGE_MANIFEST.length - 1);
    expect(result[cached.id]).toBe(cachedPath);
  });

  it("downloads missing images into the cache directory", async () => {
    cacheDir = await mkdtemp(path.join(tmpdir(), "demo-seed-cache-"));
    const fetchMock = vi.fn().mockImplementation(async () =>
      new Response(new Uint8Array([4, 5, 6]), {
        status: 200,
        headers: { "content-type": "image/jpeg" },
      }));
    const { ensureDemoSeedImageCache, DEMO_SEED_IMAGE_MANIFEST } = await import(
      "@/lib/dev/demo-seed-image-cache"
    );

    const result = await ensureDemoSeedImageCache({ cacheDir, fetch: fetchMock });
    const downloadedPath = result[DEMO_SEED_IMAGE_MANIFEST[0].id];

    expect(fetchMock).toHaveBeenCalledTimes(DEMO_SEED_IMAGE_MANIFEST.length);
    await expect(readFile(downloadedPath)).resolves.toEqual(Buffer.from([4, 5, 6]));
  });
});
