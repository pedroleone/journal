import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Instrument_Serif, DM_Sans, Geist_Mono } from "next/font/google";
import "./globals.css";
import { NavWrapper } from "@/components/nav-wrapper";
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register";
import { ModeProvider } from "@/lib/mode-context";

const heading = Instrument_Serif({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: "400",
});

const body = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
    { media: "(prefers-color-scheme: light)", color: "rgb(248 247 242)" },
    { media: "(prefers-color-scheme: dark)", color: "rgb(31 29 25)" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${heading.variable} ${body.variable} ${geistMono.variable} antialiased`}
      >
        <ServiceWorkerRegister />
        <Suspense>
          <ModeProvider>
            <NavWrapper />
            {children}
          </ModeProvider>
        </Suspense>
      </body>
    </html>
  );
}
