import { defineConfig } from "drizzle-kit";

const url = process.env.TURSO_DATABASE_URL || "file:local.db";

export default defineConfig({
  schema: "./lib/schema.ts",
  out: "./drizzle",
  dialect: "turso",
  dbCredentials: {
    url,
    authToken: url.startsWith("file:") ? undefined : process.env.TURSO_AUTH_TOKEN,
  },
});
