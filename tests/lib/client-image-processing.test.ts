// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";
import { prepareImageForUpload } from "@/lib/client-image-processing";
import { MAX_IMAGE_UPLOAD_BYTES } from "@/lib/image-upload-policy";

const drawImage = vi.fn();
const canvasToBlob = vi.fn<(callback: BlobCallback, type?: string, quality?: unknown) => void>();
const convertToBlob = vi.fn<
  (options?: { type?: string; quality?: number }) => Promise<Blob>
>();

let mockImageWidth = 1200;
let mockImageHeight = 900;
let decodeShouldFail = false;

class MockImage {
  decoding = "";
  naturalWidth = mockImageWidth;
  naturalHeight = mockImageHeight;
  onload: null | (() => void) = null;
  onerror: null | (() => void) = null;
  private currentSrc = "";

  set src(value: string) {
    this.currentSrc = value;
  }

  get src() {
    return this.currentSrc;
  }

  async decode() {
    this.naturalWidth = mockImageWidth;
    this.naturalHeight = mockImageHeight;

    if (decodeShouldFail) {
      throw new Error("decode failed");
    }
  }
}

function installCanvasFallback(blob: Blob) {
  vi.stubGlobal("OffscreenCanvas", undefined);
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
    drawImage,
  } as unknown as CanvasRenderingContext2D);
  vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation((callback) => {
    canvasToBlob(callback);
    callback(blob);
  });
}

function installOffscreenCanvas(blob: Blob) {
  class MockOffscreenCanvas {
    width: number;
    height: number;

    constructor(width: number, height: number) {
      this.width = width;
      this.height = height;
    }

    getContext() {
      return {
        drawImage,
      } as unknown as OffscreenCanvasRenderingContext2D;
    }

    async convertToBlob(options?: { type?: string; quality?: number }) {
      convertToBlob(options);
      return blob;
    }
  }

  vi.stubGlobal("OffscreenCanvas", MockOffscreenCanvas);
}

describe("prepareImageForUpload", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    mockImageWidth = 1200;
    mockImageHeight = 900;
    decodeShouldFail = false;
    vi.stubGlobal("Image", MockImage);
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn(() => "blob:mock-image"),
      revokeObjectURL: vi.fn(),
    });
  });

  it("returns the original jpeg when it is already within limits", async () => {
    const file = new File([new Uint8Array([1, 2, 3])], "photo.jpg", {
      type: "image/jpeg",
    });

    const prepared = await prepareImageForUpload(file);

    expect(prepared).toBe(file);
  });

  it("resizes a large jpeg before upload", async () => {
    mockImageWidth = 3200;
    mockImageHeight = 2000;
    installOffscreenCanvas(new Blob([new Uint8Array([1, 2, 3])], { type: "image/jpeg" }));
    const file = new File([new Uint8Array([1, 2, 3])], "photo.jpg", {
      type: "image/jpeg",
    });

    const prepared = await prepareImageForUpload(file);

    expect(prepared).not.toBe(file);
    expect(prepared.type).toBe("image/jpeg");
    expect(drawImage).toHaveBeenCalledWith(expect.anything(), 0, 0, 1600, 1000);
    expect(convertToBlob).toHaveBeenCalledWith({
      type: "image/jpeg",
      quality: 0.82,
    });
  });

  it("preserves png output type", async () => {
    installOffscreenCanvas(new Blob([new Uint8Array([1, 2, 3])], { type: "image/png" }));
    const file = new File([new Uint8Array([1, 2, 3])], "diagram.png", {
      type: "image/png",
    });

    const prepared = await prepareImageForUpload(file);

    expect(prepared.type).toBe("image/png");
  });

  it("rejects svg uploads", async () => {
    const file = new File(["<svg />"], "vector.svg", {
      type: "image/svg+xml",
    });

    await expect(prepareImageForUpload(file)).rejects.toThrow("Unsupported image format");
  });

  it("rejects gif uploads", async () => {
    const file = new File([new Uint8Array([1, 2, 3])], "animated.gif", {
      type: "image/gif",
    });

    await expect(prepareImageForUpload(file)).rejects.toThrow("Unsupported image format");
  });

  it("rejects processed files that remain above the byte limit", async () => {
    mockImageWidth = 3200;
    mockImageHeight = 2000;
    installOffscreenCanvas(
      new Blob(["x".repeat(MAX_IMAGE_UPLOAD_BYTES + 1)], { type: "image/jpeg" }),
    );
    const file = new File([new Uint8Array([1, 2, 3])], "photo.jpg", {
      type: "image/jpeg",
    });

    await expect(prepareImageForUpload(file)).rejects.toThrow(
      "Processed image exceeds 5 MB limit",
    );
  });

  it("falls back to html canvas when OffscreenCanvas is unavailable", async () => {
    mockImageWidth = 3200;
    mockImageHeight = 2000;
    installCanvasFallback(new Blob([new Uint8Array([1, 2, 3])], { type: "image/jpeg" }));
    const file = new File([new Uint8Array([1, 2, 3])], "photo.jpg", {
      type: "image/jpeg",
    });

    const prepared = await prepareImageForUpload(file);

    expect(prepared.type).toBe("image/jpeg");
    expect(canvasToBlob).toHaveBeenCalled();
  });
});
