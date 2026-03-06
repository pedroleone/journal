# Phase 1 — Full Core

## Goal

A working end-to-end journal app: login, write encrypted entries, browse and read them back. No images, no Telegram, no export.

## Approach: Vertical Slices

Build each feature end-to-end before moving to the next. Every slice is independently testable and deployable. Encryption is real from the start — no stubs.

---

## Slice 1 — Auth

**What gets built:**
- `/login` page with two fields: auth password and encryption passphrase, single "Unlock" button
- `POST /api/auth/login` — bcrypt-verify password against `PASSWORD_HASH`, set signed JWT as HTTP-only cookie
- `POST /api/auth/logout` — clear the session cookie
- `middleware.ts` — protect all routes except `/login`, verify JWT, refresh cookie on each request (sliding 15-min inactivity window)
- `lib/key-manager.ts` — client-side module that holds the PBKDF2-derived `CryptoKey` in memory; 5-min inactivity timer (reset on `mousedown`, `keydown`, `scroll`, `touchstart`); wipes key and fires lock callback when timer fires
- `hooks/use-visibility-lock.ts` — wipes key and shows lock screen when tab is hidden for more than 2 seconds; cancels wipe if tab becomes visible again within the grace period

**Done when:** Logging in sets a session cookie, logging out clears it, middleware redirects unauthenticated requests to `/login`, key manager holds the passphrase-derived key in memory and wipes it on inactivity.

---

## Slice 2 — Write

**What gets built:**
- `lib/schema.ts` — Drizzle schema for the `entries` table (id, type, source, year, month, day, hour, encrypted_content, iv, images, tags, created_at, updated_at)
- `lib/db.ts` — Turso/libSQL client + Drizzle instance
- `lib/crypto.ts` — Web Crypto utility functions:
  - `deriveKey(passphrase)` — PBKDF2-SHA256, 600k iterations, fixed salt, returns AES-GCM-256 `CryptoKey`
  - `encrypt(key, plaintext)` — random 12-byte IV, AES-GCM, returns `{ ciphertext: string, iv: string }` (base64)
  - `decrypt(key, ciphertext, iv)` — returns plaintext string
- `POST /api/entries` — insert encrypted entry into DB
- `/write` page — type selector (journal / food / idea / note), plain textarea, save button; on save: if key in memory, encrypt and POST; if key wiped, show inline passphrase prompt, derive key, encrypt, POST (draft preserved in textarea)

**Done when:** Can type an entry, save it, and confirm the row exists in the DB with encrypted content.

---

## Slice 3 — Browse + Entry View

**What gets built:**
- `GET /api/entries` — list entries with optional query filters (`year`, `month`, `day`, `type`); returns metadata + ciphertext
- `GET /api/entries/[id]` — single entry by ID
- `/browse` page — year list → month list → day list drill-down; type filter; client-side decryption of entry previews
- `/entry/[id]` page — fetch and decrypt full entry content, render as markdown

**Done when:** Can browse entries by date, filter by type, open an entry and read the decrypted content.

---

## Environment Variables Required for Phase 1

```env
# Auth
PASSWORD_HASH="$2a$12$..."       # bcryptjs hash of your auth password
SESSION_SECRET="hex-64-chars"    # random hex string for JWT signing

# Database (Turso)
TURSO_DATABASE_URL="libsql://your-db.turso.io"
TURSO_AUTH_TOKEN="your-turso-token"

# Client-side encryption
NEXT_PUBLIC_PBKDF2_SALT="base64-random-salt"  # fixed salt for key derivation
```

---

## Out of Scope for Phase 1

- Image upload / Cloudflare R2
- Telegram bot webhook
- Export (markdown or JSON backup)
- Restore from backup
- Server-side encryption (only needed for Telegram entries)
- AI integration

---

## Next Steps — Phase 2

Once Phase 1 is complete and running, Phase 2 adds the remaining features from the spec:

### Image Support
- `lib/crypto.ts` — add `encryptBuffer` and `decryptBuffer` for binary data
- `POST /api/images/upload` — accept encrypted blob + IV, generate nanoid key, upload to R2
- `GET /api/images/[key]` — fetch encrypted blob from R2, return with IV in `X-Encryption-IV` header
- Update `/write` to support image attachment (encrypt client-side before upload)
- Update `/entry/[id]` to fetch, decrypt, and render images via `URL.createObjectURL`
- Add R2 environment variables: `R2_ENDPOINT`, `R2_ACCESS_KEY`, `R2_SECRET_KEY`, `R2_BUCKET`

### Telegram Bot
- `POST /api/telegram/webhook` — verify secret token header and chat ID, parse command prefix to determine entry type, encrypt text server-side using `SERVER_ENCRYPTION_SECRET`, store with `source: "telegram"`, handle photo attachments
- `GET /api/auth/server-key` — protected route that returns the server encryption secret so the browser can derive the same key for decrypting Telegram entries
- Update key manager to also hold the server-derived key after login
- Update `/browse` and `/entry/[id]` to select the correct key based on `entry.source`
- Add Telegram environment variables: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `TELEGRAM_WEBHOOK_SECRET`, `SERVER_ENCRYPTION_SECRET`

### Export & Backup
- `/export` page — two options: decrypted markdown download and encrypted JSON backup
- `GET /api/backup` — server fetches all entries + image blobs from R2, returns as JSON (content still encrypted)
- `POST /api/backup/restore` — insert entries into DB, re-upload image blobs to R2, skip or overwrite on ID conflict
- Client-side markdown export: fetch all entries, decrypt each, format by year/month/day, trigger `.md` download
