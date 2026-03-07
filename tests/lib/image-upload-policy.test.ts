import { describe, expect, it } from "vitest";
import {
  getConstrainedDimensions,
  getUploadOutputMimeType,
  isSupportedUploadMimeType,
  MAX_IMAGE_DIMENSION,
} from "@/lib/image-upload-policy";

describe("image upload policy", () => {
  it("resizes landscape dimensions to the max edge", () => {
    expect(getConstrainedDimensions(4000, 2000, MAX_IMAGE_DIMENSION)).toEqual({
      width: 1600,
      height: 800,
    });
  });

  it("resizes portrait dimensions to the max edge", () => {
    expect(getConstrainedDimensions(2000, 4000, MAX_IMAGE_DIMENSION)).toEqual({
      width: 800,
      height: 1600,
    });
  });

  it("leaves smaller images unchanged", () => {
    expect(getConstrainedDimensions(1200, 900, MAX_IMAGE_DIMENSION)).toEqual({
      width: 1200,
      height: 900,
    });
  });

  it("preserves aspect ratio when scaling", () => {
    expect(getConstrainedDimensions(4032, 3024, MAX_IMAGE_DIMENSION)).toEqual({
      width: 1600,
      height: 1200,
    });
  });

  it("returns png for png uploads and jpeg for other supported raster formats", () => {
    expect(getUploadOutputMimeType("image/png")).toBe("image/png");
    expect(getUploadOutputMimeType("image/jpeg")).toBe("image/jpeg");
    expect(getUploadOutputMimeType("image/webp")).toBe("image/jpeg");
  });

  it("rejects unsupported image formats", () => {
    expect(isSupportedUploadMimeType("image/svg+xml")).toBe(false);
    expect(isSupportedUploadMimeType("image/gif")).toBe(false);
    expect(isSupportedUploadMimeType("text/plain")).toBe(false);
  });
});
