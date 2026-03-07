// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PassphrasePrompt } from "@/components/passphrase-prompt";
import { deriveKey, decrypt } from "@/lib/crypto";
import { setKey } from "@/lib/key-manager";

vi.mock("@/lib/crypto", () => ({
  deriveKey: vi.fn(),
  decrypt: vi.fn(),
}));

vi.mock("@/lib/key-manager", () => ({
  setKey: vi.fn(),
}));

describe("PassphrasePrompt", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requires matching confirmation for first-time users", async () => {
    const onUnlock = vi.fn();
    render(<PassphrasePrompt mode="first-user" onUnlock={onUnlock} />);

    fireEvent.change(screen.getByLabelText("Passphrase"), {
      target: { value: "secret-one" },
    });
    fireEvent.change(screen.getByLabelText("Confirm Passphrase"), {
      target: { value: "secret-two" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Unlock" }));

    expect(await screen.findByText("Passphrases do not match")).toBeTruthy();
    expect(deriveKey).not.toHaveBeenCalled();
    expect(onUnlock).not.toHaveBeenCalled();
  });

  it("validates an existing user's passphrase against the oldest entry", async () => {
    const fakeKey = { type: "secret" } as CryptoKey;
    vi.mocked(deriveKey).mockResolvedValue(fakeKey);
    vi.mocked(decrypt).mockResolvedValue("decrypted");

    const onUnlock = vi.fn();
    render(
      <PassphrasePrompt
        mode="existing-user"
        validationEntry={{ encrypted_content: "ciphertext", iv: "entry-iv" }}
        onUnlock={onUnlock}
      />,
    );

    fireEvent.change(screen.getByLabelText("Passphrase"), {
      target: { value: "correct-passphrase" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Unlock" }));

    await waitFor(() => {
      expect(decrypt).toHaveBeenCalledWith(fakeKey, "ciphertext", "entry-iv");
      expect(setKey).toHaveBeenCalledWith(fakeKey);
      expect(onUnlock).toHaveBeenCalledWith(fakeKey);
    });
  });
});
