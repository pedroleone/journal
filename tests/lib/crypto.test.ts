import { describe, it, expect } from "vitest";
import {
  decrypt,
  decryptBuffer,
  deriveKey,
  deriveServerKey,
  encrypt,
  encryptBuffer,
} from "@/lib/crypto";

describe("crypto", () => {
  it("deriveKey returns a CryptoKey", async () => {
    const key = await deriveKey("test-passphrase");
    expect(key).toBeDefined();
    expect(key.type).toBe("secret");
    expect(key.algorithm).toMatchObject({ name: "AES-GCM", length: 256 });
  });

  it("same passphrase derives same key", async () => {
    const key1 = await deriveKey("same-passphrase");
    const key2 = await deriveKey("same-passphrase");
    const plain = "hello";
    const { ciphertext, iv } = await encrypt(key1, plain);
    const result = await decrypt(key2, ciphertext, iv);
    expect(result).toBe(plain);
  });

  it("encrypt/decrypt roundtrip", async () => {
    const key = await deriveKey("roundtrip-test");
    const plaintext = "The quick brown fox jumps over the lazy dog";
    const { ciphertext, iv } = await encrypt(key, plaintext);

    expect(ciphertext).not.toBe(plaintext);
    expect(iv).toBeDefined();
    expect(iv.length).toBeGreaterThan(0);

    const decrypted = await decrypt(key, ciphertext, iv);
    expect(decrypted).toBe(plaintext);
  });

  it("encrypt produces unique IV each time", async () => {
    const key = await deriveKey("iv-test");
    const { iv: iv1 } = await encrypt(key, "test");
    const { iv: iv2 } = await encrypt(key, "test");
    expect(iv1).not.toBe(iv2);
  });

  it("decrypt with wrong key fails", async () => {
    const key1 = await deriveKey("correct-passphrase");
    const key2 = await deriveKey("wrong-passphrase");
    const { ciphertext, iv } = await encrypt(key1, "secret data");

    await expect(decrypt(key2, ciphertext, iv)).rejects.toThrow();
  });

  it("decrypt with tampered ciphertext fails", async () => {
    const key = await deriveKey("tamper-test");
    const { ciphertext, iv } = await encrypt(key, "original");
    const tampered = ciphertext.slice(0, -4) + "AAAA";

    await expect(decrypt(key, tampered, iv)).rejects.toThrow();
  });

  it("handles empty string", async () => {
    const key = await deriveKey("empty-test");
    const { ciphertext, iv } = await encrypt(key, "");
    const decrypted = await decrypt(key, ciphertext, iv);
    expect(decrypted).toBe("");
  });

  it("handles unicode content", async () => {
    const key = await deriveKey("unicode-test");
    const plaintext = "Hello 🌍 你好世界 مرحبا";
    const { ciphertext, iv } = await encrypt(key, plaintext);
    const decrypted = await decrypt(key, ciphertext, iv);
    expect(decrypted).toBe(plaintext);
  });

  it("encryptBuffer/decryptBuffer roundtrip", async () => {
    const key = await deriveKey("buffer-test");
    const bytes = new Uint8Array([1, 2, 3, 4, 5]);
    const { ciphertext, iv } = await encryptBuffer(key, bytes);
    const decrypted = await decryptBuffer(key, ciphertext, iv);
    expect([...decrypted]).toEqual([1, 2, 3, 4, 5]);
  });

  it("deriveServerKey is stable for the same secret", async () => {
    const key1 = await deriveServerKey("same-secret");
    const key2 = await deriveServerKey("same-secret");
    const { ciphertext, iv } = await encrypt(key1, "telegram");
    await expect(decrypt(key2, ciphertext, iv)).resolves.toBe("telegram");
  });
});
