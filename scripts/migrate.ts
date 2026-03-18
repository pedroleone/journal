import crypto from "node:crypto";
import fs from "node:fs";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { sql } from "drizzle-orm";

const url = process.env.TURSO_DATABASE_URL || "file:local.db";

const client = createClient({
  url,
  authToken: url.startsWith("file:") ? undefined : process.env.TURSO_AUTH_TOKEN,
});

const db = drizzle(client);

async function main() {
  // Create migration journal table if it doesn't exist
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS __drizzle_migrations (
      id SERIAL PRIMARY KEY,
      hash text NOT NULL,
      created_at numeric
    )
  `);

  const existing = await db.get<{ count: number }>(
    sql`SELECT COUNT(*) as count FROM __drizzle_migrations`
  );

  // Check if the DB was set up before Drizzle migrations (has tables but no journal)
  const tables = await db.get<{ count: number }>(
    sql`SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name='entries'`
  );

  if (existing?.count === 0 && tables?.count === 1) {
    console.log(
      "Existing database detected without migration history. Seeding journal..."
    );

    // Read journal entries and compute hashes exactly as Drizzle does
    const journal = JSON.parse(
      fs.readFileSync("./drizzle/meta/_journal.json", "utf-8")
    );

    for (const entry of journal.entries) {
      const query = fs.readFileSync(`./drizzle/${entry.tag}.sql`, "utf-8");
      const hash = crypto.createHash("sha256").update(query).digest("hex");
      await db.run(
        sql`INSERT INTO __drizzle_migrations (hash, created_at) VALUES (${hash}, ${entry.when})`
      );
    }

    console.log(
      `Seeded ${journal.entries.length} existing migrations into journal.`
    );
  }

  console.log("Running migrations...");
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log("Migrations complete.");
  client.close();
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
