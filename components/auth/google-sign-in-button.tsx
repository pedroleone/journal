"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function GoogleSignInButton() {
  const [loading, setLoading] = useState(false);

  async function handleSignIn() {
    setLoading(true);
    await signIn("google", { redirectTo: "/unlock" });
  }

  return (
    <Button type="button" className="w-full" onClick={handleSignIn} disabled={loading}>
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Redirecting...
        </>
      ) : (
        "Continue with Google"
      )}
    </Button>
  );
}
