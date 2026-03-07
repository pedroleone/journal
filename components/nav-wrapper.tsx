"use client";

import { usePathname } from "next/navigation";
import { AppNav } from "@/components/app-nav";

export function NavWrapper() {
  const pathname = usePathname();
  if (pathname === "/login") return null;
  return <AppNav />;
}
