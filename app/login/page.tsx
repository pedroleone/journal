import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";

export default async function LoginPage() {
  const session = await auth();

  if (session?.user?.id) {
    redirect("/unlock");
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="animate-page w-full max-w-xs space-y-8">
        <div className="text-center">
          <h1 className="font-display text-4xl tracking-tight">Journal</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Google authenticates the session. Your passphrase still unlocks the journal locally.
          </p>
        </div>

        <div className="space-y-4">
          <GoogleSignInButton />
          <p className="text-center text-xs text-muted-foreground">
            The server never receives your encryption passphrase.
          </p>
        </div>
      </div>
    </div>
  );
}
