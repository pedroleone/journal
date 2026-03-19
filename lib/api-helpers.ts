import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import type { ZodSchema } from "zod";
import type { Table } from "drizzle-orm";
import { getRequiredUserId, unauthorizedResponse } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { NO_STORE_HEADERS, jsonNoStore } from "@/lib/http";
import { encryptServerText, decryptServerText } from "@/lib/server-crypto";

// ---------------------------------------------------------------------------
// 1. withAuth — wraps a handler so auth is checked before the handler runs
// ---------------------------------------------------------------------------

type AuthHandler = (
  userId: string,
  request: NextRequest,
) => Promise<NextResponse>;

type AuthHandlerWithParams<P extends Record<string, string>> = (
  userId: string,
  request: NextRequest,
  context: { params: P },
) => Promise<NextResponse>;

export function withAuth(handler: AuthHandler): (request: NextRequest) => Promise<NextResponse>;
export function withAuth<P extends Record<string, string>>(
  handler: AuthHandlerWithParams<P>,
): (request: NextRequest, ctx: { params: Promise<P> }) => Promise<NextResponse>;
export function withAuth<P extends Record<string, string>>(
  handler: AuthHandler | AuthHandlerWithParams<P>,
) {
  return async (request: NextRequest, ctx?: { params: Promise<P> }) => {
    const userId = await getRequiredUserId();
    if (!userId) return unauthorizedResponse();

    if (ctx) {
      const params = await ctx.params;
      return (handler as AuthHandlerWithParams<P>)(userId, request, { params });
    }

    return (handler as AuthHandler)(userId, request);
  };
}

// ---------------------------------------------------------------------------
// 2. parseBody — parse + validate JSON body with a Zod schema
// ---------------------------------------------------------------------------

type ParseSuccess<T> = { success: true; data: T };
type ParseFailure = { success: false; response: NextResponse };
type ParseResult<T> = ParseSuccess<T> | ParseFailure;

export async function parseBody<T>(
  request: NextRequest,
  schema: ZodSchema<T>,
): Promise<ParseResult<T>> {
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return {
      success: false,
      response: jsonNoStore(
        { error: "Invalid input", details: parsed.error.issues },
        { status: 400 },
      ),
    };
  }
  return { success: true, data: parsed.data };
}

// ---------------------------------------------------------------------------
// 3. parseQuery — parse + validate query params with a Zod schema
// ---------------------------------------------------------------------------

export function parseQuery<T>(
  request: NextRequest,
  schema: ZodSchema<T>,
  keys: string[],
): ParseResult<T> {
  const { searchParams } = request.nextUrl;
  const raw: Record<string, string | undefined> = {};
  for (const key of keys) {
    raw[key] = searchParams.get(key) ?? undefined;
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      response: jsonNoStore({ error: "Invalid query" }, { status: 400 }),
    };
  }
  return { success: true, data: parsed.data };
}

// ---------------------------------------------------------------------------
// 4. findOwned — look up a single record by id + userId
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function findOwned<T extends Table, C extends Record<string, any> | undefined = undefined>(
  table: T,
  id: string,
  userId: string,
  columns?: C,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const t = table as any;
  const query = columns
    ? db.select(columns).from(table).where(and(eq(t.id, id), eq(t.userId, userId)))
    : db.select().from(table).where(and(eq(t.id, id), eq(t.userId, userId)));
  const [row] = await query;
  return row ?? null;
}

// ---------------------------------------------------------------------------
// 5. notFoundResponse / deleteNoContent — standard responses
// ---------------------------------------------------------------------------

export function notFoundResponse() {
  return jsonNoStore({ error: "Not found" }, { status: 404 });
}

export function deleteNoContent() {
  return new NextResponse(null, { status: 204, headers: NO_STORE_HEADERS });
}

// ---------------------------------------------------------------------------
// 6. encryptContentFields — encrypt text for DB insert/update
// ---------------------------------------------------------------------------

export async function encryptContentFields(content: string) {
  const encrypted = await encryptServerText(content);
  return { encrypted_content: encrypted.ciphertext, iv: encrypted.iv };
}

// ---------------------------------------------------------------------------
// 7. decryptRecord / decryptRecords — decrypt from DB
// ---------------------------------------------------------------------------

export async function decryptRecord<
  T extends { encrypted_content: string; iv: string },
>(record: T) {
  const { encrypted_content, iv, ...rest } = record;
  const content = await decryptServerText(encrypted_content, iv);
  return { ...rest, content };
}

export async function decryptRecords<
  T extends { encrypted_content: string; iv: string },
>(records: T[]) {
  return Promise.all(records.map(decryptRecord));
}
