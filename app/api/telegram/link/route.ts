import { getRequiredUserId, unauthorizedResponse } from "@/lib/auth/session";
import { jsonNoStore } from "@/lib/http";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { unlinkTelegramChatId } from "@/lib/auth/user";

export async function GET() {
  const userId = await getRequiredUserId();
  if (!userId) return unauthorizedResponse();

  const [user] = await db
    .select({ telegramChatId: users.telegramChatId })
    .from(users)
    .where(eq(users.id, userId));

  const chatId = user?.telegramChatId ?? null;
  return jsonNoStore({ linked: chatId !== null, chatId });
}

export async function DELETE() {
  const userId = await getRequiredUserId();
  if (!userId) return unauthorizedResponse();

  await unlinkTelegramChatId(userId);
  return jsonNoStore({ ok: true });
}
