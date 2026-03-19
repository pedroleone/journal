# Concept D — Dashboard Migration Plan

See [shared migration plan](../../docs/migration-plan.md) for phases, backend scope, and decisions.

## Layout Shell

**Pattern**: day-centric dashboard with 2x2 quadrant grid as home, expanding to full-page views per domain.

Two distinct layout modes:
1. **Dashboard mode** (`/`) — top bar with date nav + 2x2 quadrant grid (journal, food, notes, library)
2. **Expanded mode** (`/journal`, `/food`, `/notes`, `/library`, `/settings`) — breadcrumb bar + full-width content area

Top bar (dashboard only): `[<] [Mar 18] [Wednesday, March 19] [Mar 20] [>]  [calendar] [settings]`

Breadcrumb bar (expanded views): `[< Dashboard] / [Domain Name] [date if applicable]`

## Component Inventory

### Shell / Navigation

| Component | Description |
|-----------|-------------|
| `DashboardShell` | Outer wrapper, renders TopBar + QuadrantGrid on `/`, or BreadcrumbBar + children on domain routes |
| `TopBar` | Date navigator (arrows + neighbors + current date) + action buttons (calendar, settings) |
| `BreadcrumbBar` | Back-to-dashboard link (color-coded per domain) + separator + current section + optional date |
| `QuadrantGrid` | CSS grid 2x2 container, responsive to 1-col on mobile |

### Quadrant Cards (dashboard home)

| Component | Description |
|-----------|-------------|
| `QuadrantCard` | Generic quadrant wrapper: header (label + accent dot + actions), content slot, footer |
| `JournalQuadrant` | Entry preview text, word count + image count + save status in footer |
| `FoodQuadrant` | Compact meal-row list (slot name, desc, time), slot fill count in footer, inbox badge |
| `NotesQuadrant` | Recent notes list (title + tag), note/tag counts in footer |
| `LibraryQuadrant` | "In Progress" + "Recently Finished" item rows with cover/title/status pill |

### Shared

| Component | Description |
|-----------|-------------|
| `DateNavigator` | Prev/next arrows + neighbor date labels + current date (reused in TopBar) |
| `ImageTray` | Thumbnail strip + add-image button (used in journal, food, notes) |
| `ImageLightbox` | Full-screen encrypted image viewer |
| `StatusBadge` | Save status indicator ("Saved just now", etc.) |
| `InboxBadge` | Pill showing unsorted food count |
| `AccentDot` | Small colored circle per domain |
| `MealSlotCard` | Full meal card: header, desc, photo — filled/skipped/empty states |
| `MealRow` | Compact single-line meal slot (for dashboard quadrant) |
| `ContentEditor` | Markdown-capable editor for journal + notes |
| `TagInput` | Tag entry with autocomplete |

### Domain-Specific

| Component | Description |
|-----------|-------------|
| **Journal** | |
| `JournalExpanded` | Full editor view: meta bar (date, editing state, save status), editor, image strip, word count footer |
| **Food** | |
| `FoodExpanded` | Header actions (quick add, inbox, calendar) + 7-slot meal grid |
| `FoodQuickAdd` | Fast-add dialog (text, image, or both) |
| `FoodInbox` | Unsorted entries list with assign-to-slot action |
| **Notes** | |
| `NotesExpanded` | Sidebar/editor split layout |
| `NotesSidebar` | Search input + tag chips + scrollable note list + count + "New" button |
| `NoteEditor` | Title input + tag row + body + images + subnotes/follow-ups |
| `SubnoteItem` | Single follow-up row with arrow icon |
| **Library** | |
| `LibraryExpanded` | Grid-panel / detail-panel split layout |
| `LibraryToolbar` | Type tabs + status filter chips + search + "Add" button |
| `LibraryCardGrid` | Responsive card grid with cover/title/sub/status/rating |
| `LibraryCard` | Single media card, selected state |
| `LibraryDetail` | Cover + metadata rows + "Your Thoughts" section |
| `ThoughtItem` | Single thought/note with date |
| **Settings** | |
| `SettingsExpanded` | Sections: preferences, export, backup, PWA install |
| `ExportForm` | Content/format/date-range selectors + download button |
| `BackupSection` | Create backup button + restore dropzone + confirmation |
| `PwaInstallCard` | Icon + description + install button |

## Build Order

```
 1. DashboardShell (two-mode routing: dashboard vs expanded)
 2. TopBar (with DateNavigator embedded)
 3. BreadcrumbBar
 4. QuadrantGrid + QuadrantCard (generic)
 5. AccentDot, StatusBadge, InboxBadge
 6. JournalQuadrant (preview card)
 7. FoodQuadrant (meal rows)
 8. NotesQuadrant (note rows)
 9. LibraryQuadrant (item rows)
--- shell complete, all quadrants show summary data ---
10. ImageTray, ImageLightbox, ContentEditor, TagInput
11. JournalExpanded (editor + auto-save + images)
12. MealSlotCard → FoodExpanded (7-slot grid)
13. FoodQuickAdd, FoodInbox
14. NotesSidebar → NoteEditor → SubnoteItem → NotesExpanded
15. LibraryToolbar → LibraryCardGrid → LibraryCard → LibraryDetail → ThoughtItem → LibraryExpanded
16. SettingsExpanded (ExportForm, BackupSection, PwaInstallCard)
17. Auth page
```

## Layout-Specific Concerns

**Two-mode shell**: The root route (`/`) renders the quadrant dashboard; all other routes render the expanded single-domain view with breadcrumb. This is the core architectural distinction — not a sidebar nav or tab bar, but a hub-and-spoke model.

**Quadrant click = navigate**: Each quadrant is a clickable link to the expanded view. Action buttons inside quadrants (Write, + New, + Add) must `stopPropagation` to avoid double navigation.

**Day-centric navigation**: The dashboard is anchored to a single date. TopBar date nav changes which day's data all four quadrants display. Expanded views for journal and food inherit the selected date; notes and library are date-independent.

**No persistent nav**: There is no sidebar, bottom bar, or tab bar. Navigation is: dashboard (hub) -> expanded view (spoke) -> back via breadcrumb. Settings accessed via top bar gear icon.

**Quadrant data loading**: Dashboard needs summary data from all four domains for the selected date in a single render. Consider parallel fetching or a combined dashboard endpoint if latency is a problem.

**Split layouts**: Notes and Library expanded views both use a sidebar+editor / grid+detail split. These share a similar CSS pattern but are separate components.

## Responsive Strategy

**Desktop (>=768px)**:
- Dashboard: 2x2 quadrant grid
- Notes expanded: sidebar (280px) + editor (flex)
- Library expanded: grid panel (flex) + detail panel (320px)

**Mobile (<768px)**:
- Dashboard: single-column stack (4 quadrants vertically, each more compact)
- TopBar: hide neighbor date labels, keep arrows + current date + actions
- BreadcrumbBar: hide date label, keep back link + section name
- Notes: full-width note list; selecting a note replaces list with editor (back button to return)
- Library: full-width card grid; selecting a card pushes to detail view (back button to return)
- Food: single-column meal card stack (already works)
- Journal: full-width editor (already works)
- Quadrant footers: hide on mobile if space is tight
