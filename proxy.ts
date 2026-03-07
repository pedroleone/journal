import { auth } from "@/auth";

export default auth(() => undefined);

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest\\.webmanifest|sw\\.js|offline\\.html|icons/).*)",
  ],
};
