import { getRequiredUserId, unauthorizedResponse } from "@/lib/auth/session";
import { jsonNoStore } from "@/lib/http";
import { setTelegramLinkToken } from "@/lib/auth/user";

function getBotUsername() {
  return process.env.TELEGRAM_BOT_USERNAME ?? "";
}

function generateToken(length = 8) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let token = "";
  const values = crypto.getRandomValues(new Uint8Array(length));
  for (const v of values) {
    token += chars[v % chars.length];
  }
  return token;
}

export async function POST() {
  const userId = await getRequiredUserId();
  if (!userId) return unauthorizedResponse();

  const token = generateToken();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  await setTelegramLinkToken(userId, token, expiresAt);

  const botUsername = getBotUsername();
  const deepLink = botUsername
    ? `https://t.me/${botUsername}?start=${token}`
    : null;

  return jsonNoStore({ token, deepLink, expiresAt }, { status: 201 });
}
