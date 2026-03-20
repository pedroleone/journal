import { spawnSync } from "node:child_process";

const args = process.argv.slice(2);

if (args.length === 0) {
  console.error("Usage: node --experimental-strip-types scripts/run-drizzle.ts <drizzle-kit args>");
  process.exit(1);
}

const drizzleEnvModulePath = "../lib/drizzle-env.ts";
const {
  buildDrizzleProcessEnv,
  resolveDrizzleDbCredentials,
} = await import(drizzleEnvModulePath);

const { url, authToken } = resolveDrizzleDbCredentials();
const env = buildDrizzleProcessEnv(process.env, { url, authToken });

const result = spawnSync("pnpm", ["exec", "drizzle-kit", ...args], {
  stdio: "inherit",
  env,
});

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);
