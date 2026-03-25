import { describe, it, expect } from "vitest";
import { renderMarkdownPreview } from "@/lib/markdown-preview";

describe("renderMarkdownPreview", () => {
  it("renders --- as <hr>", () => {
    expect(renderMarkdownPreview("hello\n\n---\n\nworld")).toContain("<hr");
  });

  it("renders *text* as <em>", () => {
    expect(renderMarkdownPreview("*italic*")).toContain("<em>italic</em>");
  });

  it("renders **text** as <strong>", () => {
    expect(renderMarkdownPreview("**bold**")).toContain("<strong>bold</strong>");
  });

  it("leaves malformed syntax as literal", () => {
    const result = renderMarkdownPreview("a lone * here");
    expect(result).not.toContain("<em>");
    expect(result).toContain("*");
  });

  it("renders empty lines as line breaks", () => {
    const result = renderMarkdownPreview("line1\n\nline2");
    expect(result).toContain("<br");
  });

  it("handles empty string", () => {
    expect(renderMarkdownPreview("")).toBe("");
  });
});
