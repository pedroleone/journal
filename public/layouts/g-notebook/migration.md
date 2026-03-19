# Concept G — Notebook: Migration Plan

See [shared migration plan](../../docs/migration-plan.md) for phases, backend scope, and decisions.

## 1. Layout Shell

The notebook metaphor uses a 3-column CSS grid: **spine | tabs | page**.

```
[ spine 8px ][ tabs 36px ][        page (1fr)         ]
                           [ page-header              ]
                           [ page-content (scrollable) ]
                           [ footer / image-tray       ]
```

- **Spine** — decorative gradient strip (left edge), purely visual
- **Tabs** — vertical column with rotated text (`writing-mode: vertical-rl`), one per domain. Active tab visually "opens into" the page via `border-radius` + negative margin. Each tab has a distinct muted background shade; active tab matches page background
- **Page** — main content area. Contains page-header, scrollable page-content, and optional footer sections (image tray, word count)
- **Mobile** — spine + tabs hidden, replaced by fixed bottom nav bar with letter icons (J/F/N/L)
- **Settings** — accessed via gear icon in page-header, not a 5th tab. Tabs remain visible but none active
- **Auth** — standalone page, no notebook chrome at all

## 2. Component Inventory

### Shell / Navigation

| Component | Description |
|-----------|-------------|
| `NotebookShell` | Root layout: notebook-wrapper > notebook grid (spine + tabs + page) |
| `NotebookSpine` | Decorative gradient strip, left edge |
| `NotebookTabs` | Vertical tab column with 4 domain tabs, active state handling |
| `NotebookTab` | Single rotated tab button with domain color accent when active |
| `NotebookPage` | Page container with inset shadow, flex column for header + content + footer |
| `PageHeader` | Header bar: left slot (date-nav or title) + right slot (badges, buttons, gear) |
| `MobileNavBar` | Fixed bottom bar with 4 letter-icon buttons, domain-colored active state |
| `GearButton` | Settings link icon in page-header |

### Shared

| Component | Description |
|-----------|-------------|
| `DateNavigator` | Prev/next day navigation with serif current-date display |
| `ImageTray` | Horizontal strip: label + thumbnail grid + add button, below content |
| `ImagePlaceholder` | Single image thumbnail (multiple sizes: default 72px, lg 120x90) |
| `HeaderBadge` | Pill badge for status (saved, inbox count) |
| `HeaderButton` | Small action button (primary/default/danger variants) |
| `SectionHeading` | Uppercase sans-serif label for content sections |
| `IndexCard` | Reusable card with subtle shadow, used in food inbox and elsewhere |
| `ContentEditor` | Contenteditable area for journal writing (serif, line-height 2.0) |
| `TagInput` | Tag entry with autocomplete |
| `StatusBadge` | Save status + offline indicator |

### Domain-Specific

| Component | Description |
|-----------|-------------|
| `LinedPaper` | Repeating-gradient background (33px lines), journal pages only |
| `JournalArea` | Centered column (max-width 720px) with entry-date label + entry-body |
| `JournalFooter` | Word count + date footer below journal content |
| `MealRow` | 3-column grid row: slot label, content (desc + photos), time |
| `MealSlotLabel` | Uppercase sans-serif meal name (Breakfast, Lunch, etc.) |
| `FoodInboxItem` | IndexCard variant with description, capture time, assign button |
| `NotesLayout` | 2-column grid: sidebar (280px) + detail pane |
| `NotesSidebar` | Search input + tag chips + scrollable note list |
| `NoteItem` | List row: title, preview, tags. Active state has left border accent |
| `NoteDetail` | Full note view: title, tags, body, images, follow-ups section |
| `FollowUpItem` | Card-style sub-item within note detail |
| `LibraryLayout` | 2-column grid: main (grid + toolbar) + detail panel (320px) |
| `LibraryToolbar` | Type tabs (All/Books/Games/...) + filter chips (status) |
| `LibraryGrid` | 4-column card grid (2-col on mobile) |
| `LibraryCard` | Cover image + info (title, creator, type badge, status/stars) |
| `LibraryDetail` | Side panel: cover, title, metadata fields, thoughts, edit/delete |
| `SettingsSection` | Group with uppercase title + row list |
| `SettingsRow` | Label + description left, control (select/button/toggle) right |
| `AuthCard` | Centered card with app name, tagline, Google sign-in, footer |

## 3. Build Order

```
 1. NotebookShell (grid: spine + tabs + page)
 2. NotebookSpine
 3. NotebookTabs + NotebookTab (wire mode-context)
 4. NotebookPage
 5. PageHeader + GearButton
 6. MobileNavBar
 7. DateNavigator
 8. HeaderBadge + HeaderButton + SectionHeading
 9. ImageTray + ImagePlaceholder
10. LinedPaper + JournalArea + JournalFooter + ContentEditor
11. JournalArea wired to API (write/browse/view)
12. MealRow + MealSlotLabel + FoodInboxItem
13. Food pages wired to API (capture/inbox/browse/detail)
14. NotesLayout + NotesSidebar + NoteItem + NoteDetail + FollowUpItem
15. Notes pages wired to API (list/detail/create)
16. LibraryLayout + LibraryToolbar + LibraryGrid + LibraryCard + LibraryDetail
17. Library pages wired to API (browse/detail/create)
18. SettingsSection + SettingsRow (preferences, export, backup, PWA, account)
19. AuthCard (standalone page, no notebook shell)
```

## 4. Layout-Specific Concerns

- **Warm color palette** — all backgrounds use cream/parchment tones (`#fffdf8`, `#f5f0eb`, `#e8e0d5`). No pure whites. Dark mode must translate these to warm dark tones, not cool grays
- **Serif-first typography** — body text, titles, and entry content use `Georgia` / serif stack. Sans-serif (`system-ui`) only for labels, badges, meta text, and controls
- **Lined paper background** — journal pages only. CSS `repeating-linear-gradient` at 33px intervals with `background-attachment: local` so lines scroll with content. Other domains have plain page background
- **Vertical tab rotation** — `writing-mode: vertical-rl` + `text-orientation: mixed`. Tabs are 7px uppercase, stacked vertically. Each tab has a progressively darker inactive shade (`--tab-inactive-1` through `--tab-inactive-4`)
- **Active tab "opens" into page** — active tab gets `border-radius: 0 4px 4px 0`, page background color, negative right margin to overlap page border, and `z-index: 2`
- **Domain accent colors** — journal: `#7c7cff`, food: `#4caf93`, notes: `#b07cff`, library: `#ff7c7c`, inbox: `#c9a96e`. Used sparingly on active tab text, badges, borders
- **Physical notebook metaphor** — subtle inset shadow on page, card backgrounds with 1px borders and faint drop shadows, no hard edges
- **Settings via gear, not tab** — settings is not a domain tab. Accessed through gear icon in page-header. When on settings, all 4 tabs show inactive
- **Line-height 2.0 for journal** — entry body text has double line-height to align with lined paper background
- **Scrollbar styling** — custom thin scrollbar (6px) matching the warm palette

## 5. Responsive Strategy

| | Desktop (>768px) | Mobile (<=768px) |
|---|---|---|
| **Navigation** | Vertical tabs column (spine + tabs visible) | Fixed bottom bar with letter icons (J/F/N/L) |
| **Spine** | Visible (8px gradient) | Hidden (`display: none`) |
| **Grid** | `8px 36px 1fr` | `0 0 1fr` (full-width page) |
| **Notes** | 2-column: sidebar + detail | Single column, sidebar hidden (show list OR detail) |
| **Library** | 2-column: grid + detail panel | Single column, detail panel hidden (navigate to detail) |
| **Library grid** | 4 columns | 2 columns |
| **Food meal-row** | 3 columns (label 120px + content + time) | 2 columns (label 90px + content), time hidden |
| **Page header** | Full padding (14px 28px) | Compact padding (10px 16px) |
| **Journal area** | Padding 32px 40px | Padding 20px 16px |
| **Settings** | Padding 32px 40px, max-width 600px | Padding 20px 16px |

Mobile notes/library need a list-detail navigation pattern (show list, tap to navigate to detail view) since sidebars/panels are hidden. This requires client-side state to toggle between list and detail views on small screens.
