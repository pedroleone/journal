const { spawnSync } = require("node:child_process");
const { resolveDrizzleDbCredentials } = require("../lib/drizzle-env.ts");

const args = process.argv.slice(2);

if (args.length === 0) {
  console.error("Usage: node --experimental-strip-types scripts/run-drizzle.ts <drizzle-kit args>");
  process.exit(1);
}

const { url, authToken } = resolveDrizzleDbCredentials();
const env = {
  ...process.env,
  TURSO_DATABASE_URL: url,
};

if (authToken) {
  env.TURSO_AUTH_TOKEN = authToken;
} else {
  delete env.TURSO_AUTH_TOKEN;
}

const result = spawnSync("pnpm", ["exec", "drizzle-kit", ...args], {
  stdio: "inherit",
  env,
});

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);
