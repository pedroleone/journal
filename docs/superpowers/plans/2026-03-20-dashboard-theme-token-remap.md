# Dashboard Theme Token Remap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remap the app's global theme tokens so dark mode matches the `d-dashboard` palette and light mode becomes a paper-like translation of the same hierarchy, without changing layout behavior.

**Architecture:** Keep the existing `background/card/popover/muted/border/sidebar/...` token contract that the app already consumes, but redefine those tokens from a shared dashboard-style semantic palette in `app/globals.css`. Update the browser chrome color in `app/layout.tsx`, then make the dashboard-specific chrome components consume shared top-bar and quadrant surface tokens so both light and dark modes inherit the same visual system.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Tailwind CSS v4, Vitest, Testing Library

---

## File Structure

- Modify: `app/globals.css`
  - Define the shared semantic palette for light and dark modes and remap existing app-facing tokens from it.
- Modify: `app/layout.tsx`
  - Update `viewport.themeColor` to match the remapped light and dark base backgrounds.
- Modify: `components/dashboard/top-bar.tsx`
  - Consume the shared top-bar surface token instead of a dark-only override.
- Modify: `components/dashboard/breadcrumb-bar.tsx`
  - Consume the shared top-bar surface token instead of a dark-only override.
- Modify: `components/dashboard/quadrant-card.tsx`
  - Consume shared quadrant surface and hover tokens in both themes.
- Modify: `tests/app/globals.test.ts`
  - Verify the new semantic theme tokens exist in `app/globals.css`.
- Modify: `tests/app/layout.test.ts`
  - Verify `viewport.themeColor` matches the remapped theme backgrounds.
- Create: `tests/components/dashboard/chrome-surfaces.test.tsx`
  - Verify dashboard chrome components use the shared theme surface hooks rather than dark-only class overrides.

### Task 1: Add Failing Tests For The Theme Contract

**Files:**
- Modify: `tests/app/globals.test.ts`
- Modify: `tests/app/layout.test.ts`
- Reference: `app/globals.css`
- Reference: `app/layout.tsx`

- [ ] **Step 1: Extend the global CSS test with the new semantic palette expectations**

```ts
it("defines dashboard semantic surface and text tokens", () => {
  const css = readFileSync(path.resolve(process.cwd(), "app/globals.css"), "utf8");

  expect(css).toContain("--surface-base:");
  expect(css).toContain("--surface-topbar:");
  expect(css).toContain("--surface-panel:");
  expect(css).toContain("--surface-panel-hover:");
  expect(css).toContain("--text-primary:");
  expect(css).toContain("--text-secondary:");
  expect(css).toContain("--border-subtle:");
});
```

- [ ] **Step 2: Run the global CSS test to verify it fails**

Run: `pnpm test tests/app/globals.test.ts`
Expected: FAIL because the semantic dashboard tokens do not exist yet.

- [ ] **Step 3: Extend the layout test to require remapped browser chrome colors**

```ts
it("exports remapped theme colors for light and dark browser chrome", () => {
  const layout = readFileSync(path.resolve(process.cwd(), "app/layout.tsx"), "utf8");

  expect(layout).toContain('{ media: "(prefers-color-scheme: light)", color: "#f4efe6" }');
  expect(layout).toContain('{ media: "(prefers-color-scheme: dark)", color: "#111118" }');
});
```

- [ ] **Step 4: Run the layout test to verify it fails**

Run: `pnpm test tests/app/layout.test.ts`
Expected: FAIL because `app/layout.tsx` still exports the old theme colors.

- [ ] **Step 5: Commit**

```bash
git add tests/app/globals.test.ts tests/app/layout.test.ts
git commit -m "test: cover dashboard theme token remap contract"
```

### Task 2: Remap Global Theme Tokens And Browser Chrome

**Files:**
- Modify: `app/globals.css`
- Modify: `app/layout.tsx`
- Test: `tests/app/globals.test.ts`
- Test: `tests/app/layout.test.ts`

- [ ] **Step 1: Write the minimal implementation**

Implementation notes:
- In `:root`, define a paper-like light palette with semantic variables:
  - `--surface-base`
  - `--surface-topbar`
  - `--surface-panel`
  - `--surface-panel-hover`
  - `--surface-card`
  - `--text-primary`
  - `--text-secondary`
  - `--text-muted`
  - `--border-strong`
  - `--border-subtle`
- In `.dark`, define the same semantic variables so they track the `d-dashboard` dark palette closely, including `#111118` as the base background family.
- Remap existing app-facing tokens from the semantic palette:
  - `--background` from `--surface-base`
  - `--card` and `--popover` from `--surface-card`
  - `--foreground` from `--text-primary`
  - `--muted-foreground` from `--text-secondary` or `--text-muted`
  - `--border` and `--input` from the border palette
  - `--sidebar` and related sidebar tokens from the same surface stack
- Keep the domain accent tokens, but make their light-mode dim variants slightly softer than the dark-mode versions.
- Update `viewport.themeColor` in `app/layout.tsx` to:
  - light: `#f4efe6`
  - dark: `#111118`

- [ ] **Step 2: Run the focused theme tests**

Run: `pnpm test tests/app/globals.test.ts tests/app/layout.test.ts`
Expected: PASS

- [ ] **Step 3: Run related regression coverage**

Run: `pnpm test tests/app/globals.test.ts tests/app/layout.test.ts tests/app/food-page.test.tsx`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add app/globals.css app/layout.tsx tests/app/globals.test.ts tests/app/layout.test.ts
git commit -m "feat: remap dashboard theme tokens"
```

### Task 3: Add Failing Tests For Dashboard Chrome Surface Usage

**Files:**
- Create: `tests/components/dashboard/chrome-surfaces.test.tsx`
- Reference: `components/dashboard/top-bar.tsx`
- Reference: `components/dashboard/breadcrumb-bar.tsx`
- Reference: `components/dashboard/quadrant-card.tsx`

- [ ] **Step 1: Write the failing dashboard chrome test**

```tsx
it("uses shared surface tokens for the top navigation bars", () => {
  render(<TopBar date={new Date("2026-03-20T00:00:00")} onDateChange={vi.fn()} />);

  expect(screen.getByRole("banner").className).toContain("bg-[var(--surface-topbar)]");
});

it("uses the shared top-bar surface token in the breadcrumb bar", () => {
  render(<BreadcrumbBar domain="journal" />);

  expect(screen.getByRole("banner").className).toContain("bg-[var(--surface-topbar)]");
});

it("uses shared surface tokens for quadrant cards", () => {
  const { container } = render(
    <QuadrantCard domain="journal" label="Journal" href="/journal/browse">
      <p>Preview</p>
    </QuadrantCard>,
  );

  expect(container.firstElementChild?.className).toContain("bg-[var(--surface-panel)]");
  expect(container.firstElementChild?.className).toContain("hover:bg-[var(--surface-panel-hover)]");
});
```

- [ ] **Step 2: Run the dashboard chrome test to verify it fails**

Run: `pnpm test tests/components/dashboard/chrome-surfaces.test.tsx`
Expected: FAIL because the components still use `bg-background` and dark-only overrides.

- [ ] **Step 3: Commit**

```bash
git add tests/components/dashboard/chrome-surfaces.test.tsx
git commit -m "test: cover dashboard chrome surface tokens"
```

### Task 4: Update Dashboard Chrome To Use Shared Theme Surfaces

**Files:**
- Modify: `components/dashboard/top-bar.tsx`
- Modify: `components/dashboard/breadcrumb-bar.tsx`
- Modify: `components/dashboard/quadrant-card.tsx`
- Test: `tests/components/dashboard/chrome-surfaces.test.tsx`
- Regression Test: `tests/components/dashboard/quadrant-card.test.tsx`

- [ ] **Step 1: Write the minimal implementation**

Implementation notes:
- Replace the dark-only top-bar background override in `TopBar` with a shared surface token class such as `bg-[var(--surface-topbar)]`.
- Apply the same shared top-bar surface token in `BreadcrumbBar`.
- Replace the quadrant card's `bg-background` plus dark-only panel override with the shared panel surface tokens:
  - base: `bg-[var(--surface-panel)]`
  - hover: `hover:bg-[var(--surface-panel-hover)]`
- Keep the existing accent-dot and action-link behavior unchanged.

- [ ] **Step 2: Run the focused dashboard tests**

Run: `pnpm test tests/components/dashboard/chrome-surfaces.test.tsx tests/components/dashboard/quadrant-card.test.tsx`
Expected: PASS

- [ ] **Step 3: Run related shell coverage**

Run: `pnpm test tests/components/dashboard/chrome-surfaces.test.tsx tests/components/dashboard/quadrant-card.test.tsx tests/components/dashboard/dashboard-shell.test.tsx`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add components/dashboard/top-bar.tsx components/dashboard/breadcrumb-bar.tsx components/dashboard/quadrant-card.tsx tests/components/dashboard/chrome-surfaces.test.tsx
git commit -m "feat: align dashboard chrome surfaces with theme tokens"
```

### Task 5: Verify The Theme Remap End To End

**Files:**
- Verify only

- [ ] **Step 1: Run lint on all touched files**

Run: `pnpm lint app/layout.tsx components/dashboard/top-bar.tsx components/dashboard/breadcrumb-bar.tsx components/dashboard/quadrant-card.tsx tests/app/globals.test.ts tests/app/layout.test.ts tests/components/dashboard/chrome-surfaces.test.tsx`
Expected: PASS

- [ ] **Step 2: Run the full test suite**

Run: `pnpm test`
Expected: PASS

- [ ] **Step 3: Verify visually in the browser**

Manual checks:
- Open the app dashboard in light and dark modes.
- Compare the dark-mode shell against `public/layouts/d-dashboard/index.html`.
- Confirm the top bar, breadcrumb bar, quadrant surfaces, and shared backgrounds now read as one coherent system.
- Confirm light mode feels like a paper-like translation, not a separate design language.
- Note any remaining literal-color mismatches for the documented follow-up backlog instead of broadening this task.

- [ ] **Step 4: Commit the verification-ready state**

```bash
git add app/globals.css app/layout.tsx components/dashboard/top-bar.tsx components/dashboard/breadcrumb-bar.tsx components/dashboard/quadrant-card.tsx tests/app/globals.test.ts tests/app/layout.test.ts tests/components/dashboard/chrome-surfaces.test.tsx
git commit -m "chore: verify dashboard theme token remap"
```
