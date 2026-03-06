Personal single-user encrypted journal web app.

## Stack

- Next.js (App Router)
- TypeScript
- pnpm
- Drizzle ORM
- Turso (libSQL)
- Cloudflare R2
- Vercel

## Package Manager

Use `pnpm` for all package management and scripts.

## Core Architecture

- Server auth is password-based with JWT cookie sessions.
- Journal content is encrypted/decrypted client-side when possible.
- Web entries must be end-to-end encrypted.
- The server must never store plaintext web journal content.
- Images must be encrypted before upload and stored in R2 as encrypted blobs.
- Telegram entries are the only content allowed to be encrypted server-side.

## Data

- Database: Turso
- ORM: Drizzle
- Object storage: Cloudflare R2

## Important Rules

- Prefer built-in Web Crypto / platform APIs where possible.
- Preserve the privacy-first, zero-knowledge design.
- Keep implementation simple and minimal.
