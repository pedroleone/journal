# Journal Shared Flat Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make journal write and browse use the same flat layout and structural design so switching between reading and editing feels like one journal surface instead of two separate screens.

**Architecture:** Keep the existing route split between browse and write, but introduce a shared flat journal layout structure at the component level. Reuse the same title row, body width, and archive action placement while adapting the body area for read-only prose or the editor and moving write-only status/actions into lightweight inline controls instead of boxed chrome.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind CSS, Vitest, Testing Library

---

## File Structure

### Existing files to modify

- `app/journal/write/page.tsx`
  - Replace the current boxed editor presentation with the shared flat journal structure and align control placement with browse.
- `app/journal/browse/page.tsx`
  - Reuse any shared journal layout helpers introduced for parity with write.
- `components/journal/entry-viewer.tsx`
  - Extract or align the shared flat journal heading/body structure so write can match it exactly.
- `app/globals.css`
  - Add shared flat journal layout classes and remove leftover boxed write assumptions where needed.
- `tests/app/journal/write-page.test.tsx`
  - Update assertions for the new flat structure and browse-parity layout.
- `tests/app/journal/write-page-polish.test.tsx`
  - Adjust tests away from old boxed/meta assumptions and toward the shared flat presentation.
- `tests/app/journal/browse-page.test.tsx`
  - Confirm shared archive action placement expectations if needed.

### New files to create

- `tests/app/journal/shared-layout-parity.test.tsx`
  - Verify browse and write expose the same flat layout hooks and archive action placement.

## Task 1: Add failing parity tests for the flat shared journal layout

**Files:**
- Create: `tests/app/journal/shared-layout-parity.test.tsx`
- Modify: `tests/app/journal/write-page.test.tsx`
- Modify: `tests/app/journal/write-page-polish.test.tsx`

- [ ] **Step 1: Write the failing browse/write parity test**
- [ ] **Step 2: Add a failing write-page assertion that the boxed shell is gone and archive action lives in the heading row**
- [ ] **Step 3: Run the focused write/parity tests and verify failure**

Run: `pnpm test -- tests/app/journal/shared-layout-parity.test.tsx tests/app/journal/write-page.test.tsx tests/app/journal/write-page-polish.test.tsx`

## Task 2: Implement the shared flat journal structure across browse and write

**Files:**
- Modify: `app/journal/write/page.tsx`
- Modify: `app/journal/browse/page.tsx`
- Modify: `components/journal/entry-viewer.tsx`
- Modify: `app/globals.css`

- [ ] **Step 1: Introduce or reuse a shared flat journal heading/body structure**
- [ ] **Step 2: Move write mode onto that structure with inline status and utility controls**
- [ ] **Step 3: Place the archive action in the same heading row on write and browse**
- [ ] **Step 4: Remove remaining boxed write-only chrome**

## Task 3: Verify focused tests then full suite

**Files:**
- Modify tests created above as needed

- [ ] **Step 1: Run focused journal layout tests**

Run: `pnpm test -- tests/app/journal/shared-layout-parity.test.tsx tests/app/journal/write-page.test.tsx tests/app/journal/write-page-polish.test.tsx tests/app/journal/browse-page.test.tsx`

- [ ] **Step 2: Run full suite**

Run: `pnpm test`
