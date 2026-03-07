import { NextRequest, NextResponse } from "next/server";
import { getRequiredUserId, unauthorizedResponse } from "@/lib/auth/session";
import { deleteEncryptedObject, getEncryptedObject } from "@/lib/r2";
import { getOwnerImageRecord, setOwnerImages } from "@/lib/entry-images";
import { NO_STORE_HEADERS, jsonNoStore } from "@/lib/http";
import { decryptServerBuffer } from "@/lib/server-crypto";
import { imageOwnerKindSchema } from "@/lib/validators";

function decodeKey(encodedKey: string) {
  return decodeURIComponent(encodedKey);
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ key: string }> },
) {
  const userId = await getRequiredUserId();
  if (!userId) return unauthorizedResponse();

  const { key: rawKey } = await params;
  const key = decodeKey(rawKey);

  if (!key.startsWith(`${userId}/`)) {
    return jsonNoStore({ error: "Not found" }, { status: 404 });
  }

  const [, ownerKind, ownerId] = key.split("/");
  const parsedOwnerKind = imageOwnerKindSchema.safeParse(ownerKind);
  if (!parsedOwnerKind.success || !ownerId) {
    return jsonNoStore({ error: "Not found" }, { status: 404 });
  }

  const ownerRecord = await getOwnerImageRecord(userId, parsedOwnerKind.data, ownerId);
  if (!ownerRecord?.images?.includes(key)) {
    return jsonNoStore({ error: "Not found" }, { status: 404 });
  }

  const object = await getEncryptedObject(key);
  const decrypted = await decryptServerBuffer(object.body, object.iv);

  return new NextResponse(decrypted, {
    status: 200,
    headers: {
      ...NO_STORE_HEADERS,
      "Content-Type": object.contentType,
    },
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> },
) {
  const userId = await getRequiredUserId();
  if (!userId) return unauthorizedResponse();

  const ownerKind = request.nextUrl.searchParams.get("owner_kind");
  const ownerId = request.nextUrl.searchParams.get("owner_id");
  const { key: rawKey } = await params;
  const key = decodeKey(rawKey);

  if (typeof ownerKind !== "string" || typeof ownerId !== "string") {
    return jsonNoStore({ error: "Missing owner info" }, { status: 400 });
  }

  const parsedOwnerKind = imageOwnerKindSchema.safeParse(ownerKind);
  if (!parsedOwnerKind.success) {
    return jsonNoStore({ error: "Invalid owner_kind" }, { status: 400 });
  }

  const ownerRecord = await getOwnerImageRecord(userId, parsedOwnerKind.data, ownerId);
  if (!ownerRecord?.images?.includes(key)) {
    return jsonNoStore({ error: "Not found" }, { status: 404 });
  }

  const currentImages = ownerRecord.images ?? [];
  const images = currentImages.filter((imageKey) => imageKey !== key);

  await setOwnerImages(userId, parsedOwnerKind.data, ownerId, images);

  try {
    await deleteEncryptedObject(key);
  } catch {
    await setOwnerImages(userId, parsedOwnerKind.data, ownerId, currentImages).catch(
      () => undefined,
    );
    return jsonNoStore({ error: "Failed to delete image" }, { status: 500 });
  }

  return jsonNoStore({ ok: true, images });
}
