import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { NextResponse } from "next/server";
import { upsertGoogleUser } from "@/lib/auth/user";

const PUBLIC_PATHS = [
  "/login",
  "/manifest.webmanifest",
  "/sw.js",
  "/offline.html",
];

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [Google],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    signIn({ account, profile }) {
      if (account?.provider !== "google") return false;

      return (
        typeof profile?.sub === "string" && typeof profile?.email === "string"
      );
    },
    authorized({ request, auth }) {
      const { pathname } = request.nextUrl;

      if (
        PUBLIC_PATHS.includes(pathname) ||
        pathname.startsWith("/icons/") ||
        pathname.startsWith("/api/auth") ||
        pathname.startsWith("/_next") ||
        pathname === "/favicon.ico"
      ) {
        return true;
      }

      if (auth?.user) return true;

      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      return false;
    },
    async jwt({ token, account, profile }) {
      if (account?.provider !== "google") return token;

      const googleSub =
        typeof profile?.sub === "string" ? profile.sub : undefined;
      const email =
        typeof profile?.email === "string"
          ? profile.email
          : typeof token.email === "string"
            ? token.email
            : undefined;

      if (!googleSub || !email) return token;

      const user = await upsertGoogleUser({ googleSub, email });
      token.appUserId = user.id;
      token.email = user.email;
      return token;
    },
    async session({ session, token }) {
      if (session.user && typeof token.appUserId === "string") {
        session.user.id = token.appUserId;
      }

      if (session.user && typeof token.email === "string") {
        session.user.email = token.email;
      }

      return session;
    },
  },
});
