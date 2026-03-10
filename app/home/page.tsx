"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { VIEW_ROUTES, type DefaultView } from "@/hooks/use-default-view";

const VALID_VIEWS = new Set(Object.keys(VIEW_ROUTES));

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem("defaultView");
    const view: DefaultView =
      stored && VALID_VIEWS.has(stored) ? (stored as DefaultView) : "journal-browse";
    router.replace(VIEW_ROUTES[view]);
  }, [router]);

  return null;
}
