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

export async function getUserByTelegramChatId(chatId: string) {
  const [user] = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(eq(users.telegramChatId, chatId));
  return user ?? null;
}

export async function getUserByTelegramLinkToken(token: string) {
  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      telegramLinkTokenExpiresAt: users.telegramLinkTokenExpiresAt,
    })
    .from(users)
    .where(eq(users.telegramLinkToken, token));
  return user ?? null;
}

export async function setTelegramLinkToken(
  userId: string,
  token: string,
  expiresAt: string,
) {
  await db
    .update(users)
    .set({ telegramLinkToken: token, telegramLinkTokenExpiresAt: expiresAt, updated_at: new Date().toISOString() })
    .where(eq(users.id, userId));
}

export async function linkTelegramChatId(userId: string, chatId: string) {
  await db
    .update(users)
    .set({
      telegramChatId: chatId,
      telegramLinkToken: null,
      telegramLinkTokenExpiresAt: null,
      updated_at: new Date().toISOString(),
    })
    .where(eq(users.id, userId));
}

export async function unlinkTelegramChatId(userId: string) {
  await db
    .update(users)
    .set({
      telegramChatId: null,
      telegramLinkToken: null,
      telegramLinkTokenExpiresAt: null,
      updated_at: new Date().toISOString(),
    })
    .where(eq(users.id, userId));
}
