import { defineConfig } from "drizzle-kit";
import { resolveDrizzleDbCredentials } from "./lib/drizzle-env";

const { url, authToken } = resolveDrizzleDbCredentials();

export default defineConfig({
  schema: "./lib/schema.ts",
  out: "./drizzle",
  dialect: "turso",
  dbCredentials: {
    url,
    authToken,
  },
});
