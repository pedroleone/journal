import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  buildDrizzleProcessEnv,
  loadProjectEnv,
  resolveDrizzleDbCredentials,
} from "@/lib/drizzle-env";

function createTempDir() {
  return mkdtempSync(join(tmpdir(), "journal-drizzle-env-"));
}

describe("resolveDrizzleDbCredentials", () => {
  it("prefers process env over env files", () => {
    const cwd = createTempDir();

    try {
      writeFileSync(join(cwd, ".env.local"), "TURSO_DATABASE_URL=file:local.db\n");
      writeFileSync(join(cwd, ".env"), "TURSO_DATABASE_URL=libsql://remote.turso.io\n");

      const credentials = resolveDrizzleDbCredentials({
        cwd,
        env: {
          TURSO_DATABASE_URL: "libsql://process-env.turso.io",
          TURSO_AUTH_TOKEN: "process-token",
        },
      });

      expect(credentials).toEqual({
        url: "libsql://process-env.turso.io",
        authToken: "process-token",
      });
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });

  it("prefers .env.local over .env for local development", () => {
    const cwd = createTempDir();

    try {
      writeFileSync(join(cwd, ".env.local"), "TURSO_DATABASE_URL=file:local.db\n");
      writeFileSync(
        join(cwd, ".env"),
        "TURSO_DATABASE_URL=libsql://remote.turso.io\nTURSO_AUTH_TOKEN=remote-token\n",
      );

      const credentials = resolveDrizzleDbCredentials({ cwd, env: {} });

      expect(credentials).toEqual({
        url: "file:local.db",
        authToken: undefined,
      });
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });

  it("falls back to .env when .env.local is absent", () => {
    const cwd = createTempDir();

    try {
      writeFileSync(
        join(cwd, ".env"),
        "TURSO_DATABASE_URL=libsql://remote.turso.io\nTURSO_AUTH_TOKEN=remote-token\n",
      );

      const credentials = resolveDrizzleDbCredentials({ cwd, env: {} });

      expect(credentials).toEqual({
        url: "libsql://remote.turso.io",
        authToken: "remote-token",
      });
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });

  it("uses the local sqlite fallback when no env files are present", () => {
    const cwd = createTempDir();

    try {
      const credentials = resolveDrizzleDbCredentials({ cwd, env: {} });

      expect(credentials).toEqual({
        url: "file:local.db",
        authToken: undefined,
      });
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });
});

describe("buildDrizzleProcessEnv", () => {
  it("sets TURSO auth token for remote databases", () => {
    const env = buildDrizzleProcessEnv(
      { NODE_ENV: "test" },
      { url: "libsql://remote.turso.io", authToken: "remote-token" },
    );

    expect(env.TURSO_DATABASE_URL).toBe("libsql://remote.turso.io");
    expect(env.TURSO_AUTH_TOKEN).toBe("remote-token");
  });

  it("removes TURSO auth token for local sqlite databases", () => {
    const env = buildDrizzleProcessEnv(
      { NODE_ENV: "test", TURSO_AUTH_TOKEN: "stale-token" },
      { url: "file:local.db", authToken: undefined },
    );

    expect(env.TURSO_DATABASE_URL).toBe("file:local.db");
    expect("TURSO_AUTH_TOKEN" in env).toBe(false);
  });
});

describe("loadProjectEnv", () => {
  it("loads .env.local before .env while preserving existing env values", () => {
    const cwd = createTempDir();

    try {
      writeFileSync(
        join(cwd, ".env.local"),
        "SHARED_KEY=local-value\nLOCAL_ONLY_KEY=local-only\n",
      );
      writeFileSync(
        join(cwd, ".env"),
        "SHARED_KEY=env-value\nENV_ONLY_KEY=env-only\n",
      );

      const env = loadProjectEnv(cwd, { SHARED_KEY: "process-value" });

      expect(env.SHARED_KEY).toBe("process-value");
      expect(env.LOCAL_ONLY_KEY).toBe("local-only");
      expect(env.ENV_ONLY_KEY).toBe("env-only");
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });
});
