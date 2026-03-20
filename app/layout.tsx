import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Fraunces, DM_Sans, Geist_Mono, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register";
import { ModeProvider } from "@/lib/mode-context";
import { LocaleProvider } from "@/hooks/use-locale";
import { ThemeProvider } from "@/hooks/use-theme";

const heading = Fraunces({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const body = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const reading = Source_Serif_4({
  variable: "--font-prose",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Journal",
  description: "Encrypted personal journal",
  applicationName: "Journal",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Journal",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        url: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    apple: [
      {
        url: "/icons/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4efe6" },
    { media: "(prefers-color-scheme: dark)", color: "#111118" },
  ],
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${heading.variable} ${body.variable} ${geistMono.variable} ${reading.variable} antialiased`}
      >
        <ServiceWorkerRegister />
        <Suspense>
          <ThemeProvider>
            <LocaleProvider>
              <ModeProvider>
                <DashboardShell>{children}</DashboardShell>
              </ModeProvider>
            </LocaleProvider>
          </ThemeProvider>
        </Suspense>
      </body>
    </html>
  );
}
