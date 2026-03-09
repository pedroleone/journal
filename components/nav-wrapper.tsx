"use client";

import { usePathname } from "next/navigation";
import { AppNav } from "@/components/app-nav";

export function NavWrapper() {
  const pathname = usePathname();
  if (pathname === "/login" || pathname === "/") return null;
  return <AppNav />;
}
