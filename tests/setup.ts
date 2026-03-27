import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// Set test env vars
process.env.AUTH_SECRET = "test-auth-secret";
process.env.AUTH_GOOGLE_ID = "test-google-id";
process.env.AUTH_GOOGLE_SECRET = "test-google-secret";
process.env.SERVER_ENCRYPTION_SECRET = "server-test-secret";
process.env.R2_ENDPOINT = "https://example.r2.cloudflarestorage.com";
process.env.R2_ACCESS_KEY = "test-r2-access";
process.env.R2_SECRET_KEY = "test-r2-secret";
process.env.R2_BUCKET = "journal-images";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/server-crypto", () => ({
  encryptServerText: vi.fn().mockResolvedValue({
    ciphertext: "mock-ct",
    iv: "mock-iv",
  }),
  decryptServerText: vi.fn().mockResolvedValue("decrypted"),
  encryptServerBuffer: vi.fn().mockResolvedValue({
    ciphertext: new Uint8Array([7, 8, 9]),
    iv: "mock-image-iv",
  }),
  decryptServerBuffer: vi.fn().mockResolvedValue(new Uint8Array([4, 5, 6])),
}));

// Mock db module for API route tests
vi.mock("@/lib/db", () => ({
  db: {
    insert: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    transaction: vi.fn(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    groupBy: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    values: vi.fn().mockResolvedValue(undefined),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
    reverse: vi.fn().mockReturnValue([]),
    all: vi.fn().mockResolvedValue([]),
  },
}));
