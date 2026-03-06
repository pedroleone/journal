import { NextRequest, NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { SignJWT } from "jose";
import { loginSchema } from "@/lib/validators";

const secret = new TextEncoder().encode(process.env.SESSION_SECRET!);

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const valid = await compare(parsed.data.password, process.env.PASSWORD_HASH!);
  if (!valid) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const token = await new SignJWT({ sub: "user" })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("15m")
    .setIssuedAt()
    .sign(secret);

  const response = NextResponse.json({ ok: true });
  response.cookies.set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 15 * 60,
  });

  return response;
}
