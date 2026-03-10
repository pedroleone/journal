// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NoteDetail, type NoteDetailData } from "@/components/notes/note-detail";

const deleteEncryptedImageMock = vi.fn();

vi.mock("@/components/ui/markdown-editor", () => ({
  MarkdownEditor: ({
    value,
    onChange,
    onBlur,
    placeholder,
  }: {
    value: string;
    onChange?: (value: string) => void;
    onBlur?: () => void;
    placeholder?: string;
  }) => (
    <textarea
      value={value}
      placeholder={placeholder}
      onChange={(event) => onChange?.(event.target.value)}
      onBlur={onBlur}
    />
  ),
}));

vi.mock("@/hooks/use-images", () => ({
  useImages: (imageKeys: string[] | null) => ({
    images: (imageKeys ?? []).map((key) => ({ key, url: `blob:${key}` })),
  }),
}));

vi.mock("@/lib/client-images", () => ({
  uploadEncryptedImage: vi.fn(),
  deleteEncryptedImage: (...args: unknown[]) => deleteEncryptedImageMock(...args),
}));

function buildNote(overrides?: Partial<NoteDetailData>): NoteDetailData {
  return {
    id: "note-1",
    title: "First note",
    tags: ["alpha"],
    images: ["image-1"],
    content: "First content",
    created_at: "2026-03-08T12:00:00.000Z",
    updated_at: "2026-03-08T12:00:00.000Z",
    subnotes: [],
    ...overrides,
  };
}

describe("NoteDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("resets draft and transient UI state when the note changes", async () => {
    deleteEncryptedImageMock.mockRejectedValueOnce(new Error("boom"));

    const onUpdate = vi.fn().mockResolvedValue(undefined);
    const onAddSubnote = vi.fn().mockResolvedValue(undefined);
    const onUpdateSubnote = vi.fn().mockResolvedValue(undefined);
    const onDelete = vi.fn().mockResolvedValue(undefined);
    const onDeleteSubnote = vi.fn().mockResolvedValue(undefined);
    const onImagesChange = vi.fn().mockResolvedValue(undefined);

    const { rerender } = render(
      <NoteDetail
        note={buildNote()}
        onUpdate={onUpdate}
        onAddSubnote={onAddSubnote}
        onUpdateSubnote={onUpdateSubnote}
        onDelete={onDelete}
        onDeleteSubnote={onDeleteSubnote}
        onImagesChange={onImagesChange}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText(/add tag/i), {
      target: { value: "draft-tag" },
    });
    fireEvent.click(screen.getByRole("button", { name: /delete note/i }));
    fireEvent.click(screen.getByRole("button", { name: /add entry/i }));
    fireEvent.change(screen.getByPlaceholderText(/write a subnote/i), {
      target: { value: "subnote draft" },
    });
    fireEvent.click(screen.getByRole("button", { name: /remove image/i }));

    expect(await screen.findByText("Failed to remove image")).toBeTruthy();
    expect(screen.getByDisplayValue("draft-tag")).toBeTruthy();
    expect(screen.getByDisplayValue("subnote draft")).toBeTruthy();
    expect(screen.getAllByText(/^cancel$/i)).toHaveLength(2);

    rerender(
      <NoteDetail
        note={buildNote({
          id: "note-2",
          title: "Second note",
          tags: ["beta"],
          images: null,
          content: "Second content",
          created_at: "2026-03-09T12:00:00.000Z",
          updated_at: "2026-03-09T12:00:00.000Z",
        })}
        onUpdate={onUpdate}
        onAddSubnote={onAddSubnote}
        onUpdateSubnote={onUpdateSubnote}
        onDelete={onDelete}
        onDeleteSubnote={onDeleteSubnote}
        onImagesChange={onImagesChange}
      />,
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue("Second note")).toBeTruthy();
    });

    expect(screen.getByDisplayValue("Second content")).toBeTruthy();
    expect(screen.getByText("beta")).toBeTruthy();
    expect(screen.queryByText("alpha")).toBeNull();
    expect((screen.getByPlaceholderText(/add tag/i) as HTMLInputElement).value).toBe("");
    expect(screen.queryByPlaceholderText(/write a subnote/i)).toBeNull();
    expect(screen.queryByText("Failed to remove image")).toBeNull();
    expect(screen.queryAllByText(/^cancel$/i)).toHaveLength(0);
  });
});
