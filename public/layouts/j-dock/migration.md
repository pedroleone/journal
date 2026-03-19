# J-Dock Migration Plan

See [shared migration plan](../../docs/migration-plan.md) for phases, backend scope, and decisions.

## 1. Layout Shell

Three-layer vertical stack, fixed to viewport:

```
┌─────────────────────────────┐
│  TopBar (sticky)            │  48px — domain-specific controls
├─────────────────────────────┤
│                             │
│  Content (scrollable)       │  flex: 1, overflow-y: auto
│                             │
├─────────────────────────────┤
│  ImageTray (conditional)    │  only journal/food/notes
├─────────────────────────────┤
│  Dock (fixed bottom)        │  56px desktop / 44px mobile
└─────────────────────────────┘
```

- `.app` — full-viewport flex column
- `.app-inner` — flex column, `flex: 1`, `padding-bottom: var(--dock-height)`
- `.dock` — fixed bottom, 4 equal slots (Journal / Food / Notes / Library)
- TopBar content changes per domain (date nav for journal/food, search+tags for notes, type tabs+filters for library, plain title for settings)
- No sidebar. No icon rail. Navigation lives entirely in the dock.

## 2. Component Inventory

### Shell / Navigation

| Component | Description |
|-----------|-------------|
| `DockLayout` | Root shell: app-inner + fixed dock footer, accepts children |
| `Dock` | 4-slot footer bar with active state per domain, domain-colored glow + dot indicator |
| `DockSlot` | Single dock slot: label (full + short), live metric, active class by domain color |
| `DockPopover` | Long-press context menu anchored above a dock slot (e.g., food quick actions) |
| `TopBar` | Sticky bar container — renders domain-specific children |
| `TopBarDateNav` | Prev/next date navigator with side dates (journal, food) |
| `TopBarActions` | Right-side cluster: buttons, status badge, settings gear |

### Shared

| Component | Description |
|-----------|-------------|
| `ImageTray` | Horizontal thumb strip between content and dock, with add button |
| `ImageTrayThumb` | Single thumbnail in the tray |
| `StatusBadge` | Auto-save status indicator ("auto-saved", "saving...", "offline") |
| `SearchInput` | Search field with icon, used in notes + library top bars |
| `Chip` | Filterable tag pill with active state (notes tags, library filters) |
| `TypeTabs` | Segmented tab bar for library media types (All/Books/Games/Albums/Movies) |
| `Badge` | Amber notification count pill (food inbox count) |
| `ContentEditor` | Markdown editor wrapper for journal body + note body |
| `TagInput` | Tag entry with autocomplete (notes) |

### Domain-Specific

| Component | Description |
|-----------|-------------|
| **Journal** | |
| `JournalMeta` | Date chip + word count row above body |
| `JournalBody` | Serif writing surface with blinking caret, contenteditable |
| **Food** | |
| `MealSlotList` | Vertical stack of meal slots for a day |
| `MealSlot` | Single slot row: label col, content, optional photo thumbs; filled/skipped/empty states |
| `FoodQuickAdd` | Top bar button triggering quick-add (text/photo) |
| `FoodInboxButton` | Top bar inbox button with badge count |
| **Notes** | |
| `NotesList` | Sidebar list of notes with title, preview, tag |
| `NotesListItem` | Single row: title, truncated preview, tag chip |
| `NoteEditor` | Right panel: title input, tags, body, images, follow-ups section |
| `FollowupItem` | Single subnote row with arrow prefix |
| **Library** | |
| `LibraryGrid` | CSS grid of media cards, auto-fill columns |
| `LibCard` | Cover image + title + meta + stars + optional status pip |
| `LibDetail` | Sticky sidebar panel: cover, metadata rows, thoughts, action buttons |
| **Settings** | |
| `SettingsGroup` | Grouped card with title and rows |
| `SettingsRow` | Single setting: icon, label, sub-label, value/action slot |
| **Auth** | |
| `AuthPage` | Centered card: logo, title, subtitle, Google button, footer — no dock |

## 3. Build Order

```
 1. DockLayout (shell wrapper with padding-bottom for dock)
 2. Dock + DockSlot (fixed footer, wire mode-context for active state)
 3. TopBar (sticky container)
 4. TopBarDateNav (needed by journal + food)
 5. StatusBadge
 6. ImageTray + ImageTrayThumb
 7. JournalMeta + JournalBody → full journal write view
 8. MealSlot + MealSlotList → food browse view
 9. FoodQuickAdd + FoodInboxButton → food top bar actions
10. DockPopover → food long-press quick actions
11. SearchInput + Chip
12. NotesList + NotesListItem + NoteEditor + FollowupItem → notes full view
13. TypeTabs
14. LibCard + LibraryGrid + LibDetail → library full view
15. SettingsGroup + SettingsRow → settings page
16. AuthPage → pre-auth (no dock)
17. ContentEditor + TagInput (adapt existing, wire into journal + notes)
```

## 4. Layout-Specific Concerns

**Dock metrics are live data.** Each dock slot shows a real-time metric:
- Journal: word count today (`324 words today`)
- Food: filled slots / total + unsorted count (`4/7 · 4 unsorted`) with badge
- Notes: total note count (`12 notes`)
- Library: in-progress count (`2 in progress`)

These need lightweight API calls or cached state. Consider a `useDockMetrics()` hook that fetches summary counts on mount + after mutations.

**Domain-colored active states.** Each domain has its own accent color applied to the active dock slot (background tint, border glow, dot indicator, label color). The active class pattern is `active-{domain}` on `DockSlot`. CSS variables already defined per domain (`--journal`, `--food`, `--notes`, `--library` with `-15`, `-27`, `-08` opacity variants).

**Dock popover (long-press).** Food slot supports a popover with quick actions (Photo, Text entry, Sort inbox). Triggered on long-press (mobile) or right-click (desktop). Anchored above the slot with arrow pointer. Needs a generic `DockPopover` that other domains could optionally use later.

**Image tray positioning.** Sits between scrollable content and the dock — not inside the scroll area. It's part of `.app-inner`, below `<main>` and above the dock's padding zone. Only visible when the current view has images (journal write, food detail, note detail).

**Top bar is polymorphic.** Not a single component with props for everything — render different children per domain route. Journal/food get `TopBarDateNav`, notes gets search + tag chips + new button, library gets type tabs + filter chips + search + add button, settings gets plain title.

**Notes split layout.** Desktop: sidebar list (280px) + editor pane. Fills remaining height via `min-height: calc(100vh - topbar - dock - offset)`. On mobile: stacks vertically with list capped at 200px.

**Library grid + detail.** Desktop: auto-fill card grid + sticky 280px detail sidebar. On mobile: stacks, detail loses sticky positioning.

## 5. Responsive Strategy

Breakpoint: `768px` (matches `use-media-query`).

| Element | Desktop (>768px) | Mobile (<=768px) |
|---------|-------------------|-------------------|
| Dock height | 56px | 44px |
| Dock slot labels | Full word ("Journal") | Single letter ("J") via `full-label`/`short-label` toggle |
| Dock slot metrics | 10px, visible | 9px, still visible |
| TopBar date nav | Shows side dates (Mar 18 / Mar 20) | Hides side dates, smaller center label |
| TopBar padding | 20px | 12px |
| Content padding | 24px 20px | 16px 12px |
| Notes layout | Side-by-side (list 280px + editor) | Stacked (list capped 200px, editor below) |
| Library layout | Grid + sticky detail sidebar | Stacked (grid then detail) |
| Library card grid | `minmax(130px, 1fr)` | `minmax(100px, 1fr)` |

No hamburger menu. No drawer. Dock is always visible. Mobile just compacts labels to single letters and stacks split layouts.
