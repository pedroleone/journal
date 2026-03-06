"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { decrypt } from "@/lib/crypto";
import { getKey } from "@/lib/key-manager";

interface EntryCardProps {
  id: string;
  type: string;
  year: number;
  month: number;
  day: number;
  encrypted_content: string;
  iv: string;
}

export function EntryCard({
  id,
  type,
  encrypted_content,
  iv,
}: EntryCardProps) {
  const router = useRouter();
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    const key = getKey();
    if (!key) return;
    decrypt(key, encrypted_content, iv).then((text) => {
      setPreview(text.length > 140 ? text.slice(0, 140) + "..." : text);
    }).catch(() => {
      setPreview("[decryption failed]");
    });
  }, [encrypted_content, iv]);

  return (
    <button
      onClick={() => router.push(`/entry/${id}`)}
      className="group w-full text-left rounded-lg border border-border/60 bg-card p-4 transition-all hover:border-border hover:shadow-sm"
    >
      <div className="flex items-center gap-2 mb-1.5">
        <Badge variant="secondary" className="capitalize text-[11px]">{type}</Badge>
      </div>
      <p className="text-sm leading-relaxed text-muted-foreground line-clamp-2">
        {preview ?? "Decrypting..."}
      </p>
    </button>
  );
}
