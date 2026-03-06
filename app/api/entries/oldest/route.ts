import { NextResponse } from "next/server";
import { asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { entries } from "@/lib/schema";

export async function GET() {
  const [oldest] = await db
    .select({
      encrypted_content: entries.encrypted_content,
      iv: entries.iv,
    })
    .from(entries)
    .orderBy(asc(entries.created_at))
    .limit(1);

  return NextResponse.json({ entry: oldest ?? null });
}
