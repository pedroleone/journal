import { vi } from "vitest";

// Set test env vars
process.env.NEXT_PUBLIC_PBKDF2_SALT = btoa("test-salt-16bytes");
process.env.SESSION_SECRET = "test-session-secret-that-is-long-enough-for-hs256";
// bcrypt hash of "testpassword" with 4 rounds for speed
process.env.PASSWORD_HASH =
  "$2a$04$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";

// Mock db module for API route tests
vi.mock("@/lib/db", () => ({
  db: {
    insert: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    groupBy: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    values: vi.fn().mockResolvedValue(undefined),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    reverse: vi.fn().mockReturnValue([]),
  },
}));
