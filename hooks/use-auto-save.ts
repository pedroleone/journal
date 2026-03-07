"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { encrypt } from "@/lib/crypto";
import { getKey } from "@/lib/key-manager";

type Status = "idle" | "saving" | "saved" | "error";

interface UseAutoSaveOptions {
  entryId: string | null;
  content: string;
  year: number;
  month: number;
  day: number;
  delayMs?: number;
}

interface UseAutoSaveReturn {
  status: Status;
  lastSaved: Date | null;
  entryId: string | null;
}

export function useAutoSave({
  entryId: initialEntryId,
  content,
  year,
  month,
  day,
  delayMs = 1500,
}: UseAutoSaveOptions): UseAutoSaveReturn {
  const [status, setStatus] = useState<Status>("idle");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [entryId, setEntryId] = useState<string | null>(initialEntryId);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savingRef = useRef(false);
  const contentRef = useRef(content);
  const entryIdRef = useRef(entryId);

  contentRef.current = content;
  entryIdRef.current = entryId;

  useEffect(() => {
    if (initialEntryId) {
      setEntryId(initialEntryId);
      entryIdRef.current = initialEntryId;
    }
  }, [initialEntryId]);

  const save = useCallback(async () => {
    const currentContent = contentRef.current;
    if (!currentContent.trim() || savingRef.current) return;

    const key = getKey();
    if (!key) {
      setStatus("error");
      return;
    }

    savingRef.current = true;
    setStatus("saving");

    try {
      const { ciphertext, iv } = await encrypt(key, currentContent);

      if (entryIdRef.current) {
        const res = await fetch(`/api/journal/${entryIdRef.current}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ encrypted_content: ciphertext, iv }),
        });
        if (!res.ok) throw new Error("Failed to update");
      } else {
        const now = new Date();
        const res = await fetch("/api/journal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            encrypted_content: ciphertext,
            iv,
            year,
            month,
            day,
            hour: now.getHours(),
          }),
        });
        if (!res.ok) throw new Error("Failed to create");
        const data = await res.json();
        setEntryId(data.id);
        entryIdRef.current = data.id;
      }

      setStatus("saved");
      setLastSaved(new Date());
    } catch {
      setStatus("error");
    } finally {
      savingRef.current = false;
    }
  }, [year, month, day]);

  useEffect(() => {
    if (!content.trim()) {
      setStatus("idle");
      return;
    }

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(save, delayMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [content, save, delayMs]);

  return { status, lastSaved, entryId };
}
