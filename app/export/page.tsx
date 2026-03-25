"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { bytesToBase64 } from "@/lib/base64";
import type { MealSlot } from "@/lib/food";
import type { EntrySource } from "@/lib/types";
import { useLocale } from "@/hooks/use-locale";

type FormatOption = "markdown" | "plaintext" | "pdf";
type PresetOption = "week" | "month" | "custom" | "year" | "everything";

interface BaseEntry {
  id: string;
  source: EntrySource;
  year: number;
  month: number;
  day: number;
  hour: number | null;
  content: string;
  images: string[] | null;
}

interface JournalEntry extends BaseEntry {
  kind: "journal";
}

interface FoodEntry extends BaseEntry {
  kind: "food";
  logged_at: string;
  meal_slot: MealSlot | null;
}

type ExportableEntry = JournalEntry | FoodEntry;

function entrySelectionId(entry: ExportableEntry) {
  return `${entry.kind}:${entry.id}`;
}

function rangeContains(entry: ExportableEntry, from: Date | null, to: Date | null) {
  const current = new Date(entry.year, entry.month - 1, entry.day).getTime();
  if (from && current < from.getTime()) return false;
  if (to && current > to.getTime()) return false;
  return true;
}

function formatFullDate(entry: ExportableEntry, localeCode: string) {
  return new Date(entry.year, entry.month - 1, entry.day).toLocaleDateString(localeCode, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

async function fetchImageDataUrls(entry: ExportableEntry) {
  if (!entry.images?.length) return [];

  const urls: string[] = [];
  for (const imageKey of entry.images) {
    const response = await fetch(`/api/images/${encodeURIComponent(imageKey)}`);
    if (!response.ok) continue;
    const contentType = response.headers.get("Content-Type") ?? "image/jpeg";
    const bytes = new Uint8Array(await response.arrayBuffer());
    urls.push(`data:${contentType};base64,${bytesToBase64(bytes)}`);
  }

  return urls;
}

export default function ExportPage() {
  const [entries, setEntries] = useState<ExportableEntry[]>([]);
  const [preset, setPreset] = useState<PresetOption>("month");
  const [format, setFormat] = useState<FormatOption>("markdown");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [exporting, setExporting] = useState(false);
  const [backupDownloading, setBackupDownloading] = useState(false);
  const { t } = useLocale();

  useEffect(() => {
    let cancelled = false;

    async function loadEntries() {
      const [journalRes, foodRes] = await Promise.all([
        fetch("/api/entries"),
        fetch("/api/food"),
      ]);

      if (!journalRes.ok || !foodRes.ok) return;

      const [journalRows, foodRows] = await Promise.all([
        journalRes.json(),
        foodRes.json(),
      ]);

      if (cancelled) return;

      const allEntries: ExportableEntry[] = [
        ...journalRows.map((entry: BaseEntry) => ({ ...entry, kind: "journal" as const })),
        ...foodRows.map((entry: FoodEntry) => ({ ...entry, kind: "food" as const })),
      ];

      setEntries(allEntries);
    }

    void loadEntries();

    return () => {
      cancelled = true;
    };
  }, []);

  const tree = useMemo(() => {
    const years = new Map<number, Map<number, Map<number, ExportableEntry[]>>>();

    for (const entry of entries) {
      if (!years.has(entry.year)) years.set(entry.year, new Map());
      const months = years.get(entry.year)!;
      if (!months.has(entry.month)) months.set(entry.month, new Map());
      const days = months.get(entry.month)!;
      if (!days.has(entry.day)) days.set(entry.day, []);
      days.get(entry.day)!.push(entry);
    }

    return [...years.entries()]
      .sort((a, b) => b[0] - a[0])
      .map(([year, months]) => ({
        year,
        months: [...months.entries()]
          .sort((a, b) => b[0] - a[0])
          .map(([month, days]) => ({
            month,
            days: [...days.entries()]
              .sort((a, b) => b[0] - a[0])
              .map(([day, dayEntries]) => ({
                day,
                entries: dayEntries,
              })),
          })),
      }));
  }, [entries]);

  useEffect(() => {
    if (!entries.length) return;

    const now = new Date();
    let from: Date | null = null;
    let to: Date | null = null;

    if (preset === "week") {
      from = new Date(now);
      from.setDate(now.getDate() - 6);
      to = now;
    } else if (preset === "month") {
      from = new Date(now.getFullYear(), now.getMonth(), 1);
      to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    } else if (preset === "year") {
      from = new Date(now.getFullYear(), 0, 1);
      to = new Date(now.getFullYear(), 11, 31);
    } else if (preset === "custom") {
      from = customFrom ? new Date(`${customFrom}T00:00:00`) : null;
      to = customTo ? new Date(`${customTo}T23:59:59`) : null;
    }

    const nextIds =
      preset === "everything"
        ? entries.map(entrySelectionId)
        : entries
            .filter((entry) => rangeContains(entry, from, to))
            .map(entrySelectionId);

    setSelectedIds(nextIds);
  }, [customFrom, customTo, entries, preset]);

  function toggleEntries(ids: string[]) {
    setSelectedIds((current) => {
      const allSelected = ids.every((id) => current.includes(id));
      if (allSelected) {
        return current.filter((id) => !ids.includes(id));
      }

      return [...new Set([...current, ...ids])];
    });
  }

  async function downloadEncryptedBackup() {
    setBackupDownloading(true);
    try {
      const response = await fetch("/api/backup");
      if (!response.ok) return;
      const payload = await response.json();
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "journal-backup.json";
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setBackupDownloading(false);
    }
  }

  async function handleExport() {
    const selectedEntries = entries.filter((entry) =>
      selectedIds.includes(entrySelectionId(entry)),
    );
    if (selectedEntries.length === 0) return;

    setExporting(true);
    try {
      const content = await Promise.all(
        selectedEntries
          .slice()
          .sort((a, b) => {
            const left = new Date(a.year, a.month - 1, a.day).getTime();
            const right = new Date(b.year, b.month - 1, b.day).getTime();
            return left - right;
          })
          .map(async (entry) => ({
            entry,
            text: entry.content,
            images: await fetchImageDataUrls(entry),
          })),
      );

      if (format === "pdf") {
        const popup = window.open("", "_blank", "noopener,noreferrer");
        if (!popup) return;

        popup.document.write(`
          <html>
            <head>
              <title>Journal Export</title>
              <style>
                body { font-family: serif; padding: 32px; line-height: 1.6; }
                img { max-width: 100%; display: block; margin: 12px 0; border-radius: 12px; }
                article { margin-bottom: 40px; page-break-inside: avoid; }
                h2 { margin-bottom: 8px; }
                .meta { color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; }
              </style>
            </head>
            <body>
              ${content
                .map(
                  ({ entry, text, images }) => `
                    <article>
                      <div class="meta">${entry.kind} · ${entry.source}</div>
                      <h2>${formatFullDate(entry, t.localeCode)}</h2>
                      <pre style="white-space: pre-wrap; font: inherit;">${text || "(no text)"}</pre>
                      ${images.map((src) => `<img src="${src}" alt="" />`).join("")}
                    </article>
                  `,
                )
                .join("")}
            </body>
          </html>
        `);
        popup.document.close();
        popup.focus();
        popup.print();
        return;
      }

      const output = content
        .map(({ entry, text, images }) => {
          const header =
            format === "markdown"
              ? `## ${formatFullDate(entry, t.localeCode)}\n\n_${entry.kind} · ${entry.source}_`
              : `${formatFullDate(entry, t.localeCode)}\n${entry.kind.toUpperCase()} · ${entry.source.toUpperCase()}`;
          const imageSection =
            images.length === 0
              ? ""
              : format === "markdown"
                ? `\n\nImages:\n${images.map((src) => `![](${src})`).join("\n")}`
                : `\n\nImages:\n${images.join("\n")}`;
          return `${header}\n\n${text || "(no text)"}${imageSection}`;
        })
        .join(format === "markdown" ? "\n\n---\n\n" : "\n\n========================================\n\n");

      const blob = new Blob([output], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = format === "markdown" ? "journal-export.md" : "journal-export.txt";
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="animate-page mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">
          {t.exportPage.export}
        </p>
        <h1 className="font-display text-4xl tracking-tight">{t.exportPage.exportAndDownload}</h1>
      </header>

      <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
        <section className="space-y-6 rounded-xl border border-border/60 bg-card/30 p-6">
          <div className="space-y-3">
            <h2 className="text-sm uppercase tracking-[0.24em] text-muted-foreground">
              {t.exportPage.selectionPreset}
            </h2>
            <div className="grid gap-2">
              {(["week", "month", "custom", "year", "everything"] as PresetOption[]).map((option) => (
                <button
                  key={option}
                  onClick={() => setPreset(option)}
                  className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                    preset === option
                      ? "border-foreground bg-foreground text-background"
                      : "border-border/60 bg-background/50 text-foreground"
                  }`}
                >
                  {option === "week"
                    ? t.exportPage.thisWeek
                    : option === "month"
                      ? t.exportPage.thisMonth
                      : option === "custom"
                        ? t.exportPage.customRange
                        : option === "year"
                          ? t.exportPage.thisYear
                          : t.exportPage.everything}
                </button>
              ))}
            </div>
            {preset === "custom" ? (
              <div className="grid gap-2">
                <input
                  type="date"
                  value={customFrom}
                  onChange={(event) => setCustomFrom(event.target.value)}
                  className="rounded-lg border border-border/60 bg-background/70 px-3 py-2 text-sm"
                />
                <input
                  type="date"
                  value={customTo}
                  onChange={(event) => setCustomTo(event.target.value)}
                  className="rounded-lg border border-border/60 bg-background/70 px-3 py-2 text-sm"
                />
              </div>
            ) : null}
          </div>

          <div className="space-y-3">
            <h2 className="text-sm uppercase tracking-[0.24em] text-muted-foreground">
              {t.exportPage.format}
            </h2>
            <div className="grid gap-2">
              {(["markdown", "plaintext", "pdf"] as FormatOption[]).map((option) => (
                <button
                  key={option}
                  onClick={() => setFormat(option)}
                  className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                    format === option
                      ? "border-foreground bg-foreground text-background"
                      : "border-border/60 bg-background/50 text-foreground"
                  }`}
                >
                  {option === "plaintext" ? t.exportPage.plainText : option.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {t.exportPage.entriesSelected(selectedIds.length)}
            </p>
            <Button onClick={() => void handleExport()} disabled={exporting || selectedIds.length === 0} className="w-full">
              {exporting ? t.exportPage.preparingExport : t.exportPage.exportSelected}
            </Button>
            <Button variant="outline" onClick={() => void downloadEncryptedBackup()} disabled={backupDownloading} className="w-full">
              {backupDownloading ? t.exportPage.downloading : t.exportPage.downloadBackupJson}
            </Button>
          </div>
        </section>

        <section className="rounded-xl border border-border/60 bg-card/20 p-6">
          <h2 className="mb-4 text-sm uppercase tracking-[0.24em] text-muted-foreground">
            {t.exportPage.treeSelection}
          </h2>
          <div className="space-y-4">
            {tree.map((yearGroup) => {
              const yearIds = yearGroup.months.flatMap((monthGroup) =>
                monthGroup.days.flatMap((dayGroup) =>
                  dayGroup.entries.map(entrySelectionId),
                ),
              );
              return (
                <div key={yearGroup.year} className="rounded-lg border border-border/50 p-4">
                  <label className="flex items-center gap-3 text-sm font-medium">
                    <input
                      type="checkbox"
                      checked={yearIds.every((id) => selectedIds.includes(id))}
                      onChange={() => toggleEntries(yearIds)}
                    />
                    {yearGroup.year}
                  </label>
                  <div className="mt-3 space-y-3 pl-6">
                    {yearGroup.months.map((monthGroup) => {
                      const monthIds = monthGroup.days.flatMap((dayGroup) =>
                        dayGroup.entries.map(entrySelectionId),
                      );
                      return (
                        <div key={`${yearGroup.year}-${monthGroup.month}`}>
                          <label className="flex items-center gap-3 text-sm">
                            <input
                              type="checkbox"
                              checked={monthIds.every((id) => selectedIds.includes(id))}
                              onChange={() => toggleEntries(monthIds)}
                            />
                            {new Date(yearGroup.year, monthGroup.month - 1, 1).toLocaleDateString(t.localeCode, {
                              month: "long",
                            })}
                          </label>
                          <div className="mt-2 space-y-2 pl-6">
                            {monthGroup.days.map((dayGroup) => {
                              const dayIds = dayGroup.entries.map(entrySelectionId);
                              return (
                                <label
                                  key={`${yearGroup.year}-${monthGroup.month}-${dayGroup.day}`}
                                  className="flex items-start gap-3 text-sm text-muted-foreground"
                                >
                                  <input
                                    type="checkbox"
                                    checked={dayIds.every((id) => selectedIds.includes(id))}
                                    onChange={() => toggleEntries(dayIds)}
                                  />
                                  <span>
                                    {dayGroup.day.toString().padStart(2, "0")} ·{" "}
                                    {dayGroup.entries.map((entry) => entry.kind).join(", ")}
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
