"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/hooks/use-locale";
import { useDefaultView, DefaultView, VIEW_ROUTES } from "@/hooks/use-default-view";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const VIEW_LABELS: Record<DefaultView, { en: string; pt: string }> = {
  "journal-browse": { en: "Journal Browse", pt: "Navegar Diário" },
  "food-browse": { en: "Food Browse", pt: "Navegar Alimentação" },
  "notes-browse": { en: "Notes Browse", pt: "Navegar Notas" },
  "journal-write": { en: "Journal Write", pt: "Escrever Diário" },
  "food-new": { en: "New Food Entry", pt: "Nova Entrada de Alimentação" },
  "notes-new": { en: "New Note", pt: "Nova Nota" },
};

export default function SettingsPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [restoreMessage, setRestoreMessage] = useState("");
  const { t, locale, setLocale } = useLocale();
  const { view: defaultView, setView: setDefaultView } = useDefaultView();

  async function handleRestore(file: File | null) {
    if (!file) return;

    setRestoring(true);
    setRestoreMessage("");

    try {
      const payload = JSON.parse(await file.text());
      const response = await fetch("/api/backup/restore", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Restore failed");
      }

      const data = await response.json();
      setRestoreMessage(
        t.settings.importedResult(data.imported_journal, data.imported_food, data.imported_images),
      );
    } catch {
      setRestoreMessage(t.settings.restoreFailed);
    } finally {
      setRestoring(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  return (
    <div className="animate-page mx-auto max-w-3xl space-y-8 px-6 py-10">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">
          {t.settings.settings}
        </p>
        <h1 className="font-display text-4xl tracking-tight">{t.settings.journalControls}</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          {t.settings.description}
        </p>
      </header>

      <section className="rounded-xl border border-border/60 bg-card/30 p-6">
        <h2 className="font-display text-2xl tracking-tight">{t.settings.language}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{t.settings.languageDesc}</p>
        <div className="mt-4 flex gap-2">
          <Button
            variant={locale === "en" ? "default" : "outline"}
            size="sm"
            onClick={() => setLocale("en")}
          >
            English
          </Button>
          <Button
            variant={locale === "pt-br" ? "default" : "outline"}
            size="sm"
            onClick={() => setLocale("pt-br")}
          >
            Português (BR)
          </Button>
        </div>
      </section>

      <section className="rounded-xl border border-border/60 bg-card/30 p-6">
        <h2 className="font-display text-2xl tracking-tight">{t.settings.defaultView}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{t.settings.defaultViewDesc}</p>
        <div className="mt-4">
          <Select value={defaultView} onValueChange={(v) => setDefaultView(v as DefaultView)}>
            <SelectTrigger className="w-[240px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(VIEW_ROUTES) as DefaultView[]).map((key) => (
                <SelectItem key={key} value={key}>
                  {locale === "pt-br" ? VIEW_LABELS[key].pt : VIEW_LABELS[key].en}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </section>

      <section className="rounded-xl border border-border/60 bg-card/30 p-6">
        <h2 className="font-display text-2xl tracking-tight">{t.settings.dataExport}</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {t.settings.dataExportDesc}
        </p>
        <Button className="mt-4" asChild>
          <Link href="/export">{t.settings.openExportTools}</Link>
        </Button>
      </section>

      <section className="rounded-xl border border-border/60 bg-card/30 p-6">
        <h2 className="font-display text-2xl tracking-tight">{t.settings.restoreBackup}</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {t.settings.restoreBackupDesc}
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          className="mt-4 block text-sm text-muted-foreground"
          onChange={(event) => {
            void handleRestore(event.target.files?.[0] ?? null);
          }}
        />
        {restoring ? <p className="mt-3 text-sm text-muted-foreground">{t.settings.restoring}</p> : null}
        {restoreMessage ? <p className="mt-3 text-sm text-muted-foreground">{restoreMessage}</p> : null}
      </section>

    </div>
  );
}
