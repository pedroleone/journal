"use client";

import { Download } from "lucide-react";
import { usePwaInstall } from "@/hooks/use-pwa-install";
import { Button } from "@/components/ui/button";

export function InstallAppButton() {
  const { canInstall, promptInstall } = usePwaInstall();

  if (!canInstall) return null;

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="gap-1.5"
      onClick={() => {
        void promptInstall();
      }}
    >
      <Download className="h-4 w-4" />
      <span className="hidden sm:inline">Install</span>
    </Button>
  );
}
