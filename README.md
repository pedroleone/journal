## Journal

Encrypted personal journal web app built with Next.js, TypeScript, Drizzle, Turso, and Cloudflare R2.

## Auth And Encryption

- Server auth uses Auth.js with Google sign-in.
- Google login creates the server session and opens the app directly.
- All content (journal entries, notes, food log) is encrypted server-side before storage using AES-GCM.
- Images are processed client-side (resized/re-encoded), then encrypted server-side before being stored in R2.
- Telegram entries are encrypted server-side before persistence.
- `SERVER_ENCRYPTION_SECRET` is the single key used for all server-side encryption.

## Environment Variables

Create a local `.env` file with:

```bash
AUTH_SECRET="replace-me"
AUTH_GOOGLE_ID="replace-me"
AUTH_GOOGLE_SECRET="replace-me"
SERVER_ENCRYPTION_SECRET="replace-me"
TURSO_DATABASE_URL="file:local.db"
# Required when using a remote Turso database:
TURSO_AUTH_TOKEN="replace-me"
R2_ENDPOINT="https://<account>.r2.cloudflarestorage.com"
R2_ACCESS_KEY="replace-me"
R2_SECRET_KEY="replace-me"
R2_BUCKET="journal-images"
TELEGRAM_BOT_TOKEN="replace-me"
TELEGRAM_CHAT_ID="replace-me"
TELEGRAM_WEBHOOK_SECRET="replace-me"
```

Configure Google OAuth redirect URIs:

```text
http://localhost:3000/api/auth/callback/google
https://<your-domain>/api/auth/callback/google
```

## Development

Start the app:

```bash
pnpm dev
```

Generate and apply schema changes:

```bash
pnpm db:generate
pnpm db:push
```

Run checks:

```bash
pnpm lint
pnpm test
pnpm exec tsc --noEmit
pnpm build
```

## Notes

- All data is user-scoped in the database.
- `SERVER_ENCRYPTION_SECRET` must never change — rotating it will make existing encrypted data unreadable.
