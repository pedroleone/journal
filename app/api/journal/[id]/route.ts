import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { journalEntries } from "@/lib/schema";
import { updateEntrySchema } from "@/lib/validators";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const result = await db.select().from(journalEntries).where(eq(journalEntries.id, id));

  if (result.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(result[0]);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json();
  const parsed = updateEntrySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const now = new Date().toISOString();
  await db
    .update(journalEntries)
    .set({
      encrypted_content: parsed.data.encrypted_content,
      iv: parsed.data.iv,
      updated_at: now,
    })
    .where(eq(journalEntries.id, id));

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await db.delete(journalEntries).where(eq(journalEntries.id, id));
  return new NextResponse(null, { status: 204 });
}
