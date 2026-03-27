# Library New Cover Upload Disable Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Disable the empty-cover upload control on unsaved library items while preserving existing cover behavior for saved items.

**Architecture:** Add an explicit `coverUploadDisabled` UI-state prop to the shared `LibraryDetail` component, wire it from the new-library page, and cover the behavior with one component regression test and one page wiring test. Keep the patch narrow: only the empty-cover state changes, and the follow-up create-then-upload flow is deferred behind a local `TODO:` comment.

**Tech Stack:** Next.js App Router, React, TypeScript, Vitest, Testing Library

---

### Task 1: Add component-level regression coverage

**Files:**
- Modify: `tests/components/library/library-detail-layout.test.tsx`

- [ ] **Step 1: Write the failing test**

Add a test that renders `LibraryDetail` with `item.id = "__new__"` and `coverUploadDisabled = true`, then asserts the "Add cover" button exists and is disabled with `toBeDisabled()`.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test tests/components/library/library-detail-layout.test.tsx`
Expected: FAIL because `LibraryDetail` does not yet accept or apply `coverUploadDisabled`.

- [ ] **Step 3: Commit**

Skip commit for this small patch unless requested.

### Task 2: Add page wiring regression coverage

**Files:**
- Modify: `tests/app/library/new-page.test.tsx`

- [ ] **Step 1: Write the failing test**

Extend the `LibraryDetail` mock capture and assert the new page passes `coverUploadDisabled: true` in the existing editor-opening flow.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test tests/app/library/new-page.test.tsx`
Expected: FAIL because `LibraryNewPage` does not yet pass the prop.

- [ ] **Step 3: Commit**

Skip commit for this small patch unless requested.

### Task 3: Implement the minimal UI patch

**Files:**
- Modify: `components/library/library-detail.tsx`
- Modify: `app/library/new/page.tsx`

- [ ] **Step 1: Write minimal implementation**

Add `coverUploadDisabled?: boolean` to `LibraryDetailProps`, derive `isCoverUploadDisabled = coverUploadDisabled || uploadingCover`, add the requested `TODO:` comment at the empty-cover decision point, disable the button and suppress file-picker opening when disabled, then pass `coverUploadDisabled` from the new-item page.

- [ ] **Step 2: Run targeted tests to verify they pass**

Run: `pnpm test tests/components/library/library-detail-layout.test.tsx`
Expected: PASS

Run: `pnpm test tests/app/library/new-page.test.tsx`
Expected: PASS

- [ ] **Step 3: Run full verification**

Run: `pnpm test`
Expected: PASS

- [ ] **Step 4: Commit**

Skip commit for this small patch unless requested.
