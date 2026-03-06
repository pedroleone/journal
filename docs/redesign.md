# UI/UX Design for Encrypted Journal App

## Global Structure

The app has two top-level modes: **Journal** and **Food**. I'd suggest a very minimal top-level switcher — not a full nav bar, just a subtle toggle or tab pair, since there are only two modes and you want minimal distraction.

```text
┌──────────────────────────────────────────────────────┐
│  [Journal]  [Food]                        [+ New] [⚙]│
│─────────────────────────────────────────────────────-│
│             ...content area...                       │
└──────────────────────────────────────────────────────┘
```

The `[+ New]` button is contextual — creates a journal entry or a food log depending on mode. Settings gear for export, encryption key management, Telegram link, etc.

---

## 1. Journal Mode

### 1a. Entry Creation (Write Mode)

**Goal:** Full screen, zero distraction, just write.

```text
┌──────────────────────────────────────────────────────┐
│  ← Back                     Monday, 17/02/2026       │
│──────────────────────────────────────────────────────│
│                                                      │
│                                                      │
│  Just a blinking cursor and your words.              │
│  No toolbar, no formatting bar unless you            │
│  hover/tap a region. Think iA Writer.                │
│                                                      │
│                                                      │
│                                                      │
│                                                      │
│                                                      │
│                                                      │
│──────────────────────────────────────────────────────│
│  [📎 Image]                          auto-saved ✓    │
└──────────────────────────────────────────────────────┘
```

Key decisions:
- **Date is the only "header."** No title field. The date is determined automatically (today) but can be overridden via a subtle date picker if you tap/click the date.
- **Auto-save** with an indicator. No save button.
- **Image attach** is tucked in the bottom bar, out of the way.
- If an entry already exists for today, opening "New" takes you to that entry to append (or you see a confirmation: "An entry for today already exists. Append or view?").
- Markdown or plain text — up to you, but keep it invisible. No formatting toolbar by default.

### 1b. Browse Mode (Read/Review)

**Goal:** macOS Notes-style — left sidebar with date hierarchy, right pane with content.

```text
┌──────────────────────────────────────────────────────────┐
│  [Journal]  [Food]                         [+ New]  [⚙] │
│──────────────────────────────────────────────────────────│
│  ▾ 2026                    │                             │
│    ▾ February               │  Monday, 17/02/2026        │
│      ☐ Mon, 17/02  ←active │  ─────────────────────     │
│      ☐ Sun, 16/02          │                             │
│      ☐ Sat, 15/02          │  Went for a walk today.    │
│      ☐ Fri, 14/02          │  The weather was perfect,  │
│    ▸ January                │  first real spring day...  │
│  ▸ 2025                    │                             │
│                             │  [photo_park.jpg]          │
│                             │                             │
│                             │                             │
│                             │                             │
│                             │                             │
│─────────────────────────────│                             │
│  [Export ↓]                 │                             │
└──────────────────────────────────────────────────────────┘
```

Key decisions:
- **Hierarchy:** Year → Month → Day entries. Collapsible tree.
- **Left sidebar shows ONLY dates**, no content preview. This is also good for privacy — someone glancing at your screen sees only dates.
- **Content is fetched and decrypted only when you click a date.** Show a brief loading/decrypting indicator.
- **Checkboxes (☐)** next to each entry are hidden by default, but appear when you enter "Export/Select mode" (triggered by the Export button). This lets you multi-select for export.
- Clicking a month label selects all entries in that month for export. Clicking a year selects all.
- The right pane shows rendered content with a subtle **[Edit ✏️]** button in the top-right corner that transitions to Write Mode for that entry.

### 1c. Export Flow

```text
┌──────────────────────────────────────────────────────┐
│  Export Journal Entries                          [✕]  │
│──────────────────────────────────────────────────────│
│                                                      │
│  Selection:                                          │
│    ○ This week (10/02 – 16/02)                       │
│    ○ This month (February 2026)                      │
│    ● Custom range                                    │
│       [01/01/2026] → [17/02/2026]                    │
│    ○ Entire year (2026)                              │
│    ○ Everything                                      │
│                                                      │
│  Format:                                             │
│    ○ Markdown (.md)                                  │
│    ● PDF                                             │
│    ○ Plain text                                      │
│                                                      │
│  23 entries selected                                 │
│                                                      │
│           [Cancel]    [Decrypt & Export]              │
└──────────────────────────────────────────────────────┘
```

This is a modal/dialog. "Decrypt & Export" makes it clear that decryption happens client-side before generating the file.

---

## 2. Food Mode

### 2a. Quick Entry (Web — mirrors Telegram bot experience)

**Goal:** Absolute minimum friction. Log and get back to eating.

```text
┌──────────────────────────────────────────────────────┐
│  [Journal]  [Food]                         [+ New]  [⚙]│
│──────────────────────────────────────────────────────│
│                                                      │
│          ┌─────────────────────────────────┐         │
│          │ What are you eating?            │         │
│          │                                 │         │
│          │ Chicken rice bowl, extra        │         │
│          │ avocado                         │         │
│          │                                 │         │
│          │ [📷 Photo]                      │         │
│          │                                 │         │
│          │              [Log ✓]            │         │
│          └─────────────────────────────────┘         │
│                                                      │
│   Logged just now: "Coffee, black"                   │
│   Logged 2h ago: "Scrambled eggs, toast" 📷          │
│                                                      │
└──────────────────────────────────────────────────────┘
```

Key decisions:
- **One text field + optional photo. One button.** That's it.
- No date picker, no category, no meal type. Just dump it in. It gets timestamped automatically.
- Below the input, a small feed of recent uncategorized entries as confirmation that things are being logged.
- **Telegram bot flow** is identical conceptually: send text or photo → it's logged with a timestamp, uncategorized.

### 2b. Browse & Organize Mode

This is where the complexity lives. The layout mirrors the Journal browse mode, but with key differences:

```text
┌──────────────────────────────────────────────────────────────┐
│  [Journal]  [Food]                              [+ New]  [⚙]│
│──────────────────────────────────────────────────────────────│
│  ⚑ Uncategorized (7)        │                                │
│  ─────────────────           │  Tuesday, 17/02/2026          │
│  ▾ 2026                     │  ─────────────────────         │
│    ▾ February                │                                │
│      Tue, 17/02 (3 items)   │  ☀ Breakfast                   │
│      Mon, 16/02 (2 items)   │    Scrambled eggs, toast  📷   │
│      Sun, 15/02 (0 items)   │    Coffee, black               │
│      Sat, 14/02 (1 item)    │                                │
│    ▸ January                 │  🌤 Lunch                      │
│                              │    Chicken rice bowl,          │
│                              │    extra avocado          📷   │
│                              │                                │
│                              │  🌙 Dinner                     │
│                              │    (empty)                     │
│                              │                                │
│──────────────────────────────│                                │
│  [Export ↓]                  │                                │
└──────────────────────────────────────────────────────────────┘
```

Key differences from Journal:
- **"Uncategorized" pinned at the top** of the sidebar with a count. This is your inbox/triage area.
- **Empty days are shown** in the sidebar (e.g., Sun 15/02 shows "0 items").
- **Item count** next to each date so you can see at a glance which days are sparse.
- Right pane groups food entries by **meal slot** (Breakfast / Lunch / Dinner / Snacks) — these are optional organizational buckets, not required during quick entry.
- **Empty meal slots are visible** with "(empty)" so you can see gaps.

### 2c. Uncategorized Triage View

When you click "⚑ Uncategorized":

```text
┌──────────────────────────────────────────────────────────────┐
│  [Journal]  [Food]                              [+ New]  [⚙]│
│──────────────────────────────────────────────────────────────│
│  ⚑ Uncategorized (7)  ←active│                               │
│  ─────────────────            │  Uncategorized Entries        │
│  ▾ 2026                      │  ────────────────────         │
│    ▾ February                 │                               │
│      ...                      │  ┌───────────────────────┐   │
│                               │  │ Scrambled eggs, toast  │   │
│                               │  │ 📷  Today, 8:32 AM     │   │
│                               │  │                        │   │
│                               │  │ [Tue 17/02 ▾] [☀ ▾]  │   │
│                               │  │          [Assign →]    │   │
│                               │  └───────────────────────┘   │
│                               │                               │
│                               │  ┌───────────────────────┐   │
│                               │  │ Coffee, black          │   │
│                               │  │ Today, 8:35 AM         │   │
│                               │  │                        │   │
│                               │  │ [Tue 17/02 ▾] [☀ ▾]  │   │
│                               │  │          [Assign →]    │   │
│                               │  └───────────────────────┘   │
│                               │                               │
│                               │  ┌───────────────────────┐   │
│                               │  │ some photo             │   │
│                               │  │ 📷 Yesterday, 1:12 PM  │   │
│                               │  │                        │   │
│                               │  │ [Mon 16/02 ▾] [🌤 ▾]  │   │
│                               │  │          [Assign →]    │   │
│                               │  └───────────────────────┘   │
│                               │                               │
│                               │       [Assign All by Date →] │
└──────────────────────────────────────────────────────────────┘
```

Key decisions:
- Each uncategorized entry is a **card** with:
  - The content/photo preview
  - The original timestamp
  - A **date picker** (pre-filled with the date it was logged — smart default)
  - An optional **meal slot** dropdown (Breakfast/Lunch/Dinner/Snack — can be left blank)
  - An **[Assign]** button
- **"Assign All by Date"** at the bottom — one click to assign all entries to their auto-detected dates (based on when they were logged). This is the fast path: log throughout the day via Telegram, then at night hit one button and everything slots into today with timestamps determining meal slots automatically.
- Meal slot can be **auto-suggested** based on timestamp (before 11am → Breakfast, 11am–3pm → Lunch, 3pm–5pm → Snack, after 5pm → Dinner). The user just confirms or overrides.

---

## 3. Mobile Considerations

Since you'll use this from any device, the layouts above should collapse:

```text
Mobile - Browse Mode:
┌─────────────────────┐     ┌─────────────────────┐
│ ☰  Journal    [+]   │     │ ← February 2026     │
│─────────────────────│     │─────────────────────│
│ ▾ 2026              │     │                     │
│   ▾ February        │     │ Mon, 17/02/2026     │
│     Mon, 17/02  >   │ ──► │ ─────────────────   │
│     Sun, 16/02  >   │     │                     │
│     Sat, 15/02  >   │     │ Went for a walk     │
│   ▸ January         │     │ today. The weather  │
│                     │     │ was perfect...      │
│                     │     │                     │
│ [Export ↓]          │     │         [Edit ✏️]   │
└─────────────────────┘     └─────────────────────┘
   List view                   Detail view
```

The sidebar becomes the full screen, and tapping a date pushes to the detail view. Standard mobile navigation pattern.

For **Food Quick Entry on mobile**, the quick-log form should be the **default landing** when you switch to Food mode, since the primary mobile use case is logging, not browsing.

---

## 4. Design Principles Summary

| Principle | Implementation |
|---|---|
| **Minimal friction for input** | Journal: full-screen blank page. Food: one field + one button. |
| **Organize later** | Food entries are uncategorized by default, triaged in batch later. |
| **Privacy by design** | Sidebar shows only dates/metadata, never content. Content decrypted on demand. |
| **Consistent patterns** | Both modes share the same Year → Month → Day hierarchy and sidebar layout. |
| **Smart defaults** | Food entries pre-fill date from timestamp, auto-suggest meal slot from time of day. |
| **Empty states are visible** | Food mode shows days with 0 entries and empty meal slots so gaps are obvious. |
| **Export is first-class** | Accessible from browse mode, supports range selection at any hierarchy level. |
