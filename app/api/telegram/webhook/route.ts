import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import { jsonNoStore } from "@/lib/http";
import { putEncryptedObject } from "@/lib/r2";
import { foodEntries } from "@/lib/schema";
import {
  getUserByTelegramChatId,
  getUserByTelegramLinkToken,
  linkTelegramChatId,
} from "@/lib/auth/user";
import { encryptServerBuffer, encryptServerText } from "@/lib/server-crypto";

interface TelegramPhotoSize {
  file_id: string;
  file_unique_id: string;
  width: number;
  height: number;
}

interface TelegramMessage {
  message_id: number;
  date: number;
  text?: string;
  caption?: string;
  photo?: TelegramPhotoSize[];
  chat?: {
    id: number;
  };
}

interface TelegramUpdate {
  message?: TelegramMessage;
}

function getWebhookSecret() {
  return process.env.TELEGRAM_WEBHOOK_SECRET;
}

function getBotToken() {
  return process.env.TELEGRAM_BOT_TOKEN;
}

async function telegramFetch(path: string, init?: RequestInit) {
  const token = getBotToken();
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN is not set");
  return fetch(`https://api.telegram.org/bot${token}/${path}`, init);
}

async function sendTelegramMessage(chatId: string, text: string) {
  await telegramFetch("sendMessage", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id: chatId,
      text,
    }),
  });
}

async function fetchTelegramPhoto(fileId: string) {
  const fileResponse = await telegramFetch(`getFile?file_id=${encodeURIComponent(fileId)}`);
  const fileData = await fileResponse.json();
  const filePath = fileData?.result?.file_path;
  if (typeof filePath !== "string") {
    throw new Error("Unable to fetch Telegram file path");
  }

  const token = getBotToken();
  const downloadResponse = await fetch(`https://api.telegram.org/file/bot${token}/${filePath}`);
  if (!downloadResponse.ok) {
    throw new Error("Unable to download Telegram file");
  }

  return {
    bytes: new Uint8Array(await downloadResponse.arrayBuffer()),
    contentType:
      downloadResponse.headers.get("Content-Type") ?? "image/jpeg",
  };
}

function parseCommand(input: string) {
  const startMatch = input.match(/^\/start(?:\s+(\S+))?$/);
  if (startMatch) {
    return {
      kind: "link" as const,
      token: startMatch[1] ?? "",
    };
  }

  if (
    input.startsWith("/journal") ||
    input.startsWith("/idea") ||
    input.startsWith("/note")
  ) {
    return {
      kind: "unsupported" as const,
      content: input.replace(/^\/(journal|idea|note)\b/, "").trim(),
    };
  }

  return {
    kind: "food" as const,
    content: input.replace(/^\/food\b/, "").trim(),
  };
}

export async function POST(request: Request) {
  const secret = getWebhookSecret();
  if (!secret) {
    return jsonNoStore({ error: "TELEGRAM_WEBHOOK_SECRET is not set" }, { status: 500 });
  }

  if (request.headers.get("X-Telegram-Bot-Api-Secret-Token") !== secret) {
    return jsonNoStore({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = (await request.json()) as TelegramUpdate;
  const message = payload.message;
  const chatId = String(message?.chat?.id ?? "");
  if (!message || !chatId) {
    return jsonNoStore({ ok: true });
  }

  const rawText = (message.text ?? message.caption ?? "").trim();
  const parsed = parseCommand(rawText);

  if (parsed.kind === "link") {
    if (!parsed.token) {
      await sendTelegramMessage(chatId, "Please generate a link code in the app settings.");
      return jsonNoStore({ ok: true });
    }
    const user = await getUserByTelegramLinkToken(parsed.token);
    if (!user || !user.telegramLinkTokenExpiresAt) {
      await sendTelegramMessage(chatId, "This link has expired. Please generate a new one in the app.");
      return jsonNoStore({ ok: true });
    }
    if (new Date(user.telegramLinkTokenExpiresAt) < new Date()) {
      await sendTelegramMessage(chatId, "This link has expired. Please generate a new one in the app.");
      return jsonNoStore({ ok: true });
    }
    await linkTelegramChatId(user.id, chatId);
    await sendTelegramMessage(chatId, "✅ Your Telegram is now linked to your journal!");
    return jsonNoStore({ ok: true });
  }

  const user = await getUserByTelegramChatId(chatId);
  if (!user) {
    await sendTelegramMessage(chatId, "Your Telegram is not linked. Open the app and connect from Settings.");
    return jsonNoStore({ ok: true });
  }

  if (parsed.kind === "unsupported") {
    await sendTelegramMessage(
      chatId,
      "Unsupported command. Telegram capture is food-only in this build.",
    );
    return jsonNoStore({ ok: true });
  }

  const messageDate = new Date(message.date * 1000);
  const textPayload = await encryptServerText(parsed.content);
  const imageKeys: string[] = [];

  if (message.photo?.length) {
    const photo = message.photo[message.photo.length - 1];
    const downloaded = await fetchTelegramPhoto(photo.file_id);
    const encrypted = await encryptServerBuffer(downloaded.bytes);
    const ownerId = nanoid();
    const key = `${user.id}/food/${ownerId}/${nanoid()}.enc`;
    await putEncryptedObject({
      key,
      body: encrypted.ciphertext,
      iv: encrypted.iv,
      contentType: downloaded.contentType,
    });
    imageKeys.push(key);

    await db.insert(foodEntries).values({
      id: ownerId,
      userId: user.id,
      source: "telegram",
      year: messageDate.getFullYear(),
      month: messageDate.getMonth() + 1,
      day: messageDate.getDate(),
      hour: messageDate.getHours(),
      meal_slot: null,
      assigned_at: null,
      logged_at: messageDate.toISOString(),
      encrypted_content: textPayload.ciphertext,
      iv: textPayload.iv,
      images: imageKeys,
      tags: null,
      created_at: messageDate.toISOString(),
      updated_at: messageDate.toISOString(),
    });
    await sendTelegramMessage(chatId, "✅ food entry saved");
    return jsonNoStore({ ok: true });
  }

  const id = nanoid();
  await db.insert(foodEntries).values({
    id,
    userId: user.id,
    source: "telegram",
    year: messageDate.getFullYear(),
    month: messageDate.getMonth() + 1,
    day: messageDate.getDate(),
    hour: messageDate.getHours(),
    meal_slot: null,
    assigned_at: null,
    logged_at: messageDate.toISOString(),
    encrypted_content: textPayload.ciphertext,
    iv: textPayload.iv,
    images: null,
    tags: null,
    created_at: messageDate.toISOString(),
    updated_at: messageDate.toISOString(),
  });
  await sendTelegramMessage(chatId, "✅ food entry saved");
  return jsonNoStore({ ok: true });
}
