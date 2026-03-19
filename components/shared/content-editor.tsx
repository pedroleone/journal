"use client";

import { MarkdownEditor } from "@/components/ui/markdown-editor";

interface ContentEditorProps {
  value: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  readOnly?: boolean;
  autoFocus?: boolean;
  minHeight?: string;
}

export function ContentEditor({
  value,
  onChange,
  onBlur,
  placeholder,
  readOnly,
  autoFocus,
  minHeight = "calc(100vh - 16rem)",
}: ContentEditorProps) {
  return (
    <MarkdownEditor
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      placeholder={placeholder}
      readOnly={readOnly}
      autoFocus={autoFocus}
      minHeight={minHeight}
      className="font-serif text-base leading-relaxed"
    />
  );
}
