"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";

interface VocabularyInputProps {
  field: "reactions" | "genres" | "platform";
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
}

interface VocabSuggestion {
  value: string;
  count: number;
}

export function VocabularyInput({ field, values, onChange, placeholder }: VocabularyInputProps) {
  const [suggestions, setSuggestions] = useState<VocabSuggestion[]>([]);
  const [input, setInput] = useState("");
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/library/vocabulary?field=${field}`)
      .then((r) => r.json())
      .then(setSuggestions)
      .catch(() => undefined);
  }, [field]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = useMemo(() => {
    const q = input.toLowerCase();
    return suggestions.filter(
      (s) => !values.includes(s.value) && (!q || s.value.toLowerCase().includes(q)),
    );
  }, [suggestions, values, input]);

  function addValue(val: string) {
    if (!values.includes(val)) {
      onChange([...values, val]);
    }
    setInput("");
    setOpen(false);
  }

  function removeValue(val: string) {
    onChange(values.filter((v) => v !== val));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const val = input.trim();
      if (val) addValue(val);
    }
    if (e.key === "Backspace" && input === "" && values.length > 0) {
      e.preventDefault();
      removeValue(values[values.length - 1]);
    }
    if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={wrapperRef} className="relative">
      <div className="flex flex-wrap items-center gap-1.5 min-h-[2rem]">
        {values.map((val) => (
          <span
            key={val}
            className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-muted/50 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground tracking-wide"
          >
            {val}
            <button
              onClick={() => removeValue(val)}
              className="hover:text-foreground leading-none transition-colors"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </span>
        ))}
        <input
          className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none min-w-[80px] flex-1"
          placeholder={placeholder}
          value={input}
          onChange={(e) => { setInput(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
        />
      </div>

      {open && filtered.length > 0 && (
        <div className="absolute left-0 top-full z-20 mt-1 max-h-40 w-full overflow-y-auto rounded-md border border-border bg-background shadow-md">
          {filtered.map((s) => (
            <button
              key={s.value}
              onClick={() => addValue(s.value)}
              className="flex w-full items-center justify-between px-3 py-1.5 text-sm hover:bg-secondary"
            >
              <span>{s.value}</span>
              {s.count > 0 && (
                <span className="text-xs text-muted-foreground">{s.count}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
