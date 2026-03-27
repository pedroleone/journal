// @vitest-environment jsdom

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog";

describe("ConfirmDeleteDialog", () => {
  it("renders title and description when open", () => {
    render(
      <ConfirmDeleteDialog
        open={true}
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
        title="Delete this item"
        description="This action cannot be undone."
      />,
    );

    expect(screen.getByText("Delete this item")).toBeTruthy();
    expect(screen.getByText("This action cannot be undone.")).toBeTruthy();
  });

  it("calls onConfirm when Delete button is clicked", () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmDeleteDialog
        open={true}
        onOpenChange={vi.fn()}
        onConfirm={onConfirm}
        title="Delete this item"
        description="This action cannot be undone."
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /delete/i }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("calls onOpenChange(false) when Cancel button is clicked", () => {
    const onOpenChange = vi.fn();
    render(
      <ConfirmDeleteDialog
        open={true}
        onOpenChange={onOpenChange}
        onConfirm={vi.fn()}
        title="Delete this item"
        description="This action cannot be undone."
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("does not render dialog content when open is false", () => {
    render(
      <ConfirmDeleteDialog
        open={false}
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
        title="Delete this item"
        description="This action cannot be undone."
      />,
    );

    expect(screen.queryByText("Delete this item")).toBeNull();
  });
});
