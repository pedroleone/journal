# Journal — Current Product Spec

## Overview

Personal encrypted journal web app for a single user.

Current implementation priorities:

- Web-created journal and food content stays end-to-end encrypted.
- The server never stores plaintext web journal or food content.
- Telegram entries are encrypted server-side before storage.
- Images are encrypted before upload and stored in Cloudflare R2 as encrypted blobs.
- Auth and encryption remain separate:
  - Google via Auth.js creates the server session.
  - A local passphrase unlocks decryption keys in the browser.

## Current Scope

Implemented:

- Google sign-in session auth
- Client-side passphrase unlock flow
- Dual-key in-memory key manager
- Journal write and browse flows
- Food quick log, uncategorized triage, and date browse flows
- Encrypted image upload, fetch, decrypt, render, and delete
- Telegram webhook ingest for food capture
- Encrypted backup export and restore
- Decrypted export page for markdown, plain text, and print-to-PDF
- Settings page with export, restore, lock-now, and Telegram help

Explicitly not implemented:

- Password/JWT auth flow
- Unified single-table entry model
- `/idea` and `/note` entry types
- Telegram support for journal capture
- Telegram support for `/idea` and `/note`
- Rich settings or Telegram status management

## Stack

| Layer | Technology | Purpose |
| --- | --- | --- |
| Framework | Next.js App Router | Full-stack app |
| Language | TypeScript | Shared types and app code |
| ORM | Drizzle ORM | Database access |
| Database | Turso / libSQL | Encrypted entry metadata and ciphertext |
| Object storage | Cloudflare R2 | Encrypted image blobs |
| Auth | Auth.js + Google | Server session only |
| Crypto | Web Crypto API | Browser encryption and decryption |
| Bot integration | Telegram Bot API | Mobile text/photo capture |
| UI | Tailwind CSS + shadcn/ui | App interface |

## Data Model

The app currently uses separate tables for journal and food content.

### Users

`users`

- `id`
- `google_sub`
- `email`
- `created_at`
- `updated_at`

### Journal Entries

`entries`

- `id`
- `user_id`
- `source`: `"web" | "telegram"`
- `year`
- `month`
- `day`
- `hour`
- `encrypted_content`
- `iv`
- `images`: `string[] | null`
- `tags`: `string[] | null`
- `created_at`
- `updated_at`

Notes:

- There is exactly one journal entry per user per date.
- `images` stores R2 object keys.

### Food Entries

`food_entries`

- `id`
- `user_id`
- `source`: `"web" | "telegram"`
- `year`
- `month`
- `day`
- `hour`
- `meal_slot`: `"breakfast" | "lunch" | "dinner" | "snack" | null`
- `assigned_at`
- `logged_at`
- `encrypted_content`
- `iv`
- `images`: `string[] | null`
- `tags`: `string[] | null`
- `created_at`
- `updated_at`

Notes:

- Food entries can be created uncategorized, then assigned later.
- Telegram food entries land as uncategorized by default.

## Authentication And Unlock

### Server Auth

Server auth uses Auth.js with Google sign-in.

- `/login` starts Google sign-in
- Auth.js session gates app routes and API routes
- `/api/telegram/webhook` is public and uses Telegram secret validation instead

### Client Unlock

After login, the user unlocks at `/unlock`.

The unlock flow:

1. Derive the user key from the passphrase using PBKDF2-SHA256.
2. Validate that passphrase against the oldest web journal entry when one exists.
3. Fetch `/api/auth/server-key`.
4. Derive the Telegram/server key from `SERVER_ENCRYPTION_SECRET`.
5. Store both keys only in memory.

## Encryption Model

### Web Entries

For web-created journal and food entries:

- plaintext is encrypted in the browser with AES-GCM
- ciphertext and IV are stored in Turso
- the server never receives plaintext

### Telegram Entries

For Telegram-origin entries:

- Telegram sends plaintext text/photo metadata to the server
- the server encrypts text and images with a server-derived AES-GCM key
- the browser later decrypts those entries using the server-derived key fetched through `/api/auth/server-key`

### Images

Images follow the same encrypted-at-rest model:

- encrypt in browser for web uploads
- encrypt on server for Telegram uploads
- upload ciphertext to R2
- store IV in object metadata
- fetch encrypted blob through app API
- decrypt in browser and render via object URL

## Key Management

The browser keeps two keys in memory:

- user key for `source === "web"`
- server key for `source === "telegram"`

Behavior:

- keys are never persisted to local storage or session storage
- inactivity timer wipes both after 5 minutes
- visibility lock wipes both after a short hidden-tab grace period
- lock/logout routes the user back through `/unlock`

## Journal UX

### Write

- Full-screen writing surface
- Autosave for web journal entries
- Date picker in header
- Image attach and remove in the bottom bar
- If a journal entry already exists for today, `New` prompts to continue writing or view it

### Browse

- Year/month/day tree in the sidebar
- Client-side decryption when viewing entries
- Images render inline after browser decryption
- Only web entries are editable from write mode

## Food UX

### Quick Log

- One text field
- Optional photo attachment
- Text-only, photo-only, and text-plus-photo are all valid

### Browse And Organize

- Uncategorized inbox
- Date tree with counts
- Assign per item or assign-all by date
- Meal slot suggestion by timestamp
- Images render in uncategorized and organized views

## Telegram Integration

Telegram capture is food-only.

Behavior:

- validates `X-Telegram-Bot-Api-Secret-Token`
- ignores messages from non-allowed chat ids
- treats plain messages as food entries
- accepts `/food` as an optional explicit prefix
- accepts text-only, photo-only, or text-plus-photo messages
- replies with confirmation on success

Unsupported commands in the current app:

- `/journal`
- `/idea`
- `/note`

Those commands return an unsupported-command response instead of creating entries.

## Storage

### Database

Turso stores:

- encrypted text ciphertext
- IVs
- entry metadata
- image key references

### R2

R2 stores:

- encrypted image blobs
- IV metadata per object

Object keys are user-scoped and owner-scoped:

- `<userId>/journal/<entryId>/<imageId>.enc`
- `<userId>/food/<entryId>/<imageId>.enc`

## Export And Backup

### Decrypted Export

`/export` supports:

- markdown export
- plain text export
- print-friendly PDF flow via browser print

Selection supports:

- week
- month
- custom range
- year
- everything
- manual tree selection by year / month / day

Export decrypts content client-side using the correct key for each entry source.

### Encrypted Backup

`GET /api/backup` returns:

- `version`
- `exported_at`
- `journal_entries`
- `food_entries`
- `image_blobs`

The payload keeps entry content encrypted and includes encrypted image blobs as base64.

### Restore

`POST /api/backup/restore`:

- restores journal rows
- restores food rows
- restores encrypted image blobs
- preserves IDs where possible
- skips conflicts by default

## API Surface

### Auth

- `GET /api/auth/server-key`
- `GET|POST /api/auth/[...nextauth]`

### Journal

- `GET /api/entries`
- `POST /api/entries`
- `GET /api/entries/[id]`
- `PUT /api/entries/[id]`
- `DELETE /api/entries/[id]`
- `GET /api/entries/dates`
- `GET /api/entries/oldest`

### Food

- `GET /api/food`
- `POST /api/food`
- `GET /api/food/dates`
- `PATCH /api/food/[id]/assign`
- `POST /api/food/assign-all`

### Images

- `POST /api/images/upload`
- `GET /api/images/[key]`
- `DELETE /api/images/[key]`

### Backup

- `GET /api/backup`
- `POST /api/backup/restore`

### Telegram

- `POST /api/telegram/webhook`

## Required Environment Variables

```env
AUTH_SECRET="replace-me"
AUTH_GOOGLE_ID="replace-me"
AUTH_GOOGLE_SECRET="replace-me"
NEXT_PUBLIC_PBKDF2_SALT="base64-random-salt"
SERVER_ENCRYPTION_SECRET="replace-me"

TURSO_DATABASE_URL="file:local.db"
TURSO_AUTH_TOKEN="replace-me"

R2_ENDPOINT="https://<account>.r2.cloudflarestorage.com"
R2_ACCESS_KEY="replace-me"
R2_SECRET_KEY="replace-me"
R2_BUCKET="journal-images"

TELEGRAM_BOT_TOKEN="replace-me"
TELEGRAM_CHAT_ID="replace-me"
TELEGRAM_WEBHOOK_SECRET="replace-me"
```

## Current Constraints

- The app still uses Google auth rather than the original password/JWT concept.
- Journal and food remain split across two tables.
- Idea/note support is deferred.
- Backup restore uses skip-on-conflict semantics.
- PDF export relies on browser print rather than dedicated PDF generation.
