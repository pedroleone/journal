// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DateNavigator } from "@/components/shared/date-navigator";

vi.mock("@/hooks/use-media-query", () => ({
  useMediaQuery: () => false,
}));

vi.mock("@/hooks/use-locale", () => ({
  useLocale: () => ({
    t: {
      localeCode: "pt-BR",
    },
  }),
}));

describe("DateNavigator", () => {
  it("formats the current date using the app locale instead of the runtime default", () => {
    render(
      <DateNavigator
        date={new Date("2026-03-20T00:00:00")}
        onDateChange={vi.fn()}
      />,
    );

    expect(screen.getByText("sexta-feira, 20 de março")).toBeTruthy();
  });
});
