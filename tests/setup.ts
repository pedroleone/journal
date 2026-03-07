import { vi } from "vitest";

// Set test env vars
process.env.NEXT_PUBLIC_PBKDF2_SALT = btoa("test-salt-16bytes");
process.env.AUTH_SECRET = "test-auth-secret";
process.env.AUTH_GOOGLE_ID = "test-google-id";
process.env.AUTH_GOOGLE_SECRET = "test-google-secret";
process.env.SERVER_ENCRYPTION_SECRET = "server-test-secret";
process.env.TELEGRAM_BOT_TOKEN = "telegram-token";
process.env.TELEGRAM_CHAT_ID = "123456";
process.env.TELEGRAM_WEBHOOK_SECRET = "telegram-secret";
process.env.R2_ENDPOINT = "https://example.r2.cloudflarestorage.com";
process.env.R2_ACCESS_KEY = "test-r2-access";
process.env.R2_SECRET_KEY = "test-r2-secret";
process.env.R2_BUCKET = "journal-images";

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
    groupBy: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    values: vi.fn().mockResolvedValue(undefined),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
    reverse: vi.fn().mockReturnValue([]),
  },
}));
