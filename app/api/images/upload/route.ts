import { nanoid } from "nanoid";
import { getRequiredUserId, unauthorizedResponse } from "@/lib/auth/session";
import { getOwnerImageRecord, setOwnerImages } from "@/lib/entry-images";
import { jsonNoStore } from "@/lib/http";
import { deleteEncryptedObject, putEncryptedObject } from "@/lib/r2";
import { MAX_IMAGE_UPLOAD_BYTES } from "@/lib/image-upload-policy";
import { encryptServerBuffer } from "@/lib/server-crypto";
import { imageOwnerKindSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const userId = await getRequiredUserId();
  if (!userId) return unauthorizedResponse();

  const formData = await request.formData();
  const file = formData.get("file");
  const ownerKind = formData.get("owner_kind");
  const ownerId = formData.get("owner_id");

  if (!(file instanceof File) || typeof ownerKind !== "string" || typeof ownerId !== "string") {
    return jsonNoStore({ error: "Invalid form data" }, { status: 400 });
  }

  if (!file.type.startsWith("image/")) {
    return jsonNoStore({ error: "Unsupported image type" }, { status: 400 });
  }

  if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
    return jsonNoStore({ error: "Image exceeds 5 MB limit" }, { status: 413 });
  }

  const parsedOwnerKind = imageOwnerKindSchema.safeParse(ownerKind);
  if (!parsedOwnerKind.success) {
    return jsonNoStore({ error: "Invalid owner_kind" }, { status: 400 });
  }

  const record = await getOwnerImageRecord(userId, parsedOwnerKind.data, ownerId);
  if (!record) {
    return jsonNoStore({ error: "Owner not found" }, { status: 404 });
  }

  const key = `${userId}/${parsedOwnerKind.data}/${ownerId}/${nanoid()}.enc`;
  const body = new Uint8Array(await file.arrayBuffer());
  const encrypted = await encryptServerBuffer(body);
  const nextImages = [...(record.images ?? []), key];

  try {
    await putEncryptedObject({
      key,
      body: encrypted.ciphertext,
      iv: encrypted.iv,
      contentType: file.type || "application/octet-stream",
    });
    await setOwnerImages(userId, parsedOwnerKind.data, ownerId, nextImages);
  } catch (error) {
    await deleteEncryptedObject(key).catch(() => undefined);
    throw error;
  }

  return jsonNoStore({ key, images: nextImages }, { status: 201 });
}
