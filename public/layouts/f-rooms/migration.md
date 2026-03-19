# Concept F (Rooms) — Migration Plan

See [shared migration plan](../../docs/migration-plan.md) for phases, backend scope, and decisions.

## 1. Layout Shell

Full-screen "rooms" — each domain occupies 100vh with its own background color and internal layout. Only shared chrome is the room switcher.

- **Desktop**: 48px fixed icon rail on left (`room-switcher`). Vertical stack: brand icon, 4 domain icons, spacer, settings. Tooltip on hover via `::after`. Active icon gets domain accent color + dim bg.
- **Mobile**: bottom tab bar (56px), 5 tabs (journal/food/notes/library/settings) with icon + label. Side rail hidden.
- **Room wrapper**: `margin-left: 48px` (desktop), full-width (mobile). Each room gets unique `--room-*-bg` background.
- **Auth page**: no room switcher at all, centered card on dark bg.

## 2. Component Inventory

### Shell / Navigation

| Component | Description |
|-----------|-------------|
| `RoomSwitcher` | Fixed left icon rail (desktop), renders domain icons with active state from `mode-context` |
| `MobileTabBar` | Fixed bottom tab bar (mobile), same icons + text labels |
| `RoomWrapper` | Layout container — applies per-room bg color, handles margin-left offset, bottom padding on mobile |

### Shared

| Component | Description |
|-----------|-------------|
| `DateNavigator` | Prev/next arrows + neighbor dates + current date display (used in journal, food) |
| `ImageTray` | Horizontal thumbnail strip with add button (journal, food, notes) |
| `ImageLightbox` | Full-screen image viewer (adapt existing) |
| `EncryptedImage` | Single encrypted image display (adapt existing) |
| `StatusBadge` | Save status indicator ("saved"), attachment count |
| `ContentEditor` | Markdown editor wrapper (adapt existing) |
| `TagInput` | Tag entry with autocomplete (adapt existing) |

### Domain: Journal

| Component | Description |
|-----------|-------------|
| `JournalRoom` | Full room container — header + writing surface + image strip + past entries |
| `WritingSurface` | Centered serif editor area with word count, 640px max-width |
| `PastEntryCard` | Read-only entry card with date + readonly badge + serif text |
| `PastEntrySection` | Divider + list of `PastEntryCard`s |

### Domain: Food

| Component | Description |
|-----------|-------------|
| `FoodRoom` | Two-column layout: meal timeline (left) + inbox panel (right) |
| `MealTimeline` | Vertical list of meal slots for a day |
| `MealSlotCard` | Single slot row: time column + accent bar + body (filled/skipped/empty states) |
| `FoodInboxPanel` | Right sidebar — inbox header, card list, sort-all footer |
| `InboxCard` | Single inbox item (text-only or image+text, with timestamp) |
| `QuickAddButton` | Accent-colored "+ Quick Add" button in food header |

### Domain: Notes

| Component | Description |
|-----------|-------------|
| `NotesRoom` | Two-panel layout: sidebar list + editor |
| `NoteListSidebar` | Left panel — search input, tag filter chips, scrollable note list |
| `NoteListItem` | Single note row: title, preview, tag badge, date |
| `NoteEditor` | Right panel — title, tags, body text, images, follow-ups section |
| `SubnoteItem` | Single follow-up with left accent border |

### Domain: Library

| Component | Description |
|-----------|-------------|
| `LibraryRoom` | Toolbar + two-panel content: catalog grid + detail panel |
| `LibraryToolbar` | Type tabs (All/Books/Albums/etc) + filter chips + search + add button |
| `CatalogGrid` | Responsive card grid (5-col desktop, 2-col mobile) |
| `CatalogCard` | Cover image + status badge + title + type + rating |
| `ItemDetailPanel` | Right sidebar — cover, title, metadata rows, thoughts text |

### Domain: Settings

| Component | Description |
|-----------|-------------|
| `SettingsRoom` | Centered 600px column with grouped setting sections |
| `SettingsSection` | Section title + list of `SettingsRow` |
| `SettingsRow` | Label + description (left) + control (right): select, button, or danger button |

### Auth

| Component | Description |
|-----------|-------------|
| `AuthPage` | Centered card: logo, title, subtitle, Google sign-in button, privacy text |

## 3. Build Order

```
1.  RoomWrapper (per-room bg, margin offset)
2.  RoomSwitcher (desktop icon rail)
3.  MobileTabBar (bottom tabs)
4.  Wire mode-context + use-theme + use-locale into shell
5.  DateNavigator
6.  StatusBadge
7.  ImageTray + EncryptedImage + ImageLightbox
8.  WritingSurface + ContentEditor
9.  PastEntryCard → PastEntrySection
10. JournalRoom (compose: header + surface + images + past entries)
11. MealSlotCard → MealTimeline
12. InboxCard → FoodInboxPanel
13. FoodRoom (compose: header + columns)
14. NoteListItem → NoteListSidebar
15. SubnoteItem → NoteEditor
16. NotesRoom (compose: sidebar + editor)
17. CatalogCard → CatalogGrid
18. ItemDetailPanel
19. LibraryToolbar
20. LibraryRoom (compose: toolbar + grid + detail)
21. SettingsRow → SettingsSection → SettingsRoom
22. AuthPage
```

## 4. Layout-Specific Concerns

### Per-room theming
- Each room has its own `--room-*-bg` background color and `--domain` accent color
- `RoomWrapper` must dynamically apply the correct bg class based on active route
- Active switcher icon uses `--domain-dim` bg + `--domain` color — need 5 active states (journal/food/notes/library/settings)

### Room isolation
- Each room owns its entire viewport — no shared header or content area between rooms
- Internal layouts differ wildly: journal is single-column centered, food is 2-column with sidebar, notes is master-detail, library is toolbar + grid + detail
- No shared layout beyond the switcher — each room component manages its own structure

### Writing surface specifics
- Serif font (Georgia) for journal writing + past entries
- Blinking cursor accent in `--journal` color
- Word count positioned bottom-right of surface

### Accent bar pattern
- Food meal slots use a 3px colored vertical accent bar (filled=green, skipped=muted, empty=border)
- Notes subnotes use a 3px left border in notes accent

### Tooltip system
- Desktop switcher icons show label tooltips on hover via CSS `::after` + `data-label`
- Can implement with CSS only or replace with shadcn Tooltip

## 5. Responsive Strategy

Breakpoint: **768px**

| Element | Desktop | Mobile |
|---------|---------|--------|
| Room switcher | 48px fixed left rail | Hidden |
| Tab bar | Hidden | 56px fixed bottom bar |
| Room wrapper | `margin-left: 48px` | `margin-left: 0`, `padding-bottom: 56px` |
| Journal | Centered 640px column | Same, tighter padding |
| Food | 2-column (timeline + inbox) | Single column, inbox stacks below (max-h 280px) |
| Notes | Sidebar (260px) + editor | Sidebar only, editor hidden (navigate to detail) |
| Library grid | 5-column grid + detail panel | 2-column grid, detail panel hidden (navigate to detail) |
| Library type tabs | Inline flex | Horizontal scroll |

### Mobile detail views (notes + library)
- On mobile, detail panels are hidden — need route-based navigation to a detail view
- Notes: tap note item -> navigate to editor view (full screen)
- Library: tap catalog card -> navigate to detail view (full screen)
- Back button needed on mobile detail views
