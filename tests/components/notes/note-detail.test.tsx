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

  it("does not create a new note when title focus moves within the editor", () => {
    const onUpdate = vi.fn().mockResolvedValue(undefined);

    render(
      <NoteDetail
        note={buildNote({
          id: "__new__",
          title: null,
          tags: null,
          images: null,
          content: "",
        })}
        onUpdate={onUpdate}
        onAddSubnote={vi.fn().mockResolvedValue(undefined)}
        onUpdateSubnote={vi.fn().mockResolvedValue(undefined)}
        onDelete={vi.fn().mockResolvedValue(undefined)}
        onDeleteSubnote={vi.fn().mockResolvedValue(undefined)}
        onImagesChange={vi.fn().mockResolvedValue(undefined)}
      />,
    );

    const titleInput = screen.getByPlaceholderText(/untitled/i);
    const tagInput = screen.getByPlaceholderText(/add tag/i);

    fireEvent.change(titleInput, { target: { value: "Draft title" } });
    fireEvent.blur(titleInput, { relatedTarget: tagInput });

    expect(onUpdate).not.toHaveBeenCalled();
  });

  it("saves a new note title when focus leaves the editor", async () => {
    const onUpdate = vi.fn().mockResolvedValue(undefined);

    render(
      <NoteDetail
        note={buildNote({
          id: "__new__",
          title: null,
          tags: null,
          images: null,
          content: "",
        })}
        onUpdate={onUpdate}
        onAddSubnote={vi.fn().mockResolvedValue(undefined)}
        onUpdateSubnote={vi.fn().mockResolvedValue(undefined)}
        onDelete={vi.fn().mockResolvedValue(undefined)}
        onDeleteSubnote={vi.fn().mockResolvedValue(undefined)}
        onImagesChange={vi.fn().mockResolvedValue(undefined)}
      />,
    );

    const titleInput = screen.getByPlaceholderText(/untitled/i);

    fireEvent.change(titleInput, { target: { value: "Draft title" } });
    fireEvent.blur(titleInput);

    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith({ title: "Draft title" });
    });
  });

  it("includes the current title when a new note is first saved from content blur", async () => {
    const onUpdate = vi.fn().mockResolvedValue(undefined);

    render(
      <NoteDetail
        note={buildNote({
          id: "__new__",
          title: null,
          tags: null,
          images: null,
          content: "",
        })}
        onUpdate={onUpdate}
        onAddSubnote={vi.fn().mockResolvedValue(undefined)}
        onUpdateSubnote={vi.fn().mockResolvedValue(undefined)}
        onDelete={vi.fn().mockResolvedValue(undefined)}
        onDeleteSubnote={vi.fn().mockResolvedValue(undefined)}
        onImagesChange={vi.fn().mockResolvedValue(undefined)}
      />,
    );

    const titleInput = screen.getByPlaceholderText(/untitled/i);
    const contentInput = screen.getByPlaceholderText(/start writing/i);

    fireEvent.change(titleInput, { target: { value: "Draft title" } });
    fireEvent.blur(titleInput, { relatedTarget: contentInput });
    fireEvent.change(contentInput, { target: { value: "Draft body" } });
    fireEvent.blur(contentInput);

    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith({
        title: "Draft title",
        content: "Draft body",
      });
    });
  });

  it("renders the title field as a wrapping textarea", () => {
    render(
      <NoteDetail
        note={buildNote()}
        onUpdate={vi.fn().mockResolvedValue(undefined)}
        onAddSubnote={vi.fn().mockResolvedValue(undefined)}
        onUpdateSubnote={vi.fn().mockResolvedValue(undefined)}
        onDelete={vi.fn().mockResolvedValue(undefined)}
        onDeleteSubnote={vi.fn().mockResolvedValue(undefined)}
        onImagesChange={vi.fn().mockResolvedValue(undefined)}
      />,
    );

    const titleInput = screen.getByPlaceholderText(/untitled/i);

    expect(titleInput.tagName).toBe("TEXTAREA");
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
    fireEvent.click(screen.getByRole("button", { name: /add entry/i }));
    fireEvent.change(screen.getByPlaceholderText(/write a subnote/i), {
      target: { value: "subnote draft" },
    });
    fireEvent.click(screen.getByRole("button", { name: /remove image/i }));

    expect(await screen.findByText("Failed to remove image")).toBeTruthy();
    expect(screen.getByDisplayValue("draft-tag")).toBeTruthy();
    expect(screen.getByDisplayValue("subnote draft")).toBeTruthy();
    expect(screen.getAllByText(/^cancel$/i)).toHaveLength(1);

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
