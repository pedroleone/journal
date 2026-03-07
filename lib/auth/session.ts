import { NextResponse } from "next/server";
import { auth } from "@/auth";

export function unauthorizedResponse() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function getRequiredUserId() {
  const session = await auth();
  return session?.user?.id ?? null;
}
