"use client";

import Link from "next/link";
import { Pencil } from "lucide-react";
import { MarkdownEditor } from "@/components/ui/markdown-editor";
import { EncryptedImageGallery } from "@/components/encrypted-image-gallery";

interface JournalEntryStateProps {
  entryId: string;
  content: string;
  imageKeys?: string[] | null;
  editable: boolean;
}

export function JournalEntryState({
  entryId,
  content,
  imageKeys,
  editable,
}: JournalEntryStateProps) {
  const contentView = (
    <div className="space-y-6" data-testid="journal-entry-state">
      <div className="journal-prose">
        <MarkdownEditor readOnly value={content} className="pointer-events-none" />
      </div>
      {imageKeys?.length ? (
        <EncryptedImageGallery
          imageKeys={imageKeys}
          className="gap-3 md:flex-row"
          imageClassName="h-[84px] w-[84px] rounded-md md:h-[84px] md:w-[84px]"
        />
      ) : null}
    </div>
  );

  if (!editable) return contentView;

  return (
    <Link
      href={`/journal/write?entry=${entryId}`}
      className="group block rounded-2xl border border-transparent p-1 transition-colors hover:border-border/50 hover:bg-secondary/20"
    >
      <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border/60 px-3 py-1 text-xs text-muted-foreground">
        <Pencil className="h-3.5 w-3.5" />
        Edit entry
      </div>
      {contentView}
    </Link>
  );
}
