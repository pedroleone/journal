# Theme Hydration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the root hydration mismatch by consolidating theme ownership into the client theme provider and deleting the pre-hydration `<html>` mutation from the root layout.

**Architecture:** Keep `ThemeProvider` in `hooks/use-theme.tsx` as the single source of truth for reading stored theme preference, resolving system fallback, and applying the `dark` class to `document.documentElement`. Simplify `app/layout.tsx` so it renders stable server HTML with no inline theme bootstrap script, then lock that contract with focused tests.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Vitest

---

## File Structure

- Modify: `app/layout.tsx`
  - Remove the inline script that mutates `document.documentElement` before hydration.
- Modify: `tests/app/layout.test.ts`
  - Assert the layout no longer contains the inline theme bootstrap while preserving existing metadata checks.
- Reference: `hooks/use-theme.tsx`
  - Confirm theme ownership remains here; no production change expected unless tests reveal a gap.

### Task 1: Add The Failing Layout Contract Test

**Files:**
- Modify: `tests/app/layout.test.ts`
- Reference: `app/layout.tsx`

- [ ] **Step 1: Write the failing test**

```ts
it("does not inline theme bootstrap code that mutates the html element before hydration", () => {
  const layout = readFileSync(path.resolve(process.cwd(), "app/layout.tsx"), "utf8");

  expect(layout).not.toContain("document.documentElement.classList.add('dark')");
  expect(layout).not.toContain("localStorage.getItem('theme')");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test tests/app/layout.test.ts`
Expected: FAIL because `app/layout.tsx` still contains the inline bootstrap script.

### Task 2: Remove The Pre-Hydration Mutation

**Files:**
- Modify: `app/layout.tsx`
- Test: `tests/app/layout.test.ts`

- [ ] **Step 1: Write the minimal implementation**

Implementation notes:
- Delete the inline `<script>` that reads `localStorage` and toggles `document.documentElement.classList`.
- Leave `ThemeProvider` wiring unchanged so it remains the only theme owner.
- Do not change viewport metadata or other layout responsibilities.

- [ ] **Step 2: Run the focused test to verify it passes**

Run: `pnpm test tests/app/layout.test.ts`
Expected: PASS

### Task 3: Verify Theme Regression Coverage

**Files:**
- Verify only

- [ ] **Step 1: Run related theme/provider coverage**

Run: `pnpm test tests/app/layout.test.ts`
Expected: PASS

- [ ] **Step 2: Run the full suite**

Run: `pnpm test`
Expected: PASS
