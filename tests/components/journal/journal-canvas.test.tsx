// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { JournalCanvas } from "@/components/journal/journal-canvas";
import { JournalEntryState } from "@/components/journal/journal-entry-state";

describe("JournalCanvas", () => {
  it("renders a write action for an empty selected day", () => {
    render(
      <JournalCanvas
        heading="Wednesday, 18 March 2026"
        meta={<span>No entry yet</span>}
        body={<p>Start writing for this day.</p>}
        actions={<a href="/journal/write?year=2026&month=3&day=18">Write for this day</a>}
      />,
    );

    const action = screen.getByRole("link", { name: /write for this day/i });
    expect(action.getAttribute("href")).toBe("/journal/write?year=2026&month=3&day=18");
  });

  it("applies the journal prose treatment to entry content", () => {
    const { container } = render(
      <JournalEntryState
        entryId="entry-1"
        content="Today felt different."
        imageKeys={[]}
        editable={false}
      />,
    );

    expect(container.querySelector(".journal-prose")).toBeTruthy();
  });
});
