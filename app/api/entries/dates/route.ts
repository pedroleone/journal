import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { entries } from "@/lib/schema";

export async function GET() {
  const result = await db
    .select({
      id: entries.id,
      year: entries.year,
      month: entries.month,
      day: entries.day,
    })
    .from(entries)
    .orderBy(entries.year, entries.month, entries.day);

  result.reverse();

  return NextResponse.json(result);
}
