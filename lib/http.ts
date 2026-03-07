import { NextResponse } from "next/server";

export const NO_STORE_HEADERS = {
  "Cache-Control": "no-store",
};

export function jsonNoStore(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, {
    ...init,
    headers: {
      ...NO_STORE_HEADERS,
      ...(init?.headers ?? {}),
    },
  });
}
