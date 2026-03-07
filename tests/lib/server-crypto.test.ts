import { beforeEach, describe, expect, it, vi } from "vitest";

describe("server-crypto", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unmock("@/lib/server-crypto");
    process.env.SERVER_ENCRYPTION_SECRET = "server-test-secret";
  });

  it("encryptServerBuffer/decryptServerBuffer roundtrip", async () => {
    const { encryptServerBuffer, decryptServerBuffer } = await import("@/lib/server-crypto");
    const input = new Uint8Array([1, 2, 3, 4]);

    const encrypted = await encryptServerBuffer(input);
    const decrypted = await decryptServerBuffer(encrypted.ciphertext, encrypted.iv);

    expect(decrypted).toEqual(input);
  });

  it("throws on tampered ciphertext", async () => {
    const { encryptServerBuffer, decryptServerBuffer } = await import("@/lib/server-crypto");
    const input = new Uint8Array([1, 2, 3, 4]);

    const encrypted = await encryptServerBuffer(input);
    encrypted.ciphertext[0] ^= 0xff;

    await expect(decryptServerBuffer(encrypted.ciphertext, encrypted.iv)).rejects.toThrow();
  });
});
