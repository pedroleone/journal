"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { NavWrapper } from "@/components/nav-wrapper";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const hideNav = pathname === "/login" || pathname === "/";

  return (
    <>
      <NavWrapper />
      <main className={hideNav ? undefined : "pb-20 md:pb-0"}>{children}</main>
    </>
  );
}
