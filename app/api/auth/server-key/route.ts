import { getRequiredUserId, unauthorizedResponse } from "@/lib/auth/session";
import { jsonNoStore } from "@/lib/http";

export async function GET() {
  const userId = await getRequiredUserId();
  if (!userId) return unauthorizedResponse();

  const secret = process.env.SERVER_ENCRYPTION_SECRET;
  if (!secret) {
    return jsonNoStore(
      { error: "SERVER_ENCRYPTION_SECRET is not set" },
      { status: 500 },
    );
  }

  return jsonNoStore({ secret });
}
