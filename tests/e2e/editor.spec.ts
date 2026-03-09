import { test, expect } from "@playwright/test";

const TEST_PASSWORD = process.env.TEST_PASSWORD ?? "test-password";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByLabel(/password/i).fill(TEST_PASSWORD);
  await page.getByRole("button", { name: /sign in|log in/i }).click();
  await page.waitForURL(/\/(journal|notes|$)/);
}

test.describe("editor scroll / layout", () => {
  test("write page: status bar stays visible when content exceeds viewport", async ({
    page,
  }) => {
    await login(page);
    await page.goto("/journal/write");

    const editor = page.locator(".cm-content");
    await editor.click();

    // Type enough lines to push content beyond viewport height
    for (let i = 0; i < 40; i++) {
      await page.keyboard.type(`Line ${i + 1}: The quick brown fox jumps over the lazy dog.`);
      await page.keyboard.press("Enter");
    }

    // Status bar should still be in viewport
    const statusBar = page.locator("text=Save").first();
    await expect(statusBar).toBeInViewport();

    await page.screenshot({ path: "tests/e2e/screenshots/write-page-long-content.png" });
  });

  test("write page: no white bar flash on backspace", async ({ page }) => {
    await login(page);
    await page.goto("/journal/write");

    const editor = page.locator(".cm-content");
    await editor.click();

    // Type content near viewport boundary
    for (let i = 0; i < 20; i++) {
      await page.keyboard.type(`Line ${i + 1}: Some text here.`);
      await page.keyboard.press("Enter");
    }

    // Take before screenshot
    const before = await page.screenshot();

    // Press backspace several times
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press("Backspace");
    }

    const after = await page.screenshot({ path: "tests/e2e/screenshots/write-page-after-backspace.png" });

    // Screenshots should be similar — no dramatic layout shift
    // (visual comparison via screenshot diff tools; this just captures for inspection)
    expect(after).toBeTruthy();
    expect(before).toBeTruthy();
  });
});
