"use client";

import {
  getConstrainedDimensions,
  getUploadOutputMimeType,
  isSupportedUploadMimeType,
  JPEG_UPLOAD_QUALITY,
  MAX_IMAGE_DIMENSION,
  MAX_IMAGE_UPLOAD_BYTES,
} from "@/lib/image-upload-policy";

type CanvasTarget = HTMLCanvasElement | OffscreenCanvas;

function getFileExtension(mimeType: string) {
  if (mimeType === "image/png") {
    return "png";
  }

  return "jpg";
}

function getPreparedFileName(file: File, outputMimeType: string) {
  const baseName = file.name.replace(/\.[^.]+$/, "");
  const safeBaseName = baseName.length > 0 ? baseName : "image";
  return `${safeBaseName}.${getFileExtension(outputMimeType)}`;
}

async function loadImageElement(file: File) {
  const objectUrl = URL.createObjectURL(file);
  const image = new Image();

  try {
    image.decoding = "async";
    image.src = objectUrl;

    if (typeof image.decode === "function") {
      await image.decode();
    } else {
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error("decode failed"));
      });
    }

    if (!image.naturalWidth || !image.naturalHeight) {
      throw new Error("missing dimensions");
    }

    return image;
  } catch {
    throw new Error("Unsupported image format");
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function createCanvas(width: number, height: number): CanvasTarget {
  if (typeof OffscreenCanvas !== "undefined") {
    return new OffscreenCanvas(width, height);
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function getCanvasContext(canvas: CanvasTarget) {
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Failed to prepare image for upload");
  }

  return context;
}

async function canvasToBlob(
  canvas: CanvasTarget,
  outputMimeType: string,
  quality?: number,
) {
  if ("convertToBlob" in canvas) {
    return canvas.convertToBlob({
      type: outputMimeType,
      quality,
    });
  }

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Failed to prepare image for upload"));
          return;
        }

        resolve(blob);
      },
      outputMimeType,
      quality,
    );
  });
}

export async function prepareImageForUpload(file: File) {
  if (!isSupportedUploadMimeType(file.type)) {
    throw new Error("Unsupported image format");
  }

  const outputMimeType = getUploadOutputMimeType(file.type);
  if (!outputMimeType) {
    throw new Error("Unsupported image format");
  }

  const image = await loadImageElement(file);
  const targetDimensions = getConstrainedDimensions(
    image.naturalWidth,
    image.naturalHeight,
    MAX_IMAGE_DIMENSION,
  );
  const needsResize =
    targetDimensions.width !== image.naturalWidth ||
    targetDimensions.height !== image.naturalHeight;
  const needsReencode = outputMimeType !== file.type.toLowerCase();
  const shouldProcess = needsResize || needsReencode || file.size > MAX_IMAGE_UPLOAD_BYTES;

  if (!shouldProcess) {
    return file;
  }

  try {
    const canvas = createCanvas(targetDimensions.width, targetDimensions.height);
    const context = getCanvasContext(canvas);
    context.drawImage(image, 0, 0, targetDimensions.width, targetDimensions.height);

    const blob = await canvasToBlob(
      canvas,
      outputMimeType,
      outputMimeType === "image/jpeg" ? JPEG_UPLOAD_QUALITY : undefined,
    );

    if (blob.size > MAX_IMAGE_UPLOAD_BYTES) {
      throw new Error("Processed image exceeds 5 MB limit");
    }

    return new File([blob], getPreparedFileName(file, outputMimeType), {
      type: outputMimeType,
      lastModified: file.lastModified,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Processed image exceeds 5 MB limit") {
      throw error;
    }

    throw new Error("Failed to prepare image for upload");
  }
}
