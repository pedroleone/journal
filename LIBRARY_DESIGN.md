# Library — Personal Media Library

## Overview

A dedicated section for tracking books, albums, movies, games, videos, and misc media. Private, encrypted, designed for frictionless logging and rediscovery through multiple browsing lenses.

## Data Model

### MediaItems table

| Field | Type | Notes |
|-------|------|-------|
| id | text PK | |
| userId | text FK → users | |
| type | enum | `book`, `album`, `movie`, `game`, `video`, `misc` |
| title | text | required |
| creator | text | nullable — author/artist/director/developer |
| url | text | nullable — YouTube link, store page, etc. |
| status | enum | `backlog`, `in_progress`, `finished`, `dropped` |
| rating | integer | nullable, 1-5 |
| reactions | string[] JSON | self-building vocabulary |
| genres | string[] JSON | self-building vocabulary |
| metadata | JSON | type-specific fields (see below) |
| cover_image | text | nullable, encrypted image key |
| encrypted_content | text | nullable — initial thoughts/description |
| iv | text | encryption IV |
| added_at | timestamp | auto-set on creation |
| started_at | timestamp | nullable, set on status → in_progress |
| finished_at | timestamp | nullable, set on status → finished |
| created_at | timestamp | |
| updated_at | timestamp | |

### Type-specific metadata

| Type | Fields |
|------|--------|
| Book | `pages` |
| Album | — |
| Movie | `duration` |
| Game | `platform` (string[], self-building: steam/PS5/mobile/emulation/switch/PC/etc) |
| Video | `channel` |
| Misc | — |

`genre` is shared across all types via the top-level `genres` field.

### MediaItemNotes table (Thought Log)

| Field | Type | Notes |
|-------|------|-------|
| id | text PK | |
| mediaItemId | text FK → media_items | |
| userId | text FK → users | |
| encrypted_content | text | |
| iv | text | |
| images | string[] JSON | nullable |
| created_at | timestamp | |
| updated_at | timestamp | |

Displayed chronologically. Adding is the primary action; editing/deleting are available but not prominent.

## Vocabulary Fields

Three fields share the same UX pattern: **reactions**, **genres**, **platform** (games only).

- Free-text input with autocomplete from previous usage
- Quick-select buttons for most-used values
- No separate configuration — the vocabulary builds from usage
- Default suggestions shown until the user has enough of their own
- Each vocabulary is browsable: dedicated views to see all items with a given genre/reaction/platform

### Default reactions (starting set)

`interesting`, `beautiful`, `disturbing`, `funny`, `thought-provoking`, `virtuoso`, `cozy`, `intense`, `overrated`, `underrated`

## UI Labels by Type

| Type | Creator label |
|------|--------------|
| Book | Author |
| Album | Artist |
| Movie | Director |
| Game | Developer |
| Video | Channel |
| Misc | Creator |

## Navigation

Top-level sidebar entry: **Library**

### Views

- **Main list** — all items, filterable by type, status, genre, reaction, platform. Most recently updated first.
- **Item detail** — metadata + thought log
- **Browse by genre** — list all genres, click into one to see items
- **Browse by reaction** — same pattern
- **Browse by platform** — same, scoped to games

## Encryption

Same model as notes:
- Content encrypted client-side with IV
- Images encrypted before R2 upload
- Server never sees plaintext

## Phases

### Phase 1 — Foundation

- [ ] Database schema (media_items + media_item_notes tables)
- [ ] Drizzle migration
- [ ] Zod validators
- [ ] API routes: CRUD for media items
- [ ] API routes: CRUD for thought log entries
- [ ] API route: vocabulary suggestions (distinct reactions/genres/platforms)
- [ ] Basic list page with type filter
- [ ] Item detail page with thought log
- [ ] Create/edit item form
- [ ] Sidebar navigation entry
- [ ] Tests for API routes and validators

### Phase 2 — Browsing & Filtering

- [ ] Status filter (backlog/in-progress/finished/dropped)
- [ ] Genre browsing page
- [ ] Reaction browsing page
- [ ] Platform browsing page (games)
- [ ] Combined filters (e.g. "finished books in sci-fi")
- [ ] Rating filter
- [ ] Search by title/creator

### Phase 3 — Polish

- [ ] Cover image upload
- [ ] Status change auto-sets started_at/finished_at
- [ ] Quick-add flow (minimal fields: type + title → backlog)
- [ ] Bulk status updates
- [ ] Export/backup integration