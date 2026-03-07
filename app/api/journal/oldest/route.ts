import { NextResponse } from "next/server";
import { asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { journalEntries } from "@/lib/schema";

export async function GET() {
  const [oldest] = await db
    .select({
      encrypted_content: journalEntries.encrypted_content,
      iv: journalEntries.iv,
    })
    .from(journalEntries)
    .orderBy(asc(journalEntries.created_at))
    .limit(1);

  return NextResponse.json({ entry: oldest ?? null });
}
