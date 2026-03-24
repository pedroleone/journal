# Dashboard Library Prioritization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update the dashboard library card to fill up to six slots by prioritizing all in-progress items first, then recently finished items from the last 30 days, then backlog items.

**Architecture:** Keep the change local to the dashboard library quadrant by adding a small selection helper that consumes the existing `/api/library` payload fields (`status`, `updated_at`, `finished_at`, `added_at`) and returns a single prioritized list for rendering. Preserve the compact dashboard layout and avoid API or schema changes.

**Tech Stack:** Next.js App Router, TypeScript, Vitest, Testing Library

---

### Task 1: Lock the dashboard selection behavior with tests

**Files:**
- Modify: `tests/components/dashboard/library-quadrant.test.tsx`
- Modify: `components/dashboard/library-quadrant.tsx`

- [ ] **Step 1: Write the failing tests**

Add tests that prove:
- the card fills all 6 slots with in-progress items before anything else
- recent finished items only count if `finished_at` is within 30 days
- backlog items fill remaining slots when recent finished items do not

- [ ] **Step 2: Run the focused test file to verify it fails**

Run: `pnpm test tests/components/dashboard/library-quadrant.test.tsx`
Expected: FAIL because the dashboard still slices `in_progress` to 3 and ignores the 30-day/backlog prioritization rule.

- [ ] **Step 3: Write the minimal implementation**

Implement a small helper inside `components/dashboard/library-quadrant.tsx` that:
- sorts `in_progress` by `updated_at` descending
- keeps only `finished` items whose `finished_at` is within 30 days and sorts them by `finished_at` descending
- sorts `backlog` by `added_at` descending
- concatenates those buckets and slices the final list to 6 items

- [ ] **Step 4: Run the focused test file to verify it passes**

Run: `pnpm test tests/components/dashboard/library-quadrant.test.tsx`
Expected: PASS

### Task 2: Verify the full app still passes

**Files:**
- No additional file edits expected

- [ ] **Step 1: Run the relevant dashboard link regression test**

Run: `pnpm test tests/components/dashboard/library-quadrant-links.test.tsx`
Expected: PASS

- [ ] **Step 2: Run the full test suite**

Run: `pnpm test`
Expected: PASS
