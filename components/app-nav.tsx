"use client";

import { DesktopTopBar } from "@/components/nav/desktop-top-bar";
import { MobileBottomBar } from "@/components/nav/mobile-bottom-bar";
import { MobileTopBar } from "@/components/nav/mobile-top-bar";
import { useMediaQuery } from "@/hooks/use-media-query";

export function AppNav() {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (isDesktop) {
    return <DesktopTopBar />;
  }

  return (
    <>
      <MobileTopBar />
      <div aria-hidden="true" className="h-12 md:hidden" />
      <MobileBottomBar />
    </>
  );
}
