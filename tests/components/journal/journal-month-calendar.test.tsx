// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { JournalMonthCalendar } from "@/components/journal/journal-month-calendar";

describe("JournalMonthCalendar", () => {
  it("marks days with entries and leaves empty days unmarked", () => {
    render(
      <JournalMonthCalendar
        visibleMonth={{ year: 2026, month: 3 }}
        selectedDate={{ year: 2026, month: 3, day: 12 }}
        entryDates={["2026-03-05", "2026-03-12"]}
        onSelectDay={vi.fn()}
        onChangeMonth={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: /march 12/i }).getAttribute("data-has-entry")).toBe(
      "true",
    );
    expect(screen.getByRole("button", { name: /march 8/i }).getAttribute("data-has-entry")).toBe(
      "false",
    );
  });

  it("calls month navigation handlers when previous and next are pressed", () => {
    const onChangeMonth = vi.fn();

    render(
      <JournalMonthCalendar
        visibleMonth={{ year: 2026, month: 3 }}
        selectedDate={null}
        entryDates={[]}
        onSelectDay={vi.fn()}
        onChangeMonth={onChangeMonth}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /previous month/i }));
    fireEvent.click(screen.getByRole("button", { name: /next month/i }));

    expect(onChangeMonth).toHaveBeenNthCalledWith(1, { year: 2026, month: 2 });
    expect(onChangeMonth).toHaveBeenNthCalledWith(2, { year: 2026, month: 4 });
  });

  it("calls onSelectDay with the chosen calendar day", () => {
    const onSelectDay = vi.fn();

    render(
      <JournalMonthCalendar
        visibleMonth={{ year: 2026, month: 3 }}
        selectedDate={null}
        entryDates={[]}
        onSelectDay={onSelectDay}
        onChangeMonth={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /march 21/i }));

    expect(onSelectDay).toHaveBeenCalledWith({ year: 2026, month: 3, day: 21 });
  });
});
