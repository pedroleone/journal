import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { journalEntries } from "@/lib/schema";

export async function GET() {
  const result = await db
    .select({
      id: journalEntries.id,
      year: journalEntries.year,
      month: journalEntries.month,
      day: journalEntries.day,
    })
    .from(journalEntries)
    .orderBy(journalEntries.year, journalEntries.month, journalEntries.day);

  result.reverse();

  return NextResponse.json(result);
}
