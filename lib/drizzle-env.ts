import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

type EnvMap = Record<string, string | undefined>;
type DrizzleEnv = Pick<EnvMap, "TURSO_DATABASE_URL" | "TURSO_AUTH_TOKEN">;

type ResolveDrizzleDbCredentialsOptions = {
  cwd?: string;
  env?: DrizzleEnv;
};

type DrizzleDbCredentials = {
  url: string;
  authToken?: string;
};

function parseEnvValue(rawValue: string) {
  const trimmed = rawValue.trim();

  if (!trimmed) return "";

  if (
    (trimmed.startsWith("\"") && trimmed.endsWith("\"")) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }

  const commentIndex = trimmed.indexOf(" #");
  return commentIndex === -1 ? trimmed : trimmed.slice(0, commentIndex);
}

function readEnvFile(filePath: string): EnvMap {
  if (!existsSync(filePath)) return {};

  const contents = readFileSync(filePath, "utf8");
  const values: EnvMap = {};

  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const normalized = trimmed.startsWith("export ") ? trimmed.slice(7).trim() : trimmed;
    const separatorIndex = normalized.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = normalized.slice(0, separatorIndex).trim();
    const value = parseEnvValue(normalized.slice(separatorIndex + 1));

    values[key] = value;
  }

  return values;
}

export function loadProjectEnv(cwd = process.cwd(), env: EnvMap = process.env) {
  const envLocal = readEnvFile(join(cwd, ".env.local"));
  const envFile = readEnvFile(join(cwd, ".env"));

  return {
    ...envFile,
    ...envLocal,
    ...env,
  };
}

export function resolveDrizzleDbCredentials(
  options: ResolveDrizzleDbCredentialsOptions = {},
): DrizzleDbCredentials {
  const cwd = options.cwd ?? process.cwd();
  const env = loadProjectEnv(cwd, options.env ?? process.env);

  const url =
    env.TURSO_DATABASE_URL ||
    "file:local.db";

  const authToken =
    url.startsWith("file:")
      ? undefined
      : env.TURSO_AUTH_TOKEN;

  return { url, authToken };
}

export function buildDrizzleProcessEnv(
  baseEnv: EnvMap,
  credentials: DrizzleDbCredentials,
): EnvMap {
  const env: EnvMap = {
    ...baseEnv,
    TURSO_DATABASE_URL: credentials.url,
  };

  if (credentials.authToken) {
    env.TURSO_AUTH_TOKEN = credentials.authToken;
  } else {
    delete env.TURSO_AUTH_TOKEN;
  }

  return env;
}
