import { vi } from "vitest";

// Set test env vars
process.env.NEXT_PUBLIC_PBKDF2_SALT = btoa("test-salt-16bytes");
process.env.AUTH_SECRET = "test-auth-secret";
process.env.AUTH_GOOGLE_ID = "test-google-id";
process.env.AUTH_GOOGLE_SECRET = "test-google-secret";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

// Mock db module for API route tests
vi.mock("@/lib/db", () => ({
  db: {
    insert: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    values: vi.fn().mockResolvedValue(undefined),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
    reverse: vi.fn().mockReturnValue([]),
  },
}));
