# UI Migration Plan

Replace the current frontend wholesale with one of the new layout concepts. Backend (API routes, DB schema, encryption, auth) stays untouched.

## Scope

**Changes**: app shell, navigation, all page components, domain-specific UI
**No changes**: `/api/*` routes, `/lib/schema.ts`, `/lib/auth/*`, `/lib/server-crypto.ts`, `/lib/r2.ts`, `/lib/validators.ts`, Drizzle config, Auth.js config

## Existing Infrastructure to Preserve & Reuse

These hooks and libs wire directly into the new UI with no changes:

| Module | Purpose |
|--------|---------|
| `use-auto-save` | Debounced save during editing |
| `use-locale` | i18n context provider |
| `use-theme` | Dark/light mode |
| `use-media-query` | Responsive breakpoint detection |
| `use-online-status` | Offline/online detection for PWA |
| `use-pwa-install` | Install prompt handling |
| `use-images` | Image loading state |
| `use-default-view` | Preferred view memory |
| `lib/mode-context` | Active domain state (journal/food/notes/library) |
| `lib/client-image-processing` | Client-side resize before upload |
| `lib/client-images` | Image URL management |
| `lib/food` | Meal slot types, `suggestMealSlot()`, calendar helpers |
| `lib/library` | Media types/statuses, reactions, status timestamp logic |
| `components/ui/*` | All shadcn/ui primitives (button, dialog, card, etc.) |

## Phases

### Phase 1 — Layout Shell & Navigation

Replace the app's structural skeleton. After this phase, the app renders the new layout with placeholder content in each domain.

1. Remove `app-shell.tsx`, `app-nav.tsx`, `nav-wrapper.tsx`
2. Remove `components/nav/*` (desktop-top-bar, mobile-bottom-bar, mobile-top-bar, nav-sections)
3. Build new layout wrapper component (concept-specific: icon rail / quadrant grid / room switcher / tab bar / dock)
4. Build new navigation component with responsive variant (desktop + mobile)
5. Wire `mode-context` into new navigation (active domain state)
6. Wire `use-theme` and `use-locale` into new shell
7. Verify: all domain routes render inside new shell, navigation switches between domains

### Phase 2 — Shared UI Components

Build reusable components needed across multiple domains. These are layout-aware but domain-agnostic.

1. `DateNavigator` — prev/next date navigation widget (used in journal, food)
2. `ImageTray` — thumbnail grid with add button (used in journal, food, notes)
3. `ImageLightbox` — full-screen image viewer (adapt existing `image-lightbox.tsx`)
4. `EncryptedImage` — single encrypted image display (adapt existing `encrypted-image-gallery.tsx`)
5. `StatusBadge` — save status, offline indicator, inbox count
6. `MealSlot` — single meal slot display (filled / skipped / empty states)
7. `ContentEditor` — markdown-capable editor wrapper (adapt existing `markdown-editor` from shadcn)
8. `TagInput` — tag entry with autocomplete from vocabulary (adapt existing `vocabulary-input.tsx`)

### Phase 3 — Domain Pages

Rebuild each domain's pages, wiring new components to existing API calls and hooks. One domain at a time, fully functional before moving to the next.

#### 3a — Journal
1. Write/edit view — contenteditable area, `use-auto-save`, image upload, word count
2. Browse view — `date-tree` calendar, entry list by date
3. Entry viewer — read-only display with images, read-only vs editable state handling
4. Wire: `POST/GET/PUT /api/entries`, `GET /api/entries/dates`, image upload flow

#### 3b — Food
1. Capture view — fast-add form (text, image, or both), `suggestMealSlot()`
2. Inbox view — unsorted entries list, assign to day/meal slot, bulk organize
3. Browse view — date-based meal grid, meal slot cards (filled/skipped/empty)
4. Entry detail — view/edit/delete single food entry
5. Wire: `POST/GET/PUT/DELETE /api/food`, `/api/food/assign-all`, `/api/food/dates`

#### 3c — Notes
1. List view — all notes with search + tag filtering
2. Detail view — note title, body, tags, images, subnote list
3. Subnote CRUD — inline create/edit/delete within note detail
4. Create/edit — note form with tag input
5. Wire: `POST/GET/PUT/DELETE /api/notes`, subnote endpoints

#### 3d — Library
1. Browse view — grid/list of media items, filter bar (type, status, genre, reaction, platform, rating, search)
2. Detail view — cover image, metadata (type-specific fields), status transitions, reactions, item notes
3. Create view — quick-add + full-detail paths, type picker
4. Status transitions — auto-timestamp logic via `computeStatusTimestamps()`
5. Wire: `POST/GET/PUT/DELETE /api/library`, cover upload, item notes, bulk status, vocabulary

#### 3e — Settings
1. Language picker (EN / PT-BR)
2. Theme picker (light / dark)
3. Default landing area selector
4. Export/backup access link

#### 3f — Export & Backup
1. Export view — time range selector, manual content selection, format picker (markdown/plain text/print)
2. Backup download — full encrypted backup trigger
3. Backup restore — file upload with safety confirmation
4. Wire: `GET/POST /api/backup`, restore endpoint

### Phase 4 — Cross-Cutting Concerns

1. Auth flow — pre-auth landing page, Google sign-in button, redirect to default view
2. PWA — service worker registration, install prompt, offline state messaging
3. Responsive QA — verify all views at mobile + desktop breakpoints
4. i18n — verify all new components respect `use-locale`, no hardcoded strings
5. Encryption — verify encrypted image display works end-to-end in new components
6. Empty/loading/error states — add skeleton loaders, empty state messages, error boundaries

## Recommended Order of Work

```
Shell → Navigation → DateNavigator → ImageTray → StatusBadge
  → Journal (write → browse → view)
  → Food (capture → inbox → browse → detail)
  → Notes (list → detail → create)
  → Library (browse → detail → create)
  → Settings → Export/Backup
  → Auth flow → PWA → Responsive QA → i18n pass → Final states
```

## Files to Delete

```
components/app-shell.tsx
components/app-nav.tsx
components/nav-wrapper.tsx
components/nav/desktop-top-bar.tsx
components/nav/mobile-bottom-bar.tsx
components/nav/mobile-top-bar.tsx
components/nav/nav-sections.ts
```

## Files to Adapt (not delete)

```
components/ui/*              — keep all shadcn primitives
components/journal/*         — rewrite, may keep date-tree logic
components/library/*         — rewrite, preserve filter/status logic
components/notes/*           — rewrite
components/auth/*            — keep Google sign-in button
components/pwa/*             — keep as-is
encrypted-image-gallery.tsx  — adapt into new EncryptedImage component
image-lightbox.tsx           — adapt into new ImageLightbox component
```

## Unresolved Questions

- Which layout concept to implement? (C/D/F/G/J)

## Decisions

- **New layout features not yet in backend**: keep the UI element as a placeholder with `// TODO: implement` in the code. No backend work during migration.
- **Test strategy**: manual QA only. No new automated tests during migration.
- **Telegram integration**: removed from the app, not part of migration scope.
