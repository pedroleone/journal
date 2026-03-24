# Library Full Create And Typed Genres Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove library quick add, make all library creation use the full-detail editor, and scope genre suggestions to the active media type.

**Architecture:** Keep `/library/new` as the only create entry point. Reuse the existing `LibraryDetail` surface for both new and existing items, but give new items an explicit save action and full metadata fields. Extend vocabulary fetching so genre suggestions can be filtered by media type without changing reaction or platform behavior.

**Tech Stack:** Next.js App Router, TypeScript, Vitest, Drizzle ORM

---

### Task 1: Lock Behavior With Tests

**Files:**
- Create: `tests/app/library/new-page.test.tsx`
- Modify: `tests/components/library/library-browse.test.tsx`
- Modify: `tests/api/library.test.ts`

- [ ] **Step 1: Write the failing tests**
- [ ] **Step 2: Run targeted tests to verify they fail for the intended reasons**
- [ ] **Step 3: Implement the minimal production changes**
- [ ] **Step 4: Re-run targeted tests to verify they pass**

### Task 2: Remove Quick Add And Unify Creation

**Files:**
- Modify: `components/library/library-detail.tsx`
- Modify: `components/library/library-browse.tsx`
- Modify: `components/library/library-list.tsx`
- Modify: `app/library/new/page.tsx`

- [ ] **Step 1: Remove library quick-add UI and unused props**
- [ ] **Step 2: Change the new-item detail view to use the full editor with explicit save**
- [ ] **Step 3: Keep existing-item editing behavior unchanged**
- [ ] **Step 4: Re-run relevant UI tests**

### Task 3: Scope Genre Vocabulary By Type

**Files:**
- Modify: `app/api/library/vocabulary/route.ts`
- Modify: `lib/validators.ts`
- Modify: `components/library/vocabulary-input.tsx`
- Modify: `components/library/library-detail.tsx`
- Modify: `app/library/browse/page.tsx`

- [ ] **Step 1: Add optional media type query validation for vocabulary**
- [ ] **Step 2: Filter genre vocabulary queries by media type when provided**
- [ ] **Step 3: Pass the active media type from library detail and browse surfaces**
- [ ] **Step 4: Re-run API and component tests**

### Task 4: Verify End To End

**Files:**
- Modify: none

- [ ] **Step 1: Run `pnpm test`**
- [ ] **Step 2: Confirm no regressions in the touched library flows**
