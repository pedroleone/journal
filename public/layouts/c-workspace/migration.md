# Concept C — Workspace: Migration Plan

See [shared migration plan](../../docs/migration-plan.md) for phases, backend scope, and decisions.

## 1. Layout Shell

IDE-style layout: vertical icon rail (left) + flexible panel area (right).

```
+--------+-----------------------------+
| Icon   |  Panel 60%  |  Panel 40%   |
| Rail   |  (primary)  |  (secondary) |
| 52px   |             |              |
|        +-------------+--------------+
| [J]    | header      | header       |
| [F]    | body        | body         |
| [N]    | footer      | footer       |
| [L]    |             |              |
|  ...   |             |              |
| [S]    |             |              |
+--------+-----------------------------+
```

- **Icon rail**: vertical, 52px wide. 4 domain icons + spacer + settings at bottom. Active state = domain tint bg.
- **Panel area**: flex container. Holds 1-2 panels depending on domain. Each panel = header + scrollable body + footer.
- **Panel splits**: Journal (60/40 with Food sidebar), Food (60/40 with Inbox), Notes (full-width, internal sidebar/editor split), Library (full-width), Settings (full-width, centered content).

## 2. Component Inventory

### Shell / Navigation

| Component | Description |
|-----------|-------------|
| `WorkspaceShell` | Root grid layout: icon rail + panel area. Handles responsive switch. |
| `IconRail` | Vertical nav with domain icons, spacer, settings. Active state per domain. |
| `Panel` | Generic panel wrapper: header, scrollable body, footer. Accepts flex weight (40/50/60/full). |
| `PanelHeader` | Standardized header bar: title (domain-colored), gap, right-side actions. |
| `PanelFooter` | Thin status bar: left info, gap, right actions. |

### Shared

| Component | Description |
|-----------|-------------|
| `DateNavigator` | Prev/next arrows + date label, used in journal & food panel headers. |
| `ImageTray` | Horizontal row of thumbnails + dashed add button. |
| `StatusDot` | Tiny colored dot (saved/saving). |
| `StatusBadge` | Pill badge with domain-colored bg (e.g., "Inbox 4", "12 notes"). |
| `ContentEditor` | Markdown contenteditable surface, serif font, max-width constrained. |
| `MealSlotCompact` | Single-line meal row for secondary food panel (filled/skipped/empty). |
| `MealSlot` | Full meal slot card with image support (filled/skipped/empty states). |
| `TagChip` | Pill chip for tags with active state. Used in notes. |
| `SearchBar` | Styled text input with domain-colored focus ring. |

### Domain-Specific

| Component | Description |
|-----------|-------------|
| `JournalPanel` | Primary panel: date heading, content editor, image tray, word count footer. |
| `FoodPanel` | Primary panel: meal slot list (full variant), add button, summary footer. |
| `FoodContextPanel` | Secondary 40% panel: compact meal slots, "Expand" link. Used alongside journal. |
| `InboxPanel` | Secondary 40% panel: unsorted food entries with drag hint, sort button. |
| `InboxItem` | Single inbox entry: thumbnail, timestamp, description, drag hint. |
| `NotesSidebar` | 280px sidebar: search bar, tag chips, scrollable note list. |
| `NoteListItem` | Single row in notes sidebar: title, preview, tag. Selected state = tint + left border. |
| `NotesEditor` | Right pane: title, tags, body editor, image attach, follow-ups section, footer. |
| `FollowUpItem` | Subnote card with left border accent. |
| `LibraryToolbar` | Type tab bar + filter row (status, genre, rating, reaction, search). |
| `LibraryGrid` | 5-col (desktop) / 2-col (mobile) card grid. |
| `LibraryCard` | Cover image + title + subtitle + status badge + optional stars. |
| `LibraryDetail` | Expanded detail: cover, metadata fields, thoughts section, edit/delete actions. |
| `SettingsPage` | Centered max-600px content: preferences, export, backup, PWA sections. |
| `ToggleGroup` | Segmented control (e.g., EN/PT-BR, Light/Dark, Markdown/Plain/PDF). |
| `FileDropZone` | Dashed upload area for backup restore. |
| `DangerZone` | Red-bordered section with passphrase + confirm input for restore. |
| `AuthPage` | Full-screen centered card: app icon, name, tagline, Google sign-in. |

## 3. Build Order

```
 1. WorkspaceShell        — grid: icon-rail + panel-area
 2. IconRail              — wire mode-context, active states, domain routing
 3. Panel + PanelHeader + PanelFooter  — generic wrappers
 4. DateNavigator         — shared, needed by journal + food
 5. StatusDot + StatusBadge
 6. ImageTray             — shared, needed by journal + food + notes
 7. ContentEditor         — shared, needed by journal + notes
 8. MealSlotCompact       — needed by FoodContextPanel
 9. JournalPanel          — first domain: editor, images, auto-save, word count
10. FoodContextPanel      — secondary panel for journal view (compact meals)
11. MealSlot              — full variant for food primary panel
12. FoodPanel             — date-based meal grid
13. InboxItem + InboxPanel — food inbox secondary panel
14. SearchBar + TagChip
15. NoteListItem + NotesSidebar
16. FollowUpItem + NotesEditor
17. LibraryToolbar (tabs + filters)
18. LibraryCard + LibraryGrid
19. LibraryDetail
20. ToggleGroup + FileDropZone + DangerZone
21. SettingsPage (preferences + export + backup + PWA)
22. AuthPage
```

## 4. Layout-Specific Concerns

- **Multi-panel state**: shell must track which panels to show per domain. Journal = 60/40 (journal + food context). Food = 60/40 (food + inbox). Notes/Library/Settings = single full panel. Consider a `panelLayout` config map keyed by domain.
- **Panel flex ratios**: use `flex: 60` / `flex: 40` — not fixed px. Panels resize proportionally.
- **No resizable panels in prototype**: the splits are fixed ratios. If resizable panels are desired later, add a drag handle between panels — but not in initial migration scope.
- **Notes internal split**: notes uses a full-width panel with its own internal sidebar (280px fixed) + editor (flex:1). This is a unique sub-layout within the panel system, not the same as the 60/40 panel split.
- **Domain-colored theming**: icon rail active state, panel title, badges, chips, and focus rings all use domain-specific CSS variables. Components should accept a `domain` prop or derive it from `mode-context`.
- **Secondary panel hides on mobile**: CSS hides `panel:not(:first-child)` at 768px. Need an alternative way to access food context / inbox on mobile (likely: link/button to navigate to full food view).
- **Compact vs full meal slots**: two distinct components — compact for secondary panel context, full for food primary panel.

## 5. Responsive Strategy

**Breakpoint**: 768px (matches `use-media-query`).

### Desktop (>768px)
- Icon rail: vertical left column, 52px wide
- Panel area: horizontal flex, 1-2 panels side by side
- Notes: internal sidebar (280px) + editor

### Mobile (<=768px)
- Icon rail becomes fixed bottom tab bar (58px), horizontal, icons spaced evenly, `rail-spacer` hidden
- Panel area: stacked vertical, only first (primary) panel visible. Secondary panel hidden via CSS.
- Notes sidebar: collapses to top section (max-height 200px), editor below
- Library grid: 2 columns instead of 5
- Panel headers: slightly shorter (44px vs 48px), tighter padding
- Settings: full-width with smaller padding
- Auth card: reduced padding

### Mobile access to hidden panels
- Food context panel (hidden on mobile when viewing journal): user taps Food icon in bottom bar to see full food view
- Inbox panel (hidden on mobile when viewing food): add "Inbox" tab or button within mobile food view, or navigate via badge tap
