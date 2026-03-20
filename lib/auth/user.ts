import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";

interface UpsertGoogleUserInput {
  googleSub: string;
  email: string;
}

interface AuthUserRecord {
  id: string;
  email: string;
}

export async function upsertGoogleUser({
  googleSub,
  email,
}: UpsertGoogleUserInput): Promise<AuthUserRecord> {
  const [existing] = await db
    .select({
      id: users.id,
      email: users.email,
    })
    .from(users)
    .where(eq(users.googleSub, googleSub));

  const now = new Date().toISOString();

  if (existing) {
    if (existing.email !== email) {
      await db
        .update(users)
        .set({
          email,
          updated_at: now,
        })
        .where(eq(users.id, existing.id));
    }

    return {
      id: existing.id,
      email,
    };
  }

  const id = nanoid();

  await db.insert(users).values({
    id,
    googleSub,
    email,
    created_at: now,
    updated_at: now,
  });

  return { id, email };
}

export async function getPrimaryUser() {
  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
    })
    .from(users)
    .limit(1);

  return user ?? null;
}

export async function getUserByEmail(email: string) {
  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
    })
    .from(users)
    .where(eq(users.email, email));

  return user ?? null;
}
