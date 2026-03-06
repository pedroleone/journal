# Encrypted Personal Journal — IDEA.md

## Overview

A single-user, end-to-end encrypted journaling web app with multiple entry
types, image support, and a Telegram bot integration. Designed to be free to
run, extremely private, and accessible from any device via a web browser.

This is a personal project for a single user. Privacy is the #1 priority.
The hosting providers, database providers, and anyone who gains access to the
infrastructure should never be able to read the journal content.

---

## Core Principles

1. **Zero-knowledge architecture**: The server never sees plaintext journal
   content. All encryption/decryption happens in the browser using the Web
   Crypto API. The only exception is entries submitted via the Telegram bot,
   which are encrypted server-side before storage.
2. **Minimal infrastructure**: Use free tiers of managed services. No
   self-hosting, no server maintenance, no security hardening.
3. **Defense in depth**: Two separate authentication layers — a server-side
   auth password and a client-side encryption passphrase. Compromising one
   does not compromise the other.
4. **Single-user simplicity**: No user management, no OAuth, no social login.
   One user, one password hash in an environment variable.

---

## Tech Stack

| Layer            | Technology                    | Purpose                          |
| ---------------- | ----------------------------- | -------------------------------- |
| Framework        | Next.js (App Router)          | Full-stack web app               |
| Language         | TypeScript                    | End-to-end type safety           |
| ORM              | Drizzle ORM                   | Type-safe database access        |
| Database         | Turso (hosted SQLite/libSQL)  | Entry metadata + ciphertext      |
| Object Storage   | Cloudflare R2                 | Encrypted image blobs            |
| Hosting          | Vercel (Hobby tier)           | Zero-config deploys, HTTPS, edge |
| UI               | Tailwind CSS + shadcn/ui      | Responsive, accessible UI        |
| Auth             | Custom JWT middleware          | Minimal single-user auth         |
| Encryption       | Web Crypto API (AES-GCM)     | Client-side E2EE                 |
| Bot Integration  | Telegram Bot API (webhooks)   | Quick entries from mobile        |

### Dependencies

- `bcryptjs` + `@types/bcryptjs` — password hashing for auth
- `jose` — JWT signing and verification (lightweight, edge-compatible)
- `@aws-sdk/client-s3` — R2 access (R2 is S3-compatible)
- `nanoid` — ID generation
- `drizzle-orm` + `drizzle-kit` + `@libsql/client` — database

No other major dependencies. No NextAuth. No heavy crypto libraries (Web
Crypto API is built into the browser and available in Vercel edge/serverless).

---

## Database Schema

Using Drizzle ORM with Turso (SQLite).

```ts
// lib/schema.ts
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const entries = sqliteTable("entries", {
  id: text("id").primaryKey(), // nanoid
  type: text("type", {
    enum: ["journal", "food", "idea", "note"],
  }).notNull(),
  source: text("source", {
    enum: ["web", "telegram"],
  }).notNull(),
  year: integer("year").notNull(),
  month: integer("month").notNull(),
  day: integer("day").notNull(),
  hour: integer("hour"),
  encrypted_content: text("encrypted_content").notNull(), // base64 AES-GCM ciphertext
  iv: text("iv").notNull(), // base64 initialization vector
  images: text("images", { mode: "json" }).$type<string[]>(), // array of R2 keys
  tags: text("tags", { mode: "json" }).$type<string[]>(), // optional tags
  created_at: text("created_at").notNull(),
  updated_at: text("updated_at").notNull(),
});
```

Index the `year`, `month`, `day` columns for browse queries. Index `type` for
filtered views.

---

## Authentication

### Design

Single-user, no database user table. The auth password bcrypt hash and JWT
signing secret are stored as environment variables.

- **Auth password** → verified server-side via bcrypt → sets a signed
  HTTP-only cookie containing a JWT.
- **Encryption passphrase** → entered after login, used client-side only to
  derive an AES-GCM key via Web Crypto API. Never sent to the server. Never
  stored anywhere. Held in browser memory only.

These are two separate secrets. The user stores both in a password manager
(e.g., Bitwarden).

### Login API Route

`POST /api/auth/login`

- Accepts `{ password: string }` in the request body.
- Compares against `process.env.PASSWORD_HASH` using bcrypt.
- On success, creates a JWT with `{ authenticated: true }` and an expiration
  of 15 minutes, signed with `process.env.SESSION_SECRET`.
- Sets the JWT as an HTTP-only, secure, SameSite=strict cookie named
  `session`.

### Logout API Route

`POST /api/auth/logout`

- Clears the `session` cookie.

### Middleware

`middleware.ts` at the project root.

- Runs on every request except `/login` and static assets.
- Reads the `session` cookie, verifies the JWT with `jose.jwtVerify`.
- If invalid or missing, redirects to `/login`.
- If valid, **refreshes the cookie** with a new JWT (same 15-minute
  expiration) to implement a sliding session window. This means 15 minutes of
  *inactivity* triggers logout, not 15 minutes since login.

### Environment Variables for Auth

```env
# Generate password hash:
#   node -e "require('bcryptjs').hash('your-password', 12).then(console.log)"
PASSWORD_HASH="$2a$12$..."

# Generate session secret:
#   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
SESSION_SECRET="random-hex-string"
```

---

## Encryption

### Browser-Side (Web Entries)

All web-originated entries use end-to-end encryption. The server never sees
plaintext.

#### Key Derivation

When the user enters their passphrase after login:

1. Encode the passphrase as UTF-8.
2. Import as key material using `crypto.subtle.importKey` with `PBKDF2`.
3. Derive an AES-GCM 256-bit key using `crypto.subtle.deriveKey` with a
   fixed salt (stored in the client code or as an env var exposed to the
   client) and 600,000 iterations of PBKDF2-SHA256.
4. Store the derived `CryptoKey` in a JavaScript closure (the key manager
   module). NOT in `localStorage` or `sessionStorage`.

#### Text Encryption

1. Generate a random 12-byte IV using `crypto.getRandomValues`.
2. Encrypt the plaintext with `crypto.subtle.encrypt` using AES-GCM with the
   derived key and IV.
3. Base64-encode the ciphertext and IV.
4. Send to the server for storage.

#### Text Decryption

1. Fetch the base64 ciphertext and IV from the server.
2. Decode from base64.
3. Decrypt with `crypto.subtle.decrypt` using the derived key and IV.
4. Render the plaintext.

#### Image Encryption

Same as text, but operates on `ArrayBuffer` from `File.arrayBuffer()`:

1. Read the image file as `ArrayBuffer`.
2. Generate a random 12-byte IV.
3. Encrypt with AES-GCM.
4. Upload the ciphertext blob to R2 via an API route, with the IV stored in
   R2 object metadata.
5. Store the R2 key in the entry's `images` array.

#### Image Decryption

1. Fetch the encrypted blob from R2 via an API route.
2. Read the IV from the response header `X-Encryption-IV`.
3. Decrypt with AES-GCM.
4. Create a `Blob`, then a `URL.createObjectURL` for rendering in `<img>`.

### Server-Side (Telegram Entries)

Telegram entries cannot be E2EE because the server receives plaintext from
Telegram's API. Instead, they are encrypted server-side before storage using a
separate server encryption key.

#### Server Key Derivation

1. Read `process.env.SERVER_ENCRYPTION_SECRET`.
2. SHA-256 hash it to get a 256-bit key.
3. Import as an AES-GCM `CryptoKey` using `crypto.subtle.importKey`.
4. Cache in a module-level variable.

#### Client-Side Decryption of Telegram Entries

The browser needs access to the server encryption key to decrypt Telegram
entries. Options:

- **Option A (recommended)**: Expose a protected API route
  `GET /api/auth/server-key` that returns the server encryption secret. The
  browser derives the same key using the same SHA-256 process. This route is
  protected by the session middleware. The user's browser fetches this once
  after login and holds it in memory alongside the passphrase-derived key.
- **Option B**: Use the same passphrase-derived key on the server for
  Telegram entries. This requires the server to know the passphrase, which
  defeats the purpose of E2EE for web entries. **Do not do this.**

Entries have a `source` field (`"web"` or `"telegram"`) so the client knows
which key to use for decryption.

---

## Client-Side Key Manager

A module that holds encryption keys in memory with automatic wiping on
inactivity.

### Behavior

- Stores the passphrase-derived `CryptoKey` and the server `CryptoKey` in
  module-level variables (closures). Not in any persistent storage.
- Starts a 5-minute inactivity timer on key set.
- Resets the timer on any `mousedown`, `keydown`, `scroll`, or `touchstart`
  event.
- When the timer fires: wipes both keys from memory and invokes a lock
  callback.
- Exports `setKey`, `getKey`, `wipeKey`, `onLock`, and
  `initActivityListeners`.

### Visibility Lock

A React hook `useVisibilityLock` that:

- Listens to `document.visibilitychange`.
- When the document becomes hidden (tab switch, phone lock, app switch):
  waits 2 seconds (grace period for quick app switches on mobile), then wipes
  keys and sets a `locked` state.
- When locked, the component tree unmounts any decrypted content from the DOM
  and renders a lock screen prompting for the passphrase.
- If the document becomes visible again within the 2-second grace period, the
  timer is cancelled and nothing happens.

### Session Layers Summary

| Layer                    | Timeout           | Trigger                          | User action to resume           |
| ------------------------ | ----------------- | -------------------------------- | ------------------------------- |
| Server session (JWT)     | 15 min inactivity | No HTTP requests                 | Re-enter auth password          |
| Encryption key in memory | 5 min inactivity  | No mouse/keyboard/touch activity | Re-enter encryption passphrase  |
| Visibility lock          | 2 sec hidden      | Tab switch, screen lock          | Re-enter encryption passphrase  |

### Writing vs. Viewing

- **Viewing** past entries requires the encryption key in memory. If the key
  has been wiped, the lock screen appears.
- **Writing** a new entry does NOT require the key until the user hits save.
  The user types plaintext into a textarea freely. When they save:
  - If the key is in memory → encrypt and save immediately.
  - If the key was wiped → show an inline passphrase prompt, derive the key,
    encrypt, and save. The draft in the textarea is not lost.

---

## Image Storage (Cloudflare R2)

### Configuration

R2 is S3-compatible. Use `@aws-sdk/client-s3` with:

- `region: "auto"`
- `endpoint: process.env.R2_ENDPOINT` (from Cloudflare dashboard)
- Credentials: `R2_ACCESS_KEY` and `R2_SECRET_KEY`
- Bucket: `R2_BUCKET`

### API Routes

#### `POST /api/images/upload`

- Accepts `multipart/form-data` with fields: `file` (encrypted blob), `iv`
  (base64 string).
- Generates a key using `nanoid()` + `.enc` extension.
- Uploads to R2 with the IV stored in object metadata.
- Returns `{ key: string }`.
- Protected by session middleware.

#### `GET /api/images/[key]`

- Fetches the encrypted blob from R2.
- Returns it as `application/octet-stream` with the IV in an
  `X-Encryption-IV` response header.
- Protected by session middleware.

### Free Tier Limits

10 GB storage, 10M reads/month, 1M writes/month, zero egress. More than
enough for a personal journal.

---

## Telegram Bot Integration

### Setup

1. Create a bot via @BotFather on Telegram.
2. Register a webhook:
   `POST https://api.telegram.org/bot<TOKEN>/setWebhook`
   with `url` set to `https://<domain>/api/telegram/webhook` and
   `secret_token` set to a random secret.
3. Register bot commands via BotFather:
   - `/journal` — Write a journal entry (default)
   - `/food` — Log a food entry
   - `/idea` — Save a quick idea
   - `/note` — Save a note

### Webhook Handler

`POST /api/telegram/webhook`

#### Security

1. Verify the `X-Telegram-Bot-Api-Secret-Token` header matches
   `process.env.TELEGRAM_WEBHOOK_SECRET`. Reject if not.
2. Verify `message.chat.id` matches `process.env.TELEGRAM_CHAT_ID` (your
   personal chat ID). Ignore all other chats silently (return 200 OK to avoid
   Telegram retries).

#### Processing

1. Extract text from `message.text` or `message.caption`.
2. Determine entry type from command prefix (`/food`, `/idea`, `/note`, or
   default to `journal`). Strip the command prefix from the stored text.
3. If `message.photo` exists:
   a. Get the largest photo size (last element of the `photo` array).
   b. Fetch the file from Telegram API using `getFile` + file download URL.
   c. Encrypt the image buffer server-side using the server encryption key.
   d. Upload encrypted blob to R2.
   e. Collect the R2 key.
4. Encrypt the text content server-side using the server encryption key.
5. Insert a new entry into the database with `source: "telegram"`.
6. Send a confirmation message back to the Telegram chat:
   `✅ <type> entry saved`.

### Environment Variables for Telegram

```env
TELEGRAM_BOT_TOKEN="123456:ABC-DEF..."
TELEGRAM_CHAT_ID="your-numeric-chat-id"
TELEGRAM_WEBHOOK_SECRET="random-secret-string"
```

---

## Pages and Routes

### Pages

| Route                  | Description                                          |
| ---------------------- | ---------------------------------------------------- |
| `/login`               | Auth password + encryption passphrase input          |
| `/`                    | Redirect to today's entry or the write page          |
| `/write`               | Write/edit today's entry. Type selector (journal,    |
|                        | food, idea, note). Image upload. Auto-saves or       |
|                        | manual save button.                                  |
| `/browse`              | Browse entries by year → month → day drill-down.     |
|                        | Filter by entry type. Shows entry previews           |
|                        | (decrypted client-side).                             |
| `/entry/[id]`          | View a single entry with decrypted images.           |
| `/export`              | Export options: decrypted markdown download and      |
|                        | encrypted backup JSON download.                      |

### API Routes

| Route                         | Method | Description                          |
| ----------------------------- | ------ | ------------------------------------ |
| `/api/auth/login`             | POST   | Verify password, set session cookie  |
| `/api/auth/logout`            | POST   | Clear session cookie                 |
| `/api/auth/server-key`        | GET    | Return server encryption secret      |
| `/api/entries`                | GET    | List entries (with query filters)    |
| `/api/entries`                | POST   | Create new entry                     |
| `/api/entries/[id]`           | GET    | Get single entry                     |
| `/api/entries/[id]`           | PUT    | Update entry                         |
| `/api/entries/[id]`           | DELETE | Delete entry                         |
| `/api/images/upload`          | POST   | Upload encrypted image to R2         |
| `/api/images/[key]`           | GET    | Fetch encrypted image from R2        |
| `/api/backup`                 | GET    | Download full encrypted backup JSON  |
| `/api/backup/restore`         | POST   | Restore from encrypted backup JSON   |
| `/api/telegram/webhook`       | POST   | Telegram bot webhook handler         |

All API routes except `/api/auth/login` and `/api/telegram/webhook` are
protected by the session middleware. The Telegram webhook has its own
authentication via the secret token header.

---

## Export & Backup

### Decrypted Markdown Export

Triggered from the `/export` page. Runs entirely client-side:

1. Fetch all entries from `/api/entries`.
2. Decrypt each entry using the appropriate key (passphrase-derived for web
   entries, server key for Telegram entries).
3. For entries with images, decrypt images and embed them as base64 data URIs
   or save as separate files.
4. Format as markdown grouped by year/month/day.
5. Download as a `.md` file (or a `.zip` if images are saved separately).

### Encrypted Backup JSON

Triggered from the `/export` page or the `GET /api/backup` route:

1. Server fetches all entries from the database.
2. Returns them as a JSON file. Content is still encrypted (ciphertext).
3. Format:

```json
{
  "version": 1,
  "exported_at": "2026-03-06T13:00:00Z",
  "entries": [
    {
      "id": "...",
      "type": "journal",
      "source": "web",
      "year": 2026,
      "month": 3,
      "day": 6,
      "hour": 9,
      "encrypted_content": "base64...",
      "iv": "base64...",
      "images": ["key1.enc", "key2.enc"],
      "tags": ["morning"],
      "created_at": "...",
      "updated_at": "..."
    }
  ]
}
```

4. Images must be exported separately (or included as base64 in the JSON
   under an `image_blobs` key) since they live in R2, not the database. The
   backup route should also fetch and include all referenced image blobs.

### Restore from Backup

`POST /api/backup/restore`

- Accepts the backup JSON.
- Inserts all entries into the database.
- Uploads all image blobs back to R2.
- Protected by session middleware.
- Should handle conflicts (skip or overwrite entries with the same ID).

---

## Environment Variables (Complete)

```env
# Auth
PASSWORD_HASH="$2a$12$..."
SESSION_SECRET="hex-string-64-chars"

# Database (Turso)
TURSO_DATABASE_URL="libsql://your-db.turso.io"
TURSO_AUTH_TOKEN="your-turso-token"

# Object Storage (Cloudflare R2)
R2_ENDPOINT="https://your-account-id.r2.cloudflarestorage.com"
R2_ACCESS_KEY="your-r2-access-key"
R2_SECRET_KEY="your-r2-secret-key"
R2_BUCKET="journal-images"

# Server-side encryption (for Telegram entries)
SERVER_ENCRYPTION_SECRET="another-random-secret-string"

# Telegram Bot
TELEGRAM_BOT_TOKEN="123456:ABC-DEF..."
TELEGRAM_CHAT_ID="your-numeric-chat-id"
TELEGRAM_WEBHOOK_SECRET="random-secret-string"
```

---

## UI Notes

- Use shadcn/ui components throughout. Keep it minimal and clean.
- The login page has two fields: auth password and encryption passphrase,
  with a single "Unlock" button.
- The write page has a type selector (dropdown or tabs), a plain textarea for
  content (markdown), an image upload button, and a save button.
- The browse page is a drill-down: year list → month list → day list →
  entries for that day. Include a type filter.
- The lock screen is a centered passphrase input with a clean, unobtrusive
  design. It replaces the entire page content when active.
- Mobile responsive. Test on small screens. The write page should be
  comfortable to use on a phone keyboard.

---

## Future AI Integration (Do Not Implement Now)

When the time comes, the AI layer will work as follows:

- Decrypted entries are available client-side in the browser.
- The browser calls an AI API (e.g., OpenAI, Anthropic) directly with the
  plaintext. The journal server never sees it.
- Use cases: mood analysis, summarization, weekly reflections, pattern
  detection.
- The Vercel AI SDK makes this straightforward to add later.
- For now, just ensure the architecture supports decrypting entries
  client-side and that the UI is extensible.

---

## Deployment

1. Push code to a GitHub repository (private).
2. Connect the repository to Vercel.
3. Set all environment variables in the Vercel dashboard.
4. Point the subdomain DNS to Vercel.
5. Register the Telegram webhook with the deployed URL.
6. Done.