import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { NO_STORE_HEADERS } from "@/lib/http";

export function unauthorizedResponse() {
  return NextResponse.json(
    { error: "Unauthorized" },
    { status: 401, headers: NO_STORE_HEADERS },
  );
}

export async function getRequiredUserId() {
  const session = await auth();
  return session?.user?.id ?? null;
}
