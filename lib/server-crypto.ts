import { base64ToBytes, bytesToArrayBuffer, bytesToBase64 } from "@/lib/base64";

let cachedSecret: string | null = null;
let cachedKey: CryptoKey | null = null;

export async function deriveServerCryptoKey(secret: string): Promise<CryptoKey> {
  const secretBytes = new TextEncoder().encode(secret);
  const digest = await crypto.subtle.digest("SHA-256", secretBytes);
  return crypto.subtle.importKey(
    "raw",
    digest,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function getServerCryptoKey() {
  const secret = process.env.SERVER_ENCRYPTION_SECRET;
  if (!secret) {
    throw new Error("SERVER_ENCRYPTION_SECRET is not set");
  }

  if (cachedKey && cachedSecret === secret) {
    return cachedKey;
  }

  cachedSecret = secret;
  cachedKey = await deriveServerCryptoKey(secret);
  return cachedKey;
}

export async function encryptServerText(plaintext: string) {
  const key = await getServerCryptoKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(plaintext),
  );

  return {
    ciphertext: bytesToBase64(new Uint8Array(encrypted)),
    iv: bytesToBase64(iv),
  };
}

export async function encryptServerBuffer(input: Uint8Array) {
  const key = await getServerCryptoKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    bytesToArrayBuffer(input),
  );

  return {
    ciphertext: new Uint8Array(encrypted),
    iv: bytesToBase64(iv),
  };
}

export async function decryptServerText(ciphertext: string, iv: string) {
  const key = await getServerCryptoKey();
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: bytesToArrayBuffer(base64ToBytes(iv)) },
    key,
    bytesToArrayBuffer(base64ToBytes(ciphertext)),
  );
  return new TextDecoder().decode(decrypted);
}

export async function decryptServerBuffer(ciphertext: Uint8Array, iv: string) {
  const key = await getServerCryptoKey();
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: bytesToArrayBuffer(base64ToBytes(iv)) },
    key,
    bytesToArrayBuffer(ciphertext),
  );
  return new Uint8Array(decrypted);
}
