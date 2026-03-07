"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { decrypt } from "@/lib/crypto";
import { getKey } from "@/lib/key-manager";

type RangeOption = "week" | "month" | "year" | "everything";
type FormatOption = "markdown" | "plaintext";

interface RawEntry {
  id: string;
  year: number;
  month: number;
  day: number;
  hour: number | null;
  encrypted_content: string;
  iv: string;
  created_at: string;
}

const MONTH_NAMES = [
  "",
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function formatDate(year: number, month: number, day: number): string {
  const date = new Date(year, month - 1, day);
  return `${DAY_NAMES[date.getDay()]}, ${day} ${MONTH_NAMES[month]} ${year}`;
}

function getWeekRange(): { year: number; month: number; day: number }[] {
  const now = new Date();
  const dates = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    dates.push({
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      day: d.getDate(),
    });
  }
  return dates;
}

interface ExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExportModal({ open, onOpenChange }: ExportModalProps) {
  const [range, setRange] = useState<RangeOption>("month");
  const [format, setFormat] = useState<FormatOption>("markdown");
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    const key = getKey();
    if (!key) return;

    setExporting(true);

    try {
      const now = new Date();
      const params = new URLSearchParams();

      if (range === "week") {
        // Fetch all, filter client-side
      } else if (range === "month") {
        params.set("year", String(now.getFullYear()));
        params.set("month", String(now.getMonth() + 1));
      } else if (range === "year") {
        params.set("year", String(now.getFullYear()));
      }

      const res = await fetch(`/api/entries?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");

      let entries: RawEntry[] = await res.json();

      if (range === "week") {
        const weekDates = getWeekRange();
        const dateSet = new Set(
          weekDates.map((d) => `${d.year}-${d.month}-${d.day}`),
        );
        entries = entries.filter(
          (e) => dateSet.has(`${e.year}-${e.month}-${e.day}`),
        );
      }

      // Decrypt all entries
      const decrypted: { entry: RawEntry; content: string }[] = [];
      for (const entry of entries) {
        try {
          const content = await decrypt(key, entry.encrypted_content, entry.iv);
          decrypted.push({ entry, content });
        } catch {
          decrypted.push({ entry, content: "[decryption failed]" });
        }
      }

      // Sort chronologically
      decrypted.sort((a, b) => {
        const aKey = a.entry.year * 10000 + a.entry.month * 100 + a.entry.day;
        const bKey = b.entry.year * 10000 + b.entry.month * 100 + b.entry.day;
        return aKey - bKey;
      });

      // Build document
      let output: string;
      const ext = format === "markdown" ? "md" : "txt";

      if (format === "markdown") {
        output = decrypted
          .map(
            ({ entry, content }) =>
              `## ${formatDate(entry.year, entry.month, entry.day)}\n\n${content}`,
          )
          .join("\n\n---\n\n");
      } else {
        output = decrypted
          .map(
            ({ entry, content }) =>
              `${formatDate(entry.year, entry.month, entry.day)}\n${"=".repeat(40)}\n\n${content}`,
          )
          .join("\n\n\n");
      }

      // Download
      const blob = new Blob([output], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `journal-export.${ext}`;
      a.click();
      URL.revokeObjectURL(url);

      onOpenChange(false);
    } catch {
      // Export failed
    } finally {
      setExporting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            Export Journal
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">
          <div className="space-y-3">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              Selection
            </Label>
            <RadioGroup
              value={range}
              onValueChange={(v) => setRange(v as RangeOption)}
              className="space-y-2"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="week" id="range-week" />
                <Label htmlFor="range-week" className="font-normal">
                  This week
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="month" id="range-month" />
                <Label htmlFor="range-month" className="font-normal">
                  This month
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="year" id="range-year" />
                <Label htmlFor="range-year" className="font-normal">
                  This year
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="everything" id="range-all" />
                <Label htmlFor="range-all" className="font-normal">
                  Everything
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-3">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              Format
            </Label>
            <RadioGroup
              value={format}
              onValueChange={(v) => setFormat(v as FormatOption)}
              className="space-y-2"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="markdown" id="format-md" />
                <Label htmlFor="format-md" className="font-normal">
                  Markdown (.md)
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="plaintext" id="format-txt" />
                <Label htmlFor="format-txt" className="font-normal">
                  Plain text (.txt)
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={exporting}>
            {exporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              "Decrypt & Export"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
