"use client";

import { decrypt } from "@/lib/crypto";
import { getKeyForSource } from "@/lib/key-manager";
import type { EntrySource } from "@/lib/types";

export async function decryptEntryContent(input: {
  source: EntrySource;
  encrypted_content: string;
  iv: string;
}) {
  const key = getKeyForSource(input.source);
  if (!key) {
    throw new Error("No key available for entry source");
  }

  return decrypt(key, input.encrypted_content, input.iv);
}
