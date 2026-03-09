"use client";

import { useMemo } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { markdown } from "@codemirror/lang-markdown";
import { EditorView } from "@codemirror/view";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags } from "@lezer/highlight";
import { cn } from "@/lib/utils";

const markdownHighlight = HighlightStyle.define([
  { tag: tags.heading1, fontSize: "1.25em", fontWeight: "600" },
  { tag: tags.heading2, fontSize: "1.15em", fontWeight: "600" },
  { tag: tags.heading3, fontSize: "1.05em", fontWeight: "600" },
  { tag: tags.strong, fontWeight: "bold" },
  { tag: tags.emphasis, fontStyle: "italic" },
  { tag: tags.strikethrough, textDecoration: "line-through" },
]);

const baseTheme = EditorView.theme({
  "&": { backgroundColor: "transparent", color: "inherit" },
  ".cm-scroller": {
    fontFamily: "inherit",
    fontSize: "inherit",
    lineHeight: "inherit",
    overflow: "visible",
  },
  ".cm-content": { padding: "0", caretColor: "currentColor" },
  ".cm-line": { padding: "0" },
  ".cm-cursor, .cm-dropCursor": { borderLeftColor: "currentColor" },
  "&.cm-focused .cm-selectionBackground, .cm-selectionBackground": {
    backgroundColor: "color-mix(in srgb, currentColor 12%, transparent)",
  },
  "&.cm-editor": { outline: "none" },
  ".cm-activeLine": { backgroundColor: "transparent" },
  ".cm-placeholder": { color: "currentColor", opacity: "0.4" },
});

// CodeMirror's .cm-scroller has overflow:visible so it never scrolls itself.
// After each update, find the rendered cursor element and call scrollIntoView
// so the browser's native logic scrolls the nearest scrollable ancestor.
const scrollCursorIntoView = EditorView.updateListener.of((update) => {
  if (!update.selectionSet && !update.docChanged) return;
  requestAnimationFrame(() => {
    const cursor = update.view.dom.querySelector<HTMLElement>(".cm-cursor");
    cursor?.scrollIntoView({ block: "nearest" });
  });
});

const baseExtensions = [
  markdown(),
  EditorView.lineWrapping,
  syntaxHighlighting(markdownHighlight),
  baseTheme,
  scrollCursorIntoView,
];

const basicSetupOptions = {
  lineNumbers: false,
  foldGutter: false,
  dropCursor: false,
  allowMultipleSelections: false,
  indentOnInput: false,
  bracketMatching: false,
  closeBrackets: false,
  autocompletion: false,
  rectangularSelection: false,
  crosshairCursor: false,
  highlightActiveLine: false,
  highlightSelectionMatches: false,
  closeBracketsKeymap: false,
  defaultKeymap: true,
  searchKeymap: false,
  historyKeymap: true,
  foldKeymap: false,
  completionKeymap: false,
  lintKeymap: false,
};

interface MarkdownEditorProps {
  value: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
  autoFocus?: boolean;
  minHeight?: string;
  readOnly?: boolean;
}

export function MarkdownEditor({
  value,
  onChange,
  onBlur,
  onKeyDown,
  placeholder,
  className,
  style,
  autoFocus,
  minHeight,
  readOnly,
}: MarkdownEditorProps) {
  const extensions = useMemo(() => {
    if (!minHeight) return baseExtensions;
    return [
      ...baseExtensions,
      EditorView.theme({ ".cm-content": { minHeight } }),
    ];
  }, [minHeight]);

  return (
    <div className={cn("w-full", className)} style={style} onKeyDown={onKeyDown}>
      <CodeMirror
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        extensions={extensions}
        autoFocus={autoFocus}
        placeholder={placeholder}
        basicSetup={basicSetupOptions}
        theme="none"
        readOnly={readOnly}
      />
    </div>
  );
}
