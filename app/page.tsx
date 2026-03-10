import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import {
  LockKeyhole,
  Utensils,
  StickyNote,
  MessageCircle,
  FileText,
  WifiOff,
} from "lucide-react";

const features = [
  {
    icon: LockKeyhole,
    title: "Encrypted Journal",
    description:
      "End-to-end encrypted entries written in markdown. The server never sees plaintext.",
  },
  {
    icon: Utensils,
    title: "Food Log",
    description: "Track meals from the web or via Telegram bot.",
  },
  {
    icon: StickyNote,
    title: "Notes",
    description:
      "Notes with subnotes and tags, organized in a two-pane view.",
  },
  {
    icon: MessageCircle,
    title: "Telegram",
    description: "Send entries directly from Telegram. Bot handles the rest.",
  },
  {
    icon: FileText,
    title: "Markdown",
    description: "Full markdown editing with live preview.",
  },
  {
    icon: WifiOff,
    title: "Offline",
    description: "Installable PWA. Works without a network connection.",
  },
];

export default async function Home() {
  const session = await auth();
  if (session?.user?.id) {
    redirect("/home");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-24">
        <div className="max-w-2xl w-full mx-auto space-y-20">
          {/* Hero */}
          <div className="animate-page space-y-8 text-center">
            <div className="space-y-3">
              <h1 className="font-display text-5xl tracking-tight">Journal</h1>
              <p className="max-w-sm mx-auto text-base text-muted-foreground">
                A private place for your thoughts, meals, and notes — encrypted
                by default.
              </p>
            </div>
            <div className="flex justify-center">
              <GoogleSignInButton />
            </div>
          </div>

          {/* Features grid */}
          <div className="grid grid-cols-2 gap-px bg-border rounded-lg overflow-hidden">
            {features.map(({ icon: Icon, title, description }) => (
              <div key={title} className="bg-background p-6 space-y-2">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{title}</span>
                </div>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 text-center">
        <p className="text-sm text-muted-foreground">Private by design.</p>
      </footer>
    </div>
  );
}
