export function renderMarkdownPreview(text: string): string {
  if (!text) return "";

  return text
    .split("\n")
    .map((line) => {
      // Horizontal rule
      if (/^---+$/.test(line.trim())) {
        return '<hr class="my-4 border-border" />';
      }

      let html = escapeHtml(line);

      // Bold: **text**
      html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

      // Italic: *text* (but not **)
      html = html.replace(/(?<!\*)\*([^*]+?)\*(?!\*)/g, "<em>$1</em>");

      return html || "<br />";
    })
    .join("\n");
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
