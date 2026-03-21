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
- Journal, notes, and food text are encrypted on the server before storage.
- The server may receive plaintext text payloads from authenticated web clients, but must never store plaintext content at rest.
- Images must be encrypted before upload and stored in R2 as encrypted blobs.

## Data

- Database: Turso
- ORM: Drizzle
- Object storage: Cloudflare R2

## Testing

- Framework: Vitest (`pnpm test` to run, `pnpm test:watch` for dev)
- Config: `vitest.config.ts`, setup file: `tests/setup.ts`
- Test location: `tests/` directory mirroring source structure (`tests/lib/`, `tests/api/`)
- DB is mocked in `tests/setup.ts` — API route tests don't hit a real database
- **All new features must include tests.** Unit tests for pure logic (lib/), API route tests for new endpoints.
- Run `pnpm test` before committing to ensure nothing is broken.
- CI runs lint, type check, tests, and build on every PR.

## Important Rules

- Prefer built-in Web Crypto / platform APIs where possible.
- Preserve the privacy-first design, with server-side text encryption and client-side image encryption.
- Keep implementation simple and minimal.
