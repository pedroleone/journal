import { base64ToBytes, bytesToArrayBuffer, bytesToBase64 } from "@/lib/base64";

const PBKDF2_ITERATIONS = 600_000;

function getSalt(): Uint8Array {
  const b64 = process.env.NEXT_PUBLIC_PBKDF2_SALT;
  if (!b64) throw new Error("NEXT_PUBLIC_PBKDF2_SALT is not set");
  return base64ToBytes(b64);
}

export async function deriveKey(passphrase: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: bytesToArrayBuffer(getSalt()),
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function encrypt(
  key: CryptoKey,
  plaintext: string,
): Promise<{ ciphertext: string; iv: string }> {
  const enc = new TextEncoder();
  return encryptBuffer(key, enc.encode(plaintext));
}

export async function decrypt(
  key: CryptoKey,
  ciphertext: string,
  iv: string,
): Promise<string> {
  const decrypted = await decryptBuffer(key, ciphertext, iv);
  return new TextDecoder().decode(decrypted);
}

export async function encryptBuffer(
  key: CryptoKey,
  input: ArrayBuffer | Uint8Array,
): Promise<{ ciphertext: string; iv: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    bytesToArrayBuffer(
      input instanceof Uint8Array ? input : new Uint8Array(input),
    ),
  );
  return {
    ciphertext: bytesToBase64(new Uint8Array(encrypted)),
    iv: bytesToBase64(iv),
  };
}

export async function decryptBuffer(
  key: CryptoKey,
  ciphertext: string,
  iv: string,
): Promise<Uint8Array> {
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: bytesToArrayBuffer(base64ToBytes(iv)) },
    key,
    bytesToArrayBuffer(base64ToBytes(ciphertext)),
  );
  return new Uint8Array(decrypted);
}

export async function deriveServerKey(secret: string): Promise<CryptoKey> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(secret),
  );

  return crypto.subtle.importKey(
    "raw",
    digest,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}
