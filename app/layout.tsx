import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Fraunces, DM_Sans, Geist_Mono } from "next/font/google";
import "./globals.css";
import { NavWrapper } from "@/components/nav-wrapper";
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
    { media: "(prefers-color-scheme: dark)", color: "rgb(43 40 35)" },
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
        <script dangerouslySetInnerHTML={{ __html: `(function(){var t=localStorage.getItem('theme');var d=window.matchMedia('(prefers-color-scheme: dark)').matches;if(t==='dark'||(t===null&&d)){document.documentElement.classList.add('dark');}})();` }} />
        <ServiceWorkerRegister />
        <Suspense>
          <ThemeProvider>
          <LocaleProvider>
            <ModeProvider>
              <NavWrapper />
              {children}
            </ModeProvider>
          </LocaleProvider>
          </ThemeProvider>
        </Suspense>
      </body>
    </html>
  );
}
