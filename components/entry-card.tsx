"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
  year,
  month,
  day,
  encrypted_content,
  iv,
}: EntryCardProps) {
  const router = useRouter();
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    const key = getKey();
    if (!key) return;
    decrypt(key, encrypted_content, iv).then((text) => {
      setPreview(text.length > 120 ? text.slice(0, 120) + "..." : text);
    }).catch(() => {
      setPreview("[decryption failed]");
    });
  }, [encrypted_content, iv]);

  const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  return (
    <Card
      className="cursor-pointer transition-colors hover:bg-accent/50"
      onClick={() => router.push(`/entry/${id}`)}
    >
      <CardHeader className="flex flex-row items-center gap-2 pb-2">
        <Badge variant="secondary">{type}</Badge>
        <span className="text-sm text-muted-foreground">{dateStr}</span>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          {preview ?? "Decrypting..."}
        </p>
      </CardContent>
    </Card>
  );
}
