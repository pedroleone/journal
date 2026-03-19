# Concept D Dashboard Migration

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current nav/shell with Concept D's hub-and-spoke dashboard layout while preserving all backend/API routes untouched.

**Architecture:** Two-mode shell — dashboard (/) renders TopBar + 2x2 QuadrantGrid; domain routes render BreadcrumbBar + full-width content. No persistent nav bar. Navigation is hub→spoke→hub via breadcrumbs.

**Tech Stack:** Next.js App Router, React 19, Tailwind CSS 4, shadcn/ui, Lucide icons, existing hooks/libs.

**Test strategy:** Manual QA per phase (per project decision in migration-plan.md). Each phase lists verification steps. No new automated tests during migration.

---

## File Structure

### Delete
```
components/app-shell.tsx
components/app-nav.tsx
components/nav-wrapper.tsx
components/nav/desktop-top-bar.tsx
components/nav/mobile-bottom-bar.tsx
components/nav/mobile-top-bar.tsx
components/nav/nav-sections.ts
hooks/use-default-view.ts
app/home/page.tsx
app/export/page.tsx
```

### Create (new shell)
```
components/dashboard/dashboard-shell.tsx    — Two-mode layout wrapper (dashboard vs expanded)
components/dashboard/top-bar.tsx            — Date nav + calendar + settings buttons
components/dashboard/breadcrumb-bar.tsx     — Back-to-dashboard + domain label + date
components/dashboard/quadrant-grid.tsx      — 2x2 CSS grid container
components/dashboard/quadrant-card.tsx      — Generic quadrant: header, content slot, footer
components/dashboard/accent-dot.tsx         — Small colored circle per domain
```

### Create (quadrant cards)
```
components/dashboard/journal-quadrant.tsx   — Entry preview, word count, image count
components/dashboard/food-quadrant.tsx      — Compact meal rows, inbox badge
components/dashboard/notes-quadrant.tsx     — Recent notes list, counts
components/dashboard/library-quadrant.tsx   — In Progress + Recently Finished items
```

### Create (shared components)
```
components/shared/date-navigator.tsx        — Prev/next arrows + neighbor dates + current date
components/shared/image-tray.tsx            — Thumbnail strip + add button
components/shared/image-lightbox.tsx        — Full-screen encrypted image viewer (adapt existing)
components/shared/encrypted-image.tsx       — Single encrypted image (adapt existing gallery)
components/shared/status-badge.tsx          — Save status indicator
components/shared/inbox-badge.tsx           — Unsorted food count pill
components/shared/meal-slot-card.tsx        — Full meal card (filled/skipped/empty)
components/shared/meal-row.tsx              — Compact single-line meal slot
components/shared/content-editor.tsx        — Markdown editor wrapper (adapt existing)
components/shared/tag-input.tsx             — Tag entry with autocomplete (adapt existing)
```

### Create (expanded domain views)
```
components/journal/journal-expanded.tsx     — Full editor: meta bar, editor, images, footer
components/food/food-expanded.tsx           — Header actions + meal grid
components/food/food-quick-add.tsx          — Fast-add dialog
components/food/food-inbox.tsx              — Unsorted entries with assign action
components/notes/notes-expanded.tsx         — Sidebar + editor split
components/notes/notes-sidebar.tsx          — Search + tags + note list + new button
components/notes/note-editor.tsx            — Title + tags + body + images + subnotes
components/notes/subnote-item.tsx           — Follow-up row with arrow icon
components/library/library-expanded.tsx     — Grid + detail split
components/library/library-toolbar.tsx      — Type tabs + status chips + search + add
components/library/library-card-grid.tsx    — Responsive card grid
components/library/library-card-new.tsx     — Single media card (rename from library-card)
components/library/library-detail-new.tsx   — Cover + metadata + thoughts
components/library/thought-item.tsx         — Single thought with date
components/settings/settings-expanded.tsx   — Preferences + export + backup + PWA
components/settings/export-form.tsx         — Content/format/range selectors
components/settings/backup-section.tsx      — Create + restore backup
components/settings/pwa-install-card.tsx    — Install prompt card
components/auth/auth-page.tsx               — Centered card with Google sign-in
```

### Modify (route pages)
```
app/layout.tsx                  — Replace AppShell/NavWrapper with DashboardShell
app/page.tsx                    — Becomes dashboard home (QuadrantGrid) for authenticated users
app/home/page.tsx               — Remove (dashboard is now /)
app/journal/write/page.tsx      — Render JournalExpanded instead of current component
app/journal/browse/page.tsx     — Render JournalExpanded in browse mode
app/journal/entry/[id]/page.tsx — Render JournalExpanded in read-only mode
app/food/page.tsx               — Render FoodExpanded
app/food/browse/page.tsx        — Render FoodExpanded in browse mode
app/food/entry/[id]/page.tsx    — Render FoodExpanded in detail mode
app/notes/browse/page.tsx       — Render NotesExpanded
app/library/browse/page.tsx     — Render LibraryExpanded
app/library/[id]/page.tsx       — Render LibraryExpanded with selected item
app/library/new/page.tsx        — Render LibraryExpanded in create mode
app/settings/page.tsx           — Render SettingsExpanded (includes export section)
```

---

## Phase 1 — Shell & Routing

Replace the structural skeleton. After this, app renders new two-mode layout with placeholder content.

### Task 1.1: CSS Variables & Design Tokens

**Files:**
- Modify: `app/globals.css`

- [ ] Add Concept D CSS variables to `:root` / `[data-theme="dark"]`: domain accent colors (`--journal`, `--food`, `--notes`, `--library` + `-dim` variants), surface colors (`--bg-quad`, `--bg-topbar`, `--bg-surface`), spacing tokens
- [ ] Verify: existing components still render correctly (no visual regression)

### Task 1.2: AccentDot + StatusBadge

**Files:**
- Create: `components/dashboard/accent-dot.tsx`
- Create: `components/shared/status-badge.tsx`

- [ ] Build `AccentDot` — small colored circle, takes `domain` prop, maps to accent color
- [ ] Build `StatusBadge` — shows "Saved", "Saving...", "Offline" text with appropriate styling
- [ ] Verify: import and render in a test page, see colored dots and status text

### Task 1.3: DateNavigator

**Files:**
- Create: `components/shared/date-navigator.tsx`

- [ ] Build `DateNavigator` — prev/next arrows, neighbor date labels, current date display. Props: `date`, `onDateChange`. Uses `use-locale` for date formatting
- [ ] Mobile variant: hide neighbor labels, keep arrows + current date
- [ ] Verify: renders date, clicking arrows changes date

### Task 1.4: TopBar

**Files:**
- Create: `components/dashboard/top-bar.tsx`

- [ ] Build `TopBar` — embeds `DateNavigator`, calendar button (placeholder), settings link (gear icon → /settings)
- [ ] 52px fixed height, `--bg-topbar` background
- [ ] Verify: renders with date nav + buttons

### Task 1.5: BreadcrumbBar

**Files:**
- Create: `components/dashboard/breadcrumb-bar.tsx`

- [ ] Build `BreadcrumbBar` — props: `domain`, optional `date`. Shows "← Dashboard" link (accent-colored per domain) + separator + domain name + date if present
- [ ] 48px height, derives accent color from domain prop
- [ ] Mobile: hide date label, keep back + domain name
- [ ] Verify: renders with correct colors per domain, back link navigates to /

### Task 1.6: QuadrantGrid + QuadrantCard

**Files:**
- Create: `components/dashboard/quadrant-grid.tsx`
- Create: `components/dashboard/quadrant-card.tsx`

- [ ] Build `QuadrantGrid` — CSS grid 2x2 desktop, 1-col mobile. Takes `children`
- [ ] Build `QuadrantCard` — header (AccentDot + label + action buttons), content slot, footer. Entire card is clickable link to expanded view. Action buttons use `stopPropagation`
- [ ] Verify: 4 placeholder cards render in grid, clicking navigates, responsive to 1-col on mobile

### Task 1.7: DashboardShell + app/page.tsx

**Files:**
- Create: `components/dashboard/dashboard-shell.tsx`
- Modify: `app/layout.tsx`
- Modify: `app/page.tsx`
- Delete: `app/home/page.tsx`

- [ ] Build `DashboardShell` — reads pathname via `usePathname()`. If `/` → render TopBar + children (dashboard mode). If `/journal|food|notes|library|settings` → render BreadcrumbBar + children (expanded mode). If `/login` or auth page → render children only (no bars). Wire `mode-context`: DashboardShell derives active domain from pathname and provides it to ModeProvider so downstream components get correct mode
- [ ] Wire into `app/layout.tsx` — replace `AppShell` + `NavWrapper` imports with `DashboardShell`
- [ ] Modify `app/page.tsx` — remove redirect to `/home`. Server-side `auth()` check: authenticated → render placeholder "Dashboard coming in Phase 2" inside TopBar layout; unauthenticated → render `AuthPage` (auth card with Google sign-in, reuse `google-sign-in-button.tsx`)
- [ ] Create `components/auth/auth-page.tsx` — centered card: logo, title, tagline, Google sign-in button, footer text (per auth.html prototype)
- [ ] Delete `app/home/page.tsx` — no longer needed since dashboard is `/`
- [ ] Delete `hooks/use-default-view.ts` — no longer needed since dashboard replaces default view concept
- [ ] Keep all existing providers (ThemeProvider, LocaleProvider, ModeProvider) untouched
- [ ] Verify: navigating to `/` shows TopBar + placeholder (no redirect to /home), `/journal/write` shows BreadcrumbBar with journal accent, `/login` shows neither

### Task 1.8: Delete Old Nav

**Files:**
- Delete: `components/app-shell.tsx`, `components/app-nav.tsx`, `components/nav-wrapper.tsx`
- Delete: `components/nav/desktop-top-bar.tsx`, `components/nav/mobile-bottom-bar.tsx`, `components/nav/mobile-top-bar.tsx`, `components/nav/nav-sections.ts`

- [ ] Remove old shell/nav files
- [ ] Remove imports from anywhere that referenced them (grep for all import paths)
- [ ] Fix `tests/components/app-nav.test.tsx` — delete or adapt
- [ ] Verify: app builds (`pnpm build`), no broken imports, navigating between routes works

**Phase 1 verification:**
- `pnpm build` succeeds
- `/` shows TopBar with date navigator + placeholder content (no redirect to /home)
- `/journal/write` shows BreadcrumbBar with blue accent + existing journal page content
- `/food` shows BreadcrumbBar with teal accent + existing food page content
- `/settings` shows BreadcrumbBar + existing settings page
- Mobile: top bar responsive, breadcrumb responsive
- Theme toggle still works (via settings page for now)
- `mode-context` returns correct domain for each route

---

## Phase 2 — Dashboard Quadrants

Build the 4 domain summary cards. After this, the dashboard home shows real data.

### Task 2.1: JournalQuadrant

**Files:**
- Create: `components/dashboard/journal-quadrant.tsx`

- [ ] Fetch today's entry from `GET /api/entries?date=<selectedDate>`. Show: text preview (5-line clamp), word count + image count in footer, save status
- [ ] "Write" action button → navigate to `/journal/write`
- [ ] Empty state: "No entry yet" + Write button
- [ ] Verify: on dashboard, journal card shows today's entry preview or empty state

### Task 2.2: FoodQuadrant

**Files:**
- Create: `components/dashboard/food-quadrant.tsx`
- Create: `components/shared/meal-row.tsx`

- [ ] Fetch today's food from `GET /api/food?date=<selectedDate>`. Show: compact MealRow list (slot name, description, time), slot fill count in footer
- [ ] `MealRow` — single line: slot icon/name, truncated description, time
- [ ] InboxBadge showing unsorted count (from `GET /api/food?uncategorized=true` or equivalent)
- [ ] "+" action button → navigate to `/food`
- [ ] Verify: on dashboard, food card shows meal rows for today, inbox count badge

### Task 2.3: NotesQuadrant

**Files:**
- Create: `components/dashboard/notes-quadrant.tsx`

- [ ] Fetch recent notes from `GET /api/notes?limit=3`. Show: note title + first tag per row
- [ ] Footer: note count + tag count
- [ ] "+ New" action button → navigate to `/notes/browse?new=1`
- [ ] Verify: on dashboard, notes card shows recent notes list

### Task 2.4: LibraryQuadrant

**Files:**
- Create: `components/dashboard/library-quadrant.tsx`

- [ ] Fetch from `GET /api/library?status=in_progress` and `GET /api/library?status=finished&limit=3`
- [ ] Show: "In Progress" section (cover + title + status pill), "Recently Finished" section
- [ ] "+ Add" action button → navigate to `/library/new`
- [ ] Verify: on dashboard, library card shows in-progress and recent finished items

### Task 2.5: Wire Dashboard Home

**Files:**
- Modify: `app/page.tsx`

- [ ] For authenticated users: render `QuadrantGrid` with all 4 quadrant components
- [ ] Date state via URL search params: read `?date=` param (default to today), pass to TopBar + quadrants. TopBar date nav updates the search param
- [ ] Unauthenticated users already see auth card (from Phase 1)
- [ ] Verify: dashboard shows all 4 quadrants with real data, date navigation changes displayed data

**Phase 2 verification:**
- Dashboard at `/` shows 4 quadrants with real data for today
- Clicking date arrows loads data for prev/next day
- Clicking quadrant navigates to expanded view
- Action buttons (Write, +, + New, + Add) navigate correctly without triggering quadrant click
- Empty states display when no data exists for selected date
- Mobile: quadrants stack vertically

---

## Phase 3 — Journal Expanded

Full journal write/browse/view functionality.

### Task 3.1: ImageTray + ImageLightbox

**Files:**
- Create: `components/shared/image-tray.tsx`
- Create: `components/shared/image-lightbox.tsx`
- Create: `components/shared/encrypted-image.tsx`

- [ ] `EncryptedImage` — adapt from `encrypted-image-gallery.tsx`. Single image: fetches encrypted blob, decrypts client-side, displays. Props: `imageKey`, `alt`, `size`
- [ ] `ImageTray` — horizontal flex of `EncryptedImage` thumbnails (72x72) + dashed "add" button. Props: `imageKeys[]`, `onAdd`, `onRemove`
- [ ] `ImageLightbox` — adapt from `image-lightbox.tsx`. Full-screen overlay with prev/next navigation
- [ ] Verify: renders encrypted images, add button triggers file picker, clicking thumb opens lightbox
- [ ] **Encryption smoke test**: upload an image (encrypts client-side → R2), then load it back (fetch blob → decrypt client-side → display). Confirm the roundtrip produces a visible image, not garbled data

### Task 3.2: ContentEditor

**Files:**
- Create: `components/shared/content-editor.tsx`

- [ ] Wrap existing CodeMirror/markdown editor. Props: `value`, `onChange`, `placeholder`, `readOnly`
- [ ] Style: Georgia serif, 16px, 1.8 line-height (matching prototype)
- [ ] Verify: renders editor, typing updates value, read-only mode disables input

### Task 3.3: JournalExpanded

**Files:**
- Create: `components/journal/journal-expanded.tsx`
- Modify: `app/journal/write/page.tsx`
- Modify: `app/journal/browse/page.tsx`
- Modify: `app/journal/entry/[id]/page.tsx`

- [ ] Build `JournalExpanded` — meta bar (date + editing state + StatusBadge), ContentEditor, ImageTray, footer (word count + save time)
- [ ] Wire `use-auto-save` for debounced saving to `POST/PUT /api/entries`
- [ ] Wire image upload flow via `client-images` + `client-image-processing`
- [ ] Browse mode: show date-tree/calendar for picking entries (adapt existing `date-tree.tsx` logic)
- [ ] Entry view: read-only ContentEditor with images
- [ ] Update route pages to render JournalExpanded
- [ ] Verify: write entry, auto-save works, add images, browse by date, view existing entries

**Phase 3 verification (also validates shared components for Phases 4-6):**
- `/journal/write` shows full editor with auto-save
- Typing triggers save indicator (Saving... → Saved)
- Image upload works (encrypted), thumbnails appear in tray
- `/journal/browse` shows date picker + entry list
- Clicking an entry shows read-only view
- BreadcrumbBar shows "← Dashboard / Journal / Mar 19"
- Word count updates as you type

---

## Phase 4 — Food Expanded

Full food capture/inbox/browse functionality.

> **Reuses from Phase 3:** `ImageTray`, `ImageLightbox`, `EncryptedImage`, `StatusBadge`, `ContentEditor`. These are already built — import from `components/shared/`.

### Task 4.1: MealSlotCard

**Files:**
- Create: `components/shared/meal-slot-card.tsx`

- [ ] Build `MealSlotCard` — 3 states: filled (header + desc + photo), skipped (faded), empty (dashed border + add button)
- [ ] Props: `slot`, `entry?`, `onEdit`, `onSkip`, `onAdd`
- [ ] Verify: all 3 states render correctly

### Task 4.2: FoodExpanded + QuickAdd + Inbox

**Files:**
- Create: `components/food/food-expanded.tsx`
- Create: `components/food/food-quick-add.tsx`
- Create: `components/food/food-inbox.tsx`
- Modify: `app/food/page.tsx`
- Modify: `app/food/browse/page.tsx`
- Modify: `app/food/entry/[id]/page.tsx`

- [ ] `FoodExpanded` — header (Quick Add button, Inbox button w/ badge, Calendar), 3-column meal grid with 7 MealSlotCards. Uses `suggestMealSlot()` from `lib/food`
- [ ] `FoodQuickAdd` — dialog/sheet: text input + image upload + submit. Posts to `POST /api/food`
- [ ] `FoodInbox` — list of unsorted entries with assign-to-slot action. Uses `POST /api/food/assign-all` and `POST /api/food/[id]/assign`
- [ ] Mobile: meal grid → 1 column
- [ ] Update route pages
- [ ] Verify: quick add creates entry, inbox shows unsorted, assigning moves to grid, browse shows meal slots by date

**Phase 4 verification:**
- `/food` shows meal grid for today with filled/skipped/empty slots
- Quick Add dialog creates entry (text, image, or both)
- Inbox shows unsorted entries with count badge
- Assigning from inbox places entry in correct meal slot
- Date navigation works
- Mobile: single column meal stack

---

## Phase 5 — Notes Expanded

Full notes list/detail/create functionality.

> **Reuses from Phase 3:** `ImageTray`, `ImageLightbox`, `EncryptedImage`, `ContentEditor`, `StatusBadge`. **Reuses from Phase 2:** `InboxBadge` pattern. All already built — import from `components/shared/`.

### Task 5.1: TagInput

**Files:**
- Create: `components/shared/tag-input.tsx`

- [ ] Adapt from existing `vocabulary-input.tsx`. Tag entry with autocomplete from existing tags
- [ ] Props: `tags[]`, `onChange`, `suggestions[]`
- [ ] Verify: adding/removing tags works, autocomplete shows suggestions

### Task 5.2: NotesExpanded + Sidebar + Editor

**Files:**
- Create: `components/notes/notes-expanded.tsx`
- Create: `components/notes/notes-sidebar.tsx`
- Create: `components/notes/note-editor.tsx`
- Create: `components/notes/subnote-item.tsx`
- Modify: `app/notes/browse/page.tsx`

- [ ] `NotesSidebar` — search input (accent border on focus), tag chip filters, scrollable note list (title + first tag), footer (count + "New" button). Width: 280px desktop, full-width mobile
- [ ] `NoteEditor` — title input, tag row (TagInput), body (ContentEditor), ImageTray, subnotes section (SubnoteItem list + add button)
- [ ] `SubnoteItem` — arrow icon + text + edit/delete actions
- [ ] `NotesExpanded` — flex row: sidebar + editor. Mobile: sidebar view ↔ editor view toggle (back button)
- [ ] Wire: `GET/POST/PUT/DELETE /api/notes`, subnote endpoints, auto-save
- [ ] Update route page
- [ ] Verify: note list loads, search filters, tag filter works, create/edit/delete notes, subnotes CRUD

**Phase 5 verification:**
- `/notes/browse` shows sidebar + editor split
- Search filters notes by text
- Tag chips filter by tag
- Creating new note works (sidebar "New" button)
- Editing note auto-saves
- Subnotes: add, edit, delete
- Mobile: sidebar → editor toggle with back button
- Image upload in notes works

---

## Phase 6 — Library Expanded

Full library browse/detail/create functionality.

> **Reuses from Phase 3:** `ImageTray`, `ImageLightbox`, `EncryptedImage`, `StatusBadge`. **Reuses from Phase 5:** `TagInput`. All already built — import from `components/shared/`. **Adapts from existing:** `filter-bar.tsx` has filter state logic worth reviewing before building `LibraryToolbar`.

### Task 6.1: LibraryExpanded + Toolbar + Grid + Detail

**Files:**
- Create: `components/library/library-expanded.tsx`
- Create: `components/library/library-toolbar.tsx`
- Create: `components/library/library-card-grid.tsx`
- Create: `components/library/library-card-new.tsx`
- Create: `components/library/library-detail-new.tsx`
- Create: `components/library/thought-item.tsx`
- Modify: `app/library/browse/page.tsx`
- Modify: `app/library/[id]/page.tsx`
- Modify: `app/library/new/page.tsx`

- [ ] `LibraryToolbar` — type tabs (All, Books, Games, Movies, Albums, Videos, Misc), status chips (In Progress, Finished, Backlog), search input, "+ Add" button
- [ ] `LibraryCardGrid` — CSS grid auto-fill (minmax 160px). Cards show cover, title, subtitle, status pill, rating
- [ ] `LibraryCardNew` — single card. Selected state: accent border + tint. Finished: reduced opacity
- [ ] `LibraryDetailNew` — right panel (300px). Cover image, title, type/author/year, status pill, metadata rows, "Your Thoughts" section with ThoughtItem list + add button
- [ ] `ThoughtItem` — text + date stamp
- [ ] `LibraryExpanded` — flex row: grid panel + detail panel. Mobile: grid view → detail view toggle
- [ ] Wire: `GET/POST/PUT/DELETE /api/library`, cover upload, item notes, `computeStatusTimestamps()`, vocabulary
- [ ] Status transitions with auto-timestamp logic
- [ ] Update route pages
- [ ] Verify: browse grid loads with filters, selecting item shows detail, create/edit/delete, status transitions, thoughts CRUD

**Phase 6 verification:**
- `/library/browse` shows toolbar + card grid + detail panel
- Type tabs filter by media type
- Status chips filter by status
- Search filters by text
- Clicking card shows detail in right panel (desktop) or pushes to detail view (mobile)
- Create new item works
- Status transitions trigger timestamp updates
- Item thoughts: add, view, delete
- Cover image upload works

---

## Phase 7 — Settings & Export

### Task 7.1: SettingsExpanded

**Files:**
- Create: `components/settings/settings-expanded.tsx`
- Create: `components/settings/export-form.tsx`
- Create: `components/settings/backup-section.tsx`
- Create: `components/settings/pwa-install-card.tsx`
- Modify: `app/settings/page.tsx`
- Delete: `app/export/page.tsx` (export becomes a section within settings)

- [ ] `SettingsExpanded` — sections: Preferences (language segmented control, theme segmented control), Export, Backup, PWA Install. No default landing selector (removed — dashboard replaces the concept)
- [ ] `ExportForm` — content selector, format selector, date range, download button. Wire `GET /api/backup` with params
- [ ] `BackupSection` — create backup button, restore dropzone with confirmation. Wire `POST /api/backup/restore`
- [ ] `PwaInstallCard` — app icon + description + install button. Wire `use-pwa-install`
- [ ] Wire `use-locale` for language switching, `use-theme` for theme switching
- [ ] Verify: all settings persist, export downloads, backup create/restore works, PWA install prompt

**Phase 7 verification:**
- Settings: language, theme persist correctly
- Export: downloads backup file with correct content
- Backup restore: uploads and restores with confirmation
- PWA install button appears when applicable
- Auth card already working from Phase 1 — verify sign-in still works after all changes

---

## Phase 8 — Polish & Cross-Cutting

### Task 8.1: Responsive QA Pass

- [ ] Verify all views at mobile (<768px) and desktop (≥768px) breakpoints
- [ ] Dashboard: 2x2 → 1-col
- [ ] Notes: sidebar+editor → toggle views
- [ ] Library: grid+detail → toggle views
- [ ] Food meal grid: 3-col → 1-col
- [ ] TopBar: hide neighbor dates on mobile
- [ ] BreadcrumbBar: hide date on mobile

### Task 8.2: i18n Pass

- [ ] Grep for hardcoded strings in all new components
- [ ] Add translation keys to `lib/i18n.ts` for all new UI text
- [ ] Wire all text through `use-locale` translations
- [ ] Verify: switch to PT-BR, all new components show translated text

### Task 8.3: Loading, Empty & Error States

- [ ] Add skeleton loaders for dashboard quadrants while data loads
- [ ] Add empty state messages for each domain (no entries, no notes, etc.)
- [ ] Add error boundaries for each expanded view
- [ ] Verify: slow network shows skeletons, empty data shows messages, thrown errors don't crash app

### Task 8.4: PWA & Offline

- [ ] Verify service worker registration in new shell
- [ ] Offline state: `use-online-status` shows indicator in StatusBadge
- [ ] Verify: going offline shows offline indicator, going online hides it

### Task 8.5: Cleanup

- [ ] Remove old domain components that were fully replaced (not adapted)
- [ ] Remove unused imports and dead code
- [ ] `pnpm lint` + `pnpm build` clean
- [ ] Update/fix any broken tests from Phase 1 deletion
- [ ] Final `pnpm test` pass

**Phase 8 verification:**
- All views responsive at both breakpoints
- Full PT-BR translation coverage
- Skeletons, empty states, error boundaries all present
- PWA install and offline detection work
- `pnpm lint`, `pnpm test`, `pnpm build` all pass

---

## Decisions

- **Dashboard date state**: URL search params (`/?date=2026-03-19`). Defaults to today when absent. Survives page refresh, works with browser back/forward. Use `useSearchParams()`.
- **Auth flow**: Replace landing page with Concept D auth card. `app/page.tsx` does server-side `auth()` → authenticated = dashboard, unauthenticated = auth card. No marketing page.
- **defaultView setting**: Remove entirely. Dashboard shows all 4 domains — no need to pick a landing area. Delete `use-default-view` hook and `/home` redirect.
- **Quadrant data loading**: Parallel fetch from existing endpoints (no new `/api/dashboard` endpoint). Follows "no backend changes" constraint. 4 parallel requests is acceptable for a dashboard.
- **Existing component reuse**: Decided per-component:
  - `date-tree.tsx` → adapt calendar logic into journal browse mode (Phase 3)
  - `filter-bar.tsx` → review filter state logic before building `LibraryToolbar` (Phase 6)
  - `vocabulary-input.tsx` → adapt into `TagInput` (Phase 5)
  - `entry-viewer.tsx` → replaced by `JournalExpanded` read-only mode
  - `encrypted-image-gallery.tsx` → adapted into `EncryptedImage` (Phase 3)
  - `image-lightbox.tsx` → adapted into `ImageLightbox` (Phase 3)
- **Export route**: Merged into settings page (no standalone `/export` route). `app/export/page.tsx` deleted.
