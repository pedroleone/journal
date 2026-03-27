# Book Progress List Surfaces Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show book progress percentages for `in_progress` books in the dashboard library quadrant and the library browse cards.

**Architecture:** Keep this display-only. Reuse the existing book-progress helper in `lib/library.ts` to derive a percentage from item metadata, then surface that value in the dashboard quadrant row and the browse card. Do not widen the API contract just for presentation.

**Tech Stack:** Next.js App Router, React, TypeScript, Vitest

---

### Task 1: Add failing display coverage

**Files:**
- Modify: `tests/components/dashboard/library-quadrant.test.tsx`
- Modify: `tests/components/library/library-browse.test.tsx`

- [ ] **Step 1: Write failing dashboard tests**

Add tests that verify:
- an `in_progress` ebook book row shows its saved percentage
- an `in_progress` physical book row shows a derived percentage
- non-book or non-`in_progress` rows do not show progress percentages

- [ ] **Step 2: Write failing browse/card tests**

Add tests that verify:
- an `in_progress` ebook card shows its saved percentage
- an `in_progress` physical book card shows a derived percentage
- non-book or non-`in_progress` cards do not show progress percentages

- [ ] **Step 3: Run targeted tests to confirm the red state**

Run:
```bash
pnpm test tests/components/dashboard/library-quadrant.test.tsx
pnpm test tests/components/library/library-browse.test.tsx
```

Expected: FAIL because the percentage display is not implemented yet.

### Task 2: Implement percentage display in dashboard and browse surfaces

**Files:**
- Modify: `components/dashboard/library-quadrant.tsx`
- Modify: `components/library/library-card.tsx`
- Modify: `components/library/library-browse.tsx` if needed for item typing only
- Modify: `lib/library.ts` only if a tiny display helper extraction is useful

- [ ] **Step 1: Extend list item typing for progress-aware metadata**

Ensure the dashboard and browse item types can read the existing `metadata` shape needed to derive progress percentages.

- [ ] **Step 2: Implement dashboard progress display**

In `components/dashboard/library-quadrant.tsx`:
- derive a percentage for `in_progress` books only
- show it as compact secondary metadata near the row status
- hide it when no valid percentage can be computed

- [ ] **Step 3: Implement browse-card progress display**

In `components/library/library-card.tsx`:
- derive a percentage for `in_progress` books only
- show it as compact secondary card metadata
- hide it for non-books, non-`in_progress` books, or books with no valid progress

- [ ] **Step 4: Re-run targeted tests**

Run:
```bash
pnpm test tests/components/dashboard/library-quadrant.test.tsx
pnpm test tests/components/library/library-browse.test.tsx
```

Expected: PASS

### Task 3: Verify no regressions

**Files:**
- Modify: none

- [ ] **Step 1: Run focused verification**

Run:
```bash
pnpm test tests/components/dashboard/library-quadrant.test.tsx tests/components/library/library-browse.test.tsx
```

Expected: PASS

- [ ] **Step 2: Run full verification**

Run:
```bash
pnpm test
```

Expected: PASS

- [ ] **Step 3: Commit**

Skip commit unless requested.
