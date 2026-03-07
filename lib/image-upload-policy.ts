export const MAX_IMAGE_DIMENSION = 1600;
export const MAX_IMAGE_UPLOAD_BYTES = 5 * 1024 * 1024;
export const JPEG_UPLOAD_QUALITY = 0.82;

export function getConstrainedDimensions(
  width: number,
  height: number,
  maxDimension: number,
) {
  if (width <= 0 || height <= 0) {
    throw new Error("Image dimensions must be positive");
  }

  const longestEdge = Math.max(width, height);
  if (longestEdge <= maxDimension) {
    return { width, height };
  }

  const scale = maxDimension / longestEdge;

  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

export function getUploadOutputMimeType(inputMimeType: string) {
  const mimeType = inputMimeType.toLowerCase();

  if (!mimeType.startsWith("image/")) {
    return null;
  }

  if (mimeType === "image/png") {
    return "image/png";
  }

  if (mimeType === "image/svg+xml" || mimeType === "image/gif") {
    return null;
  }

  return "image/jpeg";
}

export function isSupportedUploadMimeType(mimeType: string) {
  return getUploadOutputMimeType(mimeType) !== null;
}
